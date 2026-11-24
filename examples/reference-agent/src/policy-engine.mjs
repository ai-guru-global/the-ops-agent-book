import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assert, listMatches, matchesSelector, toMillis } from './shared.mjs';

export const DEFAULT_POLICY_PATH = fileURLToPath(new URL('../../cases/notready/permission-policy.notready.json', import.meta.url));
export const DECISION_ORDER = [
  'identity_and_delegation_valid',
  'explicit_deny',
  'credential_and_revocation',
  'tool_contract_allowlist',
  'role_environment_resource_scope',
  'window_freeze_blast_radius',
  'approval_plan_binding',
  'preconditions',
  'revalidate_before_write',
  'allow_invocation',
];

export function loadPolicy(path = DEFAULT_POLICY_PATH) {
  const policy = JSON.parse(readFileSync(path, 'utf8'));
  assertPolicy(policy);
  return policy;
}

export function assertPolicy(policy) {
  assert(JSON.stringify(policy.decision_order) === JSON.stringify(DECISION_ORDER), 'INVALID_POLICY', 'decision_order must match the required deny-first sequence');
  assert(Array.isArray(policy.principals) && Array.isArray(policy.tools) && Array.isArray(policy.rules), 'INVALID_POLICY', 'Policy collections are required');
  assert(policy.revocation?.check_before_every_write === true, 'INVALID_POLICY', 'Every write must check revocation');
  assert(policy.break_glass?.can_override_explicit_deny === false, 'INVALID_POLICY', 'Explicit deny cannot be overridden');
  assert(policy.rules.filter((rule) => rule.effect === 'deny').every((rule) => rule.priority <= 99), 'INVALID_POLICY', 'Deny rules must have priority below 100');
}

export class PolicyEngine {
  #policy;

  constructor(policyOrPath = DEFAULT_POLICY_PATH) {
    this.#policy = typeof policyOrPath === 'string' ? loadPolicy(policyOrPath) : structuredClone(policyOrPath);
    assertPolicy(this.#policy);
  }

  get policy() {
    return structuredClone(this.#policy);
  }

  evaluate(input) {
    const request = normalizeRequest(input);
    const checks = [];
    const handlers = {
      identity_and_delegation_valid: () => this.#identity(request),
      explicit_deny: () => this.#explicitDeny(request),
      credential_and_revocation: () => this.#credential(request),
      tool_contract_allowlist: () => this.#tool(request),
      role_environment_resource_scope: () => this.#roleScope(request),
      window_freeze_blast_radius: () => this.#window(request),
      approval_plan_binding: () => this.#approval(request),
      preconditions: () => this.#preconditions(request),
      revalidate_before_write: () => this.#revalidate(request),
      allow_invocation: () => ({ allowed: true, ruleId: request.rule?.id ?? null }),
    };

    for (const stage of this.#policy.decision_order) {
      const result = handlers[stage](request);
      checks.push({ stage, passed: result.allowed, rule_id: result.ruleId ?? null, reason: result.reason ?? null });
      if (!result.allowed) {
        return { allowed: false, rule_id: result.ruleId ?? request.rule?.id ?? null, reason: result.reason, stage, checks };
      }
      if (result.rule) request.rule = result.rule;
    }
    return { allowed: true, rule_id: request.rule?.id ?? null, reason: null, stage: 'allow_invocation', checks };
  }

  #identity(request) {
    const configured = this.#policy.principals.find((principal) => principal.id === request.principal.id);
    if (!configured) return deny(request, 'unknown_principal');
    // Roles come from the trusted principal registry, never caller assertions.
    request.roles = [...configured.roles];
    const delegation = request.delegation;
    if (!Number.isInteger(delegation.depth) || delegation.depth < 0 || delegation.depth > configured.delegation.max_depth) {
      return deny(request, 'delegation_depth_exceeded');
    }
    if (configured.delegation.requires_active_delegator && delegation.active !== true) {
      return deny(request, 'delegator_inactive');
    }
    if (configured.delegation.non_transferable && delegation.transferred) {
      return deny(request, 'delegation_non_transferable');
    }
    request.configuredPrincipal = configured;
    return { allowed: true };
  }

  #explicitDeny(request) {
    const explicit = this.#policy.rules
      .filter((rule) => rule.effect === 'deny' && matchesRule(rule, request, true))
      .sort((left, right) => left.priority - right.priority)[0];
    if (explicit) return deny(request, explicit.conditions?.reason || 'explicit_deny', explicit.id);
    return { allowed: true };
  }

  #credential(request) {
    if (request.credentialService && request.token) {
      const verified = request.credentialService.verify(request.token, {
        expectedSubject: request.principal.id,
        requiredScope: request.requiredScope || [],
        requiredPurpose: request.purpose,
        delegation: request.delegation,
        now: request.now,
      });
      if (!verified.valid) return deny(request, verified.reason);
      request.claims = verified.claims;
    } else if (request.claims) {
      const claims = request.claims;
      if (claims.sub !== request.principal.id) return deny(request, 'subject_mismatch');
      if (request.credentialService?.isRevoked(claims)) return deny(request, 'token_revoked');
      if (toMillis(request.now ?? Date.now()) >= toMillis(claims.exp * 1000)) return deny(request, 'token_expired');
      if (claims.delegation?.transferred || claims.delegation?.active === false) return deny(request, 'delegation_invalid');
    } else {
      return deny(request, 'credential_missing');
    }
    return { allowed: true };
  }

  #tool(request) {
    const contract = this.#policy.tools.find((candidate) => candidate.name === request.tool);
    if (!contract) return deny(request, 'tool_not_allowlisted');
    if (contract.effect !== request.action) return deny(request, 'tool_effect_mismatch');
    if (request.contractVersion && request.contractVersion !== contract.contract_version) {
      return deny(request, 'tool_contract_version_mismatch');
    }
    request.toolContract = contract;
    return { allowed: true };
  }

  #roleScope(request) {
    const rule = this.#policy.rules
      .filter((candidate) => candidate.effect === 'allow' && matchesRule(candidate, request, false))
      .sort((left, right) => left.priority - right.priority)[0];
    if (!rule) return deny(request, 'no_matching_allow_rule');
    request.rule = rule;
    return { allowed: true, rule };
  }

  #window(request) {
    if (!request.rule) return { allowed: true };
    if (request.blastRadius > request.rule.max_blast_radius) return deny(request, 'blast_radius_exceeded', request.rule.id);
    if (request.rule.approval.change_window === 'never') return deny(request, 'change_window_never', request.rule.id);
    if (request.rule.approval.change_window === 'required' && request.window?.open !== true) {
      return deny(request, 'change_window_closed', request.rule.id);
    }
    if (request.window?.frozen === true && request.action === 'write') return deny(request, 'change_frozen', request.rule.id);
    return { allowed: true };
  }

  #approval(request) {
    if (request.action === 'read') return { allowed: true };
    if (!request.approvalService || !request.approvalId) return deny(request, 'approval_required', request.rule?.id);
    const result = request.approvalService.validate({
      approvalId: request.approvalId,
      plan: request.plan,
      invocation: {
        tool: request.tool,
        resource: request.resource,
        expectedResourceVersion: request.expectedResourceVersion,
      },
      now: request.now,
    });
    if (!result.valid) return deny(request, result.reason, request.rule?.id);
    const strength = { single: 1, dual: 2, cab: 3 };
    if ((strength[result.approval.approval_type] || 0) < (strength[request.rule.approval.type] || 0)) {
      return deny(request, 'approval_insufficient', request.rule?.id);
    }
    request.approval = result.approval;
    return { allowed: true };
  }

  #preconditions(request) {
    if (!conditionsMatch(request.rule?.conditions, request)) return deny(request, 'preconditions_failed', request.rule?.id);
    return { allowed: true };
  }

  #revalidate(request) {
    if (request.action !== 'write') return { allowed: true };
    if (request.rule?.approval.revalidate_before_execute !== true) return deny(request, 'revalidation_not_required_by_rule', request.rule?.id);
    if (typeof request.revalidate !== 'function') return deny(request, 'revalidation_missing', request.rule?.id);
    try {
      const result = request.revalidate({ request, claims: request.claims, approval: request.approval });
      if (result !== true && result?.valid !== true) return deny(request, result?.reason || 'revalidation_failed', request.rule?.id);
    } catch (error) {
      return deny(request, error.code || 'revalidation_failed', request.rule?.id);
    }
    return { allowed: true };
  }
}

function normalizeRequest(input) {
  assert(input && typeof input === 'object', 'INVALID_REQUEST', 'Policy request is required');
  const principal = typeof input.principal === 'string'
    ? { id: input.principal, roles: input.roles || [] }
    : input.principal;
  return {
    ...input,
    principal,
    action: input.action || (input.toolEffect === 'write' ? 'write' : 'read'),
    environment: input.environment || 'prod',
    resource: input.resource || { type: 'unknown', id: 'unknown' },
    blastRadius: input.blastRadius ?? 0,
    preconditions: input.preconditions || {},
    delegation: input.delegation || { from: null, depth: 0, active: true, transferred: false },
  };
}

function conditionsMatch(conditions, request, { includeAny = true } = {}) {
  if (!conditions || typeof conditions !== 'object') return true;
  if (includeAny && Array.isArray(conditions.any)) {
    return conditions.any.some((entry) => Object.entries(entry).every(([key, value]) => request.preconditions[key] === value));
  }
  const metadata = new Set([
    'reason', 'irreversible', 'semantics', 'plan_hash_algorithm',
    'plan_change_invalidates_approval', 'partial_success_stops_next_step', 'any',
  ]);
  return Object.entries(conditions).every(([key, expected]) => {
    if (metadata.has(key)) return true;
    if (key === 'purpose') return request.purpose === expected;
    return request.preconditions[key] === expected;
  });
}

function matchesRule(rule, request, includeConditions = true) {
  const roles = request.roles || request.principal.roles || [];
  const matches = listMatches(rule.principals, request.principal.id)
    && (rule.roles.includes('*') || rule.roles.some((role) => roles.includes(role)))
    && listMatches(rule.tools, request.tool)
    && listMatches(rule.actions, request.action)
    && listMatches(rule.environments, request.environment)
    && (rule.resources.includes('*') || rule.resources.some((selector) => selector.type === request.resource.type
      && matchesSelector(selector.selector, request.resource)));
  return matches && (!includeConditions || conditionsMatch(rule.conditions, request));
}

function deny(request, reason, ruleId = null) {
  return { allowed: false, reason, ruleId: ruleId ?? request.rule?.id ?? null };
}
