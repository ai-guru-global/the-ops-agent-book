import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApprovalService } from '../src/approval-service.mjs';
import { CredentialService } from '../src/credential-service.mjs';
import {
  createAnchor, DEFAULT_ANCHOR_KEY, DEFAULT_ANCHOR_KEY_ID, DEFAULT_EVENT_SIGNING_KEY,
  DEFAULT_EVENT_SIGNING_KEY_ID, eventHash, EventStore, verifyAnchor, verifyJsonl, verifyTrace,
} from '../src/event-store.mjs';
import { createRuntime, runCanary, runNotReadyScenario, runRollback, runShadow, writeRunOutput } from '../src/runtime.mjs';
import { canonicalJson, clone, DEFAULT_NOW, sha256 } from '../src/shared.mjs';

const COPILOT = 'nhai:agent:synthetic-copilot';
const OPERATOR = 'nhai:agent:synthetic-operator';

function readyRuntime(mode = 'demo') {
  const runtime = createRuntime({ mode });
  runtime.issueCredentials();
  runtime.start('test-synthetic');
  return runtime;
}

function samplePlan(overrides = {}) {
  return {
    plan_id: 'plan_test', plan_version: 1, created_at: DEFAULT_NOW, created_by: COPILOT,
    purpose: 'notready-diagnosis', environment: 'prod',
    steps: [{ id: 'drain', tool: 'k8s.drain_node', resource: { type: 'node', id: 'synthetic-node-07' } }],
    target_resource_versions: { 'synthetic-node-07': 'node-v1' },
    expires_at: '2026-11-24T01:00:00.000Z',
    ...overrides,
  };
}

function cleanupPlan(runtime, version = 1) {
  const key = `logs/${runtime.cluster.node}`;
  return runtime.makePlan({
    version,
    steps: [{ id: 'cleanup', tool: 'node.cleanup_logs', resource: { ...runtime.cluster.logResource(), version_key: key } }],
    targets: { [key]: runtime.cluster.state.log_resource_version },
  });
}

function dualApproval(service, plan, now = DEFAULT_NOW) {
  const approval = service.request({ plan, requester: COPILOT, approvalType: 'dual', now });
  service.approve({ approvalId: approval.approval_id, approver: 'human:a', now });
  return service.approve({ approvalId: approval.approval_id, approver: 'human:b', now });
}

function twoEventStore(options = {}, intent = 'test') {
  const store = new EventStore({ now: () => DEFAULT_NOW, ...options });
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent, scenario_id: 'test', slo_class: 'SEV3' },
  });
  store.append({
    type: 'run.completed', payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false },
  });
  return store;
}

function resignTrace(events, key = DEFAULT_EVENT_SIGNING_KEY, keyId = DEFAULT_EVENT_SIGNING_KEY_ID) {
  let previousHash = null;
  for (const event of events) {
    event.integrity.prev_event_hash = previousHash;
    event.integrity.event_hash = eventHash(event);
    const bound = clone(event);
    delete bound.integrity.signature;
    event.integrity.signature = {
      algorithm: 'HMAC-SHA256', key_id: keyId,
      value: createHmac('sha256', key).update(canonicalJson(bound)).digest('hex'),
    };
    previousHash = event.integrity.event_hash;
  }
  return events;
}

test('explicit deny runs before credential and tool allowlist checks', () => {
  const runtime = readyRuntime();
  const copilotWrite = runtime.policyEngine.evaluate({
    principal: COPILOT, token: 'forged', delegation: runtime.identities.copilot.delegation,
    tool: 'k8s.drain_node', action: 'write', resource: runtime.cluster.nodeResource(),
    environment: 'prod', purpose: 'notready-diagnosis', credentialService: runtime.credentialService,
  });
  assert.equal(copilotWrite.allowed, false);
  assert.equal(copilotWrite.rule_id, 'deny-copilot-write');
  assert.equal(copilotWrite.stage, 'explicit_deny');

  const destructive = runtime.policyEngine.evaluate({
    principal: OPERATOR, token: runtime.tokens.operator.token, delegation: runtime.identities.operator.delegation,
    tool: 'k8s.force_delete_pod', action: 'write', resource: runtime.cluster.nodeResource(),
    environment: 'prod', purpose: 'notready-diagnosis', credentialService: runtime.credentialService,
  });
  assert.equal(destructive.rule_id, 'deny-destructive-actions');
  assert.equal(destructive.checks.some((check) => check.stage === 'credential_and_revocation'), false);
});

test('uncordon is denied until Ready, PDB and capacity recover', () => {
  const runtime = readyRuntime();
  const result = runtime.gateway.invoke({
    tool: 'uncordon_node', principal: OPERATOR, token: runtime.tokens.operator.token,
    delegation: runtime.identities.operator.delegation, idempotency_key: 'uncordon-before-recovery-key',
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'explicit_deny');
  assert.equal(result.policy.rule_id, 'deny-uncordon-before-recovery');
});

test('any plan field change invalidates a dual approval', () => {
  const service = new ApprovalService({ now: () => DEFAULT_NOW });
  const plan = service.freezePlan(samplePlan());
  const approval = dualApproval(service, plan);
  assert.equal(service.validate({ approvalId: approval.approval_id, plan }).valid, true);
  const changed = clone(plan);
  changed.steps[0].reason = 'changed-after-approval';
  assert.notEqual(sha256(changed), approval.plan_hash);
  assert.equal(service.validate({ approvalId: approval.approval_id, plan: changed }).reason, 'plan_hash_changed');
  assert.throws(() => { plan.plan_version = 2; }, TypeError);
});

test('approval expiration, rejection and revocation are fail-closed', () => {
  let now = DEFAULT_NOW;
  const service = new ApprovalService({ now: () => now });
  const plan = service.freezePlan(samplePlan());
  const expired = dualApproval(service, plan);
  now = '2026-11-24T00:16:00.000Z';
  assert.equal(service.validate({ approvalId: expired.approval_id, plan }).reason, 'approval_expired');

  now = DEFAULT_NOW;
  const rejected = service.request({ plan, requester: COPILOT, approvalType: 'single', now });
  service.reject({ approvalId: rejected.approval_id, approver: 'human:a', now });
  assert.equal(service.validate({ approvalId: rejected.approval_id, plan }).reason, 'approval_rejected');

  const revoked = dualApproval(service, plan);
  service.revoke({ approvalId: revoked.approval_id, now });
  assert.equal(service.validate({ approvalId: revoked.approval_id, plan }).reason, 'approval_revoked');
});

test('credential expiration, revocation, scope, audience and delegation are enforced', () => {
  let now = DEFAULT_NOW;
  const service = new CredentialService({ secret: randomBytes(32), now: () => now });
  const delegation = { from: 'human:a', depth: 1, active: true, non_transferable: true };
  const issued = service.issue({ subject: OPERATOR, delegation, scope: ['k8s.drain_node:write'], ttlSeconds: 60 });
  assert.equal(service.verify(issued.token, { expectedSubject: OPERATOR, requiredScope: ['k8s.drain_node:write'], delegation }).valid, true);
  assert.equal(service.verify(issued.token, { requiredScope: ['k8s.uncordon:write'] }).reason, 'SCOPE_DENIED');
  assert.equal(service.verify(issued.token, { expectedAudience: 'other' }).reason, 'INVALID_AUDIENCE');
  assert.equal(service.verify(issued.token, { delegation: { ...delegation, from: 'human:b' } }).reason, 'DELEGATION_MISMATCH');
  now = '2026-11-24T00:01:01.000Z';
  assert.equal(service.verify(issued.token).reason, 'TOKEN_EXPIRED');

  now = DEFAULT_NOW;
  const second = service.issue({ subject: OPERATOR, delegation, scope: ['k8s.drain_node:write'], ttlSeconds: 60 });
  service.revoke({ jti: second.claims.jti });
  assert.equal(service.verify(second.token).reason, 'TOKEN_REVOKED');
});

test('exact idempotent replay does not mutate state twice', () => {
  const runtime = readyRuntime();
  const target = runtime.cluster.state.node.resource_version;
  const plan = runtime.makePlan({
    version: 1, steps: [{ id: 'drain', tool: 'k8s.drain_node', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: target },
  });
  const approval = runtime.approvePlan({ plan }).approval;
  const args = {
    alias: 'drain_node', plan, approval, expectedResourceVersion: target,
    idempotencyKey: 'idempotency-drain-key-1',
  };
  const first = runtime.invoke(args);
  const second = runtime.invoke(args);
  assert.equal(first.status, 'succeeded');
  assert.equal(second.status, 'succeeded');
  assert.equal(second.replayed, true);
  assert.equal(runtime.cluster.state.node.resource_version, 'node-v2');
  assert.equal(runtime.gateway.audit.filter((item) => item.write_executed).length, 1);
});

test('partial success stops even a newly approved write until explicit replan resume', () => {
  const runtime = readyRuntime();
  const planV1 = cleanupPlan(runtime, 1);
  const approvalV1 = runtime.approvePlan({ plan: planV1 }).approval;
  const first = runtime.invoke({
    alias: 'cleanup_logs', plan: planV1, approval: approvalV1,
    expectedResourceVersion: planV1.target_resource_versions[`logs/${runtime.cluster.node}`],
    idempotencyKey: 'partial-cleanup-key-1',
  });
  assert.equal(first.status, 'partial_success');
  assert.equal(first.cleaned, 2);
  assert.equal(first.requested, 3);

  const planV2 = cleanupPlan(runtime, 2);
  const approvalV2 = runtime.approvePlan({ plan: planV2 }).approval;
  const blocked = runtime.invoke({
    alias: 'cleanup_logs', plan: planV2, approval: approvalV2,
    expectedResourceVersion: planV2.target_resource_versions[`logs/${runtime.cluster.node}`],
    idempotencyKey: 'partial-cleanup-key-2',
  });
  assert.equal(blocked.error.code, 'partial_success_halt');

  runtime.gateway.failedLogId = null;
  runtime.gateway.resumeAfterReplan({ plan: planV2, approvalId: approvalV2.approval_id });
  const resumed = runtime.invoke({
    alias: 'cleanup_logs', plan: planV2, approval: approvalV2,
    expectedResourceVersion: planV2.target_resource_versions[`logs/${runtime.cluster.node}`],
    idempotencyKey: 'partial-cleanup-key-3',
  });
  assert.equal(resumed.status, 'succeeded');
  assert.equal(runtime.cluster.state.logs.every((log) => log.cleaned), true);
});

test('unknown outcome is cached and never blindly retried under a new key', () => {
  const runtime = readyRuntime();
  const plan = cleanupPlan(runtime, 1);
  const approval = runtime.approvePlan({ plan }).approval;
  const expected = plan.target_resource_versions[`logs/${runtime.cluster.node}`];
  const args = {
    alias: 'cleanup_logs', plan, approval, expectedResourceVersion: expected,
    idempotencyKey: 'unknown-cleanup-key-1', simulateOutcome: 'unknown',
  };
  const first = runtime.invoke(args);
  const replay = runtime.invoke(args);
  assert.equal(first.status, 'unknown');
  assert.equal(first.error.outcome_known, false);
  assert.equal(replay.status, 'unknown');
  assert.equal(replay.replayed, true);
  assert.equal(runtime.cluster.state.logs.filter((log) => log.cleaned).length, 3);

  const planV2 = cleanupPlan(runtime, 2);
  const approvalV2 = runtime.approvePlan({ plan: planV2 }).approval;
  const blindRetry = runtime.invoke({
    alias: 'cleanup_logs', plan: planV2, approval: approvalV2,
    expectedResourceVersion: planV2.target_resource_versions[`logs/${runtime.cluster.node}`],
    idempotencyKey: 'unknown-cleanup-key-2',
  });
  assert.equal(blindRetry.status, 'failed');
  assert.equal(blindRetry.error.code, 'unknown_outcome_reconcile_required');
  const reconciliation = runtime.gateway.reconcile('unknown-cleanup-key-1');
  assert.equal(reconciliation.automatic_retry, false);
});

test('1.1.0 events bind canonical hashes, HMAC signatures and injected trusted time', () => {
  const result = runShadow();
  assert.equal(verifyTrace(result.trace).valid, true);
  assert.equal(verifyTrace(result.trace_jsonl).valid, true);
  assert.deepEqual(result.trace.map((event) => event.sequence), result.trace.map((_, index) => index + 1));
  for (const event of result.trace) {
    assert.equal(event.schema_version, '1.1.0');
    assert.equal(event.integrity.hash_algorithm, 'sha256');
    assert.equal(event.integrity.signature.algorithm, 'HMAC-SHA256');
    assert.equal(event.integrity.signature.key_id, DEFAULT_EVENT_SIGNING_KEY_ID);
    assert.equal(event.integrity.trusted_time.source, 'injected_trusted_clock');
    assert.equal(event.integrity.trusted_time.observed_at, event.event_time);
    assert.equal(event.integrity.trusted_time.max_skew_seconds, 300);
    assert.equal(Number.isFinite(Date.parse(event.integrity.trusted_time.observed_at)), true);

    const hashBound = clone(event);
    delete hashBound.integrity.event_hash;
    delete hashBound.integrity.signature;
    assert.equal(event.integrity.event_hash, sha256(hashBound));
    const signatureBound = clone(event);
    delete signatureBound.integrity.signature;
    const expected = createHmac('sha256', DEFAULT_EVENT_SIGNING_KEY).update(canonicalJson(signatureBound)).digest('hex');
    assert.equal(event.integrity.signature.value, expected);
  }
});

test('payload and reference tampering fail hash and chain verification', () => {
  const result = runShadow();
  const tampered = clone(result.trace);
  tampered.find((event) => event.event_type === 'reasoning.recorded').payload.summary = 'tampered';
  assert.throws(() => verifyTrace(tampered), { code: 'HASH_MISMATCH' });
  const brokenReference = clone(result.trace);
  brokenReference[1].parent_event_id = 'evt_does_not_exist';
  assert.throws(() => verifyTrace(brokenReference), { code: 'HASH_MISMATCH' });
});

test('wrong event keys, unknown key ids and missing or invalid signatures fail closed', () => {
  const events = twoEventStore().events;
  assert.throws(() => verifyTrace(events, {
    keys: { [DEFAULT_EVENT_SIGNING_KEY_ID]: 'synthetic-wrong-event-key' },
  }), { code: 'INVALID_SIGNATURE' });
  const unknownKey = clone(events);
  unknownKey[0].integrity.signature.key_id = 'unknown-event-key';
  assert.throws(() => verifyTrace(unknownKey), { code: 'UNKNOWN_KEY_ID' });
  const missing = clone(events);
  delete missing[0].integrity.signature;
  assert.throws(() => verifyTrace(missing), { code: 'MISSING_SIGNATURE' });
  const invalid = clone(events);
  invalid[0].integrity.signature.value = '0'.repeat(64);
  assert.throws(() => verifyTrace(invalid), { code: 'INVALID_SIGNATURE' });
});

test('trusted time tampering and configured skew mismatches fail closed', () => {
  const events = twoEventStore().events;
  const tampered = clone(events);
  tampered[0].integrity.trusted_time.observed_at = '2026-11-24T00:00:01.000Z';
  assert.throws(() => verifyTrace(tampered), { code: 'HASH_MISMATCH' });

  const resignedMismatch = clone(events);
  resignedMismatch[0].integrity.trusted_time.observed_at = '2026-11-24T00:00:01.000Z';
  resignTrace(resignedMismatch);
  assert.throws(() => verifyTrace(resignedMismatch), { code: 'TRUSTED_TIME_MISMATCH' });

  const wrongSkew = clone(events);
  wrongSkew[0].integrity.trusted_time.max_skew_seconds = 5;
  resignTrace(wrongSkew);
  assert.throws(() => verifyTrace(wrongSkew), { code: 'TRUSTED_TIME_MISMATCH' });
  const invalidSkew = clone(events);
  invalidSkew[0].integrity.trusted_time.max_skew_seconds = 301;
  resignTrace(invalidSkew);
  assert.throws(() => verifyTrace(invalidSkew), { code: 'SCHEMA_VIOLATION' });
  const wrongSource = clone(events);
  wrongSource[0].integrity.trusted_time.source = 'untrusted_wall_clock';
  resignTrace(wrongSource);
  assert.throws(() => verifyTrace(wrongSource), { code: 'SCHEMA_VIOLATION' });
});

test('trusted clock injection, key maps and optional clock skew are enforced', () => {
  let trustedAt = DEFAULT_NOW;
  const keys = { 'synthetic-map-key': 'synthetic-map-secret-not-for-production' };
  const store = new EventStore({
    now: () => DEFAULT_NOW, trustedTimeSource: () => trustedAt,
    maxClockSkewSeconds: 5, signingKeys: keys,
  });
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'test', scenario_id: 'test', slo_class: 'SEV3' },
  });
  assert.equal(store.head.integrity.trusted_time.observed_at, trustedAt);
  assert.equal(store.head.integrity.signature.key_id, 'synthetic-map-key');
  assert.equal(store.verify({ now: trustedAt }).valid, true);
  assert.equal(verifyTrace(store.events, { keys, maxClockSkewSeconds: 5, now: trustedAt }).valid, true);
  const anchor = createAnchor(store.events, { keys, maxClockSkewSeconds: 5, anchorId: 'anc_custom_key' });
  assert.equal(verifyAnchor(store.events, anchor, { keys, maxClockSkewSeconds: 5 }).valid, true);
  assert.throws(() => createAnchor(store.events, { anchorId: 'anc_missing_key' }), { code: 'UNKNOWN_KEY_ID' });
  assert.equal(verifyTrace(store.events, { keys, maxClockSkewSeconds: 5, now: '2026-11-24T00:00:05.000Z' }).valid, true);
  assert.throws(() => verifyTrace(store.events, { keys, maxClockSkewSeconds: 5, now: '2026-11-24T00:00:06.000Z' }), { code: 'CLOCK_SKEW_EXCEEDED' });
});

test('a fully rewritten chain signed with the wrong key cannot satisfy the original anchor', () => {
  const original = twoEventStore();
  const anchor = original.createAnchor({ anchorId: 'anc_original' });
  const attacker = twoEventStore({
    signingKey: 'synthetic-attacker-key-not-a-secret', signingKeyId: DEFAULT_EVENT_SIGNING_KEY_ID,
  }, 'rewritten');
  assert.equal(verifyTrace(attacker.events, {
    keys: { [DEFAULT_EVENT_SIGNING_KEY_ID]: 'synthetic-attacker-key-not-a-secret' },
  }).valid, true);
  assert.throws(() => verifyTrace(attacker.events), { code: 'INVALID_SIGNATURE' });
  assert.equal(verifyAnchor(original.events, anchor).valid, true);
  assert.throws(() => verifyAnchor(attacker.events, anchor, {
    keys: { [DEFAULT_EVENT_SIGNING_KEY_ID]: 'synthetic-attacker-key-not-a-secret' },
  }), { code: 'ANCHOR_HEAD_MISMATCH' });
});

test('external anchors bind trace identity, head, count, time and an independent HMAC key', () => {
  const events = twoEventStore().events;
  const anchor = createAnchor(events, { anchorId: 'anc_test', anchoredAt: DEFAULT_NOW });
  assert.deepEqual(Object.keys(anchor).sort(), [
    'anchor_id', 'anchored_at', 'chain_id', 'event_count', 'head_hash', 'previous_anchor_hash',
    'schema_version', 'signature', 'store',
  ].sort());
  assert.equal(anchor.schema_version, '1.0.0');
  assert.equal(anchor.store, 'synthetic-local-worm');
  assert.equal(anchor.chain_id, events[0].trace_id);
  assert.equal(anchor.event_count, events.length);
  assert.equal(anchor.head_hash, events.at(-1).integrity.event_hash);
  assert.equal(anchor.previous_anchor_hash, null);
  assert.equal(anchor.signature.algorithm, 'HMAC-SHA256');
  assert.equal(anchor.signature.key_id, DEFAULT_ANCHOR_KEY_ID);
  assert.notEqual(anchor.signature.key_id, DEFAULT_EVENT_SIGNING_KEY_ID);
  const bound = clone(anchor);
  delete bound.signature;
  assert.equal(anchor.signature.value, createHmac('sha256', DEFAULT_ANCHOR_KEY).update(canonicalJson(bound)).digest('hex'));
  assert.equal(verifyAnchor(events, anchor).valid, true);
  assert.equal(verifyAnchor(events, anchor, { now: DEFAULT_NOW }).valid, true);
  assert.throws(() => verifyAnchor(events, anchor, { now: '2026-11-24T00:05:01.000Z' }), { code: 'CLOCK_SKEW_EXCEEDED' });
  assert.throws(() => verifyAnchor(events, anchor, { anchorKey: 'synthetic-wrong-anchor-key' }), { code: 'INVALID_ANCHOR_SIGNATURE' });
  assert.throws(() => verifyAnchor(events, anchor, { anchorKeyId: 'unknown-anchor-key' }), { code: 'UNKNOWN_KEY_ID' });
  const backward = createAnchor(events, { anchorId: 'anc_backward', anchoredAt: '2026-11-23T23:59:59.000Z' });
  assert.throws(() => verifyAnchor(events, backward), { code: 'INVALID_ANCHOR_TIME' });
});

test('anchor head, count, chain and signature tampering fail closed', () => {
  const events = twoEventStore().events;
  const anchor = createAnchor(events, { anchorId: 'anc_test' });
  const headMismatch = clone(anchor);
  headMismatch.head_hash = '0'.repeat(64);
  assert.throws(() => verifyAnchor(events, headMismatch), { code: 'ANCHOR_HEAD_MISMATCH' });
  const countMismatch = clone(anchor);
  countMismatch.event_count += 1;
  assert.throws(() => verifyAnchor(events, countMismatch), { code: 'ANCHOR_COUNT_MISMATCH' });
  const chainMismatch = clone(anchor);
  chainMismatch.chain_id = 'tr_other';
  assert.throws(() => verifyAnchor(events, chainMismatch), { code: 'ANCHOR_CHAIN_MISMATCH' });
  const signatureTamper = clone(anchor);
  signatureTamper.signature.value = '0'.repeat(64);
  assert.throws(() => verifyAnchor(events, signatureTamper), { code: 'INVALID_ANCHOR_SIGNATURE' });
});

test('successive store anchors preserve signed previous-anchor continuity', () => {
  const store = new EventStore({ now: () => DEFAULT_NOW });
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'test', scenario_id: 'test', slo_class: 'SEV3' },
  });
  const first = store.createAnchor({ anchorId: 'anc_first' });
  store.append({
    type: 'run.completed', payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false },
  });
  const second = store.createAnchor({ anchorId: 'anc_second' });
  assert.equal(first.previous_anchor_hash, null);
  assert.equal(second.previous_anchor_hash, sha256(first));
  assert.equal(store.verifyAnchor(second).valid, true);
  assert.equal(store.verifyAnchor(second).previous_anchor_verified, true);
  assert.equal(store.verifyAnchor(second).anchor_chain_verified, true);
  assert.equal(verifyAnchor(store.events, second, { previousAnchor: first }).valid, true);
  assert.equal(verifyAnchor(store.events, second, { previousAnchor: first }).anchor_chain_verified, false);
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'third', scenario_id: 'test', slo_class: 'SEV3' },
  });
  const third = store.createAnchor({ anchorId: 'anc_third' });
  const complete = store.verifyAnchor(third);
  assert.equal(complete.anchor_chain_verified, true);
  assert.equal(complete.verified_anchor_count, 3);
  assert.equal(verifyAnchor(store.events, third, { anchorChain: [first, second] }).valid, true);
  assert.throws(() => verifyAnchor(store.events, third, { anchorChain: [second] }), { code: 'ANCHOR_CHAIN_INCOMPLETE' });
  assert.throws(() => verifyAnchor(store.events.slice(0, 2), second), { code: 'ANCHOR_CONTINUITY_BROKEN' });
  const brokenContinuity = clone(second);
  brokenContinuity.previous_anchor_hash = '0'.repeat(64);
  const bound = clone(brokenContinuity);
  delete bound.signature;
  brokenContinuity.signature.value = createHmac('sha256', DEFAULT_ANCHOR_KEY).update(canonicalJson(bound)).digest('hex');
  assert.throws(() => verifyAnchor(store.events.slice(0, 2), brokenContinuity), { code: 'ANCHOR_CONTINUITY_BROKEN' });
});

test('complete anchor chain verifies historical prefixes without false clock-skew failures', () => {
  let nowMs = Date.parse(DEFAULT_NOW);
  const store = new EventStore({ now: () => nowMs });
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'day-0', scenario_id: 'test', slo_class: 'SEV3' },
  });
  const first = store.createAnchor({ anchorId: 'anc_day_0' });
  nowMs += 86_400_000;
  store.append({
    type: 'run.completed', payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false },
  });
  const second = store.createAnchor({ anchorId: 'anc_day_1' });
  nowMs += 86_400_000;
  store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'day-2', scenario_id: 'test', slo_class: 'SEV3' },
  });
  const third = store.createAnchor({ anchorId: 'anc_day_2' });
  const result = verifyAnchor(store.events, third, { anchorChain: [first, second], now: nowMs });
  assert.equal(result.valid, true);
  assert.equal(result.anchor_chain_verified, true);
  assert.equal(result.verified_anchor_count, 3);
  assert.throws(() => verifyAnchor(store.events, third, {
    anchorChain: [first, second], now: nowMs + 86_400_000,
  }), { code: 'CLOCK_SKEW_EXCEEDED' });
});

test('anchor continuity rejects a previous head from a different trace prefix', () => {
  const original = new EventStore({ now: () => DEFAULT_NOW });
  original.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'shared-prefix', scenario_id: 'test', slo_class: 'SEV3' },
  });
  const first = original.createAnchor({ anchorId: 'anc_shared_prefix' });

  const fork = new EventStore({ now: () => DEFAULT_NOW });
  fork.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'different-prefix', scenario_id: 'test', slo_class: 'SEV3' },
  });
  fork.append({
    type: 'run.completed', payload: { outcome: 'failure', error_code: 'synthetic_fork', verified: false, human_takeover: true },
  });
  const forkedAnchor = fork.createAnchor({ anchorId: 'anc_fork', previousAnchorHash: sha256(first) });
  assert.throws(() => verifyAnchor(fork.events, forkedAnchor, { previousAnchor: first }), { code: 'ANCHOR_HEAD_MISMATCH' });
});

test('append-only JSONL export verifies after reopening', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'reference-agent-trace-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const store = new EventStore({ now: () => DEFAULT_NOW });
  const first = store.append({
    type: 'run.started', payload: { input_ref: 'synthetic', intent: 'test', scenario_id: 'test', slo_class: 'SEV3' },
  });
  store.append({
    type: 'run.completed', parent: first.event_id, causation: first.event_id,
    payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false },
  });
  const file = join(dir, 'trace.jsonl');
  store.exportJsonl(file);
  store.exportJsonl(file);
  assert.equal(verifyJsonl(file).event_count, 2);
  assert.equal(readFileSync(file, 'utf8').trim().split('\n').length, 2);
  const anchorFile = join(dir, 'anchor.json');
  const anchor = store.exportAnchor(anchorFile, { anchorId: 'anc_export_test' });
  assert.deepEqual(JSON.parse(readFileSync(anchorFile, 'utf8')), anchor);
  assert.equal(verifyAnchor(store.events, anchor).valid, true);
  assert.throws(() => store.append({ type: 'run.completed', payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false, extra: true } }), { code: 'SCHEMA_VIOLATION' });
});

test('run output writes a verifiable anchor and records anchor identity in the summary', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'reference-agent-output-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const result = runShadow();
  const files = writeRunOutput(result, dir);
  const summary = JSON.parse(readFileSync(files.summary_path, 'utf8'));
  const events = readFileSync(files.trace_path, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  const anchor = JSON.parse(readFileSync(files.anchor_path, 'utf8'));
  assert.equal(files.trace_verified, true);
  assert.equal(files.anchor_verified, true);
  assert.equal(verifyJsonl(files.trace_path).valid, true);
  assert.equal(verifyAnchor(events, anchor).valid, true);
  assert.equal(summary.trace.anchor_id, anchor.anchor_id);
  assert.equal(summary.trace.head_hash, anchor.head_hash);
  assert.equal(summary.trace.verified, true);
  assert.equal(summary.production_ready, false);
});

test('shadow records would-do with no mounted write tools or state changes', () => {
  const result = runShadow();
  assert.equal(result.summary.outcome, 'success');
  assert.equal(result.summary.counts.write_side_effects, 0);
  assert.equal(result.summary.counts.would_do, 3);
  assert.equal(result.summary.would_do_count, 3);
  assert.equal(result.summary.final_state.node.unschedulable, false);
  assert.equal(result.summary.final_state.logs_remaining.length, 3);
});

test('NotReady demo completes v1 partial halt, v2 cleanup and approved uncordon', () => {
  const result = runNotReadyScenario();
  assert.equal(result.summary.outcome, 'success');
  assert.equal(result.summary.verified, true);
  assert.deepEqual(result.summary.plan_versions, [1, 2, 3]);
  assert.equal(result.summary.approvals.length, 3);
  assert.equal(result.summary.steps[1].status, 'partial_success');
  assert.equal(result.summary.steps[1].succeeded, 2);
  assert.equal(result.summary.final_state.node.ready, true);
  assert.equal(result.summary.final_state.node.unschedulable, false);
  assert.equal(result.summary.final_state.pdb.satisfied, true);
  assert.equal(result.summary.final_state.slo.within_budget, true);
  assert.equal(result.summary.trace.verified, true);
});

test('canary permits exactly one synthetic node write', () => {
  const result = runCanary();
  assert.equal(result.summary.outcome, 'success');
  assert.equal(result.summary.counts.write_side_effects, 1);
  assert.equal(result.summary.canary_scope.node, 'synthetic-node-07');
  assert.equal(result.summary.checks.find((check) => check.name === 'other_node_rejected').passed, true);
});

test('rollback engages kill switch, blocks writes, revokes credential and restores LKG read-only', () => {
  const result = runRollback();
  assert.equal(result.summary.outcome, 'rolled_back');
  assert.equal(result.summary.kill_switch.engaged, true);
  assert.equal(result.summary.kill_switch.automatic_writes, false);
  assert.equal(result.summary.read_only, true);
  assert.equal(result.summary.final_state.node.unschedulable, false);
  assert.equal(result.summary.final_state.logs_remaining.length, 3);
  assert.equal(result.summary.checks.every((check) => check.passed), true);
});

test('single approval cannot satisfy a dual-approval drain rule', () => {
  const runtime = readyRuntime();
  const target = runtime.cluster.state.node.resource_version;
  const plan = runtime.makePlan({
    version: 1, steps: [{ id: 'drain', tool: 'k8s.drain_node', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: target },
  });
  const approval = runtime.approvePlan({ plan, type: 'single' }).approval;
  const result = runtime.invoke({
    alias: 'drain_node', plan, approval, expectedResourceVersion: target,
    idempotencyKey: 'insufficient-approval-key-1',
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'approval_insufficient');
  assert.equal(runtime.cluster.state.node.unschedulable, false);
});

test('write calls require an explicit idempotency key of at least eight characters', () => {
  const runtime = readyRuntime();
  const target = runtime.cluster.state.node.resource_version;
  const plan = runtime.makePlan({
    version: 1, steps: [{ id: 'drain', tool: 'k8s.drain_node', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: target },
  });
  const approval = runtime.approvePlan({ plan }).approval;
  const result = runtime.gateway.invoke({
    tool: 'drain_node', principal: OPERATOR, token: runtime.tokens.operator.token,
    delegation: runtime.identities.operator.delegation, plan,
    approval_id: approval.approval_id, expected_resource_version: target,
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'idempotency_key_required');
  assert.equal(runtime.cluster.state.node.resource_version, target);
});

test('dry-run write has approval checks but no synthetic side effect', () => {
  const runtime = readyRuntime();
  const before = canonicalJson(runtime.cluster.snapshot());
  const target = runtime.cluster.state.node.resource_version;
  const plan = runtime.makePlan({
    version: 1, steps: [{ id: 'drain', tool: 'k8s.drain_node', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: target },
  });
  const approval = runtime.approvePlan({ plan }).approval;
  const result = runtime.invoke({
    alias: 'drain_node', plan, approval, expectedResourceVersion: target,
    idempotencyKey: 'dry-run-drain-key-1', dryRun: true,
  });
  assert.equal(result.status, 'dry_run');
  assert.equal(canonicalJson(runtime.cluster.snapshot()), before);
});
