/**
 * WorkDesk — Webhook Notifications
 *
 * Sends Slack and/or email (via generic HTTP webhook) notifications
 * for security incidents and admin action alerts.
 *
 * Env vars required (set via `wrangler secret put`):
 *   SLACK_WEBHOOK_URL   — Slack Incoming Webhook URL
 *   EMAIL_WEBHOOK_URL   — Generic HTTP webhook for email dispatch
 *                         (e.g. SendGrid, Mailgun, or a custom relay)
 *   ALERT_EMAIL_TO      — Comma-separated recipient list
 */

/**
 * Send a Slack notification.
 * @param {string}  webhookUrl
 * @param {object}  payload    — Slack Block Kit message payload
 * @returns {Promise<void>}
 */
async function slackSend(webhookUrl, payload) {
  if (!webhookUrl) return;
  const resp = await fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!resp.ok) {
    console.error('[notifications] Slack webhook returned', resp.status, await resp.text());
  }
}

/**
 * Send an email notification via a generic HTTP webhook.
 * Caller supplies a pre-formed body; common providers (SendGrid/Mailgun) each
 * have slightly different schemas — adapt the body at the call-site.
 * @param {string} webhookUrl
 * @param {object} payload
 */
async function emailSend(webhookUrl, payload) {
  if (!webhookUrl) return;
  const resp = await fetch(webhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!resp.ok) {
    console.error('[notifications] Email webhook returned', resp.status, await resp.text());
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// High-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Notify about a new security incident.
 * @param {object} env        — Worker env bindings
 * @param {object} incident   — security_incidents row
 */
export async function notifyIncident(env, incident) {
  const severity = (incident.severity ?? 'medium').toUpperCase();
  const emoji    = { LOW: '🟡', MEDIUM: '🟠', HIGH: '🔴', CRITICAL: '🚨' }[severity] ?? '⚠️';

  // Slack
  await slackSend(env.SLACK_WEBHOOK_URL, {
    text: `${emoji} *Security Incident* — ${severity} (score: ${incident.risk_score ?? 'N/A'})`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} Security Incident: ${incident.incident_type}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*ID:*\n${incident.id}` },
          { type: 'mrkdwn', text: `*Severity:*\n${severity}` },
          { type: 'mrkdwn', text: `*Risk Score:*\n${incident.risk_score ?? 'N/A'}` },
          { type: 'mrkdwn', text: `*Decision:*\n${incident.decision}` },
          { type: 'mrkdwn', text: `*User:*\n${incident.user_id ?? 'unknown'}` },
          { type: 'mrkdwn', text: `*Source IP:*\n${incident.source_ip ?? 'N/A'}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Created:* ${incident.created_at}` },
      },
    ],
  });

  // Email
  if (env.EMAIL_WEBHOOK_URL && env.ALERT_EMAIL_TO) {
    await emailSend(env.EMAIL_WEBHOOK_URL, {
      to:      env.ALERT_EMAIL_TO,
      subject: `[WorkDesk] ${severity} Security Incident – ${incident.incident_type}`,
      text:    `A ${severity} security incident has been detected.\n\nID: ${incident.id}\nType: ${incident.incident_type}\nRisk Score: ${incident.risk_score}\nDecision: ${incident.decision}\nUser: ${incident.user_id ?? 'unknown'}\nTime: ${incident.created_at}`,
    });
  }
}

/**
 * Notify about a pending admin action awaiting approval.
 * @param {object} env     — Worker env bindings
 * @param {object} action  — admin_actions row
 */
export async function notifyAdminAction(env, action) {
  await slackSend(env.SLACK_WEBHOOK_URL, {
    text: `⚙️ *Admin Action Pending* — ${action.action_type} for user \`${action.target_user_id}\``,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `⚙️ Admin Action Requires Approval` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Action ID:*\n${action.id}` },
          { type: 'mrkdwn', text: `*Type:*\n${action.action_type}` },
          { type: 'mrkdwn', text: `*Target User:*\n${action.target_user_id}` },
          { type: 'mrkdwn', text: `*Requested By:*\n${action.requested_by}` },
          { type: 'mrkdwn', text: `*Risk Score:*\n${action.risk_score ?? 'N/A'}` },
          { type: 'mrkdwn', text: `*Decision:*\n${action.decision ?? 'N/A'}` },
        ],
      },
    ],
  });

  if (env.EMAIL_WEBHOOK_URL && env.ALERT_EMAIL_TO) {
    await emailSend(env.EMAIL_WEBHOOK_URL, {
      to:      env.ALERT_EMAIL_TO,
      subject: `[WorkDesk] Admin Action Pending Approval – ${action.action_type}`,
      text:    `An admin action requires approval.\n\nID: ${action.id}\nType: ${action.action_type}\nTarget: ${action.target_user_id}\nRequested by: ${action.requested_by}\nTime: ${action.created_at}`,
    });
  }
}

/**
 * Notify about a DLQ (dead-letter queue) event — action exceeded max retries.
 * @param {object} env
 * @param {object} action — admin_actions row with status='dlq'
 */
export async function notifyDlq(env, action) {
  await slackSend(env.SLACK_WEBHOOK_URL, {
    text: `💀 *DLQ Alert* — Admin action \`${action.id}\` (${action.action_type}) moved to dead-letter queue after ${action.attempts} attempts.`,
  });
  if (env.EMAIL_WEBHOOK_URL && env.ALERT_EMAIL_TO) {
    await emailSend(env.EMAIL_WEBHOOK_URL, {
      to:      env.ALERT_EMAIL_TO,
      subject: `[WorkDesk] DLQ Alert – Admin Action ${action.id} Failed`,
      text:    `Admin action ${action.id} (${action.action_type}) has been moved to the dead-letter queue after ${action.attempts} failed attempts.\n\nTarget: ${action.target_user_id}\nReason: ${action.reason ?? 'N/A'}`,
    });
  }
}

/**
 * Notify about an audit chain integrity failure.
 * @param {object} env
 * @param {object} result — { ok, broken_at, total, verified }
 */
export async function notifyAuditChainFailure(env, result) {
  await slackSend(env.SLACK_WEBHOOK_URL, {
    text: `🔐 *Audit Chain Integrity FAILURE* — broken at entry \`${result.broken_at}\` (verified ${result.verified}/${result.total} entries).`,
  });
  if (env.EMAIL_WEBHOOK_URL && env.ALERT_EMAIL_TO) {
    await emailSend(env.EMAIL_WEBHOOK_URL, {
      to:      env.ALERT_EMAIL_TO,
      subject: `[WorkDesk] CRITICAL: Audit Chain Integrity Failure`,
      text:    `The nightly audit chain verification FAILED.\n\nBroken at entry: ${result.broken_at}\nVerified: ${result.verified}/${result.total}`,
    });
  }
}
