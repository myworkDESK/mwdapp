# STEP 2 — Connect GitHub Repository to Cloudflare

You can deploy this project using either **Cloudflare Pages** (classic) or **Cloudflare Workers** (with Git integration). Both work — choose whichever you see in your dashboard.

---

## Option A — Cloudflare Pages

1. Log in to https://dash.cloudflare.com
2. In the left sidebar click **Workers & Pages**
3. Click the **Pages** tab → **Create a project**
4. Click **Connect to Git**
5. Choose **GitHub** as the Git provider
6. Click **Connect GitHub** — a GitHub OAuth popup will open
7. Authorize Cloudflare to access your GitHub account
8. When asked which repositories to allow, select **myworkDESK/mwdapp** (or "All repositories" if you prefer)
9. Click **Install & Authorize**
10. In the **Select a repository** list, find and click **myworkDESK/mwdapp**
11. Click **Begin setup**

---

## Option B — Cloudflare Workers (with Git)

1. Log in to https://dash.cloudflare.com
2. In the left sidebar click **Workers & Pages**
3. Click **Create** → choose **Worker**
4. Give the worker a name (e.g. `myworkdeskapp`)
5. Under **Build** or **Git integration**, click **Connect to Git**
6. Choose **GitHub** and authorize access to **myworkDESK/mwdapp**
7. Continue to the build settings (see Step 3)

> **Note:** The repository contains a `wrangler.jsonc` at the root that configures the Worker to serve static assets and API functions. This is why the Workers path also works.

---

➡️ Next: [STEP-3-build-settings.md](./STEP-3-build-settings.md)
