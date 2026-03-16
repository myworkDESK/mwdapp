# WorkDesk — Features, Purpose & Developer Guide

> **This document is the authoritative reference for all features, their purposes, backend API
> endpoints, button behaviours, and best practices.**
>
> **Before making any change, read this file.**
> If a change is not listed as a task or explicitly requested, do NOT make it.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Page Inventory](#2-page-inventory)
3. [Feature Reference](#3-feature-reference)
4. [Backend API Reference](#4-backend-api-reference)
5. [Button & Navigation Map](#5-button--navigation-map)
6. [Authentication Flow](#6-authentication-flow)
7. [Database Schema (D1)](#7-database-schema-d1)
8. [Cloudflare Queue Integration](#8-cloudflare-queue-integration)
9. [Deployment Commands](#9-deployment-commands)
10. [Best Practices & Rules](#10-best-practices--rules)
11. [What NOT to Change](#11-what-not-to-change)

---

## 1. Product Overview

**WorkDesk** is a zero-build, static HRIS (Human Resource Information System) deployed on
**Cloudflare Pages** with **Cloudflare Pages Functions** as the backend API layer.

| Property        | Value                                   |
|-----------------|-----------------------------------------|
| Hosting         | Cloudflare Pages                        |
| Backend         | Cloudflare Pages Functions (`/functions/api/*.js`) |
| Database        | Cloudflare D1 (SQLite on the edge)      |
| Session store   | Cloudflare KV (`SESSIONS` namespace)    |
| File storage    | Cloudflare R2 (`ATTACHMENTS` bucket)    |
| AI inference    | Cloudflare Workers AI (`env.AI`)        |
| Background jobs | Cloudflare Queues (`WORKDESK_QUEUE`)    |
| Build step      | **None** — zero-build static site       |
| CSS framework   | Custom (CSS variables in `assets/css/styles.css`) |
| JS framework    | **None** — plain ES6 IIFE modules       |
| Font            | Inter (Google Fonts CDN only)           |

---

## 2. Page Inventory

| File                          | Title              | Purpose                                     | Backend API(s)                        |
|-------------------------------|--------------------|---------------------------------------------|---------------------------------------|
| `index.html`                  | Redirect           | Redirects to `login.html`                   | —                                     |
| `login.html`                  | Sign In            | Authentication entry point                  | `POST /api/auth`                      |
| `dashboard.html`              | Dashboard          | Overview KPIs, announcements, quick actions | `GET /api/auth` (session verify)      |
| `employees.html`              | Employees          | Employee directory, add/edit/delete         | `/api/employees`                      |
| `attendance.html`             | Attendance         | Clock in/out, daily log, manual entry       | `/api/attendance`                     |
| `leave.html`                  | Leave Management   | File / approve / reject leave requests      | `/api/leave`                          |
| `payroll.html`                | Payroll            | Payroll ledger, run payroll                 | `/api/payroll`                        |
| `performance.html`            | Performance        | Reviews, goals, KPI tracking                | `/api/performance`                    |
| `recruitment.html`            | Recruitment        | Job postings, applicant pipeline            | `/api/recruitment`                    |
| `tickets.html`                | Support Tickets    | Internal IT/HR help-desk tickets            | `/api/tickets`                        |
| `documents.html`              | Documents          | Policy docs, contracts, file storage        | `/api/documents`                      |
| `projects.html`               | DeskProjects       | Team projects and milestones (planned)      | —                                     |
| `messaging.html`              | Messaging          | Direct and group chat                       | `/api/messages`                       |
| `timeline.html`               | Timeline           | Company-wide announcements feed             | `/api/timeline`                       |
| `engagement.html`             | Engagement         | Pulse surveys, satisfaction scores          | `/api/engagement`                     |
| `analytics.html`              | Analytics          | HR metrics, charts, export reports          | `/api/analytics`, `/api/reports`      |
| `ai-assistant.html`           | AI Assistant       | AI-powered HR Q&A chat interface            | `/api/ai`                             |
| `knowledge.html`              | Knowledge Base     | Internal wiki / HR policy articles          | `/api/knowledge`                      |
| `integrations.html`           | Integrations       | Connect Slack, Zoom, Xero, etc.             | `/api/integrations`                   |
| `settings.html`               | Settings           | Profile, notifications, org config          | `/api/notifications`, `POST /api/auth`|
| `super-admin/sa-portal.html`  | SA Login           | Super Admin sign-in                         | `POST /api/sa-auth`                   |
| `super-admin/sa-dashboard.html`| SA Dashboard      | Manage organizations and org admins         | `/api/sa-org-admins`                  |

---

## 3. Feature Reference

### 3.1 Authentication (`login.html`)
- **Purpose**: Verify employee identity and establish a session.
- **Inputs**: Email address, password.
- **On success**: Stores `workdesk_token` and `workdesk_display_name` in `localStorage`;
  redirects to `dashboard.html`.
- **Production path**: Replace demo check in `functions/api/auth.js` with D1 `users` table lookup
  and issue a signed JWT. For staging/testing access, set `DEMO_ORG_ID`, `DEMO_EMPLOYEE_ID`,
  and `DEMO_PASSWORD` as Cloudflare Pages environment variables (never commit these values to
  source control).

### 3.2 Dashboard (`dashboard.html`)
- **Purpose**: Landing page after login. Shows KPI stat cards, attendance summary,
  recent tickets, announcements, and quick-action shortcuts.
- **Stat cards**: Headcount, Today Present, On Leave, Open Tickets — populated from
  `localStorage` fallback values (connect D1 for live data).
- **Quick Actions**: 8 shortcut tiles → navigate to the respective page (see §5).
- **Post Announcement**: Prompts for text and appends to the announcements card.

### 3.3 Employees (`employees.html`)
- **Purpose**: Full CRUD employee directory.
- **Features**: Search, filter by department/status, add employee modal, inline edit/delete.
- **Data**: Falls back to `localStorage` when D1 is not connected.
- **API**: `GET /api/employees` (list), `POST` (create), `PUT` (update), `DELETE?id=` (remove).

### 3.4 Attendance (`attendance.html`)
- **Purpose**: Track employee attendance with clock-in/out and manual entry.
- **Features**: Live clock, clock-in/out buttons, attendance log table, manual entry modal.
- **API**: `POST /api/attendance/clock-in`, `POST /api/attendance/clock-out`,
  `GET /api/attendance?date=`, `POST /api/attendance` (manual).

### 3.5 Leave Management (`leave.html`)
- **Purpose**: File, review, and manage leave requests.
- **Features**: Leave request table, approve/reject buttons, file-leave modal.
- **API**: `GET /api/leave`, `POST /api/leave`, `POST /api/leave/approve`,
  `POST /api/leave/reject`.

### 3.6 Payroll (`payroll.html`)
- **Purpose**: View payroll ledger and initiate payroll runs.
- **Features**: Period selector, payroll table, "Run Payroll" action.
- **API**: `GET /api/payroll?period=`, `POST /api/payroll/run`.

### 3.7 Performance (`performance.html`)
- **Purpose**: Track employee performance reviews, goals, and KPI scores.
- **API**: `GET /api/performance?empId=&period=`, `POST /api/performance` (create review),
  `PUT /api/performance` (update).

### 3.8 Recruitment (`recruitment.html`)
- **Purpose**: Manage open job postings and applicant pipeline.
- **API**: `GET /api/recruitment?type=postings`, `GET /api/recruitment?type=applicants`,
  `POST /api/recruitment` (new posting), `PUT` (update), `DELETE?id=` (archive).

### 3.9 Support Tickets (`tickets.html`)
- **Purpose**: Internal help-desk for IT and HR requests.
- **Features**: Ticket list, status filters, create ticket, resolve/close actions.
- **API**: `GET /api/tickets?status=&priority=`, `POST /api/tickets` (create),
  `PUT /api/tickets` (update status), `DELETE?id=` (delete).

### 3.10 Documents (`documents.html`)
- **Purpose**: Central repository for company policies, contracts, and employee files.
- **Features**: Category tabs, search, upload, download, delete.
- **File storage**: Cloudflare R2 (`ATTACHMENTS` binding) for binary files.
- **API**: `GET /api/documents?category=&search=`, `POST /api/documents` (create metadata record),
  `DELETE?id=` (delete record + R2 object).

### 3.11 DeskProjects (`projects.html`)
- **Purpose**: Team project management — task boards, milestones (planned).
- **Status**: Placeholder "coming soon" page. No backend required until feature is built.
- **Do not add backend API for this page until the UI is built out.**

### 3.12 Messaging (`messaging.html`)
- **Purpose**: Direct and group messaging between employees.
- **Features**: Thread list, message bubbles, pin messages, archive, attachments, emoji.
- **Data**: Currently demo data in `assets/js/messaging.js` — connect `/api/messages` for persistence.
- **API**: `GET /api/messages?thread=`, `POST /api/messages` (send), `DELETE?id=` (delete).

### 3.13 Timeline (`timeline.html`)
- **Purpose**: Company-wide announcement feed. Leaders post; all employees can react and comment.
- **Features**: Role-based compose bar (leaders only), reactions, comments.
- **API**: `GET /api/timeline?page=`, `POST /api/timeline` (create post),
  `POST /api/timeline/react`, `POST /api/timeline/comments`, `DELETE?id=`.

### 3.14 Engagement (`engagement.html`)
- **Purpose**: Run pulse surveys and track employee satisfaction scores.
- **API**: `GET /api/engagement?surveyId=`, `POST /api/engagement` (submit response),
  `POST /api/engagement/survey` (create survey).

### 3.15 Analytics (`analytics.html`)
- **Purpose**: HR dashboard with charts for headcount, attendance, turnover, payroll cost.
- **Features**: Chart cards, export CSV/PDF button, date range filters.
- **API**: `GET /api/analytics?report=summary|headcount|attendance|turnover|payroll`.

### 3.16 AI Assistant (`ai-assistant.html`)
- **Purpose**: Conversational AI for HR policy Q&A, employee queries, and data lookups.
- **Backend options**: Cloudflare Workers AI (`env.AI`) or external LLM via secret API key.
- **API**: `POST /api/ai` (send prompt), `GET /api/ai/history` (conversation history).

### 3.17 Knowledge Base (`knowledge.html`)
- **Purpose**: Internal HR wiki — policies, procedures, FAQs, onboarding guides.
- **API**: `GET /api/knowledge?category=&search=`, `POST /api/knowledge` (create article),
  `PUT` (update), `DELETE?id=` (delete).

### 3.18 Integrations (`integrations.html`)
- **Purpose**: Connect third-party tools (Slack, Zoom, Google Workspace, Xero, etc.).
- **Supported types**: `slack`, `google_workspace`, `zoom`, `github`, `jira`, `xero`,
  `quickbooks`, `zapier`, `webhook`.
- **API**: `GET /api/integrations`, `POST /api/integrations` (enable),
  `PUT` (update config), `DELETE?id=` (disable).

### 3.19 Settings (`settings.html`)
- **Purpose**: User profile, password change, notification preferences, org config.
- **Sections**: Profile, Platform Settings, Organization, Admins.
- **No dedicated backend API** — uses `/api/auth` for session; profile updates should target
  `/api/employees` (update own record) in production.

### 3.20 Notifications (`/api/notifications`)
- **Purpose**: In-app notification delivery for leave approvals, payroll events, mentions, and alerts.
- **Delivery**: When a notification is created via `POST /api/notifications`, the event is also
  published to `WORKDESK_QUEUE` (if configured) so the queue consumer can persist it to D1.
- **API**: `GET /api/notifications` (list for current user), `POST` (create),
  `PATCH?id=N-X` (mark read), `DELETE?id=N-X` (delete).

### 3.21 Reports (`/api/reports`)
- **Purpose**: Generate and export HR reports across all modules for a selected date range.
- **Report types**: `hr_summary`, `attendance`, `payroll`, `leave`, `performance`,
  `recruitment`, `platform_usage`, `engagement`, `tickets`.
- **Formats**: `json`, `csv`, `xlsx`.
- **Queue integration**: `POST /api/reports` queues report generation via `WORKDESK_QUEUE`; the
  consumer (`queue-consumer/index.js`) aggregates D1 data, serializes the output, and uploads
  the file to R2.
- **API**: `GET /api/reports` (list recent), `POST /api/reports` (generate new).

### 3.22 Super Admin (`/super-admin/`)
- **Purpose**: Platform-level administration — create, modify, and deactivate organizations;
  assign Org Admins.
- **Pages**: `super-admin/sa-portal.html` (login), `super-admin/sa-dashboard.html` (management).
- **Auth**: SA tokens contain `:sa:` in the base64-decoded payload; all SA endpoints verify this.
- **API**: `POST /api/sa-auth` (SA login), `GET/POST/PUT/DELETE /api/sa-org-admins` (Org Admin CRUD).

---

## 4. Backend API Reference

All endpoints live under `/api/*` and are implemented as Cloudflare Pages Functions
in `/functions/api/*.js`. All responses use `Content-Type: application/json`.

| Method | Endpoint                     | Function File                      | Purpose                          |
|--------|------------------------------|------------------------------------|----------------------------------|
| POST   | `/api/auth`                  | `functions/api/auth.js`            | Sign in                          |
| GET    | `/api/auth`                  | `functions/api/auth.js`            | Verify session token             |
| GET    | `/api/employees`             | `functions/api/employees.js`       | List employees                   |
| POST   | `/api/employees`             | `functions/api/employees.js`       | Create employee                  |
| PUT    | `/api/employees`             | `functions/api/employees.js`       | Update employee                  |
| DELETE | `/api/employees?id=`         | `functions/api/employees.js`       | Delete employee                  |
| GET    | `/api/attendance`            | `functions/api/attendance.js`      | List attendance log              |
| POST   | `/api/attendance`            | `functions/api/attendance.js`      | Manual attendance entry          |
| POST   | `/api/attendance/clock-in`   | `functions/api/attendance.js`      | Clock in                         |
| POST   | `/api/attendance/clock-out`  | `functions/api/attendance.js`      | Clock out                        |
| GET    | `/api/leave`                 | `functions/api/leave.js`           | List leave requests              |
| POST   | `/api/leave`                 | `functions/api/leave.js`           | File leave request               |
| POST   | `/api/leave/approve`         | `functions/api/leave.js`           | Approve leave request            |
| POST   | `/api/leave/reject`          | `functions/api/leave.js`           | Reject leave request             |
| GET    | `/api/payroll`               | `functions/api/payroll.js`         | List payroll ledger              |
| POST   | `/api/payroll/run`           | `functions/api/payroll.js`         | Run payroll for period           |
| GET    | `/api/performance`           | `functions/api/performance.js`     | List performance reviews         |
| POST   | `/api/performance`           | `functions/api/performance.js`     | Create performance review        |
| PUT    | `/api/performance`           | `functions/api/performance.js`     | Update review                    |
| GET    | `/api/recruitment`           | `functions/api/recruitment.js`     | List postings / applicants       |
| POST   | `/api/recruitment`           | `functions/api/recruitment.js`     | Create job posting               |
| PUT    | `/api/recruitment`           | `functions/api/recruitment.js`     | Update posting / applicant       |
| DELETE | `/api/recruitment?id=`       | `functions/api/recruitment.js`     | Archive posting                  |
| GET    | `/api/tickets`               | `functions/api/tickets.js`         | List tickets                     |
| POST   | `/api/tickets`               | `functions/api/tickets.js`         | Create ticket                    |
| PUT    | `/api/tickets`               | `functions/api/tickets.js`         | Update ticket status             |
| DELETE | `/api/tickets?id=`           | `functions/api/tickets.js`         | Delete ticket                    |
| GET    | `/api/documents`             | `functions/api/documents.js`       | List documents                   |
| POST   | `/api/documents`             | `functions/api/documents.js`       | Create document record           |
| PUT    | `/api/documents`             | `functions/api/documents.js`       | Update document metadata         |
| DELETE | `/api/documents?id=`         | `functions/api/documents.js`       | Delete document                  |
| GET    | `/api/messages`              | `functions/api/messages.js`        | List message threads             |
| POST   | `/api/messages`              | `functions/api/messages.js`        | Send message                     |
| DELETE | `/api/messages?id=`          | `functions/api/messages.js`        | Delete message                   |
| GET    | `/api/timeline`              | `functions/api/timeline.js`        | List timeline posts              |
| POST   | `/api/timeline`              | `functions/api/timeline.js`        | Create post (leaders only)       |
| POST   | `/api/timeline/react`        | `functions/api/timeline.js`        | Toggle reaction on post          |
| POST   | `/api/timeline/comments`     | `functions/api/timeline.js`        | Add comment to post              |
| DELETE | `/api/timeline?id=`          | `functions/api/timeline.js`        | Delete post                      |
| GET    | `/api/engagement`            | `functions/api/engagement.js`      | List surveys / results           |
| POST   | `/api/engagement`            | `functions/api/engagement.js`      | Submit survey response           |
| POST   | `/api/engagement/survey`     | `functions/api/engagement.js`      | Create new survey                |
| GET    | `/api/analytics`             | `functions/api/analytics.js`       | Get analytics data               |
| POST   | `/api/ai`                    | `functions/api/ai.js`              | AI chat prompt                   |
| GET    | `/api/ai/history`            | `functions/api/ai.js`              | AI conversation history          |
| GET    | `/api/knowledge`             | `functions/api/knowledge.js`       | List KB articles                 |
| POST   | `/api/knowledge`             | `functions/api/knowledge.js`       | Create KB article                |
| PUT    | `/api/knowledge`             | `functions/api/knowledge.js`       | Update KB article                |
| DELETE | `/api/knowledge?id=`         | `functions/api/knowledge.js`       | Delete KB article                |
| GET    | `/api/integrations`          | `functions/api/integrations.js`    | List integrations                |
| POST   | `/api/integrations`          | `functions/api/integrations.js`    | Enable integration               |
| PUT    | `/api/integrations`          | `functions/api/integrations.js`    | Update integration               |
| DELETE | `/api/integrations?id=`      | `functions/api/integrations.js`    | Disable integration              |
| GET    | `/api/notifications`         | `functions/api/notifications.js`   | List notifications               |
| POST   | `/api/notifications`         | `functions/api/notifications.js`   | Create notification              |
| PATCH  | `/api/notifications?id=`     | `functions/api/notifications.js`   | Mark notification as read        |
| DELETE | `/api/notifications?id=`     | `functions/api/notifications.js`   | Delete notification              |
| GET    | `/api/reports`               | `functions/api/reports.js`         | List recent reports              |
| POST   | `/api/reports`               | `functions/api/reports.js`         | Generate report (queued)         |
| POST   | `/api/sa-auth`               | `super-admin/functions/api/sa-auth.js` | Super Admin login (SA project only) |
| GET    | `/api/sa-org-admins`         | `functions/api/sa-org-admins.js`   | List org admins (SA only)        |
| POST   | `/api/sa-org-admins`         | `functions/api/sa-org-admins.js`   | Create org admin (SA only)       |
| PUT    | `/api/sa-org-admins`         | `functions/api/sa-org-admins.js`   | Update org admin (SA only)       |
| DELETE | `/api/sa-org-admins?id=`     | `functions/api/sa-org-admins.js`   | Delete org admin (SA only)       |

### Authentication Headers

All API requests (except `POST /api/auth`) must include:
```
Authorization: Bearer <workdesk_token>
```
The token is stored in `localStorage.getItem('workdesk_token')`.

---

## 5. Button & Navigation Map

### Sidebar Navigation (all pages)
Each sidebar `<li>` has `onclick="window.location.href='<page>.html'"`.

| Sidebar Item         | Target Page            |
|----------------------|------------------------|
| Dashboard            | `dashboard.html`       |
| Employees            | `employees.html`       |
| Attendance           | `attendance.html`      |
| Leave Management     | `leave.html`           |
| Payroll              | `payroll.html`         |
| Performance          | `performance.html`     |
| Recruitment          | `recruitment.html`     |
| Support / Ticketing  | `tickets.html`         |
| Documents            | `documents.html`       |
| DeskProjects         | `projects.html`        |
| Messages             | `messaging.html`       |
| Timeline             | `timeline.html`        |
| Engagement           | `engagement.html`      |
| Analytics            | `analytics.html`       |
| AI Assistant         | `ai-assistant.html`    |
| Knowledge Base       | `knowledge.html`       |
| Integrations         | `integrations.html`    |
| Settings             | `settings.html`        |
| Log Out              | calls `logout()` → `login.html` |

### Dashboard Quick Actions (`data-action` attribute)
Handled in `assets/js/dashboard.js` → `initQuickActions()`.

| `data-action` value | Behaviour                            |
|---------------------|--------------------------------------|
| `leave`             | Navigate to `leave.html`             |
| `ticket`            | Navigate to `tickets.html`           |
| `employee`          | Navigate to `employees.html`         |
| `payroll`           | Navigate to `payroll.html`           |
| `reports`           | Navigate to `analytics.html`         |
| `settings`          | Navigate to `settings.html`          |
| `messages`          | Navigate to `messaging.html`         |
| `alerts`            | Toast: "No new alerts at this time." |

### Dashboard Card Buttons

| Button ID / Class      | Behaviour                          |
|------------------------|------------------------------------|
| `#postAnnouncementBtn` | Prompt for text, append to card    |
| `#manageTicketsBtn`    | Navigate to `tickets.html`         |
| `.ticket-item` (rows)  | Navigate to `tickets.html`         |

### Logout Button
All pages include `<script src="auth.js"></script>`. The sidebar logout button calls
`logout()` which:
1. Clears `workdesk_token`, `workdesk_display_name`, `session` from `localStorage`.
2. Redirects to `login.html`.

---

## 6. Authentication Flow

```
User opens login.html
       │
       ▼
Fills email + password
       │
       ▼
JS calls: POST /api/auth  { email, password }
       │
       ├── 401 Invalid → show error message
       │
       └── 200 OK { ok:true, token, email }
                │
                ▼
         localStorage.setItem('workdesk_token', token)
         localStorage.setItem('workdesk_display_name', name)
                │
                ▼
         window.location.href = 'dashboard.html'
```

**Session check on each protected page** (future enhancement):
```js
// At page load, verify token with GET /api/auth
fetch('/api/auth', { headers: { Authorization: 'Bearer ' + localStorage.getItem('workdesk_token') } })
  .then(r => r.json())
  .then(d => { if (!d.ok) window.location.replace('login.html'); });
```

---

## 7. Database Schema (D1)

Run these SQL statements after creating the D1 database (`wrangler d1 create workdesk-db`).

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role       TEXT DEFAULT 'member',
  created_at TEXT
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id         TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  dept       TEXT,
  position   TEXT,
  start_date TEXT,
  status     TEXT DEFAULT 'Active',
  phone      TEXT,
  created_at TEXT
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id          TEXT PRIMARY KEY,
  employee_id TEXT,
  date        TEXT NOT NULL,
  time_in     TEXT,
  time_out    TEXT,
  status      TEXT DEFAULT 'Present',
  created_at  TEXT
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id          TEXT PRIMARY KEY,
  employee_id TEXT,
  name        TEXT,
  type        TEXT,
  from_date   TEXT,
  to_date     TEXT,
  days        INTEGER,
  reason      TEXT,
  status      TEXT DEFAULT 'Pending',
  filed_date  TEXT
);

-- Payroll Ledger
CREATE TABLE IF NOT EXISTS payroll_ledger (
  id          TEXT PRIMARY KEY,
  employee_id TEXT,
  period      TEXT,
  basic_pay   REAL,
  overtime    REAL,
  allowances  REAL,
  deductions  REAL,
  total_pay   REAL,
  status      TEXT DEFAULT 'Draft',
  created_at  TEXT
);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id          TEXT PRIMARY KEY,
  employee_id TEXT,
  period      TEXT,
  score       REAL,
  comments    TEXT,
  goals       TEXT,
  created_at  TEXT
);

-- Job Postings
CREATE TABLE IF NOT EXISTS job_postings (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  dept        TEXT,
  type        TEXT,
  location    TEXT,
  salary      TEXT,
  description TEXT,
  status      TEXT DEFAULT 'Open',
  posted_date TEXT
);

-- Applicants
CREATE TABLE IF NOT EXISTS applicants (
  id          TEXT PRIMARY KEY,
  job_id      TEXT,
  name        TEXT,
  email       TEXT,
  phone       TEXT,
  stage       TEXT DEFAULT 'Applied',
  applied_date TEXT
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id           TEXT PRIMARY KEY,
  subject      TEXT NOT NULL,
  category     TEXT,
  priority     TEXT DEFAULT 'Normal',
  description  TEXT,
  submitted_by TEXT,
  assigned_to  TEXT,
  status       TEXT DEFAULT 'Open',
  created_at   TEXT
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  file_url    TEXT,
  file_size   INTEGER,
  file_type   TEXT,
  uploaded_by TEXT,
  uploaded_at TEXT
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  thread_id    TEXT,
  sender_token TEXT,
  text         TEXT,
  attachment_url TEXT,
  created_at   TEXT
);

-- Timeline Posts
CREATE TABLE IF NOT EXISTS timeline_posts (
  id           TEXT PRIMARY KEY,
  author_token TEXT,
  author_name  TEXT,
  author_role  TEXT,
  text         TEXT,
  created_at   TEXT
);

-- Timeline Reactions
CREATE TABLE IF NOT EXISTS timeline_reactions (
  id           TEXT PRIMARY KEY,
  post_id      TEXT,
  user_token   TEXT,
  emoji        TEXT
);

-- Timeline Comments
CREATE TABLE IF NOT EXISTS timeline_comments (
  id           TEXT PRIMARY KEY,
  post_id      TEXT,
  user_token   TEXT,
  text         TEXT,
  created_at   TEXT
);

-- Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id         TEXT PRIMARY KEY,
  title      TEXT,
  questions  TEXT,
  due_date   TEXT,
  created_by TEXT,
  created_at TEXT
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id               TEXT PRIMARY KEY,
  survey_id        TEXT,
  respondent_token TEXT,
  answers          TEXT,
  submitted_at     TEXT
);

-- Knowledge Articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  category     TEXT,
  content      TEXT,
  tags         TEXT,
  author_token TEXT,
  author_name  TEXT,
  created_at   TEXT,
  updated_at   TEXT
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id           TEXT PRIMARY KEY,
  type         TEXT,
  label        TEXT,
  config       TEXT,
  status       TEXT DEFAULT 'active',
  connected_at TEXT
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_token TEXT NOT NULL,
  type       TEXT NOT NULL,
  text       TEXT NOT NULL,
  href       TEXT DEFAULT '#',
  unread     INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

-- Reports (metadata log for generated reports)
CREATE TABLE IF NOT EXISTS reports (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  format       TEXT NOT NULL,
  org_id       TEXT,
  date_from    TEXT,
  date_to      TEXT,
  r2_key       TEXT,
  rows         INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'ready',
  generated_at TEXT NOT NULL
);
```

---

## 8. Cloudflare Queue Integration

WorkDesk uses **Cloudflare Queues** to offload long-running background jobs away from
the request path. This keeps API responses fast and ensures heavy work (payroll computation,
report generation) is retried safely if it fails.

### Architecture

```
┌─────────────────────────────────────────────┐
│  Cloudflare Pages (static site + Functions)  │
│                                              │
│  POST /api/payroll/run ──┐                   │
│  POST /api/reports      ─┼──► WORKDESK_QUEUE │
│  POST /api/notifications ┘        (Queue)    │
└─────────────────────────────────────────────┘
                                │
                       batch delivery
                                │
                                ▼
              ┌──────────────────────────────────┐
              │  queue-consumer/index.js (Worker)  │
              │                                    │
              │  notification.created → D1 INSERT  │
              │  payroll.run          → D1 batch    │
              │  report.generate      → D1 + R2    │
              └──────────────────────────────────┘
```

### Queue Events

| Event                | Published by                   | Consumer action                                     |
|----------------------|--------------------------------|-----------------------------------------------------|
| `notification.created` | `POST /api/notifications`    | INSERT row into D1 `notifications` table            |
| `payroll.run`          | `POST /api/payroll/run`      | Compute pay, batch INSERT into `payroll_ledger`     |
| `report.generate`      | `POST /api/reports`          | Aggregate D1 data, serialize, upload to R2          |

### File Layout

```
queue-consumer/
├── wrangler.toml   — Worker config (consumers + D1/R2 bindings)
└── index.js        — Queue handler (export default { queue() {} })
```

### Setup Checklist

```bash
# 1. Create the queue (once per environment)
npx wrangler queues create workdesk-queue

# 2. Deploy the Pages project (producer)
#    The [[queues.producers]] block in the root wrangler.toml is already active.
wrangler pages deploy .

# 3. Fill in wrangler.toml inside queue-consumer/:
#      - database_id  (from:  wrangler d1 create workdesk-db)
#      - bucket_name  (from:  wrangler r2 bucket create workdesk-attachments)

# 4. Deploy the consumer Worker
cd queue-consumer
wrangler deploy
```

### Producer Code Pattern

Each Pages Function that publishes to the queue guards the call with `if (env.WORKDESK_QUEUE)`,
so the API continues to work (in demo mode) when the queue is not yet configured:

```js
if (env.WORKDESK_QUEUE) {
  await env.WORKDESK_QUEUE.send({ event: 'payroll.run', period, count, token, queued_at });
}
```

### Consumer Code Pattern

The consumer (`queue-consumer/index.js`) exports a single default object with a `queue` handler:

```js
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await handleMessage(message.body, env);
        message.ack();
      } catch (err) {
        message.retry();
      }
    }
  },
};
```

### D1 — Additional `reports` Table

The report consumer logs metadata to a `reports` table. Add it to your schema if you are using
the report generator:

```sql
CREATE TABLE IF NOT EXISTS reports (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  format       TEXT NOT NULL,
  org_id       TEXT,
  date_from    TEXT,
  date_to      TEXT,
  r2_key       TEXT,
  rows         INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'ready',
  generated_at TEXT NOT NULL
);
```

---

## 9. Deployment Commands

### First-time setup

```bash
# 1. Create D1 database
wrangler d1 create workdesk-db
# Copy the database_id from the output and paste into wrangler.toml

# 2. Apply schema
wrangler d1 execute workdesk-db --file=./schema.sql

# 3. Create KV namespaces
wrangler kv:namespace create "SESSIONS"
# Copy the id and paste into wrangler.toml

# 4. Create R2 bucket (for file attachments)
wrangler r2 bucket create workdesk-attachments

# 5. Create the Cloudflare Queue
npx wrangler queues create workdesk-queue

# 6. Set secrets (do NOT commit these)
wrangler secret put OPENAI_API_KEY    # optional, for AI Assistant

# 7. Deploy Pages (producer)
wrangler pages deploy .

# 8. Deploy the queue consumer Worker
cd queue-consumer && wrangler deploy
```

### Day-to-day

```bash
# Local dev server (Cloudflare Pages Functions included)
npx wrangler pages dev . --compatibility-date=2024-01-01

# Deploy to production
wrangler pages deploy .

# View function logs
wrangler pages deployment tail

# List D1 databases
wrangler d1 list

# Run a D1 query
wrangler d1 execute workdesk-db --command="SELECT COUNT(*) FROM employees"
```

---

## 10. Best Practices & Rules

### Code style
- **Zero-build**: No npm, no bundler, no transpilation. All JS must run natively in the browser.
- **ES6 IIFEs**: Wrap page-specific JS in `(function(){ 'use strict'; ... }())`.
- **CSS variables only**: Never hard-code a colour hex that exists as a CSS token (see `DESIGN_SYSTEM.md §2`).
- **No `!important`** unless overriding a browser default.
- **Semantic HTML**: Use `<main>`, `<aside>`, `<header>`, `<nav>`, `<section>` appropriately.
- **Aria labels**: Every interactive element must have `aria-label`.

### API conventions
- All Functions return `{ ok: true|false, ... }` JSON.
- Auth errors return HTTP 401; missing params return 400; method errors return 405.
- Always include CORS headers (already templated in every function file).
- Always check `Authorization: Bearer <token>` header before processing data.

### Security
- Use `wrangler secret put` for any sensitive credential. Never commit secrets.
- Tokens stored in `localStorage` are for demo; production should use `HttpOnly` cookies via KV.
- The `_headers` file enforces `Content-Security-Policy`; do not weaken it.
- Never allow `Access-Control-Allow-Origin: *` in production with credentials; restrict to your domain.

### Adding a new page
1. Create `<pagename>.html` following the sidebar/topbar template from `dashboard.html`.
2. Include `<link rel="stylesheet" href="assets/css/styles.css">`.
3. Include `<script src="auth.js"></script>` (provides `logout()`).
4. Add the sidebar `<li onclick="window.location.href='<pagename>.html'">` entry.
5. Create `functions/api/<pagename>.js` if the page needs backend data.
6. Update the Page Inventory table in this file (§2).
7. Update `DESIGN_SYSTEM.md §9` file structure.

### Adding a new API endpoint
1. Create `functions/api/<name>.js` following the existing function template.
2. Export `async function onRequest(context)`.
3. Always handle `OPTIONS` preflight for CORS.
4. Always validate the `Authorization` header.
5. Document the endpoint in the Backend API Reference table above (§4).
6. Add the D1 table schema to §7 if new data is introduced.

---

## 11. What NOT to Change

> These rules prevent accidental regressions and unnecessary churn.

| Item | Rule |
|------|------|
| `DESIGN_SYSTEM.md` | Do not modify unless design tokens are actually changing. |
| `assets/css/styles.css` | Only add/change styles if explicitly requested. Do not rename CSS variables. |
| `_headers` | Do not weaken `Content-Security-Policy` or remove security headers. |
| `wrangler.toml` | Only edit when adding a new D1/KV/R2 binding or changing the project name. |
| Sidebar HTML | Do not reorder or rename sidebar items unless asked. All pages use the same sidebar. |
| `auth.js` (root) | `logout()` is called by every page. Do not rename or remove it. |
| Login page glassmorphism card | Do not touch unless style change is explicitly requested. |
| Demo data in `messaging.js` / `timeline.html` | Do not remove — used when D1 is not connected. |
| `projects.html` "coming soon" state | Do not add a backend or UI until the feature is scoped. |
| Existing button `data-action` values | Do not rename them — they are mapped in `dashboard.js`. |
| Employee avatar SVGs in `assets/images/employees/` | Do not delete or rename — referenced by employee cards. |
