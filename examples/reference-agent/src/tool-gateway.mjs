import { randomBytes } from 'node:crypto';
import {
  assert, canonicalJson, clone, deepFreeze, sha256, SYNTHETIC_CLUSTER, SYNTHETIC_NODE,
} from './shared.mjs';

export const TOOL_ALIASES = Object.freeze({
  read_node: 'k8s.read_node',
  read_pdb: 'k8s.check_pdb',
  drain_node: 'k8s.drain_node',
  cleanup_logs: 'node.cleanup_logs',
  uncordon_node: 'k8s.uncordon',
});
const WRITE_TOOLS = new Set(['k8s.drain_node', 'node.cleanup_logs', 'k8s.uncordon']);

function failure(status, code, category, retryable, outcomeKnown, partialSuccess = false) {
  return {
    status,
    partial_success: partialSuccess,
    steps: [],
    error: { code, category, retryable, outcome_known: outcomeKnown },
  };
}

export class SyntheticCluster {
  constructor({ node = SYNTHETIC_NODE, cluster = SYNTHETIC_CLUSTER } = {}) {
    this.node = node;
    this.cluster = cluster;
    this.failedLogId = 'logs-c';
    this.state = {
      node: {
        id: node,
        cluster,
        pool: 'synthetic-gpu-a',
        ready: false,
        unschedulable: false,
        resource_version: 'node-v1',
        disk_pressure: true,
        memory_pressure: false,
        pid_pressure: false,
        labels: { 'managed-by': 'platform', cluster, pool: 'synthetic-gpu-a' },
      },
      filesystem: { usage: 0.97, imagefs_available: false },
      pdb: { name: 'synthetic-gpu-pdb', desired_healthy: 3, current_healthy: 3, min_available: 2, satisfied: true },
      capacity: { available: true, schedulable_gpus: 8, required_gpus: 4 },
      slo: { error_rate: 0.001, budget: 0.005, within_budget: true },
      logs: [
        { id: 'logs-a', path: '/var/log/synthetic/kernel.log', age_hours: 48, size_gib: 2, cleaned: false },
        { id: 'logs-b', path: '/var/log/synthetic/device.log', age_hours: 30, size_gib: 1, cleaned: false },
        { id: 'logs-c', path: '/var/log/synthetic/audit.log', age_hours: 25, size_gib: 61, cleaned: false },
      ],
      log_resource_version: 'logs-v1',
      active_change: false,
    };
  }

  snapshot() {
    return deepFreeze(clone(this.state));
  }

  restore(snapshot) {
    this.state = clone(snapshot);
  }

  nodeResource() {
    const node = this.state.node;
    return {
      type: 'node', id: node.id,
      labels: { ...node.labels, cluster: node.cluster, pool: node.pool, node: node.id },
    };
  }

  logResource() {
    return {
      type: 'log_path', id: this.node,
      labels: {
        node: this.node,
        cluster: this.cluster,
        age: 25,
        allowlist: 'synthetic-log-cleanup',
      },
    };
  }

  preconditions() {
    const { node, pdb, capacity, slo, active_change: activeChange } = this.state;
    return {
      node_exists: Boolean(node),
      node_not_ready: !node.ready,
      node_ready: node.ready,
      pdb_precheck_passed: pdb.satisfied,
      pdb_satisfied: pdb.satisfied,
      capacity_available: capacity.available,
      slo_within_budget: slo.within_budget,
      no_active_change_in_scope: !activeChange,
      sanitized_evidence_saved: true,
      partial_success_stops_next_step: true,
      evidence_saved: true,
    };
  }

  readNode() {
    return clone(this.state.node);
  }

  readPdb() {
    return { ...clone(this.state.pdb), capacity_available: this.state.capacity.available, slo_within_budget: this.state.slo.within_budget };
  }

  drain(expectedVersion) {
    const node = this.state.node;
    if (node.resource_version !== expectedVersion) return failure('failed', 'conflict', 'conflict', false, true);
    if (!this.state.pdb.satisfied) return failure('failed', 'pdb_blocked', 'pdb_blocked', false, true);
    if (!this.preconditions().node_not_ready) return failure('failed', 'validation', 'validation', false, true);
    node.unschedulable = true;
    node.resource_version = 'node-v2';
    return {
      status: 'succeeded', partial_success: false,
      steps: [{ step_id: 'cordon', status: 'succeeded', resource_version: 'node-v2' }, { step_id: 'drain', status: 'succeeded', resource_version: 'node-v2' }],
      cordoned: true, evicted_pods: 0, pdb_violations: 0, error: null,
    };
  }

  cleanup(expectedVersion, { simulateOutcome } = {}) {
    if (this.state.log_resource_version !== expectedVersion) return failure('failed', 'conflict', 'conflict', false, true);
    const targets = this.state.logs.filter((log) => !log.cleaned && log.age_hours > 24);
    if (targets.length === 0) {
      return { status: 'succeeded', partial_success: false, steps: [], cleaned: 0, already_clean: true, error: null };
    }
    this.state.log_resource_version = 'logs-v2';
    const steps = [];
    for (const target of targets) {
      const shouldFail = this.failedLogId !== null && target.id === this.failedLogId && simulateOutcome !== 'unknown';
      if (!shouldFail) target.cleaned = true;
      steps.push({
        step_id: target.id,
        status: shouldFail ? 'failed' : 'succeeded',
        resource_version: this.state.log_resource_version,
        ...(shouldFail ? { error_code: 'synthetic_permission_denied' } : {}),
      });
    }
    const succeeded = steps.filter((step) => step.status === 'succeeded').length;
    if (simulateOutcome === 'unknown') {
      return {
        ...failure('unknown', 'unknown_outcome', 'unknown_outcome', false, false, true),
        steps: steps.map((step) => ({ ...step, status: 'unknown' })),
        cleaned: succeeded,
        reconciled_observation: targets.map((target) => ({ id: target.id, cleaned: target.cleaned })),
      };
    }
    const partial = succeeded !== targets.length;
    const remainingGib = this.state.logs.filter((log) => !log.cleaned).reduce((sum, log) => sum + Number(log.size_gib || 0), 0);
    this.state.filesystem.usage = partial ? 0.68 : 0.62;
    this.state.filesystem.imagefs_available = !partial;
    this.state.node.disk_pressure = partial;
    return {
      status: partial ? 'partial_success' : 'succeeded',
      partial_success: partial,
      steps,
      cleaned: succeeded,
      requested: targets.length,
      error: partial ? { code: 'partial_success', category: 'unknown', retryable: false, outcome_known: true } : null,
    };
  }

  uncordon(expectedVersion) {
    const node = this.state.node;
    if (node.resource_version !== expectedVersion) return failure('failed', 'conflict', 'conflict', false, true);
    const checks = this.preconditions();
    if (!checks.node_ready || !checks.pdb_satisfied || !checks.capacity_available || !checks.slo_within_budget) {
      return failure('failed', 'validation', 'validation', false, true);
    }
    node.unschedulable = false;
    node.resource_version = 'node-v4';
    return {
      status: 'succeeded', partial_success: false,
      steps: [{ step_id: 'uncordon', status: 'succeeded', resource_version: node.resource_version }],
      scheduling_restored: true, error: null,
    };
  }

  // This represents an external synthetic controller completing recovery. It is
  // deliberately not an agent tool write and does not bypass the kill switch.
  completeRecovery() {
    this.state.node.ready = true;
    this.state.node.disk_pressure = false;
    this.state.filesystem.usage = 0.62;
    this.state.filesystem.imagefs_available = true;
    this.state.node.resource_version = 'node-v3';
    this.state.capacity.available = true;
    this.state.pdb.satisfied = true;
    this.state.slo.within_budget = true;
    return this.preconditions();
  }
}

export class ToolGateway {
  #cluster;
  #policy;
  #approvals;
  #credentials;
  #events;
  #now;
  #mode;
  #killSwitch = false;
  #halt = null;
  #idempotency = new Map();
  #audit = [];

  constructor({
    cluster = new SyntheticCluster(), policy, approvalService, credentialService,
    eventStore, now = () => Date.now(), mode = 'demo', runId = 'run_synthetic',
  } = {}) {
    assert(policy && approvalService && credentialService, 'GATEWAY_DEPENDENCIES', 'Policy, approvals and credentials are required');
    this.#cluster = cluster;
    this.#policy = policy;
    this.#approvals = approvalService;
    this.#credentials = credentialService;
    this.#events = eventStore;
    this.#now = now;
    this.#mode = mode;
    this.runId = runId;
    this.failedLogId = 'logs-c';
  }

  get cluster() {
    return this.#cluster;
  }

  get failedLogId() {
    return this.#cluster.failedLogId;
  }

  set failedLogId(value) {
    this.#cluster.failedLogId = value;
  }

  get audit() {
    return deepFreeze(clone(this.#audit));
  }

  get mountedTools() {
    const tools = this.#mode === 'shadow' ? ['k8s.read_node', 'k8s.check_pdb'] : Object.values(TOOL_ALIASES);
    return Object.freeze(tools);
  }

  get killSwitchEngaged() {
    return this.#killSwitch;
  }

  invoke(request) {
    const canonical = TOOL_ALIASES[request.tool] || (request.tool?.startsWith('k8s.') || request.tool?.startsWith('node.') ? request.tool : null);
    const effect = canonical && WRITE_TOOLS.has(canonical) ? 'write' : 'read';
    if (this.#mode === 'shadow' && effect === 'write') return this.wouldDo(request, canonical);
    const resource = request.resource || this.#resourceFor(canonical, request);
    const { revalidate: _revalidate, ...serializableRequest } = request;
    const input = clone(serializableRequest);
    const idempotencyKey = request.idempotency_key || (effect === 'write' ? `read-${randomBytes(8).toString('hex')}` : null);
    const contract = this.#policy.policy.tools.find((tool) => tool.name === canonical);
    const subject = {
      resource_type: resource?.type || 'unknown', resource_id: resource?.id || 'unknown',
      environment: request.environment === 'prod' ? 'production' : (request.environment || 'production'),
      action_class: effect, risk_level: effect === 'write' ? 'high' : 'low',
    };
    this.#events?.append({
      type: 'tool.requested',
      actor: { type: 'agent', id: request.principal || 'unknown', delegated_from: request.delegation?.from || null },
      subject,
      payload: {
        tool_id: canonical || 'unknown', tool_name: request.tool, contract_version: contract?.contract_version || '0.0.0',
        input_schema_hash: sha256(`input:${canonical}`), output_schema_hash: sha256(`output:${canonical}`),
        idempotency_key: idempotencyKey || `read-${this.#audit.length + 1}`,
        arguments_redacted: { cluster: request.cluster || this.#cluster.cluster, node: request.node || this.#cluster.node },
        dry_run: Boolean(request.dry_run), write_operation: effect === 'write',
      },
    });

    if (this.#killSwitch && effect === 'write') return this.#deny(request, canonical, resource, 'kill_switch_engaged', 'policy_denied');
    if (!contract) return this.#deny(request, canonical, resource, 'tool_not_allowlisted', 'policy_denied');
    if (!this.mountedTools.includes(canonical)) return this.#deny(request, canonical, resource, 'tool_not_mounted', 'policy_denied');
    if (this.#mode === 'canary' && effect === 'write'
      && ((request.node || this.#cluster.node) !== this.#cluster.node || resource.id !== this.#cluster.node)) {
      return this.#deny(request, canonical, resource, 'canary_single_node_scope', 'policy_denied');
    }

    if (effect === 'write' && (typeof request.idempotency_key !== 'string' || request.idempotency_key.length < 8)) {
      return this.#deny(request, canonical, resource, 'idempotency_key_required', 'validation');
    }
    const inputHash = sha256(input);
    const cached = effect === 'write' ? this.#idempotency.get(idempotencyKey) : null;
    const decision = this.#policy.evaluate({
      principal: request.principal,
      token: request.token,
      delegation: request.delegation,
      tool: canonical,
      toolEffect: effect,
      action: effect,
      contractVersion: request.contract_version,
      resource,
      environment: request.environment || 'prod',
      blastRadius: request.blast_radius ?? (effect === 'write' ? 1 : 0),
      purpose: request.purpose || 'notready-diagnosis',
      requiredScope: request.required_scope || [`${canonical}:${effect}`],
      window: request.window || { open: true },
      plan: request.plan,
      approvalId: request.approval_id,
      approvalService: this.#approvals,
      preconditions: this.#cluster.preconditions(),
      expectedResourceVersion: request.expected_resource_version,
      credentialService: this.#credentials,
      // An exact replay still rechecks identity, scope, approval and kill switch,
      // but must not fail only because its own completed write advanced the version.
      revalidate: cached ? (() => true) : (request.revalidate || (() => ({ valid: true }))),
      now: request.now || this.#now(),
    });
    if (!decision.allowed) return this.#deny(request, canonical, resource, decision.reason, 'policy_denied', decision);

    if (cached) {
      if (cached.inputHash !== inputHash) return this.#deny(request, canonical, resource, 'idempotency_key_reused', 'conflict');
      return this.#finish(request, canonical, resource, idempotencyKey, cached.result, { replayed: true, decision });
    }
    if (effect === 'write' && this.#halt) return this.#deny(request, canonical, resource, this.#halt.reason, 'safety_halt');

    const dryRun = Boolean(request.dry_run);
    let result;
    if (canonical === 'k8s.read_node') result = { status: 'succeeded', node: this.#cluster.readNode(), error: null };
    else if (canonical === 'k8s.check_pdb') result = { status: 'succeeded', pdb: this.#cluster.readPdb(), error: null };
    else if (canonical === 'k8s.drain_node') result = dryRun
      ? { status: 'dry_run', would_change: ['cordon', 'drain'], partial_success: false, steps: [], error: null }
      : this.#cluster.drain(request.expected_resource_version);
    else if (canonical === 'node.cleanup_logs') result = dryRun
      ? { status: 'dry_run', would_change: this.#cluster.state.logs.filter((log) => !log.cleaned).map((log) => log.id), partial_success: false, steps: [], error: null }
      : this.#cluster.cleanup(request.expected_resource_version, { simulateOutcome: request.simulate_outcome });
    else if (canonical === 'k8s.uncordon') result = dryRun
      ? { status: 'dry_run', would_change: ['unschedulable=false'], partial_success: false, steps: [], error: null }
      : this.#cluster.uncordon(request.expected_resource_version);
    else return this.#deny(request, canonical, resource, 'unsupported_tool', 'validation');

    if (result.partial_success && result.status !== 'unknown') this.#halt = { reason: 'partial_success_halt', idempotency_key: idempotencyKey };
    if (result.status === 'unknown') this.#halt = { reason: 'unknown_outcome_reconcile_required', idempotency_key: idempotencyKey };
    if (result.status === 'failed' && result.error?.outcome_known) this.#halt = { reason: 'known_failure_halt', idempotency_key: idempotencyKey };
    if (effect === 'write' && !dryRun) this.#idempotency.set(idempotencyKey, { inputHash, result: clone(result) });
    return this.#finish(request, canonical, resource, idempotencyKey, result, { replayed: false, decision });
  }

  wouldDo(request, canonical = TOOL_ALIASES[request.tool]) {
    const resource = request.resource || this.#resourceFor(canonical, request);
    this.#events?.append({
      type: 'tool.requested',
      actor: { type: 'agent', id: request.principal || 'synthetic-operator' },
      subject: { resource_type: resource?.type || 'node', resource_id: resource?.id || this.#cluster.node, environment: 'shadow', action_class: 'none', risk_level: 'high' },
      payload: {
        tool_id: canonical || 'unknown', tool_name: request.tool, contract_version: this.#policy.policy.tools.find((tool) => tool.name === canonical)?.contract_version || '0.0.0',
        input_schema_hash: sha256(`input:${canonical}`), output_schema_hash: sha256(`output:${canonical}`),
        idempotency_key: request.idempotency_key || `shadow-${this.#audit.length + 1}`,
        arguments_redacted: { node: request.node || this.#cluster.node, cluster: request.cluster || this.#cluster.cluster },
        dry_run: true, write_operation: true,
      },
    });
    const result = { status: 'would_do', write_executed: false, partial_success: false, steps: [], error: null };
    return this.#finish(request, canonical, resource, null, result, { mode: 'shadow', decision: { allowed: true, reason: 'write_not_mounted' } });
  }

  reconcile(idempotencyKey) {
    const cached = this.#idempotency.get(idempotencyKey);
    assert(cached, 'IDEMPOTENCY_NOT_FOUND', 'Unknown idempotency key');
    if (this.#halt?.idempotency_key === idempotencyKey && this.#halt.reason === 'unknown_outcome_reconcile_required') this.#halt = null;
    return {
      reconciled: true,
      cached_status: cached.result.status,
      state: this.#cluster.snapshot(),
      automatic_retry: false,
    };
  }

  resumeAfterReplan({ plan, approvalId }) {
    assert(!this.#killSwitch, 'KILL_SWITCH', 'Writes cannot resume while kill switch is engaged');
    assert(this.#halt?.reason !== 'unknown_outcome_reconcile_required', 'UNKNOWN_OUTCOME', 'Reconcile before replanning');
    const approval = this.#approvals.validate({ approvalId, plan, now: this.#now() });
    assert(approval.valid, 'APPROVAL_INVALID', approval.reason);
    this.#halt = null;
    return { resumed: true, approval_id: approvalId, plan_version: plan.plan_version };
  }

  engageKillSwitch(reason = 'synthetic_security_stop') {
    this.#killSwitch = true;
    this.#halt = { reason: 'kill_switch_engaged' };
    return { engaged: true, reason, automatic_writes: false };
  }

  captureLkg() {
    return this.#cluster.snapshot();
  }

  restoreLkg(snapshot) {
    this.#cluster.restore(snapshot);
    return this.#cluster.snapshot();
  }

  #resourceFor(canonical, request) {
    if (canonical === 'node.cleanup_logs') return this.#cluster.logResource();
    if (canonical === 'k8s.read_node' || canonical === 'k8s.check_pdb') {
      return { type: 'cluster', id: request.cluster || this.#cluster.cluster, labels: { cluster: request.cluster || this.#cluster.cluster } };
    }
    return this.#cluster.nodeResource();
  }

  #deny(request, canonical, resource, reason, outcome, decision = { allowed: false, reason }) {
    const result = failure('failed', reason, outcome === 'conflict' ? 'conflict' : 'policy_denied', false, true);
    return this.#finish(request, canonical, resource, request.idempotency_key || null, result, { decision });
  }

  #finish(request, canonical, resource, idempotencyKey, result, metadata) {
    const record = {
      caller: request.principal || 'synthetic-operator',
      on_behalf_of: request.delegation?.from || null,
      agent_run_id: this.runId,
      rule_id: metadata.decision?.rule_id || null,
      tool: canonical || request.tool,
      resource: clone(resource),
      approval_id: request.approval_id || null,
      plan_version: request.plan?.plan_version || null,
      plan_hash: request.plan ? sha256(request.plan) : null,
      target_resource_version: request.expected_resource_version || null,
      idempotency_key: idempotencyKey,
      deny_reason: metadata.decision?.allowed ? null : metadata.decision?.reason,
      outcome: result.status,
      input_hash: sha256(request),
      output_hash: sha256(result),
      replayed: metadata.replayed || false,
      write_executed: metadata.mode === 'shadow' ? false : (WRITE_TOOLS.has(canonical)
        && ['succeeded', 'partial_success', 'unknown'].includes(result.status) && !request.dry_run && !metadata.replayed),
      policy_checks: clone(metadata.decision?.checks || []),
    };
    this.#audit.push(deepFreeze(record));
    return deepFreeze({ ...clone(result), replayed: record.replayed, policy: clone(metadata.decision) });
  }
}
