/**
 * WorkDesk — Route Shared Helpers
 *
 * Tiny utilities used by all route handlers in this worker.
 */

/** Standard CORS + JSON headers */
const HEADERS = {
  'Content-Type':                 'application/json',
  'Access-Control-Allow-Origin':  'same-origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
  'Cache-Control':                'no-store',
};

/**
 * Return a JSON response.
 * @param {unknown} data
 * @param {number}  [status=200]
 */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

/**
 * Require a verified actor on the request context.
 * If authentication failed upstream, returns a 401.
 * @param {object|null} actor
 * @returns {Response|null}  — null if actor is valid, Response if not.
 */
export function requireAuth(actor) {
  if (!actor) return json({ ok: false, message: 'Unauthorized' }, 401);
  return null;
}
