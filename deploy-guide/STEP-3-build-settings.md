# STEP 3 — Build & Output Settings

This project is **pure static HTML/CSS/JS** — no build tool needed.

There are two ways to deploy on Cloudflare: **Pages** (classic) and **Workers** (with Git integration). Both work — pick one and follow the matching section below.

---

## Option A — Cloudflare Pages Setup

If you chose **Workers & Pages → Pages → Create a project** in Step 2, fill in the form exactly as shown:

| Field                     | Value              |
|---------------------------|--------------------|
| **Project name**          | `myworkdeskapp`    |
| **Production branch**     | `main`             |
| **Framework preset**      | `None`             |
| **Build command**         | *(leave blank)*    |
| **Build output directory**| `/`                |
| **Root directory**        | `/`                |

---

## Option B — Cloudflare Workers (with Git) Setup

If you connected your repository under **Workers & Pages → Create → Worker → Connect to Git**, the form has slightly different fields:

| Field                     | Value                  |
|---------------------------|------------------------|
| **Build command**         | *(leave blank / None)* |
| **Deploy command**        | `npx wrangler deploy`  |
| **Root directory**        | `/`                    |
| **Production branch**     | `main`                 |

The `wrangler.jsonc` in the repository root already configures the Worker to serve static assets, so the default deploy command (`npx wrangler deploy`) is correct.

---

## ⚠️ Root Directory Must Be `/`

> **IMPORTANT — The Root directory must be `/` (the repository root).**
>
> Do **NOT** set it to a file path like `/pages/sa-login.html` or a subdirectory like `/app`. The Root directory tells Cloudflare where your project files live inside the Git repository — it must point to the **top-level folder** so that `wrangler.jsonc`, `_redirects`, `_headers`, `functions/`, and all HTML files are found.
>
> ❌ `/pages/sa-login.html` — **wrong** (this is a file, not a directory)  
> ❌ `/app` — **wrong** (this is a subdirectory, not the project root)  
> ❌ `/super-admin` — **wrong** (this has a separate wrangler.toml for standalone use)  
> ✅ `/` — **correct**

---

## Why These Values?

> **Why blank build command?**  
> There is no bundler, no npm install, no compile step. The HTML files are served as-is directly from the repository root.

> **Why `/` as root and output directory?**  
> The `index.html`, `app/`, `admin/`, `assets/`, `functions/`, `_redirects`, and `_headers` files all live at the repository root. Cloudflare needs to see the entire repo to deploy correctly.

---

## Do NOT change these (already in the repo)

The following files are already committed and Cloudflare picks them up automatically — **do not recreate them**:

- `_redirects` — handles all URL routing (login redirects, legacy /pages/ paths, admin paths)
- `_headers` — sets security headers (CSP, HSTS, X-Frame-Options, etc.)
- `functions/api/` — all API endpoints (auth, employees, payroll, etc.)
- `wrangler.jsonc` — Cloudflare project config (name, compatibility date, assets)

---

➡️ Next: [STEP-4-env-variables.md](./STEP-4-env-variables.md)
