# STEP 5 — Deploy & Verify

---

## 1. Trigger the First Deploy

After completing Steps 2–4 in the Cloudflare Pages setup wizard:

1. Click **Save and Deploy**
2. Cloudflare will start the deployment — you will see a live build log
3. Since there is **no build command**, the deploy should finish in **under 60 seconds**
4. When you see ✅ **Success**, your site is live

---

## 2. Your Live URLs

Once deployed, Cloudflare gives you a URL like:

```
https://myworkdeskapp.pages.dev
```

Or (if the name was taken):
```
https://myworkdeskapp-<hash>.pages.dev
```

---

## 3. UI Pages to Check

Open each URL below and verify it loads correctly:

### Regular User Portal
| Page              | URL                                                   |
|-------------------|-------------------------------------------------------|
| Login             | `https://myworkdeskapp.pages.dev/app/login.html`      |
| Dashboard         | `https://myworkdeskapp.pages.dev/app/dashboard.html`  |
| Employees         | `https://myworkdeskapp.pages.dev/app/employees.html`  |
| Attendance        | `https://myworkdeskapp.pages.dev/app/attendance.html` |
| Leave             | `https://myworkdeskapp.pages.dev/app/leave.html`      |
| Payroll           | `https://myworkdeskapp.pages.dev/app/payroll.html`    |
| Performance       | `https://myworkdeskapp.pages.dev/app/performance.html`|
| Projects          | `https://myworkdeskapp.pages.dev/app/projects.html`   |
| Tickets           | `https://myworkdeskapp.pages.dev/app/tickets.html`    |
| Documents         | `https://myworkdeskapp.pages.dev/app/documents.html`  |
| Messaging         | `https://myworkdeskapp.pages.dev/app/messaging.html`  |
| Timeline          | `https://myworkdeskapp.pages.dev/app/timeline.html`   |
| Analytics         | `https://myworkdeskapp.pages.dev/app/analytics.html`  |
| AI Assistant      | `https://myworkdeskapp.pages.dev/app/ai-assistant.html`|
| Knowledge Base    | `https://myworkdeskapp.pages.dev/app/knowledge.html`  |
| Engagement        | `https://myworkdeskapp.pages.dev/app/engagement.html` |
| Recruitment       | `https://myworkdeskapp.pages.dev/app/recruitment.html`|
| Integrations      | `https://myworkdeskapp.pages.dev/app/integrations.html`|
| Settings          | `https://myworkdeskapp.pages.dev/app/settings.html`   |

### Admin / Super-Admin Portal
| Page              | URL                                                     |
|-------------------|---------------------------------------------------------|
| Admin Login       | `https://myworkdeskapp.pages.dev/pages/sa-login.html`   |
| Admin Dashboard   | `https://myworkdeskapp.pages.dev/pages/sa-dashboard.html`|

### Root & Redirect Checks
| Check                         | Expected behavior                                   |
|-------------------------------|-----------------------------------------------------|
| `https://myworkdeskapp.pages.dev/` | Serves `index.html` (root landing page)        |
| `https://myworkdeskapp.pages.dev/login.html` | Redirects → `/app/login.html`     |
| `https://myworkdeskapp.pages.dev/admin` | Redirects → `/pages/sa-login.html`      |

---

## 4. Quick Login Test

**Regular login** (`/app/login.html`):
- Org ID: `DEMO`
- Employee ID: `EMP001`
- Password: whatever you set in `DEMO_PASSWORD` env var

**Admin login** (`/pages/sa-login.html`):
- Username: value of `SA_USERNAME`
- Secret Key: value of `SA_SECURITY_KEY`
- Password: value of `SA_PASSWORD`

---

## 5. Troubleshooting

| Symptom                         | Fix                                                                           |
|---------------------------------|-------------------------------------------------------------------------------|
| 404 on `/app/login.html`        | Check that Build output directory is `/` (not `dist` or `public`)             |
| 404 on everything / blank page  | Check that **Root directory** is `/` — not a file path like `/pages/sa-login.html` |
| API calls fail (401/500)        | Check env variables are saved — go to Settings → Environment variables        |
| Redirect not working            | Make sure `_redirects` file exists in repo root (it does — do not delete it)  |
| Login says "Invalid credentials"| Double-check `DEMO_PASSWORD` / `SA_PASSWORD` values in env vars               |
| CSP error in console            | Expected for external resources not on the allowlist — not a Pages issue      |
| Deploy fails with "not found"   | Root directory is wrong — it must be `/` (see [STEP-3](./STEP-3-build-settings.md)) |

---

➡️ Optional: [STEP-6-custom-domain.md](./STEP-6-custom-domain.md)
