/**
 * WorkDesk — /api/sa-org-admins
 * Cloudflare Pages Function
 *
 * Super admin endpoint for managing organization admin credentials.
 * ALL requests require a valid SA Bearer token in the Authorization header.
 *
 * GET    /api/sa-org-admins           — list all org admins
 * POST   /api/sa-org-admins           — create a new org admin
 * PUT    /api/sa-org-admins           — update an org admin (credentials / status)
 * DELETE /api/sa-org-admins           — remove an org admin
 *
 * Required environment variables:
 *   SA_USERNAME     — Super admin username  (for SA token validation)
 *   SA_SECURITY_KEY — Super admin security key
 *   SA_PASSWORD     — Super admin password
 *
 * In production wire the DB operations to Cloudflare D1:
 *   env.DB.prepare('SELECT …').bind(…).all() / .first() / .run()
 */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  const corsHeaders = {
    'Access-Control-Allow-Origin':  'same-origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
    'X-Robots-Tag':                 'noindex, nofollow',
    'Cache-Control':                'no-store, no-cache, must-revalidate',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── Constant-time comparison (timing-attack safe) ────────────────────────
  async function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const enc = new TextEncoder();
    const ka  = await crypto.subtle.importKey('raw', enc.encode(a), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kb  = await crypto.subtle.importKey('raw', enc.encode(b), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig  = enc.encode('workdesk-sa-org');
    const sigA = await crypto.subtle.sign('HMAC', ka, sig);
    const sigB = await crypto.subtle.sign('HMAC', kb, sig);
    const arrA = new Uint8Array(sigA);
    const arrB = new Uint8Array(sigB);
    if (arrA.length !== arrB.length) return false;
    let diff = 0;
    for (let i = 0; i < arrA.length; i++) diff |= arrA[i] ^ arrB[i];
    return diff === 0;
  }

  // ── SA token guard ───────────────────────────────────────────────────────
  // Every request to this endpoint must carry a valid super-admin session token.
  const authHeader = request.headers.get('Authorization') || '';
  const saToken    = authHeader.replace('Bearer ', '').trim();

  if (!saToken) {
    return new Response(JSON.stringify({ ok: false, message: 'Authentication required.' }), {
      status: 401, headers: corsHeaders,
    });
  }

  // Validate token structure: must decode to "<username>:sa:<timestamp>:<uuid>"
  let tokenUsername = '';
  try {
    const decoded  = atob(saToken);
    const parts    = decoded.split(':sa:');
    if (parts.length < 2 || !parts[0]) throw new Error('bad format');
    tokenUsername = parts[0];
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid or expired session token.' }), {
      status: 401, headers: corsHeaders,
    });
  }

  // Cross-check the username embedded in the token against the configured SA_USERNAME
  const saConfiguredUsername = env.SA_USERNAME || '';
  if (saConfiguredUsername && !(await safeEqual(tokenUsername, saConfiguredUsername))) {
    return new Response(JSON.stringify({ ok: false, message: 'Invalid or expired session token.' }), {
      status: 401, headers: corsHeaders,
    });
  }

  // ── Password hashing (SHA-256, salted) ───────────────────────────────────
  async function hashPassword(plain, salt) {
    const enc    = new TextEncoder();
    const data   = enc.encode(plain + ':' + (salt || 'workdesk-static'));
    const buf    = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── GET — list org admins ────────────────────────────────────────────────
  if (method === 'GET') {
    // TODO (production): query D1
    //   const { results } = await env.DB.prepare(
    //     'SELECT id, org_id, org_name, username, email, role, status, last_login, created_at FROM org_admins ORDER BY org_name'
    //   ).all();
    //   return new Response(JSON.stringify({ ok: true, admins: results }), { status: 200, headers: corsHeaders });

    // Demo response
    const admins = [
      { id: 'adm-001', orgId: 'ORG-001', orgName: 'ACME Corp',         username: 'admin_acme',     email: 'admin@acme.com',          role: 'org_admin', status: 'active',    lastLogin: '2026-03-15T09:12:00Z', createdAt: '2024-01-10T00:00:00Z' },
      { id: 'adm-002', orgId: 'ORG-002', orgName: 'TechCorp Inc.',      username: 'admin_tech',     email: 'admin@techcorp.io',       role: 'org_admin', status: 'active',    lastLogin: '2026-03-15T08:55:00Z', createdAt: '2024-03-05T00:00:00Z' },
      { id: 'adm-003', orgId: 'ORG-003', orgName: 'Global HR Ltd.',     username: 'admin_globalhr', email: 'admin@globalhr.com',      role: 'org_admin', status: 'active',    lastLogin: '2026-03-14T17:30:00Z', createdAt: '2024-06-12T00:00:00Z' },
      { id: 'adm-004', orgId: 'ORG-004', orgName: 'Startup Hub',        username: 'admin_startup',  email: 'admin@startuphub.io',     role: 'org_admin', status: 'trial',     lastLogin: '2026-03-12T11:00:00Z', createdAt: '2026-02-01T00:00:00Z' },
      { id: 'adm-005', orgId: 'ORG-005', orgName: 'Legacy Systems Co.', username: 'admin_legacy',   email: 'admin@legacysys.com',     role: 'org_admin', status: 'suspended', lastLogin: '2026-01-02T08:00:00Z', createdAt: '2023-08-20T00:00:00Z' },
    ];
    return new Response(JSON.stringify({ ok: true, admins }), { status: 200, headers: corsHeaders });
  }

  // ── POST — create org admin ──────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid request body.' }), { status: 400, headers: corsHeaders });
    }

    const { orgId, orgName, username, email, password, role } = body || {};

    if (!orgId || !username || !email || !password) {
      return new Response(JSON.stringify({ ok: false, message: 'orgId, username, email, and password are required.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Validate minimum password strength
    if (password.length < 10) {
      return new Response(JSON.stringify({ ok: false, message: 'Password must be at least 10 characters.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const salt = crypto.randomUUID();
    const passwordHash = await hashPassword(password, salt);
    const newId = 'adm-' + Date.now();

    // TODO (production): insert into D1
    //   await env.DB.prepare(
    //     'INSERT INTO org_admins (id, org_id, org_name, username, email, role, password_hash, salt, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    //   ).bind(newId, orgId, orgName || orgId, username, email, role || 'org_admin', passwordHash, salt, 'active', new Date().toISOString()).run();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Org admin created successfully.',
      admin: { id: newId, orgId, orgName: orgName || orgId, username, email, role: role || 'org_admin', status: 'active' },
    }), { status: 201, headers: corsHeaders });
  }

  // ── PUT — update org admin credentials / status ──────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid request body.' }), { status: 400, headers: corsHeaders });
    }

    const { id, username, email, newPassword, status } = body || {};

    if (!id) {
      return new Response(JSON.stringify({ ok: false, message: 'Admin id is required.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (newPassword && newPassword.length < 10) {
      return new Response(JSON.stringify({ ok: false, message: 'New password must be at least 10 characters.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // TODO (production): update D1 row
    //   const updates = [];
    //   const bindings = [];
    //   if (username)    { updates.push('username = ?');      bindings.push(username); }
    //   if (email)       { updates.push('email = ?');         bindings.push(email); }
    //   if (status)      { updates.push('status = ?');        bindings.push(status); }
    //   if (newPassword) {
    //     const salt = crypto.randomUUID();
    //     const hash = await hashPassword(newPassword, salt);
    //     updates.push('password_hash = ?', 'salt = ?');
    //     bindings.push(hash, salt);
    //   }
    //   bindings.push(id);
    //   await env.DB.prepare(`UPDATE org_admins SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`)
    //     .bind(...bindings, new Date().toISOString(), id).run();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Org admin updated successfully.',
      updated: { id, username, email, status, passwordChanged: !!newPassword },
    }), { status: 200, headers: corsHeaders });
  }

  // ── DELETE — remove/disable org admin ────────────────────────────────────
  if (method === 'DELETE') {
    let body;
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid request body.' }), { status: 400, headers: corsHeaders });
    }

    const { id, hardDelete } = body || {};

    if (!id) {
      return new Response(JSON.stringify({ ok: false, message: 'Admin id is required.' }), {
        status: 400, headers: corsHeaders,
      });
    }

    // TODO (production): soft-delete (preferred) or hard-delete from D1
    //   if (hardDelete) {
    //     await env.DB.prepare('DELETE FROM org_admins WHERE id = ?').bind(id).run();
    //   } else {
    //     await env.DB.prepare('UPDATE org_admins SET status = ?, deleted_at = ? WHERE id = ?')
    //       .bind('deleted', new Date().toISOString(), id).run();
    //   }

    return new Response(JSON.stringify({
      ok: true,
      message: hardDelete ? 'Org admin permanently deleted.' : 'Org admin disabled successfully.',
    }), { status: 200, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: false, message: 'Method not allowed.' }), {
    status: 405, headers: corsHeaders,
  });
}
