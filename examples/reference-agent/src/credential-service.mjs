import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { assert, canonicalJson, clone, deepFreeze, toIso, toMillis } from './shared.mjs';

const REQUIRED_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'jti', 'tenant', 'purpose', 'act', 'delegation', 'scope'];
const HEADER = { alg: 'HS256', typ: 'JWT' };

function encode(value) {
  return Buffer.from(canonicalJson(value)).toString('base64url');
}

export class CredentialService {
  #secret;
  #now;
  #revoked = new Set();
  #counter = 0;

  constructor({ secret, now = () => Date.now(), issuer = 'synthetic-identity', audience = 'synthetic-tool-gateway' } = {}) {
    assert(secret instanceof Uint8Array && secret.length >= 32, 'INVALID_SECRET', 'A random secret of at least 32 bytes is required');
    this.#secret = Buffer.from(secret);
    this.#now = now;
    this.issuer = issuer;
    this.audience = audience;
  }

  issue({
    subject, tenant = 'tenant_synthetic', purpose = 'notready-diagnosis',
    actor = { id: subject }, delegation = { from: null, depth: 0, active: true, non_transferable: true },
    scope = [], ttlSeconds = 600, now,
  }) {
    assert(typeof subject === 'string' && subject.length > 0, 'INVALID_SUBJECT', 'subject is required');
    assert(Array.isArray(scope), 'INVALID_SCOPE', 'scope must be an array');
    assert(delegation?.non_transferable === true && delegation?.active === true
      && Number.isInteger(delegation?.depth) && delegation.depth >= 0,
    'INVALID_DELEGATION', 'Delegation must be active, non-transferable and have a valid depth');
    assert(Number.isFinite(ttlSeconds) && ttlSeconds > 0 && ttlSeconds <= 600, 'INVALID_TTL', 'TTL must be 1..600 seconds');
    const issuedAt = toMillis(now ?? this.#now());
    this.#counter += 1;
    const claims = deepFreeze({
      iss: this.issuer,
      sub: subject,
      aud: this.audience,
      exp: Math.floor((issuedAt + ttlSeconds * 1000) / 1000),
      nbf: Math.floor(issuedAt / 1000),
      jti: randomUUID(),
      tenant,
      purpose,
      act: deepFreeze(clone(actor)),
      delegation: deepFreeze(clone(delegation)),
      scope: deepFreeze([...new Set(scope)]),
    });
    for (const key of REQUIRED_CLAIMS) assert(key in claims, 'MISSING_CLAIM', `Missing claim ${key}`);
    const unsigned = `${encode(HEADER)}.${encode(claims)}`;
    const signature = createHmac('sha256', this.#secret).update(unsigned).digest('base64url');
    return { token: `${unsigned}.${signature}`, claims };
  }

  verify(token, {
    expectedSubject,
    expectedAudience = this.audience,
    requiredScope = [],
    requiredPurpose,
    delegation,
    now,
  } = {}) {
    try {
      const parts = String(token).split('.');
      assert(parts.length === 3, 'INVALID_TOKEN', 'Token must have three segments');
      const [headerPart, payloadPart, signaturePart] = parts;
      const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
      assert(header.alg === 'HS256' && header.typ === 'JWT', 'INVALID_TOKEN', 'Unsupported token header');
      const supplied = Buffer.from(signaturePart, 'base64url');
      const expected = createHmac('sha256', this.#secret).update(`${headerPart}.${payloadPart}`).digest();
      assert(supplied.length === expected.length && timingSafeEqual(supplied, expected), 'INVALID_SIGNATURE', 'Token signature is invalid');
      const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
      for (const key of REQUIRED_CLAIMS) assert(key in claims, 'MISSING_CLAIM', `Missing claim ${key}`);
      const at = toMillis(now ?? this.#now());
      assert(claims.iss === this.issuer, 'INVALID_ISSUER', 'Unexpected issuer');
      assert(listIncludes(claims.aud, expectedAudience), 'INVALID_AUDIENCE', 'Wrong token audience');
      assert(Number.isFinite(claims.exp) && at < toMillis(claims.exp * 1000), 'TOKEN_EXPIRED', 'Token has expired');
      assert(Number.isFinite(claims.nbf) && at >= toMillis(claims.nbf * 1000), 'TOKEN_NOT_YET_VALID', 'Token is not yet valid');
      assert(!expectedSubject || claims.sub === expectedSubject, 'SUBJECT_MISMATCH', 'Token cannot be used by another subject');
      assert(!requiredPurpose || claims.purpose === requiredPurpose, 'PURPOSE_MISMATCH', 'Wrong token purpose');
      assert(Array.isArray(claims.scope) && requiredScope.every((item) => claims.scope.includes(item)), 'SCOPE_DENIED', 'Token scope is insufficient');
      assert(!this.#revoked.has(claims.jti) && !this.#revoked.has(claims.sub), 'TOKEN_REVOKED', 'Token or subject is revoked');
      assert(claims.delegation?.non_transferable === true && claims.delegation?.active === true
        && Number.isInteger(claims.delegation?.depth) && claims.delegation.depth >= 0,
      'DELEGATION_INVALID', 'Delegation must be active, non-transferable and have a valid depth');
      assert(!claims.delegation?.transferred, 'DELEGATION_NON_TRANSFERABLE', 'Delegation cannot be transferred');
      if (delegation) {
        assert(claims.delegation?.from === delegation.from
          && claims.delegation?.depth === delegation.depth
          && claims.delegation?.active === delegation.active,
        'DELEGATION_MISMATCH', 'Delegation context does not match the signed token');
      }
      return { valid: true, claims };
    } catch (error) {
      return { valid: false, reason: error.code || 'INVALID_TOKEN', claims: null };
    }
  }

  revoke({ jti, subject }) {
    assert(jti || subject, 'INVALID_REVOCATION', 'jti or subject is required');
    if (jti) this.#revoked.add(jti);
    if (subject) this.#revoked.add(subject);
    return { revoked: true, jti: jti || null, subject: subject || null };
  }

  isRevoked(claimsOrJti) {
    const key = typeof claimsOrJti === 'string' ? claimsOrJti : claimsOrJti?.jti;
    return Boolean(key && (this.#revoked.has(key) || this.#revoked.has(claimsOrJti?.sub)));
  }
}

function listIncludes(value, expected) {
  return value === expected || (Array.isArray(value) && value.includes(expected));
}
