-- ============================================================
--  WorkDesk — Cloudflare D1 Database Schema
--  Apply with:
--    wrangler d1 execute workdesk-db --file=./schema.sql
-- ============================================================

-- ── Organizations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  industry     TEXT,
  size         TEXT,
  country      TEXT,
  timezone     TEXT    NOT NULL DEFAULT 'UTC',
  admin_email  TEXT    NOT NULL,
  admin_name   TEXT,
  status       TEXT    NOT NULL DEFAULT 'active',  -- 'active' | 'inactive'
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT    NOT NULL UNIQUE,
  password_hash   TEXT    NOT NULL,
  display_name    TEXT    NOT NULL,
  role            TEXT    NOT NULL DEFAULT 'employee',
  -- role values: 'superadmin' | 'admin' | 'manager' | 'supervisor' | 'employee'
  department      TEXT,
  position        TEXT,
  avatar_url      TEXT,
  status          TEXT    NOT NULL DEFAULT 'active',  -- 'active' | 'inactive'
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT
);

-- ── Employees (HR profile linked to user) ─────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id           TEXT    PRIMARY KEY,                 -- e.g. "EMP-001"
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name   TEXT    NOT NULL,
  last_name    TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  phone        TEXT,
  department   TEXT    NOT NULL DEFAULT 'General',
  position     TEXT,
  start_date   TEXT,
  status       TEXT    NOT NULL DEFAULT 'Active',   -- 'Active' | 'Inactive' | 'On Leave'
  avatar_url   TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

-- ── Attendance ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  TEXT    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL,                    -- YYYY-MM-DD
  clock_in     TEXT,                                -- HH:MM:SS
  clock_out    TEXT,
  hours        REAL,
  status       TEXT    NOT NULL DEFAULT 'Present',  -- 'Present' | 'Late' | 'Absent' | 'Half-day'
  note         TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Leave Requests ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id  TEXT    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leave_type   TEXT    NOT NULL,                    -- 'Vacation' | 'Sick' | 'Emergency' | etc.
  start_date   TEXT    NOT NULL,
  end_date     TEXT    NOT NULL,
  days         REAL    NOT NULL DEFAULT 1,
  reason       TEXT,
  status       TEXT    NOT NULL DEFAULT 'Pending',  -- 'Pending' | 'Approved' | 'Rejected'
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Payroll ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payroll (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id     TEXT    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start    TEXT    NOT NULL,
  period_end      TEXT    NOT NULL,
  basic_pay       REAL    NOT NULL DEFAULT 0,
  overtime_pay    REAL    NOT NULL DEFAULT 0,
  deductions      REAL    NOT NULL DEFAULT 0,
  net_pay         REAL    NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'Draft', -- 'Draft' | 'Processing' | 'Paid'
  paid_at         TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Performance Reviews ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id   TEXT    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  org_id        INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewer_id   INTEGER REFERENCES users(id),
  review_period TEXT    NOT NULL,
  score         REAL,
  goals_met     INTEGER,                            -- 0 or 1 (boolean)
  notes         TEXT,
  status        TEXT    NOT NULL DEFAULT 'Pending', -- 'Pending' | 'Completed'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Recruitment / Job Postings ────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  department   TEXT,
  location     TEXT,
  type         TEXT    DEFAULT 'Full-time',         -- 'Full-time' | 'Part-time' | 'Contract'
  description  TEXT,
  requirements TEXT,
  status       TEXT    NOT NULL DEFAULT 'Open',     -- 'Open' | 'Closed' | 'Draft'
  posted_by    INTEGER REFERENCES users(id),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

CREATE TABLE IF NOT EXISTS job_applications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id       INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  phone        TEXT,
  resume_url   TEXT,
  stage        TEXT    NOT NULL DEFAULT 'Applied',  -- 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'
  notes        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Tickets (Help Desk) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by   INTEGER REFERENCES users(id),
  assigned_to  INTEGER REFERENCES users(id),
  subject      TEXT    NOT NULL,
  description  TEXT,
  category     TEXT,
  priority     TEXT    NOT NULL DEFAULT 'Normal',   -- 'Low' | 'Normal' | 'High' | 'Urgent'
  status       TEXT    NOT NULL DEFAULT 'Open',     -- 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT,
  resolved_at  TEXT
);

-- ── Documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by  INTEGER REFERENCES users(id),
  title        TEXT    NOT NULL,
  category     TEXT,                                -- 'Policy' | 'Contract' | 'Template' | etc.
  file_url     TEXT,
  file_type    TEXT,
  file_size    INTEGER,
  is_public    INTEGER NOT NULL DEFAULT 0,          -- 0 = private, 1 = public to org
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id    INTEGER NOT NULL REFERENCES users(id),
  recipient_id INTEGER REFERENCES users(id),        -- NULL = channel message
  channel      TEXT,                                -- NULL = direct message
  body         TEXT    NOT NULL,
  attachment_url TEXT,
  is_read      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Timeline / Announcements ──────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id    INTEGER REFERENCES users(id),
  type         TEXT    NOT NULL DEFAULT 'Announcement', -- 'Announcement' | 'Event' | 'Update'
  title        TEXT    NOT NULL,
  body         TEXT,
  pinned       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timeline_reactions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id      INTEGER NOT NULL REFERENCES timeline(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  emoji        TEXT    NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (post_id, user_id, emoji)
);

-- ── Engagement Surveys ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surveys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by   INTEGER REFERENCES users(id),
  title        TEXT    NOT NULL,
  description  TEXT,
  status       TEXT    NOT NULL DEFAULT 'Draft',    -- 'Draft' | 'Active' | 'Closed'
  closes_at    TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_id    INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id      INTEGER REFERENCES users(id),
  score        INTEGER,                             -- e.g. 1–10 NPS score
  comments     TEXT,
  submitted_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Knowledge Base ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  author_id    INTEGER REFERENCES users(id),
  title        TEXT    NOT NULL,
  category     TEXT,
  body         TEXT,
  tags         TEXT,                                -- comma-separated
  is_published INTEGER NOT NULL DEFAULT 1,
  views        INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT
);

-- ── Integrations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider     TEXT    NOT NULL,                    -- 'Slack' | 'Zoom' | 'Xero' | etc.
  status       TEXT    NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive'
  config       TEXT,                                -- JSON blob of provider-specific settings
  connected_by INTEGER REFERENCES users(id),
  connected_at TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  type         TEXT    NOT NULL,                    -- 'leave' | 'ticket' | 'message' | etc.
  title        TEXT    NOT NULL,
  body         TEXT,
  is_read      INTEGER NOT NULL DEFAULT 0,
  link         TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id       INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT    NOT NULL,                    -- e.g. 'create_employee'
  entity_type  TEXT,                                -- e.g. 'employee'
  entity_id    TEXT,                                -- e.g. 'EMP-001'
  detail       TEXT,                                -- JSON blob with before/after values
  ip_address   TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_org        ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_org    ON employees(org_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp   ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp        ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_emp      ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org      ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_org     ON messages(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_org     ON timeline(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_u  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_org        ON audit_log(org_id, created_at);
