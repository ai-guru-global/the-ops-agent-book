import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApprovalService } from '../src/approval-service.mjs';
import { CredentialService } from '../src/credential-service.mjs';
import { EventStore, verifyJsonl, verifyTrace } from '../src/event-store.mjs';
import { createRuntime, runCanary, runNotReadyScenario, runRollback, runShadow } from '../src/runtime.mjs';
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

test('trace verifies monotonic sequence, references and SHA-256 chain; tampering fails', () => {
  const result = runShadow();
  assert.equal(verifyTrace(result.trace).valid, true);
  assert.deepEqual(result.trace.map((event) => event.sequence), result.trace.map((_, index) => index + 1));
  const tampered = clone(result.trace);
  tampered.find((event) => event.event_type === 'reasoning.recorded').payload.summary = 'tampered';
  assert.throws(() => verifyTrace(tampered), { code: 'HASH_MISMATCH' });
  const brokenReference = clone(result.trace);
  brokenReference[1].parent_event_id = 'evt_does_not_exist';
  assert.throws(() => verifyTrace(brokenReference), { code: 'HASH_MISMATCH' });
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
  assert.throws(() => store.append({ type: 'run.completed', payload: { outcome: 'success', error_code: null, verified: true, human_takeover: false, extra: true } }), { code: 'SCHEMA_VIOLATION' });
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
