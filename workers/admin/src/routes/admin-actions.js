/**
 * WorkDesk — Admin Actions Routes
 *
 * POST   /api/admin-actions          — Create a new admin action
 * GET    /api/admin-actions/:id      — Get a specific admin action
 * POST   /api/admin-actions/:id/approve — Approve or reject an action
 */

import { writeAuditEntry }                from '../../lib/audit.js';
import { checkIdempotency, storeIdempotency } from '../../lib/idempotency.js';
import { issueElevationToken, verifyElevationToken } from '../../lib/jwt.js';
import { notifyAdminAction }              from '../../lib/notifications.js';
import { json, requireAuth }              from './shared.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin-actions
// ─────────────────────────────────────────────────────────────────────────────

export async function createAdminAction(request, env, actor) {
  const idemKey = request.headers.get('Idempotency-Key');
  if (idemKey) {
    const cached = await checkIdempotency(env.DB, idemKey);
    if (cached) return cached;
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: 'Invalid JSON' }, 400); }

  const { action_type, target_user_id, reason, risk_score, decision } = body ?? {};
  if (!action_type || !target_user_id) {
    return json({ ok: false, message: 'action_type and target_user_id are required' }, 400);
  }

  const ALLOWED_TYPES = ['disable_user', 'quarantine_user', 'notify_user'];
  if (!ALLOWED_TYPES.includes(action_type)) {
    return json({ ok: false, message: `action_type must be one of: ${ALLOWED_TYPES.join(', ')}` }, 400);
  }

  const now       = new Date().toISOString();
  const id        = 'aa-' + crypto.randomUUID();

  // Issue a short-lived elevation token so the approver can authorise without
  // re-authenticating via Access.
  const elevationToken = await issueElevationToken({
    actionId:   id,
    sub:        actor.email,
    secret:     env.ELEVATION_SECRET ?? 'change-me-in-production',
    ttlSeconds: 900, // 15 minutes
  });
  const elevationExp = new Date(Date.now() + 900 * 1000).toISOString();

  await env.DB
    .prepare(
      `INSERT INTO admin_actions
         (id, action_type, target_user_id, requested_by, status, risk_score, decision,
          reason, idempotency_key, attempts, max_attempts, elevation_token, elevation_exp,
          created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,0,3,?,?,?,?)`,
    )
    .bind(
      id, action_type, target_user_id, actor.email, 'pending',
      risk_score ?? null, decision ?? null, reason ?? null,
      idemKey ?? null, elevationToken, elevationExp, now, now,
    )
    .run();

  // Audit entry
  await writeAuditEntry(
    { db: env.DB, r2: env.AUDIT_BUCKET },
    {
      event_type: 'admin_action.created',
      actor:      actor.email,
      target:     target_user_id,
      payload:    { id, action_type, risk_score, decision, reason },
    },
  );

  // Notify
  const action = { id, action_type, target_user_id, requested_by: actor.email,
    status: 'pending', risk_score, decision, reason, created_at: now };
  await notifyAdminAction(env, action).catch(() => {});

  const responseBody = JSON.stringify({ ok: true, id, status: 'pending', elevation_token: elevationToken });
  if (idemKey) await storeIdempotency(env.DB, idemKey, 'POST', '/api/admin-actions', 201, responseBody);
  return new Response(responseBody, { status: 201, headers: { 'Content-Type': 'application/json' } });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin-actions/:id
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminAction(request, env, id) {
  const row = await env.DB
    .prepare('SELECT * FROM admin_actions WHERE id = ?')
    .bind(id)
    .first();

  if (!row) return json({ ok: false, message: 'Not found' }, 404);

  // Strip elevation_token from response for security
  const { elevation_token: _et, ...safe } = row;
  return json({ ok: true, action: safe });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin-actions/:id/approve
// ─────────────────────────────────────────────────────────────────────────────

export async function approveAdminAction(request, env, id, actor) {
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: 'Invalid JSON' }, 400); }

  const { decision, notes, elevation_token } = body ?? {};
  if (!decision || !['approved', 'rejected'].includes(decision)) {
    return json({ ok: false, message: 'decision must be "approved" or "rejected"' }, 400);
  }

  // Verify elevation token
  try {
    const et = await verifyElevationToken(
      elevation_token,
      env.ELEVATION_SECRET ?? 'change-me-in-production',
    );
    if (et.action_id !== id) {
      return json({ ok: false, message: 'Elevation token does not match this action' }, 403);
    }
  } catch (err) {
    return json({ ok: false, message: 'Invalid or expired elevation token: ' + err.message }, 403);
  }

  const action = await env.DB
    .prepare('SELECT * FROM admin_actions WHERE id = ?')
    .bind(id)
    .first();
  if (!action) return json({ ok: false, message: 'Not found' }, 404);
  if (action.status !== 'pending') {
    return json({ ok: false, message: `Action is not pending (current status: ${action.status})` }, 409);
  }

  const now        = new Date().toISOString();
  const approvalId = 'appr-' + crypto.randomUUID();
  const newStatus  = decision === 'approved' ? 'approved' : 'rejected';

  // Insert approval record
  await env.DB
    .prepare(
      `INSERT INTO approvals (id, action_id, reviewer, decision, notes, elevation_token, decided_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .bind(approvalId, id, actor.email, decision, notes ?? null, elevation_token, now)
    .run();

  // Update action status
  await env.DB
    .prepare('UPDATE admin_actions SET status = ?, updated_at = ? WHERE id = ?')
    .bind(newStatus, now, id)
    .run();

  // Audit
  await writeAuditEntry(
    { db: env.DB, r2: env.AUDIT_BUCKET },
    {
      event_type: `admin_action.${decision}`,
      actor:      actor.email,
      target:     action.target_user_id,
      payload:    { action_id: id, decision, notes, approval_id: approvalId },
    },
  );

  return json({ ok: true, action_id: id, approval_id: approvalId, status: newStatus });
}
