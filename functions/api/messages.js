/**
 * WorkDesk — /api/messages
 * Cloudflare Pages Function
 *
 * GET    /api/messages            — List message threads for the authenticated user
 * POST   /api/messages            — Send a new message
 * PUT    /api/messages?id=MSG-X   — Edit a message (sender only)
 * DELETE /api/messages?id=MSG-X   — Delete a message (sender only)
 *
 * For production: use env.DB (D1) for message persistence
 * and optionally env.MESSAGES (KV) for fast recent-message reads.
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

  const token = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!token) return json({ ok: false, message: 'Unauthorized.' }, 401);

  const url = new URL(request.url);

  // ── GET — list threads / messages ─────────────────────────
  if (method === 'GET') {
    const threadId = url.searchParams.get('thread');
    // TODO:
    //   if (threadId) {
    //     const { results } = await env.DB
    //       .prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC')
    //       .bind(threadId).all();
    //     return json({ ok: true, messages: results });
    //   }
    //   const { results } = await env.DB
    //     .prepare('SELECT DISTINCT thread_id, MAX(created_at) as last_at FROM messages GROUP BY thread_id')
    //     .all();
    return json({ ok: true, threads: [], message: 'Connect D1 database to enable server-side messages.' });
  }

  // ── POST — send message ───────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { threadId, text, attachmentUrl } = body || {};
    if (!threadId || !text) {
      return json({ ok: false, message: 'threadId and text are required.' }, 400);
    }
    // TODO:
    //   await env.DB.prepare(
    //     'INSERT INTO messages (thread_id, sender_token, text, attachment_url, created_at) VALUES (?,?,?,?,?)'
    //   ).bind(threadId, token, text, attachmentUrl || null, new Date().toISOString()).run();
    return json({ ok: true, message: 'Message sent.' }, 201);
  }

  // ── PUT — edit message ────────────────────────────────────
  if (method === 'PUT') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Message ID required.' }, 400);
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, message: 'Invalid JSON.' }, 400); }
    const { text } = body || {};
    if (!text) return json({ ok: false, message: 'text is required.' }, 400);
    // TODO:
    //   await env.DB.prepare(
    //     'UPDATE messages SET text = ?, edited_at = ? WHERE id = ? AND sender_token = ?'
    //   ).bind(text, new Date().toISOString(), id, token).run();
    return json({ ok: true, message: 'Message updated.' });
  }

  // ── DELETE — remove message ───────────────────────────────
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, message: 'Message ID required.' }, 400);
    // TODO: await env.DB.prepare('DELETE FROM messages WHERE id = ? AND sender_token = ?').bind(id, token).run();
    return json({ ok: true, message: 'Message deleted.' });
  }

  return json({ ok: false, message: 'Method not allowed.' }, 405);
}
