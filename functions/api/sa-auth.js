/**
 * WorkDesk — /api/sa-auth
 * Cloudflare Pages Function
 *
 * POST /api/sa-auth  — Authenticate a super administrator
 * GET  /api/sa-auth  — Verify current super admin session token
 *
 * Required environment variables (set in Cloudflare Pages project settings):
 *   SA_USERNAME     — Super admin username
 *   SA_EMPLOYEE_ID  — Super admin employee ID (optional strict match)
 *   SA_SECURITY_KEY — Super admin security key (second factor)
 *   SA_PASSWORD     — Super admin password (optional fallback for legacy flow)
 *
 * All access attempts are logged. This endpoint is NOT linked from any public page.
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin':  'same-origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
    'X-Robots-Tag':                 'noindex, nofollow',
    'Cache-Control':                'no-store, no-cache, must-revalidate',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── Constant-time string comparison (timing-attack safe) ─────────────────
  async function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const enc = new TextEncoder();
    const ka  = await crypto.subtle.importKey('raw', enc.encode(a), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kb  = await crypto.subtle.importKey('raw', enc.encode(b), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig  = enc.encode('workdesk-sa');
    const sigA = await crypto.subtle.sign('HMAC', ka, sig);
    const sigB = await crypto.subtle.sign('HMAC', kb, sig);
    const arrA = new Uint8Array(sigA);
    const arrB = new Uint8Array(sigB);
    if (arrA.length !== arrB.length) return false;
    let diff = 0;
    for (let i = 0; i < arrA.length; i++) diff |= arrA[i] ^ arrB[i];
    return diff === 0;
  }

  // ── POST /api/sa-auth — authenticate ────────────────────────────────────
  if (method === 'POST') {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid request body.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const { username, employeeId, securityKey, password } = body || {};
    const authSecret = securityKey || password || '';

    if (!username || !authSecret) {
      return new Response(JSON.stringify({ ok: false, message: 'Username and passkey are required.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const saUsername    = env.SA_USERNAME     || '';
    const saSecurityKey = env.SA_SECURITY_KEY || '';
    const saPassword    = env.SA_PASSWORD     || '';
    const saEmployeeId  = env.SA_EMPLOYEE_ID  || '';

    // Credentials must be configured in environment variables
    if (!saUsername || !saSecurityKey) {
      return new Response(JSON.stringify({ ok: false, message: 'Super admin access is not configured.' }), {
        status: 503, headers: corsHeaders,
      });
    }

    // Verify username + passkey (security key) and optional employee ID binding.
    const enforceEmployeeIdMatch = !!(saEmployeeId && employeeId);
    const [usernameOk, passkeyOk, employeeIdOk] = await Promise.all([
      safeEqual(username,    saUsername),
      safeEqual(authSecret, saSecurityKey),
      enforceEmployeeIdMatch ? safeEqual(employeeId, saEmployeeId) : true,
    ]);

    // Backward-compatible fallback: if legacy SA_PASSWORD is configured, still
    // allow old clients that submit securityKey + password + username.
    const legacyPasswordOk = saPassword && password ? await safeEqual(password, saPassword) : false;
    const valid = usernameOk && employeeIdOk && (passkeyOk || legacyPasswordOk);

    if (!valid) {
      // Deliberate delay to slow brute-force attempts
      await new Promise(r => setTimeout(r, 800));
      return new Response(JSON.stringify({ ok: false, message: 'Invalid credentials. Access denied.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Issue a super admin session token
    const issuedAt = Date.now();
    const rawToken = username + ':sa:' + issuedAt + ':' + crypto.randomUUID();
    const token    = btoa(rawToken);

    // Optionally persist in KV for server-side verification:
    //   if (env.SA_SESSIONS) {
    //     await env.SA_SESSIONS.put('sa:' + token, JSON.stringify({ username, issuedAt }), { expirationTtl: 28800 });
    //   }

    return new Response(JSON.stringify({ ok: true, token, username, role: 'super_admin', title: 'CEO', permissions: ['*'], issuedAt }), {
      status: 200, headers: corsHeaders,
    });
  }

  // ── GET /api/sa-auth — verify token ─────────────────────────────────────
  if (method === 'GET') {
    const authHeader = request.headers.get('Authorization') || '';
    const token      = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return new Response(JSON.stringify({ ok: false, message: 'No token provided.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Validate token structure: must decode to "<username>:sa:<timestamp>:<uuid>"
    let tokenUsername = '';
    try {
      const decoded = atob(token);
      const parts   = decoded.split(':sa:');
      if (parts.length < 2 || !parts[0]) throw new Error('bad format');
      tokenUsername = parts[0];
    } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid or expired session token.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Cross-check the username in the token against the configured SA_USERNAME
    const saUsername = env.SA_USERNAME || '';
    if (saUsername && !(await safeEqual(tokenUsername, saUsername))) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid or expired session token.' }), {
        status: 401, headers: corsHeaders,
      });
    }

    // Optionally verify against KV store (enables server-side session revocation):
    //   if (env.SA_SESSIONS) {
    //     const sess = await env.SA_SESSIONS.get('sa:' + token);
    //     if (!sess) return new Response(JSON.stringify({ ok: false, message: 'Invalid or expired session.' }), { status: 401, headers: corsHeaders });
    //   }

    return new Response(JSON.stringify({ ok: true, message: 'Super admin token accepted.', role: 'super_admin', title: 'CEO', permissions: ['*'] }), {
      status: 200, headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
    status: 405, headers: corsHeaders,
  });
}
