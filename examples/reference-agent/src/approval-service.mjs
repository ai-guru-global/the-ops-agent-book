import { randomUUID } from 'node:crypto';
import {
  assert, canonicalJson, clone, deepFreeze, sha256, toIso, toMillis,
} from './shared.mjs';

function immutableCopy(value) {
  return deepFreeze(clone(value));
}

export class ApprovalService {
  #approvals = new Map();
  #counter = 0;
  #now;

  constructor({ now = () => Date.now() } = {}) {
    this.#now = now;
  }

  freezePlan(proposal) {
    assert(proposal && typeof proposal === 'object', 'INVALID_PLAN', 'A plan object is required');
    assert(typeof proposal.plan_id === 'string' && proposal.plan_id.length > 0, 'INVALID_PLAN', 'plan_id is required');
    assert(Number.isInteger(proposal.plan_version) && proposal.plan_version > 0, 'INVALID_PLAN', 'plan_version must be a positive integer');
    assert(Array.isArray(proposal.steps) && proposal.steps.length > 0, 'INVALID_PLAN', 'steps must not be empty');
    assert(proposal.target_resource_versions && typeof proposal.target_resource_versions === 'object', 'INVALID_PLAN', 'target_resource_versions is required');
    assert(Object.keys(proposal.target_resource_versions).length > 0, 'INVALID_PLAN', 'At least one target version is required');
    toMillis(proposal.expires_at);
    const stepIds = new Set();
    for (const step of proposal.steps) {
      assert(typeof step.id === 'string' && step.id.length > 0 && !stepIds.has(step.id), 'INVALID_PLAN', 'Step ids must be unique non-empty strings');
      stepIds.add(step.id);
      assert(typeof step.tool === 'string' && step.resource?.type && step.resource?.id, 'INVALID_PLAN', 'Each step requires tool and resource');
      const versionKey = step.resource.version_key || step.resource.id;
      assert(proposal.target_resource_versions[versionKey], 'INVALID_PLAN', `Missing target version for ${versionKey}`);
    }
    return immutableCopy(proposal);
  }

  request({ plan, requester, approvalType = 'dual', now, ttlSeconds = 900 }) {
    const snapshot = this.freezePlan(plan);
    assert(['single', 'dual', 'cab'].includes(approvalType), 'INVALID_APPROVAL_TYPE', 'Unsupported approval type');
    assert(Number.isFinite(ttlSeconds) && ttlSeconds > 0, 'INVALID_APPROVAL_TTL', 'ttlSeconds must be positive');
    const issuedAt = toIso(now ?? this.#now());
    const expiresAt = new Date(Math.min(toMillis(issuedAt) + ttlSeconds * 1000, toMillis(snapshot.expires_at))).toISOString();
    this.#counter += 1;
    const id = `apr_${this.#counter}`;
    const record = immutableCopy({
      approval_id: id,
      plan: snapshot,
      plan_hash: sha256(snapshot),
      plan_version: snapshot.plan_version,
      target_resource_versions: snapshot.target_resource_versions,
      approval_type: approvalType,
      requester,
      status: 'pending',
      created_at: issuedAt,
      expires_at: expiresAt,
      approver_ids: [],
      decisions: [],
      revoked_at: null,
    });
    this.#approvals.set(id, record);
    return record;
  }

  approve({ approvalId, approver, reasonCode = 'approved', now }) {
    const record = this.#get(approvalId);
    const at = toIso(now ?? this.#now());
    this.#assertOpen(record, at);
    assert(typeof approver === 'string' && approver.length > 0, 'INVALID_APPROVER', 'approver is required');
    assert(approver !== record.requester, 'SELF_APPROVAL', 'The requester cannot approve their own plan');
    assert(!record.approver_ids.includes(approver), 'DUPLICATE_APPROVER', 'Approvers must be distinct');
    const decisions = [...clone(record.decisions), { approver, decision: 'approved', reason_code: reasonCode, decided_at: at }];
    const required = record.approval_type === 'dual' ? 2 : 1;
    const next = immutableCopy({
      ...clone(record),
      decisions,
      approver_ids: decisions.map((item) => item.approver),
      status: decisions.length >= required ? 'approved' : 'pending',
    });
    this.#approvals.set(idOf(record), next);
    return next;
  }

  reject({ approvalId, approver, reasonCode = 'rejected', now }) {
    const record = this.#get(approvalId);
    const at = toIso(now ?? this.#now());
    this.#assertOpen(record, at);
    const decisions = [...clone(record.decisions), { approver, decision: 'rejected', reason_code: reasonCode, decided_at: at }];
    const next = immutableCopy({ ...clone(record), decisions, status: 'rejected' });
    this.#approvals.set(idOf(record), next);
    return next;
  }

  revoke({ approvalId, actor = 'system', reason = 'manual', now }) {
    const record = this.#get(approvalId);
    const at = toIso(now ?? this.#now());
    const next = immutableCopy({
      ...clone(record),
      status: 'revoked',
      revoked_at: at,
      revoke_actor: actor,
      revoke_reason: reason,
    });
    this.#approvals.set(idOf(record), next);
    return next;
  }

  validate({ approvalId, plan, invocation, now }) {
    const record = this.#approvals.get(approvalId);
    const at = toIso(now ?? this.#now());
    if (!record) return { valid: false, reason: 'approval_not_found', approval: null };
    if (record.status === 'rejected') return { valid: false, reason: 'approval_rejected', approval: record };
    if (record.status === 'revoked') return { valid: false, reason: 'approval_revoked', approval: record };
    if (toMillis(record.expires_at) <= toMillis(at)) return { valid: false, reason: 'approval_expired', approval: record };
    if (toMillis(record.plan.expires_at) <= toMillis(at)) return { valid: false, reason: 'plan_expired', approval: record };
    if (record.status !== 'approved') return { valid: false, reason: 'approval_pending', approval: record };
    if (!plan) return { valid: false, reason: 'plan_missing', approval: record };
    // The entire canonical plan, not a caller-selected subset, is bound.
    if (record.plan_hash !== sha256(plan)) return { valid: false, reason: 'plan_hash_changed', approval: record };
    if (record.plan_version !== plan.plan_version) return { valid: false, reason: 'plan_version_changed', approval: record };
    if (canonicalJson(record.target_resource_versions) !== canonicalJson(plan.target_resource_versions)) {
      return { valid: false, reason: 'target_resource_versions_changed', approval: record };
    }
    if (invocation) {
      const step = record.plan.steps.find((candidate) => candidate.tool === invocation.tool
        && candidate.resource.type === invocation.resource.type
        && candidate.resource.id === invocation.resource.id);
      if (!step) return { valid: false, reason: 'invocation_not_in_approved_plan', approval: record };
      const expected = record.target_resource_versions[step.resource.version_key || invocation.resource.id];
      if (invocation.expectedResourceVersion !== expected) {
        return { valid: false, reason: 'target_resource_version_mismatch', approval: record };
      }
    }
    return { valid: true, reason: null, approval: record };
  }

  get(approvalId) {
    return this.#get(approvalId);
  }

  #get(approvalId) {
    const record = this.#approvals.get(approvalId);
    assert(record, 'APPROVAL_NOT_FOUND', `Unknown approval: ${approvalId}`);
    return record;
  }

  #assertOpen(record, at) {
    assert(record.status === 'pending', 'APPROVAL_CLOSED', `Approval is ${record.status}`);
    assert(toMillis(record.expires_at) > toMillis(at), 'APPROVAL_EXPIRED', 'Approval has expired');
  }
}

function idOf(record) {
  return record.approval_id;
}
