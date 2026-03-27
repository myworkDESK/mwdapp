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

    // Resolve credentials, falling back to built-in demo defaults when the
    // DEMO_* environment variables are not set. Override these in Cloudflare
    // Pages / Workers settings to use your own values.
    const demoOrgId      = (env.DEMO_ORG_ID      || 'DEMO').trim();
    const demoEmployeeId = (env.DEMO_EMPLOYEE_ID  || 'EMP001').trim();
    const demoPassword   = (env.DEMO_PASSWORD     || 'WorkDesk@2025').trim();

    // Admin credentials (optional). If the ADMIN_* env vars are set they take
    // precedence for the 'admin' role; otherwise the admin and employee share
    // the same org-ID and password but admin skips the per-employee-ID check
    // so that any ADMIN-/ADM-prefixed employee ID is accepted.
    const adminOrgId      = (env.ADMIN_ORG_ID      || demoOrgId).trim();
    const adminPassword   = (env.ADMIN_PASSWORD     || demoPassword).trim();
    const adminEmployeeId = (env.ADMIN_EMPLOYEE_ID  || '').trim();

    let valid = false;
    if (role === 'admin') {
      const [orgOk, passOk] = await Promise.all([
        safeEqual(orgId, adminOrgId),
        safeEqual(password, adminPassword),
      ]);
      // Employee-ID check is optional: only enforce if ADMIN_EMPLOYEE_ID is set
      const empOk = adminEmployeeId ? await safeEqual(employeeId, adminEmployeeId) : true;
      valid = orgOk && passOk && empOk;
    } else {
      const [orgOk, empOk, passOk] = await Promise.all([
        safeEqual(orgId, demoOrgId),
        safeEqual(employeeId, demoEmployeeId),
        safeEqual(password, demoPassword),
      ]);
      valid = orgOk && empOk && passOk;
    }

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
