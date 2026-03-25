/**
 * WorkDesk — Security Incidents Routes
 *
 * POST /api/security/incidents — Report a new security incident
 * GET  /api/incidents          — List incidents (with optional filters)
 */

import { writeAuditEntry }   from '../../lib/audit.js';
import { evaluateRisk, severityToBaseScore, scoreToDecision, decisionToActionTypes } from '../../lib/scoring.js';
import { notifyIncident }    from '../../lib/notifications.js';
import { json }              from './shared.js';
import { createAdminAction as _createAction } from './admin-actions.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/security/incidents
// ─────────────────────────────────────────────────────────────────────────────

export async function createIncident(request, env, actor) {
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, message: 'Invalid JSON' }, 400); }

  const { incident_type, severity, source_ip, user_id, detection_events } = body ?? {};
  if (!incident_type) {
    return json({ ok: false, message: 'incident_type is required' }, 400);
  }

  const events = Array.isArray(detection_events) ? detection_events : [];
  // Use detection events if provided; fall back to severity-based score
  let score, decision, actionTypes;
  if (events.length > 0) {
    ({ score, decision, actionTypes } = evaluateRisk(events));
  } else {
    score       = severityToBaseScore(severity ?? 'medium');
    decision    = scoreToDecision(score);
    actionTypes = decisionToActionTypes(decision);
  }

  const now = new Date().toISOString();
  const id  = 'inc-' + crypto.randomUUID();

  await env.DB
    .prepare(
      `INSERT INTO security_incidents
         (id, incident_type, severity, source_ip, user_id, detection_events,
          risk_score, decision, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    )
    .bind(
      id, incident_type, severity ?? 'medium', source_ip ?? null,
      user_id ?? null, JSON.stringify(events),
      score, decision, 'open', now, now,
    )
    .run();

  // Audit — lifecycle start
  await writeAuditEntry(
    { db: env.DB, r2: env.AUDIT_BUCKET },
    {
      event_type: 'incident.created',
      actor:      actor?.email ?? 'system',
      target:     user_id ?? null,
      payload:    { id, incident_type, severity, score, decision, source_ip },
    },
  );

  // Trigger admin actions derived from decision
  let adminActionIds = [];
  if (user_id && actionTypes.length) {
    for (const atype of actionTypes) {
      const syntheticReq = new Request('https://internal/api/admin-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type:    atype,
          target_user_id: user_id,
          reason:         `Auto-generated from incident ${id} (score ${score})`,
          risk_score:     score,
          decision,
        }),
      });
      const resp = await _createAction(syntheticReq, env, actor ?? { email: 'system' });
      const respBody = await resp.json().catch(() => ({}));
      if (respBody.id) {
        adminActionIds.push(respBody.id);
        // Link action to incident
        await env.DB
          .prepare('UPDATE security_incidents SET admin_action_id = ?, updated_at = ? WHERE id = ?')
          .bind(respBody.id, now, id)
          .run();
      }
    }
  }

  // Send notifications
  const incident = { id, incident_type, severity, risk_score: score, decision, user_id, source_ip, created_at: now };
  await notifyIncident(env, incident).catch(() => {});

  return json({ ok: true, id, score, decision, admin_action_ids: adminActionIds }, 201);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/incidents
// ─────────────────────────────────────────────────────────────────────────────

export async function listIncidents(request, env) {
  const url    = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 200);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  let query  = 'SELECT * FROM security_incidents';
  const args = [];
  if (status) {
    query += ' WHERE status = ?';
    args.push(status);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...args).all();
  return json({ ok: true, incidents: results, limit, offset });
}
