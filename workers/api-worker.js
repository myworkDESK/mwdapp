/**
 * WorkDesk — API Worker
 *
 * Standalone Cloudflare Worker that acts as the API gateway for the
 * WorkDesk application. Routes incoming requests to the appropriate
 * handler module and applies shared middleware (auth, CORS, rate-limiting).
 *
 * API routes handled:
 *   /api/auth            → Authentication (login, token refresh)
 *   /api/employees       → Employee directory CRUD
 *   /api/attendance      → Attendance clock-in / clock-out
 *   /api/leave           → Leave requests and approvals
 *   /api/payroll         → Payroll ledger and pay-run trigger
 *   /api/performance     → Performance reviews
 *   /api/recruitment     → Job postings and applicant pipeline
 *   /api/tickets         → IT/HR support tickets
 *   /api/documents       → Document storage
 *   /api/messages        → Internal messaging threads
 *   /api/timeline        → Company timeline / social feed
 *   /api/engagement      → Engagement surveys
 *   /api/analytics       → HR analytics aggregates
 *   /api/ai              → AI assistant (Cloudflare Workers AI / OpenAI)
 *   /api/knowledge       → Knowledge base articles
 *   /api/integrations    → Third-party integration configs
 *   /api/notifications   → Notification feed
 *   /api/reports         → Report generation queue
 *   /api/sa-auth         → Super-Admin authentication
 *   /api/sa-org-admins   → Super-Admin org admin management
 *   /api/sa-config-check → Super-Admin configuration status check
 *   /api/aux             → Auxiliary / misc helpers
 *
 * Bindings required (configure in wrangler.toml before deploying):
 *   env.DB             — Cloudflare D1 database   (workdesk-db)
 *   env.SESSIONS       — Cloudflare KV namespace  (workdesk-sessions)
 *   env.UPLOADS        — Cloudflare R2 bucket     (workdesk-attachments)
 *   env.WORKDESK_QUEUE — Cloudflare Queue producer (workdesk-queue)
 *   env.AI             — Cloudflare Workers AI binding (optional)
 *
 * Super-Admin secrets (set via: wrangler secret put <NAME> --name myworkdeskapp):
 *   env.SA_USERNAME     — Super admin username
 *   env.SA_SECURITY_KEY — Super admin security key (second factor)
 *   env.SA_PASSWORD     — Super admin password
 *
 * Note: For Cloudflare Pages deployments, API routes are served directly
 * by Pages Functions in /functions/api/*.js — this worker is used for
 * standalone Worker deployments only.
 *
 * Deploy:
 *   wrangler deploy workers/api-worker.js
 */

import { corsHeaders, jsonResponse, errorResponse } from './lib/utils.js';
import { onRequest as authHandler }          from '../functions/api/auth.js';
import { onRequest as employeesHandler }     from '../functions/api/employees.js';
import { onRequest as attendanceHandler }    from '../functions/api/attendance.js';
import { onRequest as leaveHandler }         from '../functions/api/leave.js';
import { onRequest as payrollHandler }       from '../functions/api/payroll.js';
import { onRequest as performanceHandler }   from '../functions/api/performance.js';
import { onRequest as recruitmentHandler }   from '../functions/api/recruitment.js';
import { onRequest as ticketsHandler }       from '../functions/api/tickets.js';
import { onRequest as documentsHandler }     from '../functions/api/documents.js';
import { onRequest as messagesHandler }      from '../functions/api/messages.js';
import { onRequest as timelineHandler }      from '../functions/api/timeline.js';
import { onRequest as engagementHandler }    from '../functions/api/engagement.js';
import { onRequest as analyticsHandler }     from '../functions/api/analytics.js';
import { onRequest as aiHandler }            from '../functions/api/ai.js';
import { onRequest as knowledgeHandler }     from '../functions/api/knowledge.js';
import { onRequest as integrationsHandler }  from '../functions/api/integrations.js';
import { onRequest as notificationsHandler } from '../functions/api/notifications.js';
import { onRequest as reportsHandler }       from '../functions/api/reports.js';
import { onRequest as auxHandler }           from '../functions/api/aux.js';
import { onRequest as saAuthHandler }        from '../functions/api/sa-auth.js';
import { onRequest as saOrgAdminsHandler }   from '../functions/api/sa-org-admins.js';
import { onRequest as saConfigCheckHandler } from '../functions/api/sa-config-check.js';

export default {
  /**
   * fetch — main request handler
   *
   * @param {Request}          request
   * @param {object}           env
   * @param {ExecutionContext} ctx
   * @returns {Response}
   */
  async fetch(request, env, ctx) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Only serve /api/* routes
    if (!path.startsWith('/api/')) {
      return errorResponse(404, 'Not Found');
    }

    try {
      return await routeRequest(path, method, request, env, ctx);
    } catch (err) {
      console.error('[api-worker] unhandled error:', err);
      return errorResponse(500, 'Internal Server Error');
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

async function routeRequest(path, method, request, env, ctx) {
  // Dynamically import the matching Pages Function module so that this worker
  // shares the same handler logic as the Cloudflare Pages deployment.
  // Mapping: /api/<name> → functions/api/<name>.js
  const segment = path.replace(/^\/api\//, '').split('/')[0];

  const ALLOWED_SEGMENTS = new Set([
    'auth', 'employees', 'attendance', 'leave', 'payroll', 'performance',
    'recruitment', 'tickets', 'documents', 'messages', 'timeline', 'engagement',
    'analytics', 'ai', 'knowledge', 'integrations', 'notifications', 'reports',
    'sa-auth', 'sa-org-admins', 'sa-config-check', 'aux',
  ]);

  if (!ALLOWED_SEGMENTS.has(segment)) {
    return errorResponse(404, 'API route not found: /api/' + segment);
  }

  // Build a Pages-Function-compatible context object so that handler modules
  // written for Cloudflare Pages Functions work unchanged in this worker.
  const makeContext = () => ({
    request,
    env,
    params: {},
    next:   () => errorResponse(500, 'next() is not supported in standalone worker mode — this is only available in Cloudflare Pages Functions'),
    data:   {},
  });

  // ── Route table ──────────────────────────────────────────────────────────
  const HANDLERS = {
    'auth':             authHandler,
    'employees':        employeesHandler,
    'attendance':       attendanceHandler,
    'leave':            leaveHandler,
    'payroll':          payrollHandler,
    'performance':      performanceHandler,
    'recruitment':      recruitmentHandler,
    'tickets':          ticketsHandler,
    'documents':        documentsHandler,
    'messages':         messagesHandler,
    'timeline':         timelineHandler,
    'engagement':       engagementHandler,
    'analytics':        analyticsHandler,
    'ai':               aiHandler,
    'knowledge':        knowledgeHandler,
    'integrations':     integrationsHandler,
    'notifications':    notificationsHandler,
    'reports':          reportsHandler,
    'aux':              auxHandler,
    'sa-auth':          saAuthHandler,
    'sa-org-admins':    saOrgAdminsHandler,
    'sa-config-check':  saConfigCheckHandler,
  };

  const handler = HANDLERS[segment];
  if (handler) {
    return handler(makeContext());
  }

  return errorResponse(500, 'Internal error: segment allowed but no handler found for /api/' + segment);
}
