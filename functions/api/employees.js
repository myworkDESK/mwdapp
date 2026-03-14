/**
 * WorkDesk — /api/employees
 * Cloudflare Pages Function
 *
 * GET    /api/employees           — List all employees
 * POST   /api/employees           — Create employee
 * PUT    /api/employees           — Update employee
 * DELETE /api/employees?id=EMP-X  — Delete employee
 *
 * For production: use env.DB (D1) for persistence.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: CORS });
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  // Auth check (basic)
  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);

  // ── GET — list employees ──────────────────────────────────
  if (method === 'GET') {
    // TODO: const { results } = await env.DB.prepare('SELECT * FROM employees ORDER BY last_name').all();
    // Return stub response — client uses localStorage when this is not yet wired
    return json({ ok: true, employees: [], message: 'Connect D1 database to enable server-side employee data.' });
  }

  // ── POST — create employee ────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { first, last, email, dept, pos, start, status, phone } = body || {};
    if (!first || !last || !email || !dept || !pos || !start) {
      return json({ ok: false, message: 'Missing required fields.' }, 400);
    }
    // TODO: await env.DB.prepare('INSERT INTO employees ...').bind(...).run();
    return json({ ok: true, message: 'Employee created (connect D1 to persist).' }, 201);
  }

  // ── PUT — update employee ─────────────────────────────────
  if (method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    // TODO: await env.DB.prepare('UPDATE employees SET ... WHERE id = ?').bind(...).run();
    return json({ ok: true, message: 'Employee updated (connect D1 to persist).' });
  }

  // ── DELETE — remove employee ──────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Employee ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM employees WHERE id = ?').bind(id).run();
    return json({ ok: true, message: 'Employee deleted (connect D1 to persist).' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
