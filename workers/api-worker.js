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
 *
 * Bindings required (configure in wrangler.toml before deploying):
 *   env.DB             — Cloudflare D1 database   (workdesk-db)
 *   env.SESSIONS       — Cloudflare KV namespace  (workdesk-sessions)
 *   env.UPLOADS        — Cloudflare R2 bucket     (workdesk-attachments)
 *   env.WORKDESK_QUEUE — Cloudflare Queue producer (workdesk-queue)
 *   env.AI             — Cloudflare Workers AI binding (optional)
 *
 * Super-Admin secrets (set via: wrangler secret put <NAME> --name workdesk-worker):
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
import { onRequest as saAuthHandler }      from '../functions/api/sa-auth.js';
import { onRequest as saOrgAdminsHandler } from '../functions/api/sa-org-admins.js';

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
    'sa-auth', 'sa-org-admins', 'aux',
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
    next:   () => errorResponse(500, 'next() is not supported in standalone worker'),
    data:   {},
  });

  // ── Super-Admin routes ───────────────────────────────────────────────────
  // These routes are wired up to the shared Pages Function handlers so that
  // SA credentials stored in env (SA_USERNAME, SA_SECURITY_KEY, SA_PASSWORD)
  // are respected identically whether the app runs on Pages or this worker.
  if (segment === 'sa-auth') {
    return saAuthHandler(makeContext());
  }

  if (segment === 'sa-org-admins') {
    return saOrgAdminsHandler(makeContext());
  }

  // ── Other API routes (wire up additional handlers here) ──────────────────
  return errorResponse(501, 'Route handler not wired up yet. Configure module imports for standalone deployment.');
}
