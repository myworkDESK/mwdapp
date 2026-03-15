/**
 * WorkDesk — Shared Worker Utilities
 *
 * Shared helpers used by the standalone API worker (workers/api-worker.js)
 * and any other standalone Worker modules.
 */

/**
 * Returns standard CORS + cache-control headers for API responses.
 * @returns {Object}
 */
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  'same-origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type':                 'application/json',
    'Cache-Control':                'no-store, no-cache, must-revalidate',
  };
}

/**
 * Returns a JSON success/data response.
 * @param {number} status  HTTP status code
 * @param {object} data    Payload to serialise
 * @returns {Response}
 */
export function jsonResponse(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  });
}

/**
 * Returns a JSON error response.
 * @param {number} status   HTTP status code
 * @param {string} message  Human-readable error message
 * @returns {Response}
 */
export function errorResponse(status, message) {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: corsHeaders(),
  });
}
