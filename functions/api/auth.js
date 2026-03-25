/**
 * WorkDesk — /api/auth
 * Cloudflare Pages Function
 *
 * POST /api/auth  — Authenticate a user
 * GET  /api/auth  — Verify current session
 *
 * For production: replace the demo credential check with D1 DB lookup
 * and issue a signed JWT stored in SESSIONS KV.
 */
import { CORS, json, getToken } from './_shared.js';

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // ── POST /api/auth — sign in ─────────────────────────────
  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, message: 'Invalid JSON body.' }, 400);
    }

    const { orgId, employeeId, password, role } = body || {};
    if (!orgId || !employeeId || !password) {
      return json({ ok: false, message: 'Organization ID, Employee ID, and password are required.' }, 400);
    }
    if (role && role !== 'employee' && role !== 'admin') {
      return json({ ok: false, message: 'Invalid role.' }, 400);
    }

    // TODO: Replace with real D1 lookup:
    //   const user = await env.DB.prepare(
    //     'SELECT * FROM users WHERE org_id = ? AND employee_id = ?'
    //   ).bind(orgId, employeeId).first();
    //   const valid = user && await verifyPassword(password, user.password_hash);
    //
    // Constant-time string comparison to guard against timing attacks.
    async function safeEqual(a, b) {
      if (typeof a !== 'string' || typeof b !== 'string') return false;
      const enc = new TextEncoder();
      const ka = await crypto.subtle.importKey('raw', enc.encode(a), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kb = await crypto.subtle.importKey('raw', enc.encode(b), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sigA = await crypto.subtle.sign('HMAC', ka, enc.encode('workdesk'));
      const sigB = await crypto.subtle.sign('HMAC', kb, enc.encode('workdesk'));
      const arrA = new Uint8Array(sigA);
      const arrB = new Uint8Array(sigB);
      if (arrA.length !== arrB.length) return false;
      let diff = 0;
      for (let i = 0; i < arrA.length; i++) diff |= arrA[i] ^ arrB[i];
      return diff === 0;
    }

    // Resolve credentials: use env vars when configured, fall back to built-in
    // demo values so the app works out-of-the-box for evaluation/staging.
    //
    // ⚠️  PRODUCTION WARNING: Replace all three env vars (DEMO_ORG_ID,
    //     DEMO_EMPLOYEE_ID, DEMO_PASSWORD) with strong, unique values in your
    //     Cloudflare Pages project settings before handling real user data.
    //     The built-in defaults are public knowledge and must not be used in
    //     a live deployment with real employees or sensitive information.
    const demoOrgId      = env.DEMO_ORG_ID      || 'DEMO';
    const demoEmployeeId = env.DEMO_EMPLOYEE_ID  || 'EMP001';
    const demoPassword   = env.DEMO_PASSWORD     || 'WorkDesk@2025';
    const valid =
      await safeEqual(orgId, demoOrgId) &&
      await safeEqual(employeeId, demoEmployeeId) &&
      await safeEqual(password, demoPassword);

    if (!valid) {
      return json({ ok: false, message: 'Invalid Organization ID, Employee ID, or password.' }, 401);
    }

    // Issue a simple demo token (replace with signed JWT in production)
    const token = btoa(orgId + ':' + employeeId + ':' + Date.now());

    // Optionally persist session in KV:
    //   if (env.SESSIONS) await env.SESSIONS.put('session:' + token, JSON.stringify({ orgId, employeeId }), { expirationTtl: 86400 });

    return json({ ok: true, token, orgId, employeeId, role: role || 'employee' });
  }

  // ── GET /api/auth — verify token ─────────────────────────
  if (method === 'GET') {
    const token = getToken(request);
    if (!token) return json({ ok: false, message: 'No token provided.' }, 401);

    // TODO: Verify against KV / DB in production
    return json({ ok: true, message: 'Token accepted (demo mode).' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
