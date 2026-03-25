/**
 * WorkDesk — User Disable / Enable Routes
 *
 * POST /api/users/:id/disable — Disable a user account
 * POST /api/users/:id/enable  — Re-enable a previously disabled user account
 */

import { writeAuditEntry }                   from '../../lib/audit.js';
import { checkIdempotency, storeIdempotency } from '../../lib/idempotency.js';
import { json }                              from './shared.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/:id/disable
// ─────────────────────────────────────────────────────────────────────────────

export async function disableUser(request, env, userId, actor) {
  const idemKey = request.headers.get('Idempotency-Key');
  if (idemKey) {
    const cached = await checkIdempotency(env.DB, idemKey);
    if (cached) return cached;
  }

  const user = await env.DB
    .prepare('SELECT id, email, disabled FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!user) return json({ ok: false, message: 'User not found' }, 404);
  if (user.disabled) return json({ ok: false, message: 'User is already disabled' }, 409);

  const now = new Date().toISOString();
  await env.DB
    .prepare('UPDATE users SET disabled = 1, disabled_at = ?, disabled_by = ? WHERE id = ?')
    .bind(now, actor.email, userId)
    .run();

  await writeAuditEntry(
    { db: env.DB, r2: env.AUDIT_BUCKET },
    {
      event_type: 'user.disabled',
      actor:      actor.email,
      target:     userId,
      payload:    { user_id: userId, disabled_at: now, disabled_by: actor.email },
    },
  );

  const responseBody = JSON.stringify({ ok: true, user_id: userId, status: 'disabled', disabled_at: now });
  if (idemKey) await storeIdempotency(env.DB, idemKey, 'POST', `/api/users/${userId}/disable`, 200, responseBody);
  return new Response(responseBody, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users/:id/enable
// ─────────────────────────────────────────────────────────────────────────────

export async function enableUser(request, env, userId, actor) {
  const idemKey = request.headers.get('Idempotency-Key');
  if (idemKey) {
    const cached = await checkIdempotency(env.DB, idemKey);
    if (cached) return cached;
  }

  const user = await env.DB
    .prepare('SELECT id, email, disabled FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!user) return json({ ok: false, message: 'User not found' }, 404);
  if (!user.disabled) return json({ ok: false, message: 'User is already active' }, 409);

  const now = new Date().toISOString();
  await env.DB
    .prepare('UPDATE users SET disabled = 0, disabled_at = NULL, disabled_by = NULL WHERE id = ?')
    .bind(userId)
    .run();

  await writeAuditEntry(
    { db: env.DB, r2: env.AUDIT_BUCKET },
    {
      event_type: 'user.enabled',
      actor:      actor.email,
      target:     userId,
      payload:    { user_id: userId, enabled_at: now, enabled_by: actor.email },
    },
  );

  const responseBody = JSON.stringify({ ok: true, user_id: userId, status: 'active', enabled_at: now });
  if (idemKey) await storeIdempotency(env.DB, idemKey, 'POST', `/api/users/${userId}/enable`, 200, responseBody);
  return new Response(responseBody, { status: 200, headers: { 'Content-Type': 'application/json' } });
}
