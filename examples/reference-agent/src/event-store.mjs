import { createHmac, timingSafeEqual } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { assert, canonicalJson, clone, deepFreeze, sha256, syntheticId, toIso, toMillis, ZERO_HASH } from './shared.mjs';

// Deterministic fixtures for synthetic examples only. Never use these in production.
export const DEFAULT_EVENT_SIGNING_KEY = 'synthetic-event-signing-key-v1-not-a-secret';
export const DEFAULT_EVENT_SIGNING_KEY_ID = 'synthetic-event-key-v1';
export const DEFAULT_ANCHOR_KEY = 'synthetic-anchor-signing-key-v1-not-a-secret';
export const DEFAULT_ANCHOR_KEY_ID = 'synthetic-anchor-key-v1';

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
const INTEGRITY_FIELDS = ['hash_algorithm', 'event_hash', 'prev_event_hash', 'signature', 'trusted_time'];
const TRUSTED_TIME_FIELDS = ['source', 'observed_at', 'max_skew_seconds'];
const ANCHOR_FIELDS = [
  'schema_version', 'anchor_id', 'chain_id', 'event_count', 'head_hash', 'anchored_at',
  'previous_anchor_hash', 'signature', 'store',
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
const DEFAULT_MAX_CLOCK_SKEW_SECONDS = 300;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

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
      assert([payload.input_schema_hash, payload.output_schema_hash].every((hash) => HASH_PATTERN.test(hash))
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

function withoutSignature(value) {
  const bound = clone(value);
  delete bound.signature;
  return bound;
}

function withoutEventSignature(event) {
  const bound = clone(event);
  delete bound.integrity.signature;
  return bound;
}

function hmacSha256(key, value) {
  return createHmac('sha256', key).update(canonicalJson(value)).digest('hex');
}

function signatureMatches(signature, key, bound, code, label) {
  exactKeys(signature, ['algorithm', 'key_id', 'value'], 'signature');
  assert(signature.algorithm === 'HMAC-SHA256'
    && typeof signature.key_id === 'string' && signature.key_id.length > 0
    && typeof signature.value === 'string' && HASH_PATTERN.test(signature.value),
  code, `${label} signature is missing or invalid`);
  const expected = hmacSha256(key, bound);
  assert(timingSafeEqual(Buffer.from(signature.value, 'hex'), Buffer.from(expected, 'hex')),
    code, `${label} signature does not match`);
}

function validateSigningKey(key, label) {
  assert((typeof key === 'string' && key.length > 0)
    || (key instanceof Uint8Array && key.length > 0),
  'INVALID_SIGNING_KEY', `${label} must be a non-empty string or byte array`);
}

function keyMap(keys) {
  if (keys === undefined) {
    return new Map([[DEFAULT_EVENT_SIGNING_KEY_ID, DEFAULT_EVENT_SIGNING_KEY]]);
  }
  if (keys instanceof Map) return new Map(keys);
  assert(keys && typeof keys === 'object' && !Array.isArray(keys), 'INVALID_SIGNING_KEY', 'keys must be a key-id map');
  return new Map(Object.entries(keys));
}

function validateMaxSkew(value) {
  assert(Number.isInteger(value) && value >= 0 && value <= 300, 'INVALID_TIME', 'maxClockSkewSeconds must be an integer from 0 to 300');
  return value;
}

function checkClockSkew(observedAt, now, maxSkewSeconds, label) {
  if (now === undefined || now === null) return;
  const difference = Math.abs(toMillis(observedAt) - toMillis(now)) / 1000;
  assert(difference <= maxSkewSeconds, 'CLOCK_SKEW_EXCEEDED', `${label} exceeds the allowed clock skew`);
}

export function eventHash(event) {
  const bound = clone(event);
  delete bound.integrity.event_hash;
  delete bound.integrity.signature;
  return sha256(bound);
}

function signEvent(event, key, keyId) {
  event.integrity.event_hash = eventHash(event);
  event.integrity.signature = {
    algorithm: 'HMAC-SHA256',
    key_id: keyId,
    value: hmacSha256(key, withoutEventSignature(event)),
  };
  return event;
}

export function verifyTrace(eventsOrText, { keys, now, maxClockSkewSeconds = DEFAULT_MAX_CLOCK_SKEW_SECONDS } = {}) {
  const events = typeof eventsOrText === 'string'
    ? eventsOrText.split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line))
    : eventsOrText;
  assert(Array.isArray(events), 'INVALID_TRACE', 'Trace must be an array or JSONL text');
  const signingKeys = keyMap(keys);
  const maxSkew = validateMaxSkew(maxClockSkewSeconds);
  const seen = new Map();
  let previousHash = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    assert(event?.integrity && Object.hasOwn(event.integrity, 'signature'), 'MISSING_SIGNATURE', `Missing signature at sequence ${index + 1}`);
    validateEnvelope(event);
    assert(event.sequence === index + 1, 'SEQUENCE_BROKEN', `Expected sequence ${index + 1}, got ${event.sequence}`);
    assert(event.integrity.prev_event_hash === previousHash, 'CHAIN_BROKEN', `Broken previous hash at sequence ${event.sequence}`);
    assert(event.integrity.event_hash === eventHash(event), 'HASH_MISMATCH', `Event hash mismatch at sequence ${event.sequence}`);
    const { signature, trusted_time: trustedTime } = event.integrity;
    assert(signingKeys.has(signature?.key_id), 'UNKNOWN_KEY_ID', `Unknown event signing key ${signature?.key_id}`);
    const key = signingKeys.get(signature.key_id);
    validateSigningKey(key, `Event signing key ${signature.key_id}`);
    signatureMatches(signature, key, withoutEventSignature(event), 'INVALID_SIGNATURE', `Event sequence ${event.sequence}`);
    assert(trustedTime.observed_at === event.event_time
      && trustedTime.source === 'injected_trusted_clock'
      && trustedTime.max_skew_seconds === maxSkew,
    'TRUSTED_TIME_MISMATCH', `Trusted time envelope mismatch at sequence ${event.sequence}`);
    checkClockSkew(trustedTime.observed_at, now, maxSkew, `Event sequence ${event.sequence} trusted time`);
    for (const reference of [event.parent_event_id, event.causation_event_id]) {
      assert(reference === null || seen.has(reference), 'BROKEN_REFERENCE', `Unknown prior event reference ${reference}`);
    }
    seen.set(event.event_id, event.sequence);
    previousHash = event.integrity.event_hash;
  }
  return { valid: true, event_count: events.length, head_hash: previousHash };
}

export function verifyJsonl(filePath, options = {}) {
  return verifyTrace(readFileSync(filePath, 'utf8'), options);
}

function validateEnvelope(event) {
  exactKeys(event, TOP_LEVEL, 'event');
  assert(event.schema_version === '1.1.0' && EVENT_TYPES.has(event.event_type), 'SCHEMA_VIOLATION', 'Invalid event type or schema version');
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
  exactKeys(event.integrity, INTEGRITY_FIELDS, 'event.integrity');
  assert(event.integrity.hash_algorithm === 'sha256'
    && HASH_PATTERN.test(event.integrity.event_hash)
    && (event.integrity.prev_event_hash === null || HASH_PATTERN.test(event.integrity.prev_event_hash)),
  'SCHEMA_VIOLATION', 'Invalid integrity envelope');
  const trustedTime = event.integrity.trusted_time;
  exactKeys(trustedTime, TRUSTED_TIME_FIELDS, 'event.integrity.trusted_time');
  assert(trustedTime.source === 'injected_trusted_clock'
    && Number.isFinite(Date.parse(trustedTime.observed_at))
    && Number.isInteger(trustedTime.max_skew_seconds) && trustedTime.max_skew_seconds >= 0 && trustedTime.max_skew_seconds <= 300,
  'SCHEMA_VIOLATION', 'Invalid trusted time envelope');
  assert(event.privacy?.classification && typeof event.privacy?.contains_personal_data === 'boolean'
    && Array.isArray(event.privacy?.pii_fields_detected) && event.privacy?.redaction
    && event.privacy?.retention && event.privacy?.reasoning_policy,
  'SCHEMA_VIOLATION', 'Invalid privacy envelope');
  assert(event.sampling?.decision === 'keep' && typeof event.sampling?.reason === 'string', 'SCHEMA_VIOLATION', 'Invalid sampling envelope');
}

function traceChainId(events) {
  assert(events.length > 0, 'EMPTY_TRACE', 'Cannot anchor an empty trace');
  const chainId = events[0].trace_id;
  assert(events.every((event) => event.trace_id === chainId), 'CHAIN_ID_MISMATCH', 'Trace contains more than one chain id');
  return chainId;
}

function buildAnchor(events, {
  anchorId = syntheticId('anc', sha256(`${events[0]?.trace_id}:${events.at(-1)?.integrity.event_hash}`).slice(0, 24)),
  anchoredAt = events.at(-1)?.integrity.trusted_time.observed_at,
  anchorKey = DEFAULT_ANCHOR_KEY,
  anchorKeyId = DEFAULT_ANCHOR_KEY_ID,
  previousAnchorHash = null,
} = {}) {
  validateSigningKey(anchorKey, 'Anchor signing key');
  assert(typeof anchorId === 'string' && anchorId.length > 0, 'INVALID_ANCHOR', 'anchor_id is required');
  assert(typeof anchorKeyId === 'string' && anchorKeyId.length > 0, 'INVALID_ANCHOR', 'anchorKeyId is required');
  assert(previousAnchorHash === null || HASH_PATTERN.test(previousAnchorHash), 'INVALID_ANCHOR', 'Invalid previous_anchor_hash');
  const anchor = {
    schema_version: '1.0.0',
    anchor_id: anchorId,
    chain_id: traceChainId(events),
    event_count: events.length,
    head_hash: events.at(-1).integrity.event_hash,
    anchored_at: toIso(anchoredAt),
    previous_anchor_hash: previousAnchorHash,
    signature: { algorithm: 'HMAC-SHA256', key_id: anchorKeyId, value: '' },
    store: 'synthetic-local-worm',
  };
  anchor.signature.value = hmacSha256(anchorKey, withoutSignature(anchor));
  return deepFreeze(anchor);
}

export function createAnchor(events, { keys, now, maxClockSkewSeconds, ...options } = {}) {
  verifyTrace(events, { keys, now, maxClockSkewSeconds });
  return buildAnchor(events, options);
}

function verifyAnchorCore(events, anchor, {
  anchorKey = DEFAULT_ANCHOR_KEY, anchorKeyId = DEFAULT_ANCHOR_KEY_ID,
  now, maxClockSkewSeconds = DEFAULT_MAX_CLOCK_SKEW_SECONDS, keys,
} = {}) {
  const trace = verifyTrace(events, { keys, now, maxClockSkewSeconds });
  const maxSkew = validateMaxSkew(maxClockSkewSeconds);
  validateSigningKey(anchorKey, 'Anchor signing key');
  exactKeys(anchor, ANCHOR_FIELDS, 'anchor');
  assert(anchor.schema_version === '1.0.0' && anchor.store === 'synthetic-local-worm', 'INVALID_ANCHOR', 'Invalid anchor schema or store');
  assert(typeof anchor.anchor_id === 'string' && anchor.anchor_id.length > 0, 'INVALID_ANCHOR', 'Invalid anchor_id');
  assert(anchor.chain_id === traceChainId(events), 'ANCHOR_CHAIN_MISMATCH', 'Anchor chain id does not match the trace');
  assert(anchor.event_count === trace.event_count, 'ANCHOR_COUNT_MISMATCH', 'Anchor event count does not match the trace');
  assert(anchor.head_hash === trace.head_hash, 'ANCHOR_HEAD_MISMATCH', 'Anchor head hash does not match the trace');
  assert(anchor.previous_anchor_hash === null || HASH_PATTERN.test(anchor.previous_anchor_hash), 'INVALID_ANCHOR', 'Invalid previous_anchor_hash');
  assert(Number.isFinite(Date.parse(anchor.anchored_at)), 'INVALID_ANCHOR', 'Invalid anchored_at');
  assert(toMillis(anchor.anchored_at) >= toMillis(events.at(-1).event_time), 'INVALID_ANCHOR_TIME', 'Anchor time precedes the last event');
  assert(anchor.signature?.key_id === anchorKeyId, 'UNKNOWN_KEY_ID', 'Anchor signing key id does not match');
  signatureMatches(anchor.signature, anchorKey, withoutSignature(anchor), 'INVALID_ANCHOR_SIGNATURE', 'Anchor');
  checkClockSkew(anchor.anchored_at, now, maxSkew, 'Anchor trusted time');
  return { valid: true, anchor_id: anchor.anchor_id, chain_id: anchor.chain_id, event_count: trace.event_count, head_hash: trace.head_hash };
}

export function verifyAnchor(events, anchor, { previousAnchor, ...options } = {}) {
  const result = verifyAnchorCore(events, anchor, options);
  if (anchor.previous_anchor_hash !== null) {
    assert(previousAnchor, 'ANCHOR_CONTINUITY_BROKEN', 'Previous anchor manifest is required');
    const previousCount = previousAnchor.event_count;
    assert(Number.isInteger(previousCount) && previousCount > 0 && previousCount < anchor.event_count,
      'ANCHOR_CONTINUITY_BROKEN', 'Previous anchor must cover a non-empty strict prefix');
    const prefix = events.slice(0, previousCount);
    const previous = verifyAnchorCore(prefix, previousAnchor, options);
    assert(sha256(previousAnchor) === anchor.previous_anchor_hash,
      'ANCHOR_CONTINUITY_BROKEN', 'Previous anchor hash does not match the supplied manifest');
    assert(previous.chain_id === result.chain_id,
      'ANCHOR_CHAIN_MISMATCH', 'Previous anchor belongs to a different chain');
    assert(previous.head_hash === prefix.at(-1).integrity.event_hash,
      'ANCHOR_FORK_MISMATCH', 'Previous anchor head is not on the current trace prefix');
  }
  return { ...result, previous_anchor_verified: anchor.previous_anchor_hash === null ? null : true };
}

export class EventStore {
  #events = [];
  #context;
  #now;
  #versions;
  #parent = null;
  #causation = null;
  #signingKeys;
  #activeSigningKeyId;
  #trustedTimeSource;
  #maxClockSkewSeconds;
  #lastAnchorHash = null;
  #anchors = [];

  constructor({
    context = {}, now = () => Date.now(), versions = {}, agentVersion = '0.1.0',
    signingKey, signingKeyId = DEFAULT_EVENT_SIGNING_KEY_ID, signingKeys,
    trustedTimeSource, maxClockSkewSeconds = DEFAULT_MAX_CLOCK_SKEW_SECONDS,
  } = {}) {
    assert(signingKeys === undefined || (signingKey === undefined && signingKeyId === DEFAULT_EVENT_SIGNING_KEY_ID),
      'INVALID_SIGNING_KEY', 'Use signingKey/signingKeyId or signingKeys, not both');
    this.#signingKeys = signingKeys === undefined
      ? new Map([[signingKeyId, signingKey ?? DEFAULT_EVENT_SIGNING_KEY]])
      : keyMap(signingKeys);
    for (const [keyId, key] of this.#signingKeys) {
      assert(typeof keyId === 'string' && keyId.length > 0, 'INVALID_SIGNING_KEY', 'Signing key ids must be non-empty strings');
      validateSigningKey(key, `Event signing key ${keyId}`);
    }
    assert(this.#signingKeys.size > 0, 'INVALID_SIGNING_KEY', 'At least one event signing key is required');
    this.#activeSigningKeyId = this.#signingKeys.keys().next().value;
    this.#context = {
      tenant_id: 'tenant_synthetic',
      session_id: 'ses_synthetic',
      trace_id: 'tr_synthetic',
      run_id: 'run_synthetic',
      ...context,
    };
    this.#now = now;
    this.#trustedTimeSource = trustedTimeSource || (() => toIso(this.#now()));
    assert(typeof this.#trustedTimeSource === 'function', 'INVALID_TIME', 'trustedTimeSource must be a function');
    this.#maxClockSkewSeconds = validateMaxSkew(maxClockSkewSeconds);
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
      schema_version: '1.1.0',
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
      integrity: {
        hash_algorithm: 'sha256',
        prev_event_hash: previousHash,
        trusted_time: {
          source: 'injected_trusted_clock',
          observed_at: toIso(this.#trustedTimeSource()),
          max_skew_seconds: this.#maxClockSkewSeconds,
        },
      },
    };
    signEvent(event, this.#signingKeys.get(this.#activeSigningKeyId), this.#activeSigningKeyId);
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

  verify(options = {}) {
    return verifyTrace(this.#events, {
      keys: this.#signingKeys, maxClockSkewSeconds: this.#maxClockSkewSeconds, ...options,
    });
  }

  createAnchor(options = {}) {
    assert(this.#events.length > 0, 'EMPTY_TRACE', 'No events to anchor');
    this.verify();
    const anchor = buildAnchor(this.#events, { previousAnchorHash: this.#lastAnchorHash, ...options });
    // Continuity hashes the complete prior manifest, including its signature.
    this.#lastAnchorHash = sha256(anchor);
    this.#anchors.push(anchor);
    return anchor;
  }

  verifyAnchor(anchor, options = {}) {
    const previousAnchor = options.previousAnchor
      ?? this.#anchors.find((candidate) => sha256(candidate) === anchor.previous_anchor_hash);
    return verifyAnchor(this.#events, anchor, {
      keys: this.#signingKeys, maxClockSkewSeconds: this.#maxClockSkewSeconds,
      ...options, previousAnchor,
    });
  }

  exportAnchor(filePath, options = {}) {
    const anchor = this.createAnchor(options);
    writeFileSync(filePath, `${JSON.stringify(anchor, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    return anchor;
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
        this.verifyEvents(exported);
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
    return verifyJsonl(filePath, { keys: this.#signingKeys, maxClockSkewSeconds: this.#maxClockSkewSeconds });
  }

  verifyEvents(events) {
    return verifyTrace(events, { keys: this.#signingKeys, maxClockSkewSeconds: this.#maxClockSkewSeconds });
  }
}

export { ZERO_HASH };
