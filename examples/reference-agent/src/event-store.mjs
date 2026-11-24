import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { assert, canonicalJson, clone, deepFreeze, sha256, syntheticId, toIso, ZERO_HASH } from './shared.mjs';

const EVENT_TYPES = new Set([
  'run.started', 'model.completed', 'reasoning.recorded', 'tool.requested',
  'approval.decided', 'verification.completed', 'rollback.initiated', 'run.completed',
]);
const ENVIRONMENTS = new Set(['test', 'staging', 'shadow', 'canary', 'production']);
const ACTION_CLASSES = new Set(['none', 'read', 'write']);
const RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const ACTOR_TYPES = new Set(['agent', 'human', 'service', 'system']);
const TOP_LEVEL = [
  'schema_version', 'event_id', 'event_type', 'event_time', 'tenant_id', 'session_id',
  'trace_id', 'run_id', 'sequence', 'span_id', 'parent_event_id', 'causation_event_id',
  'actor', 'subject', 'versions', 'payload', 'privacy', 'sampling', 'integrity',
];
const VERSION_FIELDS = [
  'agent_version', 'deployment_version', 'prompt_version', 'model_version',
  'tool_contract_version', 'knowledge_version', 'policy_version', 'eval_set_version',
];
const PAYLOAD_FIELDS = {
  'run.started': ['input_ref', 'intent', 'scenario_id', 'slo_class'],
  'model.completed': ['provider', 'model', 'input_tokens', 'output_tokens', 'cost_usd', 'latency_ms'],
  'reasoning.recorded': ['summary', 'evidence_refs', 'hypotheses', 'selected_hypothesis', 'confidence'],
  'tool.requested': ['tool_id', 'tool_name', 'contract_version', 'input_schema_hash', 'output_schema_hash', 'idempotency_key', 'arguments_redacted', 'dry_run', 'write_operation'],
  'approval.decided': ['approval_id', 'decision', 'approver_ids', 'reason_code', 'policy_version', 'decided_at'],
  'verification.completed': ['verification_id', 'checks', 'passed', 'evidence_refs'],
  'rollback.initiated': ['change_id', 'trigger', 'rto_seconds', 'compensation_plan_ref', 'status'],
  'run.completed': ['outcome', 'error_code', 'verified', 'human_takeover'],
};

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'SCHEMA_VIOLATION', `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  assert(canonicalJson(actual) === canonicalJson(expected), 'SCHEMA_VIOLATION', `${label} fields do not match the canonical event schema`);
}

function validatePayload(type, payload) {
  exactKeys(payload, PAYLOAD_FIELDS[type], `${type}.payload`);
  switch (type) {
    case 'run.started':
      assert(['SEV1', 'SEV2', 'SEV3'].includes(payload.slo_class), 'SCHEMA_VIOLATION', 'Invalid slo_class');
      break;
    case 'model.completed':
      assert(Number.isInteger(payload.input_tokens) && payload.input_tokens >= 0
        && Number.isInteger(payload.output_tokens) && payload.output_tokens >= 0
        && Number.isFinite(payload.cost_usd) && payload.cost_usd >= 0
        && Number.isInteger(payload.latency_ms) && payload.latency_ms >= 0,
      'SCHEMA_VIOLATION', 'Invalid model metrics');
      break;
    case 'reasoning.recorded':
      assert(typeof payload.summary === 'string' && payload.summary.length > 0
        && payload.summary.length <= 2000 && Array.isArray(payload.evidence_refs)
        && payload.evidence_refs.length > 0 && Array.isArray(payload.hypotheses)
        && typeof payload.selected_hypothesis === 'string'
        && Number.isFinite(payload.confidence) && payload.confidence >= 0 && payload.confidence <= 1,
      'SCHEMA_VIOLATION', 'Invalid reasoning payload');
      break;
    case 'tool.requested':
      assert([payload.input_schema_hash, payload.output_schema_hash].every((hash) => /^[a-f0-9]{64}$/.test(hash))
        && typeof payload.idempotency_key === 'string' && payload.idempotency_key.length > 0
        && typeof payload.dry_run === 'boolean' && typeof payload.write_operation === 'boolean',
      'SCHEMA_VIOLATION', 'Invalid tool payload');
      break;
    case 'approval.decided':
      assert(['approved', 'rejected', 'timed_out'].includes(payload.decision)
        && Array.isArray(payload.approver_ids) && payload.approver_ids.length > 0,
      'SCHEMA_VIOLATION', 'Invalid approval payload');
      break;
    case 'verification.completed':
      assert(Array.isArray(payload.checks) && payload.checks.length > 0 && typeof payload.passed === 'boolean',
      'SCHEMA_VIOLATION', 'Invalid verification payload');
      break;
    case 'rollback.initiated':
      assert(['actual_change_failure', 'drill', 'security_stop'].includes(payload.trigger)
        && ['initiated', 'canceled', 'completed', 'failed'].includes(payload.status)
        && Number.isInteger(payload.rto_seconds) && payload.rto_seconds > 0,
      'SCHEMA_VIOLATION', 'Invalid rollback payload');
      break;
    case 'run.completed':
      assert(['success', 'failure', 'escalated', 'rolled_back'].includes(payload.outcome)
        && typeof payload.verified === 'boolean' && typeof payload.human_takeover === 'boolean',
      'SCHEMA_VIOLATION', 'Invalid completion payload');
      break;
    default:
      break;
  }
}

export function eventHash(event) {
  const bound = clone(event);
  delete bound.integrity.event_hash;
  return sha256(bound);
}

export function verifyTrace(eventsOrText) {
  const events = typeof eventsOrText === 'string'
    ? eventsOrText.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    : eventsOrText;
  assert(Array.isArray(events), 'INVALID_TRACE', 'Trace must be an array or JSONL text');
  const seen = new Map();
  let previousHash = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    validateEnvelope(event);
    assert(event.sequence === index + 1, 'SEQUENCE_BROKEN', `Expected sequence ${index + 1}, got ${event.sequence}`);
    assert(event.integrity.prev_event_hash === previousHash, 'CHAIN_BROKEN', `Broken previous hash at sequence ${event.sequence}`);
    assert(event.integrity.event_hash === eventHash(event), 'HASH_MISMATCH', `Event hash mismatch at sequence ${event.sequence}`);
    for (const reference of [event.parent_event_id, event.causation_event_id]) {
      assert(reference === null || seen.has(reference), 'BROKEN_REFERENCE', `Unknown prior event reference ${reference}`);
    }
    seen.set(event.event_id, event.sequence);
    previousHash = event.integrity.event_hash;
  }
  return { valid: true, event_count: events.length, head_hash: previousHash };
}

export function verifyJsonl(filePath) {
  return verifyTrace(readFileSync(filePath, 'utf8'));
}

function validateEnvelope(event) {
  exactKeys(event, TOP_LEVEL, 'event');
  assert(event.schema_version === '1.0.0' && EVENT_TYPES.has(event.event_type), 'SCHEMA_VIOLATION', 'Invalid event type or schema version');
  assert(/^evt_[A-Za-z0-9_-]+$/.test(event.event_id), 'SCHEMA_VIOLATION', 'Invalid event_id');
  assert(Number.isFinite(Date.parse(event.event_time)), 'SCHEMA_VIOLATION', 'Invalid event_time');
  for (const field of ['tenant_id', 'session_id', 'trace_id', 'run_id', 'span_id']) {
    assert(typeof event[field] === 'string' && event[field].length > 0, 'SCHEMA_VIOLATION', `${field} is required`);
  }
  assert(Number.isInteger(event.sequence) && event.sequence >= 1, 'SCHEMA_VIOLATION', 'Invalid sequence');
  assert(event.parent_event_id === null || typeof event.parent_event_id === 'string', 'SCHEMA_VIOLATION', 'Invalid parent_event_id');
  assert(event.causation_event_id === null || typeof event.causation_event_id === 'string', 'SCHEMA_VIOLATION', 'Invalid causation_event_id');
  assert(ACTOR_TYPES.has(event.actor?.type) && typeof event.actor?.id === 'string', 'SCHEMA_VIOLATION', 'Invalid actor');
  assert(ENVIRONMENTS.has(event.subject?.environment) && ACTION_CLASSES.has(event.subject?.action_class)
    && RISK_LEVELS.has(event.subject?.risk_level) && typeof event.subject?.resource_type === 'string'
    && typeof event.subject?.resource_id === 'string', 'SCHEMA_VIOLATION', 'Invalid subject');
  exactKeys(event.versions, VERSION_FIELDS, 'versions');
  validatePayload(event.event_type, event.payload);
  assert(event.integrity?.hash_algorithm === 'sha256'
    && /^[a-f0-9]{64}$/.test(event.integrity?.event_hash)
    && (event.integrity?.prev_event_hash === null || /^[a-f0-9]{64}$/.test(event.integrity?.prev_event_hash)),
  'SCHEMA_VIOLATION', 'Invalid integrity envelope');
  assert(event.privacy?.classification && typeof event.privacy?.contains_personal_data === 'boolean'
    && Array.isArray(event.privacy?.pii_fields_detected) && event.privacy?.redaction
    && event.privacy?.retention && event.privacy?.reasoning_policy,
  'SCHEMA_VIOLATION', 'Invalid privacy envelope');
  assert(event.sampling?.decision === 'keep' && typeof event.sampling?.reason === 'string', 'SCHEMA_VIOLATION', 'Invalid sampling envelope');
}

export class EventStore {
  #events = [];
  #context;
  #now;
  #versions;
  #parent = null;
  #causation = null;

  constructor({
    context = {}, now = () => Date.now(), versions = {}, agentVersion = '0.1.0',
  } = {}) {
    this.#context = {
      tenant_id: 'tenant_synthetic',
      session_id: 'ses_synthetic',
      trace_id: 'tr_synthetic',
      run_id: 'run_synthetic',
      ...context,
    };
    this.#now = now;
    this.#versions = {
      agent_version: agentVersion,
      deployment_version: 'synthetic-local-1',
      prompt_version: 'prompt-notready-1',
      model_version: 'deterministic-synthetic-model-1',
      tool_contract_version: 'synthetic-k8s-1.1.0',
      knowledge_version: 'kb-notready-1',
      policy_version: '1.0.0',
      eval_set_version: 'notready-synthetic-1',
      ...versions,
    };
  }

  append({
    type, payload, actor = { type: 'system', id: 'synthetic-runtime' },
    subject = { resource_type: 'scenario', resource_id: 'notready', environment: 'production', action_class: 'none', risk_level: 'low' },
    parent = this.#parent, causation = this.#causation, spanId,
  }) {
    assert(EVENT_TYPES.has(type), 'SCHEMA_VIOLATION', `Unsupported event type ${type}`);
    validatePayload(type, payload);
    const sequence = this.#events.length + 1;
    const eventId = syntheticId('evt', sequence);
    const previousHash = this.#events.at(-1)?.integrity.event_hash ?? null;
    const event = {
      schema_version: '1.0.0',
      event_id: eventId,
      event_type: type,
      event_time: toIso(this.#now()),
      ...clone(this.#context),
      sequence,
      span_id: spanId || `span_${sequence}`,
      parent_event_id: parent,
      causation_event_id: causation,
      actor: clone(actor),
      subject: clone(subject),
      versions: clone(this.#versions),
      payload: clone(payload),
      privacy: {
        classification: 'internal',
        contains_personal_data: false,
        pii_fields_detected: [],
        redaction: { status: 'applied', method: 'allowlist', fields: ['payload.arguments_redacted'] },
        retention: { class: 'audit_1y', days: 365 },
        reasoning_policy: 'not_applicable',
      },
      sampling: { decision: 'keep', rate: 1, reason: 'synthetic reference audit event' },
      integrity: { hash_algorithm: 'sha256', prev_event_hash: previousHash },
    };
    event.integrity.event_hash = eventHash(event);
    validateEnvelope(event);
    const frozen = deepFreeze(event);
    this.#events.push(frozen);
    this.#parent = eventId;
    this.#causation = eventId;
    return frozen;
  }

  setCausation(eventId) {
    assert(eventId === null || this.#events.some((event) => event.event_id === eventId), 'BROKEN_REFERENCE', 'Causation must reference a prior event');
    this.#causation = eventId;
  }

  get events() {
    return deepFreeze(clone(this.#events));
  }

  get head() {
    return this.#events.at(-1) || null;
  }

  verify() {
    return verifyTrace(this.#events);
  }

  // Export only appends unseen events from this store. Re-exporting is safe;
  // appending an unrelated or tampered trace is rejected.
  exportJsonl(filePath) {
    assert(this.#events.length > 0, 'EMPTY_TRACE', 'No events to export');
    let exported = [];
    if (existsSync(filePath)) {
      const text = readFileSync(filePath, 'utf8');
      if (text.trim()) {
        exported = text.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
        verifyTrace(exported);
      }
    }
    assert(exported.length <= this.#events.length, 'EXPORT_PREFIX_MISMATCH', 'Existing export is not a prefix of this store');
    for (let index = 0; index < exported.length; index += 1) {
      assert(canonicalJson(exported[index]) === canonicalJson(this.#events[index]), 'EXPORT_PREFIX_MISMATCH', 'Existing export differs from this store');
    }
    const pending = this.#events.slice(exported.length);
    if (pending.length) {
      appendFileSync(filePath, `${pending.map((event) => canonicalJson(event)).join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
    }
    return verifyJsonl(filePath);
  }
}

export { ZERO_HASH };
