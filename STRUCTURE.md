# myWORKDESK — Project Structure

## Directory Layout

```
myworkdeskapp/
├── admin/              Super Admin aliases (entry point + headers)
│   ├── index.html      Entry point — redirects to /app/login.html
│   └── _headers        SA-specific security headers (noindex, no-cache)
│
├── admin-ui/           Security Admin dashboard (Cloudflare Pages, Access-protected)
│   └── index.html      Incidents, pending actions, and disabled-users UI (calls workdesk-admin Worker)
│
├── app/                Unified user portal
│   ├── login.html      Unified login (Super Admin, Admin, Employee)
│   ├── dashboard.html  Main dashboard
│   ├── employees.html  Employee management
│   ├── attendance.html Attendance & time tracking
│   ├── leave.html      Leave management
│   ├── payroll.html    Payroll & ledger
│   ├── performance.html  Performance reviews
│   ├── recruitment.html  Recruitment pipeline
│   ├── tickets.html    Help desk tickets
│   ├── documents.html  Document management
│   ├── projects.html   Project management
│   ├── messaging.html  Internal messaging
│   ├── timeline.html   Activity timeline
│   ├── engagement.html Employee engagement
│   ├── analytics.html  Analytics & reports
│   ├── ai-assistant.html  AI assistant
│   ├── knowledge.html  Knowledge base
│   ├── integrations.html  Third-party integrations
│   └── settings.html   Settings & configuration
│
├── pages/              App pages + SA dashboard
│   ├── login.html      Regular user login (redirects to /app/login.html)
│   ├── sa-dashboard.html SA dashboard & management panel
│   └── ...             Other pages (redirect to /app/ equivalents)
│
├── workers/            Backend / Cloudflare Workers
│   ├── api-worker.js   Standalone API gateway worker (Pages deployments use functions/api/ instead)
│   ├── lib/            Shared Worker utilities
│   ├── admin/          Admin-actions & security incident Worker (workdesk-admin)
│   │   ├── src/        Route handlers (admin-actions, security, users)
│   │   ├── lib/        audit, idempotency, jwt, notifications, scoring helpers
│   │   ├── tests/      Unit tests (audit, scoring)
│   │   └── wrangler.toml
│   ├── cron/           Scheduled cron Workers
│   │   ├── audit-verifier.js            Nightly chain verifier (00:15 UTC)
│   │   ├── action-processor.js          Action retry/DLQ processor (every 5 min)
│   │   ├── payroll.js                   Monthly payroll queue trigger (1st of month, 00:00 UTC)
│   │   ├── wrangler.audit-verifier.toml
│   │   ├── wrangler.action-processor.toml
│   │   └── wrangler.payroll.toml
│   └── queues/         Queue consumer Worker (workdesk-queue-consumer)
│       ├── job-consumer.js
│       └── wrangler.toml
│
├── functions/          Cloudflare Pages Functions (serverless API)
│   └── api/
│       ├── _shared.js      Shared CORS + helpers
│       ├── auth.js         POST/GET /api/auth
│       ├── sa-auth.js      POST/GET /api/sa-auth (SA only)
│       ├── sa-org-admins.js GET/POST/PUT/DELETE /api/sa-org-admins
│       ├── sa-config-check.js GET /api/sa-config-check
│       ├── employees.js    /api/employees
│       ├── attendance.js   /api/attendance
│       ├── leave.js        /api/leave
│       ├── payroll.js      /api/payroll
│       ├── performance.js  /api/performance
│       ├── recruitment.js  /api/recruitment
│       ├── tickets.js      /api/tickets
│       ├── documents.js    /api/documents
│       ├── messages.js     /api/messages
│       ├── notifications.js /api/notifications
│       ├── analytics.js    /api/analytics
│       ├── timeline.js     /api/timeline
│       ├── engagement.js   /api/engagement
│       ├── knowledge.js    /api/knowledge
│       ├── integrations.js /api/integrations
│       ├── aux.js          /api/aux
│       ├── ai.js           /api/ai
│       └── reports.js      /api/reports
│
├── assets/             Shared static assets
│   ├── css/styles.css  Global stylesheet + design tokens
│   ├── js/             Shared JavaScript modules
│   └── images/         Images & SVGs
│
├── middleware/         Shared JavaScript middleware
│   └── auth.js         logout() + mobile sidebar init
│
├── database/
│   └── schema.sql      D1 database schema
│
├── index.html          Root entry — redirects to /app/login.html
├── _redirects          URL routing & backward-compat redirects
├── _headers            Global security headers
├── wrangler.jsonc      Cloudflare Pages config (project: myworkdeskapp)
├── STRUCTURE.md        This file
├── FEATURES.md         Feature reference & API endpoints
├── DESIGN_SYSTEM.md    Design tokens, colors, typography
└── BRANDING.md         Brand guidelines
```

## URL Routes

| Path | Destination |
|------|-------------|
| `/` | → `/app/login.html` |
| `/app/login.html` | Unified login (Super Admin/Admin/Employee) |
| `/app/dashboard.html` | App dashboard (auth required) |
| `/pages/sa-login.html` | → `/app/login.html` |
| `/pages/sa-dashboard.html` | SA dashboard (SA token required) |
| `/admin/` | → `/app/login.html` |
| `/admin/login.html` | → `/app/login.html` |
| `/admin/dashboard.html` | → `/pages/sa-dashboard.html` |
| `/api/auth` | Regular auth endpoint |
| `/api/sa-auth` | SA auth endpoint |

## Authentication

### Unified Login (`/app/login.html`)
- Roles: Super Admin (CEO), Admin, Employee
- Super Admin Login: Username + Employee ID (role inference) + Passkey (`/api/sa-auth`)
- Admin/Employee Login: Org ID + Employee ID + Password (`/api/auth`)
- Token: `workdesk_token` in localStorage
- API: `POST /api/auth`
- Session guard: checks `localStorage.getItem('workdesk_token')`

### Super Admin (`/pages/sa-dashboard.html`)
- Login entry: `/app/login.html` (role = Super Admin)
- Token: `sa_token` in localStorage (base64 `username:sa:timestamp:uuid`)
- API: `POST /api/sa-auth`
- Session guard: checks `localStorage.getItem('sa_token')`
- Credentials set via env vars: `SA_USERNAME`, `SA_SECURITY_KEY` (+ optional `SA_EMPLOYEE_ID`, legacy `SA_PASSWORD`)
