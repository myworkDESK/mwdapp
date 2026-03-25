/**
 * WorkDesk — JWT Verification & JTI Replay Protection
 *
 * Verifies Cloudflare Access / IdP JWTs (RS256 / ES256).
 * Uses Cloudflare Access public keys endpoint to fetch the JWKS.
 *
 * JTI replay protection: on first use, the JTI is written to KV with
 * a TTL matching the token's remaining lifetime. Subsequent requests
 * with the same JTI are rejected.
 *
 * Elevation tokens: short-lived HMAC-SHA-256 signed tokens used to
 * authorise a single approval action.
 */

const encoder = new TextEncoder();

// ─────────────────────────────────────────────────────────────────────────────
// JWKS cache (in-memory, per Worker isolate — not persistent across restarts)
// ─────────────────────────────────────────────────────────────────────────────
const jwksCache = new Map(); // domain → { keys, fetchedAt }
const JWKS_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch and cache Cloudflare Access public JWKS for a given team domain.
 * @param {string} teamDomain — e.g. "yourteam.cloudflareaccess.com"
 * @returns {Promise<JsonWebKey[]>}
 */
async function getJwks(teamDomain) {
  const cached = jwksCache.get(teamDomain);
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
    return cached.keys;
  }
  const url  = `https://${teamDomain}/cdn-cgi/access/certs`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch JWKS from ${url}: ${resp.status}`);
  const { keys } = await resp.json();
  jwksCache.set(teamDomain, { keys, fetchedAt: Date.now() });
  return keys;
}

/**
 * Parse a JWT string into { header, payload, signature, signingInput }.
 * @param {string} token
 */
function parseJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const decode = (p) => JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
  return {
    header:       decode(parts[0]),
    payload:      decode(parts[1]),
    signingInput: parts[0] + '.' + parts[1],
    sigBytes:     Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  };
}

/**
 * Import a JWK for the given algorithm.
 * @param {JsonWebKey} jwk
 * @param {string} alg — "RS256" | "ES256"
 */
async function importKey(jwk, alg) {
  if (alg === 'RS256') {
    return crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify'],
    );
  }
  if (alg === 'ES256') {
    return crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['verify'],
    );
  }
  throw new Error('Unsupported algorithm: ' + alg);
}

/**
 * Verify the signature of a JWT against a JWKS.
 * @param {{ header, signingInput, sigBytes }} parsed
 * @param {JsonWebKey[]} keys
 */
async function verifySignature(parsed, keys) {
  const alg       = parsed.header.alg;
  const kid       = parsed.header.kid;
  const sigInput  = encoder.encode(parsed.signingInput);
  const candidates = kid ? keys.filter((k) => k.kid === kid) : keys;
  if (!candidates.length) throw new Error('No matching JWK found for kid: ' + kid);

  for (const jwk of candidates) {
    const cryptoKey = await importKey(jwk, alg).catch(() => null);
    if (!cryptoKey) continue;
    const params = alg === 'RS256'
      ? { name: 'RSASSA-PKCS1-v1_5' }
      : { name: 'ECDSA', hash: 'SHA-256' };
    const ok = await crypto.subtle.verify(params, cryptoKey, parsed.sigBytes, sigInput);
    if (ok) return true;
  }
  return false;
}

/**
 * Verify a Cloudflare Access JWT.
 *
 * @param {string} token
 * @param {{ teamDomain: string, audience: string, KV?: KVNamespace }} opts
 * @returns {Promise<{ sub: string, email: string, exp: number, jti: string, raw: object }>}
 */
export async function verifyAccessJwt(token, { teamDomain, audience, KV }) {
  if (!token) throw new Error('No token provided');
  const parsed = parseJwt(token);
  const { payload } = parsed;

  // 1. Audience check
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(audience)) throw new Error('JWT audience mismatch');

  // 2. Expiry check
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('JWT expired');
  if (payload.nbf && payload.nbf > now) throw new Error('JWT not yet valid');

  // 3. Signature check
  const keys = await getJwks(teamDomain);
  const valid = await verifySignature(parsed, keys);
  if (!valid) throw new Error('JWT signature invalid');

  // 4. JTI replay protection
  if (KV && payload.jti) {
    const kvKey  = 'jti:' + payload.jti;
    const exists = await KV.get(kvKey);
    if (exists) throw new Error('JWT already used (replay detected)');
    const ttl = payload.exp ? payload.exp - now : 3600;
    await KV.put(kvKey, '1', { expirationTtl: Math.max(ttl, 60) });
  }

  return {
    sub:   payload.sub,
    email: payload.email ?? payload.sub,
    exp:   payload.exp,
    jti:   payload.jti,
    raw:   payload,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Elevation tokens
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issue a short-lived HMAC-SHA-256 elevation token.
 * Payload: { action_id, sub, exp }
 * Token format: base64url( JSON(payload) ) + "." + base64url( HMAC )
 *
 * @param {{ actionId: string, sub: string, secret: string, ttlSeconds?: number }}
 * @returns {Promise<string>}
 */
export async function issueElevationToken({ actionId, sub, secret, ttlSeconds = 300 }) {
  const exp     = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = JSON.stringify({ action_id: actionId, sub, exp });
  const b64     = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const key     = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig     = await crypto.subtle.sign('HMAC', key, encoder.encode(b64));
  const sigB64  = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return b64 + '.' + sigB64;
}

/**
 * Verify and decode an elevation token.
 *
 * @param {string} token
 * @param {string} secret
 * @returns {Promise<{ action_id: string, sub: string, exp: number }>}
 */
export async function verifyElevationToken(token, secret) {
  if (!token) throw new Error('No elevation token provided');
  const [b64, sigB64] = token.split('.');
  if (!b64 || !sigB64) throw new Error('Malformed elevation token');

  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  );
  const sigBytes  = Uint8Array.from(
    atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  );
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(b64));
  if (!valid) throw new Error('Elevation token signature invalid');

  const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Elevation token expired');
  return payload;
}
