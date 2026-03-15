/**
 * WorkDesk — /api/auth
 * Cloudflare Pages Function
 *
 * POST /api/auth  — Authenticate a user (email + password)
 * GET  /api/auth  — Verify current session
 */

// Demo accounts (hardcoded for immediate access; replace with D1 lookup when DB is ready)
const DEMO_ACCOUNTS = [
  {
    email:       'demoadmin@workdesk.com',
    password:    'demo12345',
    role:        'admin',
    displayName: 'Demo Admin',
  },
  {
    email:       'demoemployee@workdesk.com',
    password:    'demo12345',
    role:        'employee',
    displayName: 'Demo Employee',
  },
];

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

export async function onRequest(context) {
  const { request } = context;
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

    // Find matching account using constant-time comparison on all fields.
    // Iterate all accounts without early exit to avoid timing side-channels.
    let matchedAccount = null;
    for (const account of DEMO_ACCOUNTS) {
      const emailMatch    = await safeEqual(email.toLowerCase().trim(), account.email);
      const passwordMatch = await safeEqual(password, account.password);
      if (emailMatch && passwordMatch && matchedAccount === null) {
        matchedAccount = account;
      }
    }

    if (!matchedAccount) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid email or password.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Sign the token payload with HMAC-SHA256 to prevent forgery.
    // Use TOKEN_SECRET env var in production (set via: wrangler secret put TOKEN_SECRET).
    // Falls back to a default key for local/preview environments.
    const secret = (context.env && context.env.TOKEN_SECRET) || 'workdesk-demo-secret-change-in-production';
    const payload = matchedAccount.email + ':' + matchedAccount.role + ':' + Date.now();
    const enc = new TextEncoder();
    const signingKey = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', signingKey, enc.encode(payload));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
    const token = btoa(payload) + '.' + signature;

    return new Response(JSON.stringify({
      ok:          true,
      token,
      email:       matchedAccount.email,
      role:        matchedAccount.role,
      displayName: matchedAccount.displayName,
    }), {
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
    return new Response(JSON.stringify({ ok: true, message: 'Token accepted.' }), {
      status: 200, headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
    status: 405, headers: corsHeaders,
  });
}
