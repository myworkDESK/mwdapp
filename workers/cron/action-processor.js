/**
 * WorkDesk — Admin Action Processor (Cron)
 *
 * Scheduled Worker that runs every 5 minutes to process approved
 * admin actions.  Implements retry + DLQ semantics:
 *
 *   1. Fetch all actions with status IN ('approved', 'executing').
 *   2. For each: mark 'executing', increment attempts, run the action.
 *   3. On success: mark 'completed', write audit entry.
 *   4. On failure: if attempts < max_attempts, leave for retry; else mark 'dlq'.
 *
 * Dead-letter queue: actions with status = 'dlq' are never retried by this
 * worker. A human must review them in the admin UI.
 *
 * Bindings (workers/admin/wrangler.toml):
 *   env.DB           — D1 database
 *   env.AUDIT_BUCKET — R2 bucket
 */

import { writeAuditEntry }  from '../admin/lib/audit.js';
import { notifyDlq }        from '../admin/lib/notifications.js';

export default {
  async scheduled(event, env, ctx) {
    if (!env.DB) {
      console.warn('[action-processor] DB binding missing — skipping.');
      return;
    }

    console.info('[action-processor] run at:', new Date(event.scheduledTime).toISOString());

    // Fetch approved or stuck-in-executing actions
    const { results: actions } = await env.DB
      .prepare(
        `SELECT * FROM admin_actions
         WHERE status IN ('approved', 'executing')
         ORDER BY created_at ASC LIMIT 50`,
      )
      .all();

    if (!actions.length) {
      console.info('[action-processor] no pending actions');
      return;
    }

    for (const action of actions) {
      await processAction(action, env);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Process a single action
// ─────────────────────────────────────────────────────────────────────────────

async function processAction(action, env) {
  const now = new Date().toISOString();

  // Mark as executing and increment attempts
  await env.DB
    .prepare(
      `UPDATE admin_actions
       SET status = 'executing', attempts = attempts + 1, updated_at = ?
       WHERE id = ?`,
    )
    .bind(now, action.id)
    .run();

  try {
    await executeAction(action, env, now);

    // Mark completed
    await env.DB
      .prepare("UPDATE admin_actions SET status = 'completed', updated_at = ? WHERE id = ?")
      .bind(now, action.id)
      .run();

    await writeAuditEntry(
      { db: env.DB, r2: env.AUDIT_BUCKET },
      {
        event_type: 'admin_action.completed',
        actor:      'system',
        target:     action.target_user_id,
        payload:    { action_id: action.id, action_type: action.action_type, attempts: action.attempts + 1 },
      },
    );

    console.info('[action-processor] completed:', action.id, action.action_type);
  } catch (err) {
    console.error('[action-processor] error executing action', action.id, ':', err.message);

    const newAttempts = (action.attempts ?? 0) + 1;
    const newStatus   = newAttempts >= (action.max_attempts ?? 3) ? 'dlq' : 'approved'; // re-queue for retry

    await env.DB
      .prepare(
        `UPDATE admin_actions
         SET status = ?, attempts = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(newStatus, newAttempts, now, action.id)
      .run();

    await writeAuditEntry(
      { db: env.DB, r2: env.AUDIT_BUCKET },
      {
        event_type: newStatus === 'dlq' ? 'admin_action.dlq' : 'admin_action.retry',
        actor:      'system',
        target:     action.target_user_id,
        payload:    { action_id: action.id, action_type: action.action_type, error: err.message, attempts: newAttempts },
      },
    );

    if (newStatus === 'dlq') {
      console.error('[action-processor] action moved to DLQ:', action.id);
      await notifyDlq(env, { ...action, attempts: newAttempts }).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute the specific action type
// ─────────────────────────────────────────────────────────────────────────────

async function executeAction(action, env, now) {
  switch (action.action_type) {
    case 'disable_user': {
      const user = await env.DB
        .prepare('SELECT id, disabled FROM users WHERE id = ?')
        .bind(action.target_user_id)
        .first();
      if (!user) throw new Error('User not found: ' + action.target_user_id);
      if (!user.disabled) {
        await env.DB
          .prepare('UPDATE users SET disabled = 1, disabled_at = ?, disabled_by = ? WHERE id = ?')
          .bind(now, 'system', action.target_user_id)
          .run();
      }
      return;
    }

    case 'quarantine_user': {
      const user = await env.DB
        .prepare('SELECT id, quarantined FROM users WHERE id = ?')
        .bind(action.target_user_id)
        .first();
      if (!user) throw new Error('User not found: ' + action.target_user_id);
      if (!user.quarantined) {
        await env.DB
          .prepare('UPDATE users SET quarantined = 1, updated_at = ? WHERE id = ?')
          .bind(now, action.target_user_id)
          .run()
          .catch(async () => {
            // Fallback if updated_at column doesn't exist on users
            await env.DB
              .prepare('UPDATE users SET quarantined = 1 WHERE id = ?')
              .bind(action.target_user_id)
              .run();
          });
      }
      return;
    }

    case 'notify_user': {
      // Insert a notification row for the target user
      const notifId = 'n-admin-' + crypto.randomUUID();
      await env.DB
        .prepare(
          `INSERT OR IGNORE INTO notifications
             (id, user_token, type, text, href, unread, created_at)
           VALUES (?,?,?,?,?,1,?)`,
        )
        .bind(
          notifId,
          action.target_user_id,
          'security',
          action.reason ?? 'You have received a security notice from the admin team.',
          '/app/dashboard.html',
          now,
        )
        .run();
      return;
    }

    default:
      console.warn('[action-processor] unknown action_type:', action.action_type);
  }
}
