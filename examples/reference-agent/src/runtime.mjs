import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApprovalService } from './approval-service.mjs';
import { CredentialService } from './credential-service.mjs';
import { createAnchor, EventStore, verifyAnchor, verifyTrace } from './event-store.mjs';
import { PolicyEngine } from './policy-engine.mjs';
import { SyntheticCluster, ToolGateway, TOOL_ALIASES } from './tool-gateway.mjs';
import {
  canonicalJson, clone, DEFAULT_NOW, randomSecret, sha256, SYNTHETIC_CLUSTER, SYNTHETIC_NODE, toMillis,
} from './shared.mjs';

const COPILOT = 'nhai:agent:synthetic-copilot';
const OPERATOR = 'nhai:agent:synthetic-operator';
const READ_SCOPES = ['k8s.read_node:read', 'k8s.check_pdb:read', 'logs.query:read'];
const WRITE_SCOPES = ['k8s.drain_node:write', 'node.cleanup_logs:write', 'k8s.uncordon:write'];
const VERSIONS = {
  agent_version: '0.1.0', deployment_version: 'synthetic-local-1', prompt_version: 'prompt-notready-1',
  model_version: 'deterministic-synthetic-model-1', tool_contract_version: 'k8s.drain_node/1.1.0',
  knowledge_version: 'kb-notready-1', policy_version: '1.0.0', eval_set_version: 'notready-synthetic-1',
};

export function createRuntime(options = {}) {
  return new ReferenceRuntime(options);
}

class ReferenceRuntime {
  constructor(options = {}) {
    this.mode = options.mode || 'demo';
    this.outputDir = options.outputDir || null;
    this.runId = options.runId || `run_${this.mode}_synthetic`;
    this.sessionId = options.sessionId || `ses_${this.mode}_synthetic`;
    this.traceId = options.traceId || `tr_${this.mode}_synthetic`;
    let current = toMillis(options.now ?? DEFAULT_NOW);
    this.clock = options.clock || (() => new Date(current).toISOString());
    this.advance = options.advance || ((seconds = 1) => {
      current += seconds * 1000;
      return new Date(current).toISOString();
    });
    this.policyEngine = options.policyEngine || new PolicyEngine(options.policyPath);
    this.approvalService = options.approvalService || new ApprovalService({ now: this.clock });
    this.credentialService = options.credentialService || new CredentialService({ secret: options.secret || randomSecret(), now: this.clock });
    this.eventStore = options.eventStore || new EventStore({
      now: this.clock,
      context: { tenant_id: 'tenant_synthetic_payments', session_id: this.sessionId, trace_id: this.traceId, run_id: this.runId },
      versions: { ...VERSIONS, policy_version: this.policyEngine.policy.version },
    });
    this.cluster = options.cluster || new SyntheticCluster({ node: options.node || SYNTHETIC_NODE, cluster: options.clusterName || SYNTHETIC_CLUSTER });
    this.initialSnapshot = this.cluster.snapshot();
    this.gateway = options.gateway || new ToolGateway({
      cluster: this.cluster, policy: this.policyEngine, approvalService: this.approvalService,
      credentialService: this.credentialService, eventStore: this.eventStore, now: this.clock,
      mode: this.mode, runId: this.runId,
    });
    this.gateway.failedLogId = options.failedLogId ?? 'logs-c';
    this.tokens = {};
    this.identities = {
      copilot: { principal: COPILOT, delegation: { from: 'human:synthetic-observer', depth: 0, active: true, non_transferable: true } },
      operator: { principal: OPERATOR, delegation: { from: 'human:synthetic-oncall', depth: 1, active: true, non_transferable: true } },
    };
  }

  issueCredentials() {
    this.tokens.copilot = this.credentialService.issue({ subject: COPILOT, actor: { id: COPILOT }, delegation: this.identities.copilot.delegation, scope: READ_SCOPES });
    this.tokens.operator = this.credentialService.issue({ subject: OPERATOR, actor: { id: OPERATOR }, delegation: this.identities.operator.delegation, scope: WRITE_SCOPES });
    return { copilot: this.tokens.copilot, operator: this.tokens.operator };
  }

  start(scenarioId = 'notready-synthetic') {
    this.advance();
    return this.emit({
      type: 'run.started',
      actor: { type: 'system', id: 'synthetic-runtime' },
      subject: { resource_type: 'scenario', resource_id: scenarioId, environment: this.mode === 'shadow' ? 'shadow' : this.mode === 'canary' ? 'canary' : 'production', action_class: 'none', risk_level: 'medium' },
      payload: { input_ref: 'examples/cases/notready/permission-policy.notready.json', intent: 'diagnose and safely remediate a synthetic NotReady GPU node', scenario_id: scenarioId, slo_class: 'SEV2' },
    });
  }

  recordModelAndReasoning(evidenceRefs) {
    this.advance();
    const modelEvent = this.emit({
      type: 'model.completed', actor: { type: 'agent', id: COPILOT },
      payload: { provider: 'synthetic', model: 'deterministic-synthetic-model-1', input_tokens: 120, output_tokens: 50, cost_usd: 0, latency_ms: 1 },
    });
    this.advance();
    const reasoningEvent = this.emit({
      type: 'reasoning.recorded', actor: { type: 'agent', id: COPILOT }, parent: modelEvent.event_id,
      payload: {
        summary: 'Synthetic node is NotReady with DiskPressure and imagefs below the eviction threshold. Freeze a single-node plan; do not bypass PDB.',
        evidence_refs: evidenceRefs,
        hypotheses: ['container log rotation failure filled imagefs', 'kubelet crash', 'CNI failure'],
        selected_hypothesis: 'container log rotation failure filled imagefs', confidence: 0.95,
      },
    });
    return { modelEvent, reasoningEvent };
  }

  readDiagnosis() {
    const nodeEvent = this.invoke({
      alias: 'read_node', identity: 'copilot', cluster: this.cluster.cluster, node: this.cluster.node,
      idempotency_key: `${this.runId}:read-node:v1`,
    });
    const pdbEvent = this.invoke({
      alias: 'read_pdb', identity: 'copilot', cluster: this.cluster.cluster,
      idempotency_key: `${this.runId}:read-pdb:v1`,
    });
    return { node: nodeEvent, pdb: pdbEvent, events: [nodeEvent.event, pdbEvent.event] };
  }

  makePlan({ version, steps, targets, expiresInSeconds = 1800 }) {
    const plan = {
      plan_id: `plan_${this.runId}`,
      plan_version: version,
      created_at: this.clock(),
      created_by: COPILOT,
      purpose: 'notready-diagnosis',
      environment: 'prod',
      change_window: { id: 'synthetic-approved-window', opens_at: this.clock(), closes_at: new Date(toMillis(this.clock()) + expiresInSeconds * 1000).toISOString() },
      steps: steps.map((step) => ({ ...step, action: 'write' })),
      target_resource_versions: targets,
      expires_at: new Date(toMillis(this.clock()) + expiresInSeconds * 1000).toISOString(),
      rollback_mode: 'compensate_lkg_or_approved_uncordon',
      data_classification: 'synthetic/desensitized',
    };
    return this.approvalService.freezePlan(plan);
  }

  approvePlan({ plan, type = 'dual', approvers, reasonCode = 'synthetic_plan_approved' }) {
    const approval = this.approvalService.request({ plan, requester: COPILOT, approvalType: type, now: this.clock() });
    let current = approval;
    const selected = approvers || (type === 'dual' ? ['human:synthetic-reviewer-a', 'human:synthetic-reviewer-b'] : ['human:synthetic-release-manager']);
    for (const approver of selected) {
      this.advance();
      current = this.approvalService.approve({ approvalId: approval.approval_id, approver, reasonCode, now: this.clock() });
    }
    const event = this.emit({
      type: 'approval.decided', actor: { type: 'human', id: selected.at(-1) }, causation: approval.approval_id ? this.eventStore.head?.event_id : null,
      payload: {
        approval_id: current.approval_id, decision: 'approved', approver_ids: [...current.approver_ids],
        reason_code: reasonCode, policy_version: this.policyEngine.policy.version, decided_at: this.clock(),
      },
    });
    return { approval: current, event };
  }

  invoke({ alias, identity = 'operator', plan, approval, expectedResourceVersion, idempotencyKey, dryRun = false, simulateOutcome, revalidate }) {
    const selected = this.identities[identity];
    const canonical = TOOL_ALIASES[alias] || alias;
    const resource = canonical === 'node.cleanup_logs'
      ? this.cluster.logResource()
      : ['k8s.read_node', 'k8s.check_pdb'].includes(canonical)
        ? { type: 'cluster', id: this.cluster.cluster, labels: { cluster: this.cluster.cluster } }
        : this.cluster.nodeResource();
    const request = {
      tool: alias, principal: selected.principal, token: this.tokens[identity]?.token,
      delegation: selected.delegation, cluster: this.cluster.cluster, node: this.cluster.node,
      resource, plan, approval_id: approval?.approval_id || null,
      expected_resource_version: expectedResourceVersion || null,
      idempotency_key: idempotencyKey || `${this.runId}:${alias}:${this.gateway.audit.length + 1}`,
      dry_run: dryRun, simulate_outcome: simulateOutcome,
      window: { open: true, id: 'synthetic-approved-window' },
      revalidate: revalidate || ((context) => this.revalidateWrite(context)),
    };
    this.advance();
    const result = this.gateway.invoke(request);
    return { ...result, event: this.eventStore.head };
  }

  revalidateWrite({ request, approval }) {
    if (this.gateway.killSwitchEngaged) return { valid: false, reason: 'kill_switch_engaged' };
    const validation = this.approvalService.validate({ approvalId: approval?.approval_id, plan: request.plan, invocation: { tool: request.tool, resource: request.resource, expectedResourceVersion: request.expectedResourceVersion }, now: this.clock() });
    if (!validation.valid) return validation;
    if (request.tool === 'node.cleanup_logs' && this.cluster.state.log_resource_version !== request.expectedResourceVersion) {
      return { valid: false, reason: 'target_resource_version_changed' };
    }
    if (request.tool !== 'node.cleanup_logs' && this.cluster.state.node.resource_version !== request.expectedResourceVersion) {
      return { valid: false, reason: 'target_resource_version_changed' };
    }
    return { valid: true };
  }

  verification(checks, evidenceRefs = []) {
    this.advance();
    return this.emit({
      type: 'verification.completed', actor: { type: 'service', id: 'synthetic-verifier' },
      payload: {
        verification_id: `ver_${this.eventStore.events.length + 1}`,
        checks: checks.map((check) => check.name), passed: checks.every((check) => check.passed),
        evidence_refs: evidenceRefs.length ? evidenceRefs : checks.filter((check) => check.evidence).map((check) => check.evidence),
      },
    });
  }

  complete(outcome, { verified = false, errorCode = null, humanTakeover = false } = {}) {
    this.advance();
    const event = this.emit({
      type: 'run.completed', actor: { type: 'system', id: 'synthetic-runtime' },
      payload: { outcome, error_code: errorCode, verified, human_takeover: humanTakeover },
    });
    return event;
  }

  emit({ type, payload, actor, subject, parent, causation }) {
    const event = this.eventStore.append({ type, payload, actor, subject, parent, causation });
    this.eventStore.setCausation(event.event_id);
    return event;
  }

  summarize({ outcome, verified, steps, approvals = [], checks = [], errorCode = null, humanTakeover = false, extra = {} }) {
    const state = this.cluster.snapshot();
    const trace = this.eventStore.verify();
    const anchor = this.eventStore.createAnchor();
    const anchored = this.eventStore.verifyAnchor(anchor);
    const summary = {
      scenario_id: 'notready-synthetic', mode: this.mode, run_id: this.runId,
      synthetic: true, data_classification: 'synthetic/desensitized', production_ready: false,
      outcome, error_code: errorCode, verified, human_takeover: humanTakeover,
      plan_versions: [...new Set(steps.filter((step) => step.plan_version).map((step) => step.plan_version))],
      approvals: approvals.map((approval) => ({
        approval_id: approval.approval_id, plan_version: approval.plan_version,
        plan_hash: approval.plan_hash, target_resource_versions: clone(approval.target_resource_versions),
        approval_type: approval.approval_type, status: approval.status,
        approver_ids: [...approval.approver_ids], expires_at: approval.expires_at,
      })),
      steps,
      checks,
      initial_state: clone(this.initialSnapshot),
      final_state: {
        node: state.node, filesystem: state.filesystem, pdb: state.pdb, capacity: state.capacity, slo: state.slo,
        logs_remaining: state.logs.filter((log) => !log.cleaned).map((log) => log.id),
        automatic_writes: !this.gateway.killSwitchEngaged,
      },
      counts: {
        read_calls: this.gateway.audit.filter((item) => item.tool === 'k8s.read_node' || item.tool === 'k8s.check_pdb').length,
        write_calls: this.gateway.audit.filter((item) => ['k8s.drain_node', 'node.cleanup_logs', 'k8s.uncordon'].includes(item.tool)).length,
        write_side_effects: this.gateway.audit.filter((item) => item.write_executed).length,
        would_do: this.gateway.audit.filter((item) => item.outcome === 'would_do').length,
        denied_calls: this.gateway.audit.filter((item) => item.deny_reason).length,
      },
      trace: {
        event_count: trace.event_count, head_hash: trace.head_hash,
        verified: trace.valid && anchored.valid, anchor_id: anchor.anchor_id,
      },
      cost: { model_cost_usd: 0, tool_cost_usd: 0, human_cost_usd: 0, currency: 'USD', synthetic: true },
      ...extra,
    };
    const events = this.eventStore.events;
    return {
      success: outcome === 'success', summary, trace: events, events, anchor, audit: this.gateway.audit,
      trace_jsonl: `${events.map((event) => canonicalJson(event)).join('\n')}\n`,
      final_state: summary.final_state,
    };
  }
}

export function runNotReadyScenario(options = {}) {
  const runtime = createRuntime({ ...options, mode: options.mode || 'demo' });
  runtime.issueCredentials();
  runtime.start();
  const diagnosis = runtime.readDiagnosis();
  runtime.recordModelAndReasoning(diagnosis.events.map((event) => event.event_id));
  const steps = [];
  const approvals = [];
  const checks = [];

  // Node and log targets share a synthetic node id, so explicit version keys
  // keep both approval bindings unambiguous.
  const targetsV1 = Object.fromEntries([
    [`node/${runtime.cluster.node}`, runtime.cluster.state.node.resource_version],
    [`logs/${runtime.cluster.node}`, runtime.cluster.state.log_resource_version],
  ]);
  const boundV1 = runtime.makePlan({
    version: 1,
    steps: [
      { id: 'drain-notready-node', tool: 'k8s.drain_node', resource: { ...runtime.cluster.nodeResource(), version_key: `node/${runtime.cluster.node}` } },
      { id: 'cleanup-old-logs', tool: 'node.cleanup_logs', resource: { ...runtime.cluster.logResource(), version_key: `logs/${runtime.cluster.node}` } },
    ],
    targets: targetsV1,
  });
  const approvalV1 = runtime.approvePlan({ plan: boundV1, type: 'dual' });
  approvals.push(approvalV1.approval);
  const operatorRevalidation = runtime.revalidateWrite({
    request: { tool: 'k8s.drain_node', plan: boundV1, resource: runtime.cluster.nodeResource(), expectedResourceVersion: targetsV1[`node/${runtime.cluster.node}`] },
    approval: approvalV1.approval,
  });
  checks.push({ name: 'operator_revalidation_before_drain', passed: operatorRevalidation.valid, evidence: approvalV1.event.event_id });

  const drained = runtime.invoke({
    alias: 'drain_node', plan: boundV1, approval: approvalV1.approval,
    expectedResourceVersion: targetsV1[`node/${runtime.cluster.node}`],
    idempotencyKey: `${runtime.runId}:v1:drain:${targetsV1[`node/${runtime.cluster.node}`]}`,
  });
  steps.push({ step_id: 'drain-notready-node', tool: 'k8s.drain_node', plan_version: 1, status: drained.status, partial_success: drained.partial_success, replayed: drained.replayed });
  if (drained.status !== 'succeeded') {
    runtime.verification([{ name: 'drain_succeeded', passed: false, evidence: drained.event?.event_id }], [drained.event?.event_id]);
    runtime.complete('escalated', { errorCode: drained.error?.code || 'drain_failed', humanTakeover: true });
    return finalize(runtime, { outcome: 'escalated', verified: false, steps, approvals, checks, errorCode: drained.error?.code || 'drain_failed', humanTakeover: true });
  }

  const cleanedV1 = runtime.invoke({
    alias: 'cleanup_logs', plan: boundV1, approval: approvalV1.approval,
    expectedResourceVersion: targetsV1[`logs/${runtime.cluster.node}`],
    idempotencyKey: `${runtime.runId}:v1:cleanup:${targetsV1[`logs/${runtime.cluster.node}`]}`,
  });
  steps.push({ step_id: 'cleanup-old-logs', tool: 'node.cleanup_logs', plan_version: 1, status: cleanedV1.status, partial_success: cleanedV1.partial_success, succeeded: cleanedV1.cleaned, requested: cleanedV1.requested });
  const partialVerification = runtime.verification([
    { name: 'cleanup_complete', passed: false, evidence: cleanedV1.event?.event_id },
  ], [cleanedV1.event?.event_id]);

  runtime.gateway.failedLogId = null;
  const targetsV2 = { [`logs/${runtime.cluster.node}`]: runtime.cluster.state.log_resource_version };
  const planV2 = runtime.makePlan({
    version: 2,
    steps: [{ id: 'finish-cleanup', tool: 'node.cleanup_logs', resource: { ...runtime.cluster.logResource(), version_key: `logs/${runtime.cluster.node}` } }],
    targets: targetsV2,
  });
  const approvalV2 = runtime.approvePlan({ plan: planV2, type: 'dual', reasonCode: 'replanned_remaining_cleanup' });
  approvals.push(approvalV2.approval);
  // Even a valid new approval cannot clear the partial-success safety latch.
  const haltedV2 = runtime.invoke({
    alias: 'cleanup_logs', plan: planV2, approval: approvalV2.approval,
    expectedResourceVersion: targetsV2[`logs/${runtime.cluster.node}`],
    idempotencyKey: `${runtime.runId}:v2:halt-check:${targetsV2[`logs/${runtime.cluster.node}`]}`,
  });
  checks.push({
    name: 'partial_success_2_of_3_stops_next_step',
    passed: cleanedV1.status === 'partial_success' && cleanedV1.cleaned === 2
      && haltedV2.status === 'failed' && haltedV2.error?.code === 'partial_success_halt',
    evidence: haltedV2.event?.event_id,
  });
  runtime.gateway.resumeAfterReplan({ plan: planV2, approvalId: approvalV2.approval.approval_id });
  const cleanedV2 = runtime.invoke({
    alias: 'cleanup_logs', plan: planV2, approval: approvalV2.approval,
    expectedResourceVersion: targetsV2[`logs/${runtime.cluster.node}`],
    idempotencyKey: `${runtime.runId}:v2:cleanup:${targetsV2[`logs/${runtime.cluster.node}`]}`,
  });
  steps.push({ step_id: 'finish-cleanup', tool: 'node.cleanup_logs', plan_version: 2, status: cleanedV2.status, partial_success: cleanedV2.partial_success, succeeded: cleanedV2.cleaned, requested: cleanedV2.requested });
  checks.push({ name: 'replanned_cleanup_complete', passed: cleanedV2.status === 'succeeded' && runtime.cluster.state.logs.every((log) => log.cleaned), evidence: cleanedV2.event?.event_id });

  // External synthetic controller recovery occurs only after cleanup completes.
  runtime.cluster.completeRecovery();
  const finalDiagnosis = runtime.readDiagnosis();
  const recoveryChecks = [
    { name: 'node_ready', passed: finalDiagnosis.node.status === 'succeeded' && finalDiagnosis.node.node?.ready === true, evidence: finalDiagnosis.events[0].event_id },
    { name: 'pdb_satisfied', passed: finalDiagnosis.pdb.status === 'succeeded' && finalDiagnosis.pdb.pdb?.satisfied === true, evidence: finalDiagnosis.events[1].event_id },
    { name: 'capacity_available', passed: runtime.cluster.state.capacity.available, evidence: finalDiagnosis.events[1].event_id },
    { name: 'slo_within_budget', passed: runtime.cluster.state.slo.within_budget, evidence: finalDiagnosis.events[1].event_id },
    { name: 'cleanup_complete', passed: runtime.cluster.state.logs.every((log) => log.cleaned), evidence: partialVerification.event_id },
  ];
  checks.push(...recoveryChecks);
  const recoveryVerified = recoveryChecks.every((check) => check.passed);
  const recoveryEvent = runtime.verification(recoveryChecks, finalDiagnosis.events.map((event) => event.event_id));

  if (!recoveryVerified) {
    runtime.complete('escalated', { errorCode: 'recovery_verification_failed', humanTakeover: true });
    return finalize(runtime, { outcome: 'escalated', verified: false, steps, approvals, checks, errorCode: 'recovery_verification_failed', humanTakeover: true });
  }

  const nodeTarget = runtime.cluster.state.node.resource_version;
  const planV3 = runtime.makePlan({
    version: 3,
    steps: [{ id: 'uncordon-recovered-node', tool: 'k8s.uncordon', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: nodeTarget },
  });
  const approvalV3 = runtime.approvePlan({ plan: planV3, type: 'single', approvers: ['human:synthetic-release-manager'], reasonCode: 'recovery_verified' });
  approvals.push(approvalV3.approval);
  const uncordoned = runtime.invoke({
    alias: 'uncordon_node', plan: planV3, approval: approvalV3.approval,
    expectedResourceVersion: nodeTarget, idempotencyKey: `${runtime.runId}:v3:uncordon:${nodeTarget}`,
  });
  steps.push({ step_id: 'uncordon-recovered-node', tool: 'k8s.uncordon', plan_version: 3, status: uncordoned.status, partial_success: uncordoned.partial_success });
  checks.push({ name: 'approved_uncordon_after_verification', passed: uncordoned.status === 'succeeded' && !runtime.cluster.state.node.unschedulable, evidence: uncordoned.event?.event_id });
  const success = checks.every((check) => check.passed) && runtime.cluster.state.node.ready
    && runtime.cluster.state.pdb.satisfied && runtime.cluster.state.slo.within_budget;
  runtime.verification([{ name: 'final_ready_pdb_slo_and_scheduling', passed: success, evidence: recoveryEvent.event_id }], [recoveryEvent.event_id, uncordoned.event?.event_id]);
  runtime.complete(success ? 'success' : 'failure', { verified: success, errorCode: success ? null : 'final_verification_failed', humanTakeover: !success });
  return finalize(runtime, { outcome: success ? 'success' : 'failure', verified: success, steps, approvals, checks, errorCode: success ? null : 'final_verification_failed', humanTakeover: !success, extra: { partial_success_stops_next_step: true } });
}

export function runShadow(options = {}) {
  const runtime = createRuntime({ ...options, mode: 'shadow' });
  runtime.issueCredentials();
  runtime.start('notready-shadow-synthetic');
  const before = canonicalJson(runtime.cluster.snapshot());
  const diagnosis = runtime.readDiagnosis();
  runtime.recordModelAndReasoning(diagnosis.events.map((event) => event.event_id));
  const proposals = ['drain_node', 'cleanup_logs', 'uncordon_node'];
  const results = proposals.map((tool, index) => runtime.gateway.wouldDo({
    tool, principal: runtime.identities.operator.principal, node: runtime.cluster.node,
    idempotency_key: `${runtime.runId}:would-do:${index + 1}`,
  }));
  const unchanged = before === canonicalJson(runtime.cluster.snapshot());
  const checks = [
    { name: 'write_tools_not_mounted', passed: !runtime.gateway.mountedTools.some((tool) => ['k8s.drain_node', 'node.cleanup_logs', 'k8s.uncordon'].includes(tool)) },
    { name: 'would_do_recorded', passed: results.every((result) => result.status === 'would_do') },
    { name: 'cluster_state_unchanged', passed: unchanged },
  ];
  runtime.verification(checks, diagnosis.events.map((event) => event.event_id));
  const success = checks.every((check) => check.passed);
  runtime.complete(success ? 'success' : 'failure', { verified: success, errorCode: success ? null : 'shadow_side_effect_detected' });
  return finalize(runtime, {
    outcome: success ? 'success' : 'failure', verified: success,
    steps: results.map((result, index) => ({ step_id: `would-do-${index + 1}`, tool: proposals[index], status: result.status, write_executed: false })),
    checks, errorCode: success ? null : 'shadow_side_effect_detected',
    extra: { write_tools_mounted: false, would_do_count: results.length },
  });
}

export function runCanary(options = {}) {
  const runtime = createRuntime({ ...options, mode: 'canary' });
  runtime.issueCredentials();
  runtime.start('notready-canary-synthetic');
  const diagnosis = runtime.readDiagnosis();
  const target = runtime.cluster.state.node.resource_version;
  const plan = runtime.makePlan({
    version: 1, steps: [{ id: 'canary-drain-one-node', tool: 'k8s.drain_node', resource: runtime.cluster.nodeResource() }],
    targets: { [runtime.cluster.node]: target },
  });
  const approval = runtime.approvePlan({ plan, type: 'dual' });
  const result = runtime.invoke({
    alias: 'drain_node', plan, approval: approval.approval, expectedResourceVersion: target,
    idempotencyKey: `${runtime.runId}:v1:canary-drain:${target}`,
  });
  const deniedOtherNode = runtime.gateway.invoke({
    tool: 'drain_node', principal: runtime.identities.operator.principal, token: runtime.tokens.operator.token,
    delegation: runtime.identities.operator.delegation, node: 'synthetic-node-99',
    resource: { type: 'node', id: 'synthetic-node-99', labels: { cluster: runtime.cluster.cluster, pool: 'synthetic-gpu-a', node: 'synthetic-node-99' } },
    idempotency_key: `${runtime.runId}:denied-other-node:1`,
  });
  const writes = runtime.gateway.audit.filter((item) => item.write_executed);
  const checks = [
    { name: 'single_canary_node_only', passed: writes.length === 1 && writes.every((item) => item.resource.id === runtime.cluster.node) },
    { name: 'other_node_rejected', passed: deniedOtherNode.status === 'failed' && deniedOtherNode.error.code === 'canary_single_node_scope' },
    { name: 'pdb_preserved', passed: runtime.cluster.state.pdb.satisfied },
    { name: 'canary_drain_succeeded', passed: result.status === 'succeeded' },
  ];
  runtime.verification(checks, [result.event?.event_id, deniedOtherNode.event?.event_id].filter(Boolean));
  const success = checks.every((check) => check.passed);
  runtime.complete(success ? 'success' : 'failure', { verified: success, errorCode: success ? null : 'canary_guard_failed' });
  return finalize(runtime, {
    outcome: success ? 'success' : 'failure', verified: success,
    steps: [{ step_id: 'canary-drain-one-node', tool: 'k8s.drain_node', plan_version: 1, status: result.status, partial_success: result.partial_success }],
    approvals: [approval.approval], checks, errorCode: success ? null : 'canary_guard_failed',
    extra: { canary_scope: { cluster: runtime.cluster.cluster, node: runtime.cluster.node }, write_calls_executed: writes.length },
  });
}

export function runRollback(options = {}) {
  const runtime = createRuntime({ ...options, mode: 'rollback' });
  const lkg = runtime.gateway.captureLkg();
  runtime.issueCredentials();
  runtime.start('notready-rollback-synthetic');
  const diagnosis = runtime.readDiagnosis();
  const target = runtime.cluster.state.node.resource_version;
  // Separate version keys bind both write targets in the drill approval.
  const boundPlan = runtime.makePlan({
    version: 1,
    steps: [
      { id: 'drill-drain', tool: 'k8s.drain_node', resource: { ...runtime.cluster.nodeResource(), version_key: `node/${runtime.cluster.node}` } },
      { id: 'drill-cleanup', tool: 'node.cleanup_logs', resource: { ...runtime.cluster.logResource(), version_key: `logs/${runtime.cluster.node}` } },
    ],
    targets: { [`node/${runtime.cluster.node}`]: target, [`logs/${runtime.cluster.node}`]: runtime.cluster.state.log_resource_version },
  });
  const approval = runtime.approvePlan({ plan: boundPlan, type: 'dual' });
  const drained = runtime.invoke({
    alias: 'drain_node', plan: boundPlan, approval: approval.approval,
    expectedResourceVersion: target, idempotencyKey: `${runtime.runId}:v1:drill-drain:${target}`,
  });
  runtime.gateway.engageKillSwitch('synthetic_security_stop');
  runtime.credentialService.revoke({ jti: runtime.tokens.operator.claims.jti });
  const blocked = runtime.gateway.invoke({
    tool: 'cleanup_logs', principal: runtime.identities.operator.principal, token: runtime.tokens.operator.token,
    delegation: runtime.identities.operator.delegation, node: runtime.cluster.node,
    resource: runtime.cluster.logResource(), expected_resource_version: runtime.cluster.state.log_resource_version,
    idempotency_key: `${runtime.runId}:v1:blocked-cleanup:${runtime.cluster.state.log_resource_version}`,
  });
  runtime.gateway.restoreLkg(lkg);
  runtime.emit({
    type: 'rollback.initiated', actor: { type: 'system', id: 'synthetic-kill-switch' },
    subject: { resource_type: 'node', resource_id: runtime.cluster.node, environment: 'production', action_class: 'write', risk_level: 'critical' },
    payload: { change_id: `chg_${runtime.runId}`, trigger: 'security_stop', rto_seconds: 1, compensation_plan_ref: 'synthetic-lkg-v1', status: 'completed' },
  });
  const readAfter = runtime.readDiagnosis();
  const restored = canonicalJson(lkg) === canonicalJson(runtime.cluster.snapshot());
  const checks = [
    { name: 'kill_switch_engaged', passed: runtime.gateway.killSwitchEngaged },
    { name: 'automatic_write_blocked', passed: blocked.status === 'failed' && blocked.error.code === 'kill_switch_engaged' },
    { name: 'operator_credential_revoked', passed: !runtime.credentialService.verify(runtime.tokens.operator.token).valid },
    { name: 'lkg_restored', passed: restored },
    { name: 'read_only_diagnosis_available', passed: readAfter.node.status === 'succeeded' && readAfter.pdb.status === 'succeeded' },
  ];
  runtime.verification(checks, [...diagnosis.events, ...readAfter.events].map((event) => event.event_id));
  const success = checks.every((check) => check.passed) && drained.status === 'succeeded';
  runtime.complete(success ? 'rolled_back' : 'failure', { verified: success, errorCode: success ? null : 'rollback_failed' });
  return finalize(runtime, {
    outcome: success ? 'rolled_back' : 'failure', verified: success,
    steps: [
      { step_id: 'drill-drain', tool: 'k8s.drain_node', plan_version: 1, status: drained.status, partial_success: drained.partial_success },
      { step_id: 'post-kill-cleanup-attempt', tool: 'node.cleanup_logs', plan_version: 1, status: blocked.status, blocked: true },
    ],
    approvals: [approval.approval], checks, errorCode: success ? null : 'rollback_failed',
    extra: { kill_switch: { engaged: true, reason: 'synthetic_security_stop', automatic_writes: false }, lkg_ref: 'synthetic-lkg-v1', read_only: true },
  });
}

function finalize(runtime, details) {
  const result = runtime.summarize(details);
  if (runtime.outputDir) writeRunOutput(result, runtime.outputDir);
  return result;
}

export function writeRunOutput(result, outputDir) {
  mkdirSync(outputDir, { recursive: true });
  const summaryPath = join(outputDir, 'summary.json');
  const tracePath = join(outputDir, 'trace.jsonl');
  const anchorPath = join(outputDir, 'anchor.json');
  const events = result.trace_jsonl.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
  const anchor = result.anchor || createAnchor(events);
  rmSync(summaryPath, { force: true });
  rmSync(tracePath, { force: true });
  rmSync(anchorPath, { force: true });
  writeFileSync(tracePath, result.trace_jsonl, { encoding: 'utf8', mode: 0o600 });
  writeFileSync(anchorPath, `${JSON.stringify(anchor, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  const verified = verifyTrace(events);
  const anchored = verifyAnchor(events, anchor);
  result.summary.trace = {
    ...result.summary.trace,
    event_count: verified.event_count,
    head_hash: verified.head_hash,
    anchor_id: anchor.anchor_id,
    verified: verified.valid && anchored.valid,
  };
  writeFileSync(summaryPath, `${JSON.stringify(result.summary, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  return {
    summary_path: summaryPath, trace_path: tracePath, anchor_path: anchorPath,
    trace_verified: verified.valid, anchor_verified: anchored.valid, event_count: verified.event_count,
  };
}

export const stableExports = {
  createRuntime, runNotReadyScenario, runShadow, runCanary, runRollback,
};
