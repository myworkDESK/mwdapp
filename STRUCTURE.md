# myWORKDESK — Project Structure

## Directory Layout

```
myworkdeskapp/
├── admin/              Super Admin portal (login + dashboard)
│   ├── index.html      Entry point — redirects to admin/login.html
│   ├── login.html      SA login (username + secret key + password)
│   ├── dashboard.html  SA dashboard & management panel
│   └── _headers        SA-specific security headers (noindex, no-cache)
│
├── app/                Regular user portal
│   ├── login.html      User login (org ID + employee ID + password)
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
├── workers/            Backend / Cloudflare Workers
│   ├── api-worker.js   Main API worker
│   ├── cron/           Scheduled jobs (payroll cron)
│   ├── queues/         Queue consumers
│   └── lib/            Shared utilities
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
├── wrangler.jsonc      Cloudflare Workers/Pages config
├── STRUCTURE.md        This file
├── FEATURES.md         Feature reference & API endpoints
├── DESIGN_SYSTEM.md    Design tokens, colors, typography
└── BRANDING.md         Brand guidelines
```

## URL Routes

| Path | Destination |
|------|-------------|
| `/` | → `/app/login.html` |
| `/app/login.html` | Regular user login |
| `/app/dashboard.html` | App dashboard (auth required) |
| `/admin/` | → `/admin/login.html` |
| `/admin/login.html` | Super Admin login |
| `/admin/dashboard.html` | SA dashboard (SA token required) |
| `/api/auth` | Regular auth endpoint |
| `/api/sa-auth` | SA auth endpoint |

## Authentication

### Regular User (`/app/`)
- Login: Org ID + Employee ID + Password
- Token: `workdesk_token` in localStorage
- API: `POST /api/auth`
- Session guard: checks `localStorage.getItem('workdesk_token')`

### Super Admin (`/admin/`)
- Login: Username + Secret Key + Password
- Token: `sa_token` in localStorage (base64 `username:sa:timestamp:uuid`)
- API: `POST /api/sa-auth`
- Session guard: checks `localStorage.getItem('sa_token')`
- Credentials set via env vars: `SA_USERNAME`, `SA_SECURITY_KEY`, `SA_PASSWORD`
