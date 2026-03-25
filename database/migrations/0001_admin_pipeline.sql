-- ============================================================
-- Migration 0001: Admin-Actions & Security Incident Pipeline
-- Apply with:
--   wrangler d1 execute workdesk-db --file=database/migrations/0001_admin_pipeline.sql
-- ============================================================

-- ── users: add disabled / quarantine state ────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS quarantined INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_by TEXT;

-- ── admin_actions ─────────────────────────────────────────────────────────────
-- Represents a pending or completed privileged action (disable, quarantine, etc.)
CREATE TABLE IF NOT EXISTS admin_actions (
  id               TEXT PRIMARY KEY,
  action_type      TEXT NOT NULL,           -- disable_user | quarantine_user | notify_user | log_only
  target_user_id   TEXT NOT NULL,
  requested_by     TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
                                            -- pending | approved | rejected | executing | completed | failed | dlq
  risk_score       REAL,
  decision         TEXT,                    -- auto_disable | quarantine | notify | log
  reason           TEXT,
  idempotency_key  TEXT UNIQUE,
  attempts         INTEGER NOT NULL DEFAULT 0,
  max_attempts     INTEGER NOT NULL DEFAULT 3,
  elevation_token  TEXT,
  elevation_exp    TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_status   ON admin_actions(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target   ON admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_idem     ON admin_actions(idempotency_key);

-- ── approvals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  id              TEXT PRIMARY KEY,
  action_id       TEXT NOT NULL REFERENCES admin_actions(id),
  reviewer        TEXT NOT NULL,
  decision        TEXT NOT NULL,            -- approved | rejected
  notes           TEXT,
  elevation_token TEXT,
  decided_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_approvals_action ON approvals(action_id);

-- ── audit_log ─────────────────────────────────────────────────────────────────
-- Tamper-evident: each row stores SHA-256(prev_hash || payload) in `hash`.
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  event_type  TEXT NOT NULL,
  actor       TEXT,
  target      TEXT,
  payload     TEXT NOT NULL,                -- JSON string
  prev_hash   TEXT NOT NULL DEFAULT '',
  hash        TEXT NOT NULL,                -- SHA-256(prev_hash || payload)
  r2_key      TEXT,                         -- optional R2 backup path
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ── security_incidents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security_incidents (
  id              TEXT PRIMARY KEY,
  incident_type   TEXT NOT NULL,
  severity        TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  source_ip       TEXT,
  user_id         TEXT,
  detection_events TEXT NOT NULL,           -- JSON array of detection events
  risk_score      REAL NOT NULL DEFAULT 0,
  decision        TEXT NOT NULL,            -- auto_disable | quarantine | notify | log
  admin_action_id TEXT,
  status          TEXT NOT NULL DEFAULT 'open',   -- open | investigating | resolved | closed
  resolved_at     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incidents_status   ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_user     ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON security_incidents(severity);

-- ── idempotency_store ─────────────────────────────────────────────────────────
-- Persists idempotency keys + responses for destructive actions.
CREATE TABLE IF NOT EXISTS idempotency_store (
  idempotency_key TEXT PRIMARY KEY,
  method          TEXT NOT NULL,
  path            TEXT NOT NULL,
  status_code     INTEGER NOT NULL,
  response_body   TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idem_expires ON idempotency_store(expires_at);
