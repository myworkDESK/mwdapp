# WorkDesk Super Admin — Deployment Guide

The Super Admin Panel (`sa-portal.html` and `sa-dashboard.html`) is deployed as part of the **main WorkDesk Cloudflare Pages project** (`workdesk-worker`). There is no separate project — everything lives under one deployment.

---

## Super Admin URLs

Once deployed, the Super Admin Panel is accessible at:

- `https://<your-domain>/sa-portal.html` — Login portal
- `https://<your-domain>/sa-dashboard.html` — Management dashboard

> **Tip:** Keep these URLs private. They are not linked from any employee-facing page and include `noindex` meta tags to prevent search engine indexing.

---

## Deploying the Main Project

From the **root** of the WorkDesk repository:

```bash
wrangler pages deploy . \
  --project-name workdesk-worker \
  --compatibility-date 2024-01-01
```

---

## Setting the Required Secrets

The Super Admin login (`POST /api/sa-auth`) reads three secrets from the Cloudflare environment. **Never commit real credentials to source control.** Set them via the CLI:

```bash
wrangler secret put SA_USERNAME     --name workdesk-worker
wrangler secret put SA_SECURITY_KEY --name workdesk-worker
wrangler secret put SA_PASSWORD     --name workdesk-worker
```

You will be prompted to enter each value interactively. Choose strong, unique values for all three.

Verify all three are set:

```bash
wrangler secret list --name workdesk-worker
# Expected output lists SA_USERNAME, SA_SECURITY_KEY, SA_PASSWORD
```

---

## Subsequent Deploys

```bash
wrangler pages deploy . --project-name workdesk-worker
```

---

## Optional — Enable Server-Side Session Storage (KV)

By default, super admin tokens are verified client-side only. For stronger security, you can persist sessions in a Cloudflare KV namespace so that tokens can be revoked server-side:

### Step 1 — Create the KV namespace

```bash
wrangler kv:namespace create "SA_SESSIONS"
```

Copy the `id` value from the output.

### Step 2 — Uncomment the KV binding in `wrangler.toml`

Open the root `wrangler.toml` and replace the commented-out section with your real namespace ID:

```toml
[[kv_namespaces]]
binding = "SA_SESSIONS"
id     = "YOUR_SA_SESSIONS_KV_ID"
```

### Step 3 — Enable server-side verification in `functions/api/sa-auth.js`

In `sa-auth.js`, uncomment the two TODO blocks that read from and write to `env.SA_SESSIONS`.

### Step 4 — Redeploy

```bash
wrangler pages deploy . --project-name workdesk-worker
```

---

## Security Checklist

Before going live, ensure:

- [ ] `SA_USERNAME`, `SA_SECURITY_KEY`, and `SA_PASSWORD` are all set as **encrypted** environment variables on `workdesk-worker` — never hardcoded in any file.
- [ ] The SA portal URL is kept private (not linked from the main app or any public page).
- [ ] The `_headers` file at the repo root is deployed alongside the HTML files (Cloudflare Pages picks it up automatically).
- [ ] Access logs are reviewed periodically in the Cloudflare Pages Functions log stream.
- [ ] Consider enabling KV-based session storage (see above) for the ability to force-expire sessions.

---

## Troubleshooting

**Login page shows but authentication fails**
→ Make sure all three environment variables (`SA_USERNAME`, `SA_SECURITY_KEY`, `SA_PASSWORD`) are set in Cloudflare Pages → Settings → Environment variables and that you redeployed after adding them.

**Background image is missing on the login page**
→ Ensure `Baground theme login page .png` is present in the **repo root** folder. Cloudflare Pages will serve it alongside `sa-portal.html`.

**`/api/sa-auth` returns 404**
→ The Pages Function in `functions/api/sa-auth.js` was not deployed. Make sure the `functions/` directory is at the repo root and that Wrangler's root directory is set to `/`.

**Wrangler reports "project not found"**
→ Run `wrangler pages project list` to see your existing projects, then re-run the deploy command with the correct `--project-name`.
