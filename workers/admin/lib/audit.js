/**
 * WorkDesk — Tamper-Evident Audit Helper
 *
 * Dual-writes every audit event to:
 *   1. D1  — audit_log table (chained SHA-256 hashes)
 *   2. R2  — audit/YYYY/MM/DD/{log_id}.json
 *
 * Chain integrity: hash = SHA-256( prev_hash || JSON(payload) )
 * The first row uses prev_hash = "" (empty string).
 */

const encoder = new TextEncoder();

/**
 * Compute SHA-256 of a UTF-8 string, return hex string.
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function sha256Hex(input) {
  const buf    = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random audit log ID.
 * @returns {string}
 */
function newLogId() {
  return 'audit-' + crypto.randomUUID();
}

/**
 * Build the R2 key for a given log ID and timestamp.
 * Format: audit/YYYY/MM/DD/{log_id}.json
 * @param {string} logId
 * @param {string} isoTimestamp
 * @returns {string}
 */
function r2Key(logId, isoTimestamp) {
  const d = new Date(isoTimestamp);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `audit/${y}/${m}/${day}/${logId}.json`;
}

/**
 * Fetch the most recent audit hash from D1.
 * Returns empty string when no rows exist yet.
 * @param {D1Database} db
 * @returns {Promise<string>}
 */
async function getLatestHash(db) {
  const row = await db
    .prepare('SELECT hash FROM audit_log ORDER BY created_at DESC, rowid DESC LIMIT 1')
    .first();
  return row?.hash ?? '';
}

/**
 * Write a single tamper-evident audit entry to D1 and (optionally) R2.
 *
 * @param {{ db: D1Database, r2?: R2Bucket }} bindings
 * @param {{ event_type: string, actor?: string, target?: string, payload: object }} entry
 * @returns {Promise<{ id: string, hash: string }>}
 */
export async function writeAuditEntry(bindings, entry) {
  const { db, r2 } = bindings;
  const id        = newLogId();
  const now       = new Date().toISOString();
  const payloadStr = JSON.stringify(entry.payload);
  const prevHash  = await getLatestHash(db);
  const hash      = await sha256Hex(prevHash + payloadStr);
  const key       = r2Key(id, now);

  // 1. Write to D1
  await db
    .prepare(
      `INSERT INTO audit_log (id, event_type, actor, target, payload, prev_hash, hash, r2_key, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      id,
      entry.event_type,
      entry.actor ?? null,
      entry.target ?? null,
      payloadStr,
      prevHash,
      hash,
      r2 ? key : null,
      now,
    )
    .run();

  // 2. Write to R2 (best-effort; non-fatal if binding missing)
  if (r2) {
    const blob = JSON.stringify({
      id,
      event_type: entry.event_type,
      actor:      entry.actor,
      target:     entry.target,
      payload:    entry.payload,
      prev_hash:  prevHash,
      hash,
      created_at: now,
    });
    await r2.put(key, blob, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { event_type: entry.event_type, hash },
    });
  }

  return { id, hash };
}

/**
 * Verify the full audit chain from D1.
 * Returns { ok: boolean, broken_at?: string, total: number, verified: number }.
 * @param {D1Database} db
 */
export async function verifyAuditChain(db) {
  const { results } = await db
    .prepare('SELECT id, payload, prev_hash, hash FROM audit_log ORDER BY created_at ASC, rowid ASC')
    .all();

  let prevHash  = '';
  let verified  = 0;
  for (const row of results) {
    const expected = await sha256Hex(prevHash + row.payload);
    if (expected !== row.hash) {
      return { ok: false, broken_at: row.id, total: results.length, verified };
    }
    prevHash = row.hash;
    verified++;
  }
  return { ok: true, total: results.length, verified };
}
