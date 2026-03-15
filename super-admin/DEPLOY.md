# WorkDesk Super Admin — Separate Deployment Guide

This folder contains the **WorkDesk Super Admin Panel** as a standalone application. It is designed to be deployed as its own Cloudflare Pages project on a **separate web address** from the main WorkDesk app — for example `admin.yourcompany.com` or `yourcompany-admin.pages.dev`.

---

## Folder Contents

| File / Folder | Purpose |
|---|---|
| `sa-portal.html` | Super admin login page (entry point) |
| `sa-dashboard.html` | Super admin console (shown after login) |
| `Baground theme login page .png` | Background image used by the login page |
| `functions/api/sa-auth.js` | Cloudflare Pages Function — handles authentication |
| `wrangler.toml` | Cloudflare Pages + Workers project configuration |
| `_headers` | HTTP security headers (no-index, no-cache, CSP) |
| `DEPLOY.md` | This file |

---

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- [Node.js](https://nodejs.org/) 18+ installed locally
- Wrangler CLI installed globally:

```bash
npm install -g wrangler
```

- Authenticate with your Cloudflare account:

```bash
wrangler login
```

---

## Option A — Deploy via Wrangler CLI (Recommended)

This deploys the `super-admin/` subfolder as a brand-new Cloudflare Pages project.

### Step 1 — Create the Pages project (first deploy only)

From the **root** of the WorkDesk repository:

```bash
wrangler pages deploy super-admin \
  --project-name workdesk-super-admin \
  --compatibility-date 2024-01-01
```

Cloudflare will print the deployment URL (e.g. `https://workdesk-super-admin.pages.dev`). Save this URL.

### Step 2 — Set the required secret environment variables

The authentication function reads three secrets from the Cloudflare environment. **Never commit real credentials to source control.** Set them via the CLI:

```bash
wrangler secret put SA_USERNAME     --project-name workdesk-super-admin
wrangler secret put SA_SECURITY_KEY --project-name workdesk-super-admin
wrangler secret put SA_PASSWORD     --project-name workdesk-super-admin
```

You will be prompted to enter each value interactively. Choose strong, unique values for all three.

### Step 3 — Verify the deployment

Open the URL printed in Step 1 in your browser. You should see the **WorkDesk Secure Access** login page. Use the credentials you set in Step 2 to log in.

### Step 4 — Subsequent deploys

After the first deploy, redeploy at any time with:

```bash
wrangler pages deploy super-admin --project-name workdesk-super-admin
```

---

## Option B — Deploy via Cloudflare Pages Dashboard (GitHub integration)

Use this option if you want automatic deployments every time you push to GitHub.

### Step 1 — Connect your repository

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/) → **Create a project** → **Connect to Git**.
2. Authorise Cloudflare to access your GitHub account and select the `workdesk` repository.
3. Click **Begin setup**.

### Step 2 — Configure the build settings

In the **Set up builds and deployments** screen, enter:

| Setting | Value |
|---|---|
| Project name | `workdesk-super-admin` (or any name you prefer) |
| Production branch | `main` (or your default branch) |
| Framework preset | `None` |
| Build command | *(leave empty)* |
| Build output directory | `super-admin` |
| Root directory | `super-admin` |

Click **Save and Deploy**.

### Step 3 — Set the required environment variables

1. After the first deploy finishes, go to your new project → **Settings** → **Environment variables**.
2. Add the following variables, making sure to mark each as **Encrypted (Secret)**:

| Variable name | Description |
|---|---|
| `SA_USERNAME` | Super admin login username |
| `SA_SECURITY_KEY` | Second-factor security key |
| `SA_PASSWORD` | Super admin password |

3. Click **Save** and then **Retry deployment** to apply the new variables.

---

## Option C — Custom Domain

After deploying, you can assign a custom domain (e.g. `admin.yourcompany.com`):

1. Go to your Cloudflare Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter your desired domain and follow the DNS instructions.
3. If your domain is already on Cloudflare DNS, the CNAME record is added automatically.

> **Tip:** Keep this domain private. Do not publish it on the main WorkDesk site or in any public documentation.

---

## Optional — Enable Server-Side Session Storage (KV)

By default, super admin tokens are verified client-side only. For stronger security, you can persist sessions in a Cloudflare KV namespace so that tokens can be revoked server-side:

### Step 1 — Create the KV namespace

```bash
wrangler kv:namespace create "SA_SESSIONS" --project-name workdesk-super-admin
```

Copy the `id` value from the output.

### Step 2 — Uncomment the KV binding in `wrangler.toml`

Open `super-admin/wrangler.toml` and replace the commented-out section with your real namespace ID:

```toml
[[kv_namespaces]]
binding = "SA_SESSIONS"
id     = "YOUR_SA_SESSIONS_KV_ID"
```

### Step 3 — Enable server-side verification in `functions/api/sa-auth.js`

In `sa-auth.js`, uncomment the two TODO blocks that read from and write to `env.SA_SESSIONS`.

### Step 4 — Redeploy

```bash
wrangler pages deploy super-admin --project-name workdesk-super-admin
```

---

## Keeping the Super Admin Panel Separate from the Main App

The main WorkDesk `_redirects` file already contains rules that redirect any requests for `/sa-portal.html`, `/sa-dashboard.html`, and `/api/sa-auth` back to `/` on the main deployment. This ensures:

- The super admin panel is **not reachable** from the main WorkDesk URL.
- Search engines will not index the admin panel through the main site.
- The admin panel lives at a completely different URL from the employee-facing app.

---

## Security Checklist

Before going live, ensure:

- [ ] `SA_USERNAME`, `SA_SECURITY_KEY`, and `SA_PASSWORD` are all set as **encrypted** environment variables in Cloudflare Pages — never hardcoded in any file.
- [ ] The deployment URL is kept private (not linked from the main app or any public page).
- [ ] The `_headers` file in this folder is deployed alongside the HTML files (Cloudflare Pages picks it up automatically).
- [ ] Access logs are reviewed periodically in the Cloudflare Pages Functions log stream.
- [ ] Consider enabling KV-based session storage (see above) for the ability to force-expire sessions.

---

## Troubleshooting

**Login page shows but authentication fails**
→ Make sure all three environment variables (`SA_USERNAME`, `SA_SECURITY_KEY`, `SA_PASSWORD`) are set in Cloudflare Pages → Settings → Environment variables and that you redeployed after adding them.

**Background image is missing on the login page**
→ Ensure `Baground theme login page .png` is present in the `super-admin/` folder. Cloudflare Pages will serve it alongside the HTML files.

**`/api/sa-auth` returns 404**
→ The Pages Function in `functions/api/sa-auth.js` was not deployed. Make sure the `functions/` directory is inside the `super-admin/` folder and that Wrangler's root directory is set to `super-admin/`.

**Wrangler reports "project not found"**
→ Run `wrangler pages project list` to see your existing projects, then re-run the deploy command with the correct `--project-name`.
