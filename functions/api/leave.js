/**
 * WorkDesk — /api/leave
 * Cloudflare Pages Function
 *
 * GET  /api/leave           — List leave requests
 * POST /api/leave           — File a leave request
 * POST /api/leave/approve   — Approve a leave request
 * POST /api/leave/reject    — Reject a leave request
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const path = url.pathname;

  // ── GET — list requests ───────────────────────────────────
  if (method === 'GET') {
    // TODO: const { results } = await env.DB.prepare('SELECT * FROM leave_requests ORDER BY filed_date DESC').all();
    return json({ ok: true, requests: [], message: 'Connect D1 database to enable server-side leave data.' });
  }

  // ── POST ──────────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    if (path.endsWith('/approve')) {
      const { id } = body || {};
      if (!id) return json({ ok: false, message: 'Leave request ID required.' }, 400);
      // TODO: await env.DB.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').bind('Approved', id).run();
      return json({ ok: true, message: 'Leave request ' + id + ' approved.' });
    }

    if (path.endsWith('/reject')) {
      const { id } = body || {};
      if (!id) return json({ ok: false, message: 'Leave request ID required.' }, 400);
      // TODO: await env.DB.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').bind('Rejected', id).run();
      return json({ ok: true, message: 'Leave request ' + id + ' rejected.' });
    }

    // File a new leave request
    const { empId, name, type, from, to, days, reason } = body || {};
    if (!empId || !type || !from || !to) {
      return json({ ok: false, message: 'Employee ID, type, from, and to are required.' }, 400);
    }
    // TODO: DB insert
    return json({ ok: true, message: 'Leave request filed successfully.' }, 201);
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
