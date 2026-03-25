# WorkDesk — Admin Worker Deployment Guide

## Prerequisites

- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account with Workers, D1, R2, and KV enabled (all free tier)
- D1 database already created and migrations applied

## Quick Start

```bash
# 1. Clone & navigate
cd workers/admin

# 2. Copy dev vars
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your values

# 3. Fill in wrangler.toml (uncomment D1, R2, KV sections and add IDs)
#    wrangler d1 list         — get your D1 database_id
#    wrangler kv namespace list — get your KV namespace id
#    wrangler r2 bucket list   — confirm workdesk-audit exists

# 4. Local dev
wrangler dev src/index.js

# 5. Production deploy
wrangler deploy

# 6. Set secrets (see README.md § Step 4)
```

## File Structure

```
workers/admin/
├── wrangler.toml           # Worker config (fill in IDs)
├── .dev.vars.example       # Copy → .dev.vars for local dev
├── package.json
├── lib/
│   ├── audit.js            # Tamper-evident audit helper (D1 + R2)
│   ├── idempotency.js      # Idempotency key store (D1)
│   ├── jwt.js              # JWT verification + elevation tokens
│   ├── notifications.js    # Slack/email webhooks
│   └── scoring.js          # Risk scoring engine
├── src/
│   ├── index.js            # Main router + auth middleware
│   └── routes/
│       ├── admin-actions.js # CRUD + approve/reject
│       ├── security.js      # Incident reporting
│       ├── shared.js        # json() helper
│       └── users.js         # Disable/enable users
└── tests/
    ├── audit.test.js        # SHA-256 chain tests
    └── scoring.test.js      # Risk scoring tests
```
