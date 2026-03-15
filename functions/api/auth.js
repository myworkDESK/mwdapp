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

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── POST /api/auth — sign in ─────────────────────────────
  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid JSON body.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const { orgId, employeeId, password } = body || {};
    if (!orgId || !employeeId || !password) {
      return new Response(JSON.stringify({ ok: false, message: 'Organization ID, Employee ID, and password are required.' }), {
        status: 400, headers: corsHeaders,
      });
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

    const demoOrgId      = env.DEMO_ORG_ID      || '';
    const demoEmployeeId = env.DEMO_EMPLOYEE_ID  || '';
    const demoPassword   = env.DEMO_PASSWORD     || '';
    const valid = demoOrgId && demoEmployeeId && demoPassword
      ? (await safeEqual(orgId, demoOrgId) && await safeEqual(employeeId, demoEmployeeId) && await safeEqual(password, demoPassword))
      : false;

    if (!valid) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid Organization ID, Employee ID, or password.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Issue a simple demo token (replace with signed JWT in production)
    const token = btoa(orgId + ':' + employeeId + ':' + Date.now());

    // Optionally persist session in KV:
    //   if (env.SESSIONS) await env.SESSIONS.put('session:' + token, JSON.stringify({ orgId, employeeId }), { expirationTtl: 86400 });

    return new Response(JSON.stringify({ ok: true, token, orgId, employeeId }), {
      status: 200, headers: corsHeaders,
    });
  }

  // ── GET /api/auth — verify token ─────────────────────────
  if (method === 'GET') {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return new Response(JSON.stringify({ ok: false, message: 'No token provided.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // TODO: Verify against KV / DB in production
    return new Response(JSON.stringify({ ok: true, message: 'Token accepted (demo mode).' }), {
      status: 200, headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
    status: 405, headers: corsHeaders,
  });
}
