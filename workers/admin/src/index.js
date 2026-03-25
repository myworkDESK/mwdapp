/**
 * WorkDesk — Admin Actions & Security Incident Worker
 *
 * Cloudflare Worker that implements the admin-actions and security incident
 * pipeline.  Deployed separately from the main Pages project so that it can
 * carry elevated bindings (D1, R2 audit bucket, KV JTI store).
 *
 * Routes:
 *   POST   /api/admin-actions               — Create admin action
 *   GET    /api/admin-actions/:id           — Get admin action
 *   POST   /api/admin-actions/:id/approve   — Approve / reject action
 *   POST   /api/security/incidents          — Report security incident
 *   POST   /api/users/:id/disable           — Disable user
 *   POST   /api/users/:id/enable            — Enable user
 *   GET    /api/incidents                   — List incidents
 *
 * Authentication:
 *   All routes require a valid Cloudflare Access JWT in the
 *   `Cf-Access-Jwt-Assertion` header (set automatically by Access).
 *   In dev/test pass: `Authorization: Bearer <token>` instead.
 *
 * Bindings (configure in workers/admin/wrangler.toml):
 *   env.DB              — D1 database (workdesk-db)
 *   env.AUDIT_BUCKET    — R2 bucket   (workdesk-audit)
 *   env.JTI_STORE       — KV namespace (workdesk-jti)
 *   env.CF_ACCESS_TEAM_DOMAIN  — e.g. "yourteam.cloudflareaccess.com"
 *   env.CF_ACCESS_AUD          — Cloudflare Access audience tag
 *   env.ELEVATION_SECRET       — HMAC secret for elevation tokens
 */

import { verifyAccessJwt }   from '../lib/jwt.js';
import { createAdminAction, getAdminAction, approveAdminAction } from './routes/admin-actions.js';
import { createIncident, listIncidents } from './routes/security.js';
import { disableUser, enableUser }       from './routes/users.js';
import { json }                          from './routes/shared.js';

export default {
  async fetch(request, env, ctx) {
    const method = request.method.toUpperCase();
    const url    = new URL(request.url);
    const path   = url.pathname;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin':  'same-origin',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, Cf-Access-Jwt-Assertion',
        },
      });
    }

    // Authenticate
    const actor = await authenticate(request, env).catch(() => null);
    if (!actor) return json({ ok: false, message: 'Unauthorized' }, 401);

    try {
      // ── POST /api/admin-actions ──────────────────────────────────────────
      if (method === 'POST' && path === '/api/admin-actions') {
        return createAdminAction(request, env, actor);
      }

      // ── GET /api/admin-actions/:id ───────────────────────────────────────
      const getMatch = path.match(/^\/api\/admin-actions\/([^/]+)$/);
      if (method === 'GET' && getMatch) {
        return getAdminAction(request, env, getMatch[1]);
      }

      // ── POST /api/admin-actions/:id/approve ──────────────────────────────
      const approveMatch = path.match(/^\/api\/admin-actions\/([^/]+)\/approve$/);
      if (method === 'POST' && approveMatch) {
        return approveAdminAction(request, env, approveMatch[1], actor);
      }

      // ── POST /api/security/incidents ─────────────────────────────────────
      if (method === 'POST' && path === '/api/security/incidents') {
        return createIncident(request, env, actor);
      }

      // ── GET /api/incidents ───────────────────────────────────────────────
      if (method === 'GET' && path === '/api/incidents') {
        return listIncidents(request, env);
      }

      // ── POST /api/users/:id/disable ──────────────────────────────────────
      const disableMatch = path.match(/^\/api\/users\/([^/]+)\/disable$/);
      if (method === 'POST' && disableMatch) {
        return disableUser(request, env, disableMatch[1], actor);
      }

      // ── POST /api/users/:id/enable ───────────────────────────────────────
      const enableMatch = path.match(/^\/api\/users\/([^/]+)\/enable$/);
      if (method === 'POST' && enableMatch) {
        return enableUser(request, env, enableMatch[1], actor);
      }

      // ── GET /api/admin-actions (list, optional ?status=) ────────────────
      if (method === 'GET' && path === '/api/admin-actions') {
        const listUrl = url;
        const status  = listUrl.searchParams.get('status');
        const limit   = Math.min(parseInt(listUrl.searchParams.get('limit') ?? '50', 10), 200);
        const offset  = parseInt(listUrl.searchParams.get('offset') ?? '0', 10);
        let query     = 'SELECT id,action_type,target_user_id,requested_by,status,risk_score,decision,reason,attempts,created_at,updated_at FROM admin_actions';
        const args    = [];
        if (status) { query += ' WHERE status = ?'; args.push(status); }
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        args.push(limit, offset);
        const { results } = await env.DB.prepare(query).bind(...args).all();
        return json({ ok: true, actions: results, limit, offset });
      }

      // ── GET /api/users (list, optional ?disabled=1) ──────────────────────
      if (method === 'GET' && path === '/api/users') {
        const listUrl  = url;
        const disabled = listUrl.searchParams.get('disabled');
        const limit    = Math.min(parseInt(listUrl.searchParams.get('limit') ?? '50', 10), 200);
        const offset   = parseInt(listUrl.searchParams.get('offset') ?? '0', 10);
        let query      = 'SELECT id, email, display_name, role, disabled, disabled_at, disabled_by FROM users';
        const args     = [];
        if (disabled === '1') { query += ' WHERE disabled = 1'; }
        query += ' ORDER BY email ASC LIMIT ? OFFSET ?';
        args.push(limit, offset);
        const { results } = await env.DB.prepare(query).bind(...args).all();
        return json({ ok: true, users: results, limit, offset });
      }

      // ── GET /api/audit/manifest/latest ──────────────────────────────────
      if (method === 'GET' && path === '/api/audit/manifest/latest') {
        if (!env.AUDIT_BUCKET) return json({ ok: false, message: 'Audit bucket not configured' }, 503);
        // Find the most recent manifest by listing objects with prefix manifests/
        const listed = await env.AUDIT_BUCKET.list({ prefix: 'manifests/', limit: 365 });
        if (!listed.objects.length) return json({ ok: false, message: 'No manifests found' }, 404);
        const latest = listed.objects.sort((a, b) => b.key.localeCompare(a.key))[0];
        const obj    = await env.AUDIT_BUCKET.get(latest.key);
        if (!obj) return json({ ok: false, message: 'Manifest not found' }, 404);
        const data = await obj.json();
        return json({ ok: true, ...data });
      }

      return json({ ok: false, message: 'Not found' }, 404);
    } catch (err) {
      console.error('[admin-worker] unhandled error:', err);
      return json({ ok: false, message: 'Internal Server Error' }, 500);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify the Cloudflare Access JWT.
 * In development (no CF_ACCESS_TEAM_DOMAIN) the Authorization Bearer token
 * is accepted as-is and decoded without signature verification (dev only).
 *
 * @param {Request} request
 * @param {object}  env
 * @returns {Promise<{ email: string, sub: string }>}
 */
async function authenticate(request, env) {
  // Cloudflare Access sets this header automatically for protected routes.
  const cfToken = request.headers.get('Cf-Access-Jwt-Assertion');
  const authHdr = request.headers.get('Authorization') ?? '';
  const bearerToken = authHdr.startsWith('Bearer ') ? authHdr.slice(7).trim() : null;

  const token = cfToken || bearerToken;
  if (!token) throw new Error('No token');

  if (env.CF_ACCESS_TEAM_DOMAIN && env.CF_ACCESS_AUD) {
    // Production: full JWT verification + JTI replay check
    return verifyAccessJwt(token, {
      teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
      audience:   env.CF_ACCESS_AUD,
      KV:         env.JTI_STORE,
    });
  }

  // Development fallback: decode without verification (NEVER use in production)
  if (env.ENVIRONMENT === 'development' || !env.CF_ACCESS_TEAM_DOMAIN) {
    const parts = token.split('.');
    if (parts.length >= 2) {
      try {
        const padded  = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
        const payload = JSON.parse(decoded);
        return { email: payload.email ?? payload.sub ?? 'dev@local', sub: payload.sub ?? 'dev' };
      } catch {
        // If decoding fails, treat the whole token as an email for local dev convenience
      }
    }
    return { email: token, sub: token };
  }

  throw new Error('Cannot authenticate');
}
