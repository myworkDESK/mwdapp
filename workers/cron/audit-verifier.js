/**
 * WorkDesk — Nightly Audit Chain Verifier
 *
 * Scheduled Worker that runs nightly (00:15 UTC) to:
 *   1. Walk every row in audit_log and re-compute SHA-256(prev_hash || payload).
 *   2. Compare the expected hash with the stored hash.
 *   3. If the chain is intact, write a signed daily manifest to R2.
 *   4. If the chain is broken, alert via Slack/email and write a FAILED manifest.
 *
 * Also purges expired idempotency_store rows.
 *
 * Bindings (workers/admin/wrangler.toml):
 *   env.DB           — D1 database
 *   env.AUDIT_BUCKET — R2 bucket
 *   env.SIGNING_KEY  — HMAC-SHA-256 secret for signing manifests
 */

import { verifyAuditChain, sha256Hex } from '../admin/lib/audit.js';
import { notifyAuditChainFailure }     from '../admin/lib/notifications.js';
import { purgeExpiredIdempotency }     from '../admin/lib/idempotency.js';

const encoder = new TextEncoder();

export default {
  async scheduled(event, env, ctx) {
    console.info('[audit-verifier] scheduled run:', new Date(event.scheduledTime).toISOString());

    if (!env.DB) {
      console.warn('[audit-verifier] DB binding missing — skipping.');
      return;
    }

    // 1. Verify audit chain
    const result = await verifyAuditChain(env.DB);
    const now    = new Date(event.scheduledTime);
    const dateStr = now.toISOString().slice(0, 10);

    // 2. Write daily manifest to R2
    const manifest = {
      date:      dateStr,
      ok:        result.ok,
      total:     result.total,
      verified:  result.verified,
      broken_at: result.broken_at ?? null,
      generated_at: new Date().toISOString(),
    };

    // Sign the manifest with HMAC-SHA-256
    if (env.SIGNING_KEY) {
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(env.SIGNING_KEY),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(manifest)));
      manifest.signature = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    if (env.AUDIT_BUCKET) {
      const manifestKey = `manifests/${dateStr}.json`;
      await env.AUDIT_BUCKET.put(manifestKey, JSON.stringify(manifest, null, 2), {
        httpMetadata: { contentType: 'application/json' },
        customMetadata: { ok: String(result.ok) },
      });
      console.info('[audit-verifier] manifest written to R2:', manifestKey);
    }

    // 3. Alert on failure
    if (!result.ok) {
      console.error('[audit-verifier] chain integrity FAILURE:', result);
      await notifyAuditChainFailure(env, result).catch((e) =>
        console.error('[audit-verifier] notification error:', e),
      );
    } else {
      console.info('[audit-verifier] chain OK — total:', result.total, 'rows verified');
    }

    // 4. Purge expired idempotency rows
    await purgeExpiredIdempotency(env.DB).catch((e) =>
      console.warn('[audit-verifier] idempotency purge error:', e),
    );
  },
};
