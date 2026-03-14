/**
 * WorkDesk — /api/attendance
 * Cloudflare Pages Function
 *
 * GET  /api/attendance            — List attendance log (with optional ?date= filter)
 * POST /api/attendance            — Create manual attendance entry
 * POST /api/attendance/clock-in   — Clock in
 * POST /api/attendance/clock-out  — Clock out
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
  const path = url.pathname; // e.g. /api/attendance/clock-in

  // ── GET — list log ────────────────────────────────────────
  if (method === 'GET') {
    const date = url.searchParams.get('date');
    // TODO: const { results } = await env.DB.prepare('SELECT * FROM attendance WHERE date = ?').bind(date || new Date().toISOString().slice(0,10)).all();
    return json({ ok: true, log: [], message: 'Connect D1 database to enable server-side attendance data.' });
  }

  // ── POST — manual entry or clock-in/out ──────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    if (path.endsWith('/clock-in')) {
      const { time, date } = body || {};
      // TODO: await env.DB.prepare('INSERT INTO attendance (employee_id, date, time_in) VALUES (?,?,?)').bind(...).run();
      return json({ ok: true, message: 'Clock-in recorded at ' + time + ' on ' + date + '.' }, 201);
    }

    if (path.endsWith('/clock-out')) {
      const { time } = body || {};
      // TODO: await env.DB.prepare('UPDATE attendance SET time_out = ? WHERE employee_id = ? AND date = ?').bind(...).run();
      return json({ ok: true, message: 'Clock-out recorded at ' + time + '.' });
    }

    // Manual entry
    const { name, date, timeIn, timeOut, status } = body || {};
    if (!name || !date) return json({ ok: false, message: 'Name and date are required.' }, 400);
    // TODO: DB insert
    return json({ ok: true, message: 'Attendance entry added.' }, 201);
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
