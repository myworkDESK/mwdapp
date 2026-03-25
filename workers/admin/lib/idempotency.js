/**
 * WorkDesk — Idempotency Handling
 *
 * For destructive/mutating actions (POST /api/admin-actions, disable, enable, etc.)
 * callers SHOULD supply an `Idempotency-Key` header (UUID v4 recommended).
 *
 * On first call  : process normally, persist key + serialised response to D1.
 * On repeat call : return the stored response verbatim without re-processing.
 * TTL            : 24 hours (configurable with IDEMPOTENCY_TTL_SECONDS env var).
 */

/** Default idempotency window: 24 hours */
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * Check whether a stored idempotency response exists for the given key.
 *
 * @param {D1Database} db
 * @param {string}     key
 * @returns {Promise<Response|null>}   Cached Response, or null if not found / expired.
 */
export async function checkIdempotency(db, key) {
  if (!key || !db) return null;
  const row = await db
    .prepare(
      `SELECT status_code, response_body FROM idempotency_store
       WHERE idempotency_key = ? AND expires_at > ?`,
    )
    .bind(key, new Date().toISOString())
    .first();

  if (!row) return null;

  return new Response(row.response_body, {
    status:  row.status_code,
    headers: {
      'Content-Type':      'application/json',
      'Idempotent-Replayed': 'true',
    },
  });
}

/**
 * Persist a completed response so repeat requests are short-circuited.
 *
 * @param {D1Database} db
 * @param {string}     key
 * @param {string}     method
 * @param {string}     path
 * @param {number}     statusCode
 * @param {string}     responseBody   — already-serialised JSON string
 * @param {number}     [ttlSeconds]
 */
export async function storeIdempotency(db, key, method, path, statusCode, responseBody, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!key || !db) return;
  const now     = new Date();
  const expires = new Date(now.getTime() + ttlSeconds * 1000);
  await db
    .prepare(
      `INSERT OR IGNORE INTO idempotency_store
         (idempotency_key, method, path, status_code, response_body, created_at, expires_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .bind(key, method, path, statusCode, responseBody, now.toISOString(), expires.toISOString())
    .run();
}

/**
 * Purge expired idempotency rows (called by the nightly maintenance cron).
 * @param {D1Database} db
 */
export async function purgeExpiredIdempotency(db) {
  await db
    .prepare('DELETE FROM idempotency_store WHERE expires_at < ?')    .bind(new Date().toISOString())
    .run();
}
