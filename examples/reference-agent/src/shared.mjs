import { createHash, randomBytes } from 'node:crypto';

export const ZERO_HASH = '0'.repeat(64);
export const SYNTHETIC_NODE = 'synthetic-node-07';
export const SYNTHETIC_CLUSTER = 'synthetic-prod-a';
export const DEFAULT_NOW = '2026-11-24T00:00:00.000Z';

export class ReferenceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ReferenceError';
    this.code = code;
    this.details = details;
  }
}

export function assert(condition, code, message) {
  if (!condition) throw new ReferenceError(code, message);
}

export function clone(value) {
  return structuredClone(value);
}

export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// RFC 8785-style deterministic ordering for this JSON-only reference runtime.
// It is not a general replacement for the full RFC 8785 number canonicalizer.
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(',')}}`;
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

export function syntheticId(prefix, value) {
  const suffix = String(value).replace(/[^A-Za-z0-9_-]/g, '_');
  return `${prefix}_${suffix}`;
}

export function randomSecret() {
  return randomBytes(32);
}

export function toMillis(value) {
  const millis = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  assert(Number.isFinite(millis), 'INVALID_TIME', `Invalid timestamp: ${value}`);
  return millis;
}

export function toIso(value) {
  return new Date(toMillis(value)).toISOString();
}

export function resourceLabels(resource = {}) {
  const labels = { ...(resource.labels || {}) };
  const id = resource.id || resource.resource_id;
  if (id) labels[resource.type || 'resource'] = id;
  if (resource.type === 'node') labels.node = id;
  if (resource.type === 'cluster') labels.cluster = id;
  return labels;
}

export function matchesSelector(selector, resource) {
  if (selector === '*') return true;
  if (typeof selector !== 'string') return false;
  const labels = resourceLabels(resource);
  return selector.split(';').filter(Boolean).every((term) => {
    if (!/>=|<=|!=|==|=|>/.test(term)) {
      return resource.id === term || Object.values(labels).includes(term);
    }
    const comparison = term.match(/^([A-Za-z0-9_.-]+)(>=|<=|!=|==|=|>)(.*)$/);
    if (!comparison) return false;
    const [, key, operator, expected] = comparison;
    if (operator !== '=' && operator !== '==') {
      const actual = Number(labels[key]);
      // Policy selectors may include a unit suffix, e.g. age>24h.
      const limit = Number.parseFloat(expected);
      if (!Number.isFinite(actual) || !Number.isFinite(limit)) return false;
      if (operator === '>') return actual > limit;
      if (operator === '>=') return actual >= limit;
      if (operator === '<') return actual < limit;
      if (operator === '<=') return actual <= limit;
      return actual !== limit;
    }
    return String(labels[key]) === expected;
  });
}

export function listMatches(pattern, value) {
  return Array.isArray(pattern) && (pattern.includes('*') || pattern.includes(value));
}
