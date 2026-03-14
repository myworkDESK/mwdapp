/**
 * WorkDesk — /api/payroll
 * Cloudflare Pages Function
 *
 * GET  /api/payroll        — List payroll ledger
 * POST /api/payroll/run    — Run payroll for a period
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

  // ── GET — list ledger ─────────────────────────────────────
  if (method === 'GET') {
    const period = url.searchParams.get('period') || 'March 2025';
    // TODO:
    //   const { results } = await env.DB
    //     .prepare('SELECT * FROM payroll_ledger WHERE period = ? ORDER BY employee_id')
    //     .bind(period).all();
    return json({ ok: true, ledger: [], period, message: 'Connect D1 database to enable server-side payroll data.' });
  }

  // ── POST ──────────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }

    if (path.endsWith('/run')) {
      const { period, count } = body || {};
      if (!period) return json({ ok: false, message: 'Pay period is required.' }, 400);
      // TODO:
      //   1. Fetch all active employees for the period
      //   2. Compute basic pay, overtime, allowances, deductions per employee
      //   3. INSERT into payroll_ledger
      //   4. UPDATE status to 'Released'
      //   5. Send email notifications via env.EMAIL_SERVICE
      return json({
        ok: true,
        message: 'Payroll run initiated for ' + period + '. ' + (count || 0) + ' employees processed.',
        period,
        count: count || 0,
      }, 202);
    }

    return json({ ok: false, message: 'Unknown action.' }, 400);
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
