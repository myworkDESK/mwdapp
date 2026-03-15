-- ============================================================
--  WorkDesk — Initial Seed / Backup Data
--  Apply AFTER schema.sql with:
--    wrangler d1 execute workdesk-db --file=./seed.sql
--
--  Passwords are stored as HMAC-SHA256 hashes in production.
--  The values below are placeholder hashes — replace with real
--  hashed passwords before going live.
-- ============================================================

-- ── Organizations ─────────────────────────────────────────────
INSERT INTO organizations (id, name, industry, size, country, timezone, admin_email, admin_name, status, created_at)
VALUES
  (1, 'Acme Corporation',     'Technology',    '51–200 employees', 'Philippines', 'Asia/Manila',     'admin@acme.com',     'HR Admin',  'active', '2024-01-15 08:00:00'),
  (2, 'BrightPath Education', 'Education',     '1–50 employees',   'Philippines', 'Asia/Manila',     'admin@brightpath.ph','HR Admin',  'active', '2024-02-01 09:00:00'),
  (3, 'MediCare Health',      'Healthcare',    '201–500 employees','Philippines', 'Asia/Manila',     'admin@medicare.ph',  'HR Admin',  'active', '2024-03-10 10:00:00');

-- ── Users ──────────────────────────────────────────────────────
-- Passwords: these are placeholder hashes (replace before production)
INSERT INTO users (id, org_id, email, password_hash, display_name, role, department, position, status, created_at)
VALUES
  -- Platform Super Admin (no org affiliation)
  (1, 1, 'superadmin@workdesk.com', 'PLACEHOLDER_HASH', 'Super Admin',    'superadmin', NULL,          NULL,               'active', '2024-01-01 00:00:00'),
  -- Acme Corporation
  (2, 1, 'admin@acme.com',          'PLACEHOLDER_HASH', 'HR Admin',       'admin',      'HR',          'HR Manager',        'active', '2024-01-15 08:00:00'),
  (3, 1, 'jdoe@acme.com',           'PLACEHOLDER_HASH', 'John Doe',       'employee',   'Engineering', 'Software Engineer', 'active', '2024-01-15 08:30:00'),
  (4, 1, 'asmith@acme.com',         'PLACEHOLDER_HASH', 'Alice Smith',    'manager',    'Engineering', 'Engineering Lead',  'active', '2024-01-15 08:31:00'),
  (5, 1, 'bjohnson@acme.com',       'PLACEHOLDER_HASH', 'Bob Johnson',    'employee',   'Sales',       'Sales Associate',   'active', '2024-01-16 09:00:00'),
  -- BrightPath Education
  (6, 2, 'admin@brightpath.ph',     'PLACEHOLDER_HASH', 'HR Admin',       'admin',      'HR',          'HR Officer',        'active', '2024-02-01 09:00:00'),
  (7, 2, 'mreyes@brightpath.ph',    'PLACEHOLDER_HASH', 'Maria Reyes',    'employee',   'Academic',    'Instructor',        'active', '2024-02-02 08:00:00'),
  -- MediCare Health
  (8, 3, 'admin@medicare.ph',       'PLACEHOLDER_HASH', 'HR Admin',       'admin',      'HR',          'HR Director',       'active', '2024-03-10 10:00:00'),
  (9, 3, 'drcruz@medicare.ph',      'PLACEHOLDER_HASH', 'Dr. Ana Cruz',   'employee',   'Medical',     'Physician',         'active', '2024-03-11 08:00:00');

-- ── Employees ─────────────────────────────────────────────────
INSERT INTO employees (id, user_id, org_id, first_name, last_name, email, phone, department, position, start_date, status, created_at)
VALUES
  ('EMP-001', 3, 1, 'John',   'Doe',     'jdoe@acme.com',           '+63-912-000-0001', 'Engineering', 'Software Engineer', '2024-01-15', 'Active', '2024-01-15 08:30:00'),
  ('EMP-002', 4, 1, 'Alice',  'Smith',   'asmith@acme.com',         '+63-912-000-0002', 'Engineering', 'Engineering Lead',  '2024-01-15', 'Active', '2024-01-15 08:31:00'),
  ('EMP-003', 5, 1, 'Bob',    'Johnson', 'bjohnson@acme.com',       '+63-912-000-0003', 'Sales',       'Sales Associate',   '2024-01-16', 'Active', '2024-01-16 09:00:00'),
  ('EMP-004', 2, 1, 'HR',     'Admin',   'admin@acme.com',          '+63-912-000-0010', 'HR',          'HR Manager',        '2024-01-15', 'Active', '2024-01-15 08:00:00'),
  ('EMP-005', 7, 2, 'Maria',  'Reyes',   'mreyes@brightpath.ph',    '+63-912-000-0004', 'Academic',    'Instructor',        '2024-02-02', 'Active', '2024-02-02 08:00:00'),
  ('EMP-006', 9, 3, 'Ana',    'Cruz',    'drcruz@medicare.ph',      '+63-912-000-0005', 'Medical',     'Physician',         '2024-03-11', 'Active', '2024-03-11 08:00:00');

-- ── Attendance (sample records for Acme) ──────────────────────
INSERT INTO attendance (employee_id, org_id, date, clock_in, clock_out, hours, status, created_at)
VALUES
  ('EMP-001', 1, '2025-03-10', '08:01:00', '17:05:00', 9.07, 'Present', '2025-03-10 17:05:00'),
  ('EMP-001', 1, '2025-03-11', '08:10:00', '17:00:00', 8.83, 'Present', '2025-03-11 17:00:00'),
  ('EMP-001', 1, '2025-03-12', '08:45:00', '17:30:00', 8.75, 'Late',    '2025-03-12 17:30:00'),
  ('EMP-002', 1, '2025-03-10', '08:00:00', '17:00:00', 9.00, 'Present', '2025-03-10 17:00:00'),
  ('EMP-002', 1, '2025-03-11', '08:00:00', '17:00:00', 9.00, 'Present', '2025-03-11 17:00:00'),
  ('EMP-003', 1, '2025-03-10', '09:00:00', '18:00:00', 9.00, 'Present', '2025-03-10 18:00:00'),
  ('EMP-003', 1, '2025-03-11', NULL,         NULL,      NULL,  'Absent',  '2025-03-11 00:00:00');

-- ── Leave Requests ────────────────────────────────────────────
INSERT INTO leave_requests (employee_id, org_id, leave_type, start_date, end_date, days, reason, status, created_at)
VALUES
  ('EMP-001', 1, 'Vacation',  '2025-04-07', '2025-04-11', 5, 'Family trip',           'Approved', '2025-03-20 10:00:00'),
  ('EMP-002', 1, 'Sick',      '2025-03-15', '2025-03-16', 2, 'Fever and rest',        'Approved', '2025-03-15 07:00:00'),
  ('EMP-003', 1, 'Emergency', '2025-03-18', '2025-03-18', 1, 'Family emergency',      'Pending',  '2025-03-18 06:30:00'),
  ('EMP-005', 2, 'Vacation',  '2025-05-01', '2025-05-05', 5, 'Summer break',          'Pending',  '2025-04-01 09:00:00');

-- ── Payroll ───────────────────────────────────────────────────
INSERT INTO payroll (employee_id, org_id, period_start, period_end, basic_pay, overtime_pay, deductions, net_pay, status, created_at)
VALUES
  ('EMP-001', 1, '2025-02-01', '2025-02-15', 25000, 1500, 3000, 23500, 'Paid', '2025-02-18 10:00:00'),
  ('EMP-001', 1, '2025-02-16', '2025-02-28', 25000,  500, 3000, 22500, 'Paid', '2025-03-05 10:00:00'),
  ('EMP-001', 1, '2025-03-01', '2025-03-15', 25000,    0, 3000, 22000, 'Draft','2025-03-16 10:00:00'),
  ('EMP-002', 1, '2025-02-01', '2025-02-15', 35000, 2000, 4500, 32500, 'Paid', '2025-02-18 10:00:00'),
  ('EMP-002', 1, '2025-02-16', '2025-02-28', 35000,    0, 4500, 30500, 'Paid', '2025-03-05 10:00:00');

-- ── Tickets ───────────────────────────────────────────────────
INSERT INTO tickets (org_id, created_by, subject, description, category, priority, status, created_at)
VALUES
  (1, 3, 'Cannot access payroll module', 'Getting a 403 error when I open payroll.',        'Access',  'High',   'Open',        '2025-03-10 09:15:00'),
  (1, 3, 'Update emergency contact',     'Please update my emergency contact details.',      'HR',      'Normal', 'In Progress', '2025-03-11 10:00:00'),
  (1, 5, 'Laptop replacement request',   'My laptop fan is very loud and slowing me down.',  'IT',      'Normal', 'Open',        '2025-03-12 11:00:00'),
  (1, 4, 'Password reset',               'Need password reset for the HR portal.',           'Access',  'High',   'Resolved',    '2025-03-08 08:00:00');

-- ── Documents ────────────────────────────────────────────────
INSERT INTO documents (org_id, uploaded_by, title, category, is_public, created_at)
VALUES
  (1, 2, 'Employee Handbook 2025',      'Policy',   1, '2025-01-05 08:00:00'),
  (1, 2, 'Code of Conduct',             'Policy',   1, '2025-01-05 08:30:00'),
  (1, 2, 'Benefits Summary 2025',       'Policy',   1, '2025-01-10 09:00:00'),
  (1, 2, 'Standard NDA Template',       'Template', 1, '2025-01-10 09:30:00'),
  (1, 3, 'Employment Contract — JDoe',  'Contract', 0, '2024-01-15 08:30:00');

-- ── Timeline / Announcements ──────────────────────────────────
INSERT INTO timeline (org_id, author_id, type, title, body, pinned, created_at)
VALUES
  (1, 2, 'Announcement', 'Welcome to WorkDesk!',
    'We are thrilled to launch WorkDesk — your new all-in-one HRIS platform. '
    'Manage attendance, leave, payroll, and more in one place.',
    1, '2025-01-15 08:00:00'),
  (1, 2, 'Event', 'Q1 2025 Town Hall — March 28',
    'Join us for the Q1 Town Hall on March 28, 2025 at 2:00 PM (Asia/Manila) via Zoom. '
    'Agenda: company updates, recognition awards, and Q&A.',
    0, '2025-03-10 09:00:00'),
  (1, 2, 'Update', 'Updated Leave Policy — Effective April 1',
    'Our leave policy has been updated. Please read the new policy document in the Documents section.',
    0, '2025-03-15 10:00:00');

-- ── Knowledge Base ────────────────────────────────────────────
INSERT INTO knowledge_articles (org_id, author_id, title, category, body, tags, is_published, created_at)
VALUES
  (1, 2, 'How to apply for leave',
    'Leave Management',
    'Go to Leave Management → click "Apply for Leave" → fill in the dates and reason → submit. '
    'Your manager will receive a notification to approve or reject the request.',
    'leave,how-to', 1, '2025-01-20 09:00:00'),
  (1, 2, 'How to clock in and out',
    'Attendance',
    'Navigate to Attendance → click "Clock In" to record your arrival. Click "Clock Out" before you leave. '
    'Your daily hours are calculated automatically.',
    'attendance,how-to', 1, '2025-01-20 09:15:00'),
  (1, 2, 'Password reset procedure',
    'IT & Access',
    'If you forget your password, click "Forgot Password" on the login page and enter your email. '
    'Your HR team will reset it and email you the temporary credentials.',
    'password,access', 1, '2025-01-20 09:30:00');
