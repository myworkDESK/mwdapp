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

    const { email, password } = body || {};
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, message: 'Email and password are required.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // TODO: Replace with real D1 lookup:
    //   const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    //   const valid = user && await verifyPassword(password, user.password_hash);
    //
    // Demo: accept any @workdesk.ph address with password "workdesk2025"
    const isDemoUser = email.endsWith('@workdesk.ph') || email.endsWith('@company.com');
    const isDemoPass = password === 'workdesk2025';
    const valid = isDemoUser && isDemoPass;

    if (!valid) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid email or password.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Issue a simple demo token (replace with signed JWT in production)
    const token = btoa(email + ':' + Date.now());

    // Optionally persist session in KV:
    //   if (env.SESSIONS) await env.SESSIONS.put('session:' + token, JSON.stringify({ email }), { expirationTtl: 86400 });

    return new Response(JSON.stringify({ ok: true, token, email }), {
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
