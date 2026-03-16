# WorkDesk — Standalone API Worker Deployment Guide

This guide covers deploying `workers/api-worker.js` as a **standalone Cloudflare Worker** and — most importantly — how to correctly set, verify, rotate, or re-add the **Super-Admin secret keys** that the worker requires.

> **Note:** For Cloudflare Pages deployments the API is served automatically by
> `functions/api/*.js`. This worker is only needed for standalone Worker deployments
> (e.g. a custom domain backed by a Worker instead of Pages Functions).

---

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/) 18+ installed locally
- Wrangler CLI installed and authenticated:

```bash
npm install -g wrangler
wrangler login
```

---

## Step 1 — Deploy the Worker

From the **root** of the WorkDesk repository:

```bash
wrangler deploy workers/api-worker.js --name workdesk-worker
```

Cloudflare will print the worker URL (e.g. `https://workdesk-worker.<account>.workers.dev`).

---

## Step 2 — Set the Super-Admin Secrets

The worker needs three secrets to authenticate Super-Admin login requests at
`POST /api/sa-auth` and validate tokens at `/api/sa-org-admins`. **Never put real
credentials in any file** — always set them via the CLI so they are stored encrypted
in Cloudflare's vault.

Run each command below and enter the value when prompted:

```bash
wrangler secret put SA_USERNAME     --name workdesk-worker
wrangler secret put SA_SECURITY_KEY --name workdesk-worker
wrangler secret put SA_PASSWORD     --name workdesk-worker
```

| Secret | Description |
|---|---|
| `SA_USERNAME` | Super admin login username |
| `SA_SECURITY_KEY` | Second-factor security key (shown in the login form as "Security Key") |
| `SA_PASSWORD` | Super admin password |

Choose strong, unique values for all three. The worker validates all three
simultaneously on every login attempt.

---

## Step 3 — Verify the Secrets Are Applied

List the secrets currently stored for the worker to confirm all three are present:

```bash
wrangler secret list --name workdesk-worker
```

Expected output (values are never shown, only names):

```
[
  { "name": "SA_PASSWORD",     "type": "secret_text" },
  { "name": "SA_SECURITY_KEY", "type": "secret_text" },
  { "name": "SA_USERNAME",     "type": "secret_text" }
]
```

If any secret is missing from the list, re-run the `wrangler secret put` command
for that secret (see Step 2).

---

## Re-adding a Deleted Secret (most common fix)

If you accidentally deleted one or more secrets:

1. **Re-run the `wrangler secret put` command** for each missing secret:

   ```bash
   # Re-add a deleted security key:
   wrangler secret put SA_SECURITY_KEY --name workdesk-worker

   # Re-add all three if unsure:
   wrangler secret put SA_USERNAME     --name workdesk-worker
   wrangler secret put SA_SECURITY_KEY --name workdesk-worker
   wrangler secret put SA_PASSWORD     --name workdesk-worker
   ```

2. **Enter the value when prompted.** The new value takes effect immediately —
   no redeploy is needed after setting secrets.

3. **Verify with `wrangler secret list`** (see Step 3 above) to confirm all three
   names appear.

4. **Test the login** by sending a POST to `/api/sa-auth`:

   ```bash
   curl -s -X POST https://workdesk-worker.<account>.workers.dev/api/sa-auth \
     -H "Content-Type: application/json" \
     -d '{"username":"<SA_USERNAME>","securityKey":"<SA_SECURITY_KEY>","password":"<SA_PASSWORD>"}' \
     | jq .
   ```

   A successful response looks like:

   ```json
   { "ok": true, "token": "...", "username": "...", "role": "super_admin", ... }
   ```

   If the response is `{ "ok": false, "message": "Super admin access is not configured." }`
   it means at least one secret is still missing. Re-run `wrangler secret list` and
   re-add any missing secrets.

---

## Rotating Secrets (security best practice)

To change a secret value (e.g. rotate the security key on a schedule or after a
suspected compromise), simply run `wrangler secret put` again with the same name:

```bash
wrangler secret put SA_SECURITY_KEY --name workdesk-worker
```

Enter the new value at the prompt. The old value is immediately replaced. No
redeploy is needed.

---

## Subsequent Deploys

After the first deploy, redeploy at any time with:

```bash
wrangler deploy workers/api-worker.js --name workdesk-worker
```

Secrets survive redeployments — you only need to re-set them if you explicitly
delete them or if you are setting up the worker on a new Cloudflare account.

---

## Troubleshooting

**`/api/sa-auth` returns `503 Super admin access is not configured.`**
→ One or more of the three secrets is missing. Run `wrangler secret list --name workdesk-worker` and re-add any that are absent.

**`/api/sa-auth` returns `401 Invalid credentials. Access denied.`**
→ All three secrets are present but the values don't match what you entered at login. Re-set the secrets with the correct values using `wrangler secret put`.

**`wrangler secret put` prompts for a value but shows an error**
→ Make sure you are authenticated (`wrangler whoami`) and that the worker name matches (`--name workdesk-worker`). Run `wrangler whoami` to verify the logged-in account.

**Worker returns `404 Not Found` for all routes**
→ The worker may not have been deployed yet. Run `wrangler deploy workers/api-worker.js --name workdesk-worker` from the repository root.

**I need to use the Cloudflare Dashboard instead of the CLI**

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → **Workers & Pages** → select **workdesk-worker**.
2. Click **Settings** → **Variables and Secrets**.
3. Under **Secret variables**, click **Add variable** for each missing secret:
   - Name: `SA_USERNAME` / `SA_SECURITY_KEY` / `SA_PASSWORD`
   - Value: your chosen credential
   - Type: **Secret** (so the value is encrypted and never shown again)
4. Click **Deploy** to apply changes.

---

## Security Checklist

Before going live, confirm:

- [ ] All three secrets (`SA_USERNAME`, `SA_SECURITY_KEY`, `SA_PASSWORD`) appear in `wrangler secret list --name workdesk-worker`.
- [ ] No credentials are hardcoded in any source file — they live only in Cloudflare's encrypted secret store.
- [ ] The worker URL is kept private and not published on any public page.
