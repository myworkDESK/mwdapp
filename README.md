# WorkDesk 

> **WorkDesk** is a comprehensive Employers/Employee workhub built as a zero-dependency, static web application deployed on Cloudflare Pages. It covers everything from employee management to payroll, attendance, messaging, and more — all in a clean, modern interface.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
   - [Authentication](#1-authentication--login)
   - [Dashboard](#2-dashboard)
   - [Employee Management](#3-employee-management)
   - [Attendance Tracking](#4-attendance-tracking)
   - [Leave Management](#5-leave-management)
   - [Payroll](#6-payroll)
   - [Performance Management](#7-performance-management)
   - [Recruitment](#8-recruitment)
   - [Support Tickets](#9-support-tickets)
   - [Documents](#10-documents)
   - [DeskProjects](#11-deskprojects)
   - [Messaging](#12-messaging)
   - [Timeline / Announcements](#13-timeline--announcements)
   - [Engagement Surveys](#14-engagement-surveys)
   - [Analytics](#15-analytics)
   - [AI Assistant](#16-ai-assistant)
   - [Knowledge Base](#17-knowledge-base)
   - [Integrations](#18-integrations)
   - [Settings](#19-settings)
   - [Notifications](#20-notifications)
   - [Reports](#21-reports)
   - [Super Admin](#22-super-admin)
3. [Roles & Career Levels](#roles--career-levels)
4. [Access & Permissions](#access--permissions)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Cloudflare Queue Integration](#cloudflare-queue-integration)
8. [Deployment](#deployment)
9. [Cloudflare Backend Notes](#cloudflare-backend-notes)
10. [API Endpoints](#api-endpoints)
11. [Design System](#design-system)
12. [Getting Started (Local Preview)](#getting-started-local-preview)
13. [Guidelines & Conventions](#guidelines--conventions)
14. [License](#license)

---

## Overview

WorkDesk is a fully-featured HRIS platform designed for modern organizations. It provides:

- A **role-based** interface (HR Admin, Leader, Employee)
- **Real-time** metrics and activity feeds
- **Cloudflare Workers** API backend with D1 database, KV sessions, and R2 storage
- A **zero-build** frontend — pure HTML, CSS (custom tokens), and vanilla JavaScript with no bundler required

---

## Features

### 1. Authentication & Login

**Page:** `login.html`

| Element | Description |
|---|---|
| Email & Password form | Standard credential login with validation |
| Password visibility toggle | Eye-icon button to show/hide password |
| Forgot Password | Sends a reset link to the entered email |
| Google SSO | Sign in via Google (configured via Cloudflare Access) |
| Microsoft SSO | Sign in via Microsoft (configured via Cloudflare Access) |
| Contact HR link | Opens HR contact for login issues |

**Flow:**
1. User enters email + password and clicks **Sign In**.
2. Credentials are sent to `/api/auth` (POST).
3. On success, the session token is stored in `localStorage` and the user is redirected to `dashboard.html`.
4. On network error (static preview), navigation falls back directly to `dashboard.html`.

---

### 2. Dashboard

**Page:** `dashboard.html`

The central hub of WorkDesk. Displays a real-time snapshot of the organization.

| Section | Description |
|---|---|
| Greeting Banner | Time-aware greeting ("Good Morning / Afternoon / Evening") with current user name |
| Stat Cards | Total Employees, Attendance Today, Leave Requests, Payroll Summary |
| Calendar | Mini calendar widget at the top beside the Monthly Attendance chart, with month navigation |
| Monthly Attendance Chart | Bar chart spanning alongside the calendar, showing monthly attendance overview |
| Today's Summary | Donut chart with attendance breakdown (Present / Late / Absent) — positioned below the calendar |
| Quick Actions | Post Announcement, Create Ticket shortcuts |
| Activity Timeline | Recent HR activity feed |
| Notification Bell | Dropdown with unread notifications (leave, attendance, payroll, employee alerts) |
| Live Clock | Real-time clock (12h/24h based on platform setting) with date, shown in the topbar beside the AUX status |
| AUX / Status Badge | Set availability manually (defaults to **Offline** on login). Time in current status is tracked and displayed. Every change is logged as an attendance footprint. |
| Messages Shortcut | Top-bar icon linking directly to Messaging |

**Sidebar Navigation:**

| Item | Target Page |
|---|---|
| Dashboard | `dashboard.html` (active) |
| Employees | `employees.html` |
| Attendance | `attendance.html` |
| Leave Management | `leave.html` |
| Payroll | `payroll.html` |
| Messages | `messaging.html` |
| Timeline | `timeline.html` |
| Ticketing | *(coming soon)* |
| Settings | `settings.html` |
| **Log Out** | Returns to `login.html` |

---

### 3. Employee Management

**Page:** `employees.html`

Full CRUD directory for all employees in the organization.

| Feature | Description |
|---|---|
| Employee Table | Paginated list with ID, Name, Department, Position, Status, Actions |
| Employee Photos | Thumbnail photos per employee, named by Employee ID (e.g., `EMP-001.jpg`) stored in `assets/images/employees/` |
| Search | Live search by name, department, or position |
| Filter | Filter by department or employment status |
| Add Employee | Modal form with fields: First/Last Name, Email, Phone, Department, Position, Start Date, Status |
| Edit Employee | Pre-filled modal form for updating employee records |
| View Employee | Read-only detail modal with full profile |
| Delete Employee | Single-click delete with confirmation toast |
| Export CSV | Download the full employee list as a CSV file |
| Bulk Import | Upload a CSV file to import multiple employees at once (with downloadable template) |
| Department Chart | Visual bar chart showing headcount per department |
| Stat Chips | Total, Active, On Leave, New This Month counts |
| Pagination | Navigate through large employee lists page by page |

**Employee ID Format:** `EMP-001`, `EMP-002`, … `EMP-NNN`

**Employee Photo Naming:** Photos must be placed in `assets/images/employees/` and named exactly matching the Employee ID (e.g., `EMP-001.jpg`). The system falls back to colored initials if no photo is found.

---

### 4. Attendance Tracking

**Page:** `attendance.html`

Monitor and manage employee time-in/time-out records.

| Feature | Description |
|---|---|
| Attendance Table | Daily log with Employee ID, Name, Time In, Time Out, Status |
| Status Indicators | Present, Late, Absent, Half-day color-coded badges |
| Date Picker | Filter attendance by specific date |
| Export | Download attendance records as CSV |
| Summary Cards | Present today, Late today, Absent today counts |

---

### 5. Leave Management

**Page:** `leave.html`

Handle all employee leave requests in one place.

| Feature | Description |
|---|---|
| Leave Request Table | List of pending, approved, and rejected requests |
| Approve / Reject | Quick action buttons on each leave request |
| Leave Type | Vacation, Sick, Emergency, Maternity/Paternity |
| Balance Tracker | Remaining leave balance per employee |
| Calendar View | Visual calendar showing approved leaves |

---

### 6. Payroll

**Page:** `payroll.html`

Generate and review employee payroll summaries.

| Feature | Description |
|---|---|
| Payroll Table | Monthly payroll entries per employee |
| Earnings & Deductions | Breakdown of gross pay, deductions, net pay |
| Status Badges | Paid, Pending, Processing status per record |
| Export Payslips | Download payslip as PDF/CSV per employee |
| Payroll Period Selector | Switch between monthly payroll periods |

---

### 7. Messaging

**Page:** `messaging.html`

Internal direct and group messaging system.

| Feature | Description |
|---|---|
| Direct Messages | One-on-one conversations with online/away/offline status |
| Group Chats | Group conversations (HR Department, All Employees, Finance Team, etc.) |
| Message Bubbles | Outbound (teal), Inbound (gray) with timestamps and read receipts (✓✓) |
| Compose Area | Text input with emoji, attachment, and send button |
| Pin Messages | Mark important messages for quick access |
| Archive Threads | Remove conversations from active list |
| Search | Filter threads by name or message content |
| Tab Navigation | Switch between Direct and Group views |
| Notification Badge | Unread message count shown in sidebar |

---

### 8. Timeline / Announcements

**Page:** `timeline.html`

Company-wide announcement feed with role-based posting.

| Feature | Description |
|---|---|
| Post Feed | Chronological list of announcements and updates |
| Leader Posts | Only users with `role: leader` can create new posts |
| Compose Area | Visible only to leaders — "Share an announcement…" input + Post button |
| Emoji Reactions | React to posts with emoji reactions |
| Comments | Expandable comment threads on each post |
| Leader Badge | "role: Leader" badge shown on leader-authored posts |
| Timestamps | Relative timestamps ("10 minutes ago") |

### 7. Performance Management

**Page:** `performance.html`

Track employee performance reviews, goals, and KPI scores over time.

| Feature | Description |
|---|---|
| Review Table | List of reviews per employee with period, score, and comments |
| Score Tracking | Numerical KPI scores with trend indicators |
| Goal Setting | Document employee goals per review period |
| Period Filter | View reviews by quarter or annual period |
| Add Review | Modal form to create a new performance review |
| Edit Review | Update an existing review record |

**API:** `GET /api/performance?empId=&period=`, `POST /api/performance`, `PUT /api/performance`

---

### 8. Recruitment

**Page:** `recruitment.html`

Manage open job postings and track the applicant pipeline from application to offer.

| Feature | Description |
|---|---|
| Job Postings Table | Active/closed roles with title, department, type, location, salary, status |
| Applicant Pipeline | Candidates per job with stage tracking (Applied → Interview → Offer → Hired) |
| Add Job Posting | Modal to create a new role with full details |
| Update Stage | Move applicants through the hiring pipeline |
| Archive Posting | Close a job once filled |
| Tab Navigation | Switch between "Postings" and "Applicants" views |

**API:** `GET /api/recruitment?type=postings`, `GET /api/recruitment?type=applicants`, `POST /api/recruitment`, `PUT /api/recruitment`, `DELETE /api/recruitment?id=`

---

### 9. Support Tickets

**Page:** `tickets.html`

Internal help-desk for IT and HR requests. Employees submit tickets; managers resolve them.

| Feature | Description |
|---|---|
| Ticket List | All tickets with ID, subject, category, priority, status, assignee |
| Status Filter | Filter by Open / In Progress / Resolved / Closed |
| Priority Badges | Critical, High, Normal, Low color-coded labels |
| Create Ticket | Modal with subject, category, priority, and description fields |
| Update Status | Change ticket status and assignee |
| Delete Ticket | Remove a ticket permanently |
| Ticket Categories | IT Support, HR Query, Payroll Issue, Leave Request, Facilities |

**API:** `GET /api/tickets?status=&priority=`, `POST /api/tickets`, `PUT /api/tickets`, `DELETE /api/tickets?id=`

---

### 10. Documents

**Page:** `documents.html`

Central repository for company policies, contracts, employee files, and other HR documents.

| Feature | Description |
|---|---|
| Document Library | Paginated file list with name, category, size, uploader, date |
| Category Tabs | Policies, Contracts, Employee Files, Templates, Other |
| Search | Live search by document name or description |
| Upload | Upload files (stored in Cloudflare R2 `ATTACHMENTS` bucket) |
| Download | Retrieve files via signed R2 URL |
| Delete | Remove document record and underlying R2 object |

**API:** `GET /api/documents?category=&search=`, `POST /api/documents`, `PUT /api/documents`, `DELETE /api/documents?id=`

---

### 11. DeskProjects

**Page:** `projects.html`

Team project management — task boards and milestones. Currently a "coming soon" placeholder.

> **Note:** No backend API exists for this page. Do not build one until the UI is scoped and approved.

---

### 12. Messaging

**Page:** `messaging.html`

Internal direct and group messaging system.

| Feature | Description |
|---|---|
| Direct Messages | One-on-one conversations with online/away/offline status |
| Group Chats | Group conversations (HR Department, All Employees, Finance Team, etc.) |
| Message Bubbles | Outbound (teal), Inbound (gray) with timestamps and read receipts (✓✓) |
| Compose Area | Text input with emoji, attachment, and send button |
| Pin Messages | Mark important messages for quick access |
| Archive Threads | Remove conversations from active list |
| Search | Filter threads by name or message content |
| Tab Navigation | Switch between Direct and Group views |
| Notification Badge | Unread message count shown in sidebar |

**API:** `GET /api/messages?thread=`, `POST /api/messages`, `DELETE /api/messages?id=`

---

### 13. Timeline / Announcements

**Page:** `timeline.html`

Company-wide announcement feed with role-based posting.

| Feature | Description |
|---|---|
| Post Feed | Chronological list of announcements and updates |
| Leader Posts | Only users with `role: leader` can create new posts |
| Compose Area | Visible only to leaders — "Share an announcement…" input + Post button |
| Emoji Reactions | React to posts with emoji reactions |
| Comments | Expandable comment threads on each post |
| Leader Badge | "role: Leader" badge shown on leader-authored posts |
| Timestamps | Relative timestamps ("10 minutes ago") |

**API:** `GET /api/timeline?page=`, `POST /api/timeline`, `POST /api/timeline/react`, `POST /api/timeline/comments`, `DELETE /api/timeline?id=`

---

### 14. Engagement Surveys

**Page:** `engagement.html`

Run pulse surveys to measure employee satisfaction and engagement scores.

| Feature | Description |
|---|---|
| Survey List | Active and past surveys with titles and due dates |
| Satisfaction Score | Rolling eNPS / satisfaction score chart |
| Submit Response | Employees answer questions anonymously |
| Create Survey | HR admins create new surveys with questions and due dates |
| Results View | Aggregate response data per question |

**API:** `GET /api/engagement?surveyId=`, `POST /api/engagement`, `POST /api/engagement/survey`

---

### 15. Analytics

**Page:** `analytics.html`

HR metrics dashboard with charts for headcount, attendance, turnover, payroll cost, and more.

| Feature | Description |
|---|---|
| Headcount Chart | Total employees over time, breakdown by department |
| Attendance Overview | Present / Late / Absent daily and monthly trends |
| Turnover Rate | Monthly attrition percentage chart |
| Payroll Cost | Monthly gross payroll spend |
| Export | Download data as CSV or PDF |
| Date Range Filter | Narrow charts to a specific time window |

**API:** `GET /api/analytics?report=summary|headcount|attendance|turnover|payroll`

---

### 16. AI Assistant

**Page:** `ai-assistant.html`

Conversational AI for HR policy questions, employee queries, and data lookups.

| Feature | Description |
|---|---|
| Chat Interface | Message bubbles, typing indicator, timestamp |
| Suggested Questions | Preset quick-action chips for common queries |
| HR Policy Q&A | Ask about leave policies, payroll rules, company guidelines |
| Data Lookup | Query employee counts, attendance, leave balances |
| Conversation History | Previous session messages (stored per token) |

**Backend options:**
- Cloudflare Workers AI (`env.AI`) — free tier, runs `@cf/meta/llama-3-8b-instruct` by default.
- External LLM — set `OPENAI_API_KEY` secret for OpenAI or any compatible provider.

**API:** `POST /api/ai`, `GET /api/ai/history`

---

### 17. Knowledge Base

**Page:** `knowledge.html`

Internal HR wiki — policies, procedures, FAQs, and onboarding guides.

| Feature | Description |
|---|---|
| Article Library | Browsable list with title, category, author, and date |
| Category Filter | HR Policy, IT Guidelines, Onboarding, Benefits, Other |
| Search | Full-text search across article titles and content |
| Create Article | Rich markdown editor (rendered as HTML) |
| Edit / Delete | Update or remove articles (manager-level access) |
| Tags | Freeform tags for discoverability |

**API:** `GET /api/knowledge?category=&search=`, `POST /api/knowledge`, `PUT /api/knowledge`, `DELETE /api/knowledge?id=`

---

### 18. Integrations

**Page:** `integrations.html`

Connect WorkDesk to third-party tools via OAuth or API key.

| Feature | Description |
|---|---|
| Integration Cards | Visual grid of available integrations with status badges |
| Connect / Disconnect | Enable or disable each integration |
| Config Editor | Provide API keys, webhook URLs, or scopes per integration |
| Supported Integrations | Slack, Google Workspace, Zoom, GitHub, Jira, Xero, QuickBooks, Zapier, Webhooks |
| Status Indicators | Connected (green), Disconnected (gray), Error (red) |

**API:** `GET /api/integrations`, `POST /api/integrations`, `PUT /api/integrations`, `DELETE /api/integrations?id=`

---

### 19. Settings

**Page:** `settings.html`

Central configuration hub for profiles, roles, permissions, and organization settings.

| Section | Access | Description |
|---|---|---|
| Profile Settings | All users | Update display name, email, position, department, password |
| Roles & Career Levels | All users (view) | Reference guide for the 5 organizational roles and 8 career levels |
| Access & Permissions | Manager+ (edit) | Role-based permission matrix; approval chain documentation |
| Organization Settings | Admin+ | Org name, industry, size, timezone, country; manage Admin users |
| Platform Settings | Admin+ | Time format (12h/24h), date format, currency, work week start, notifications, audit footprints |

---

### 20. Notifications

**API endpoint:** `/api/notifications`

In-app notification delivery for leave approvals, payroll events, mentions, system alerts, and
any event that the platform pushes to a specific user.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications for the current user |
| POST | `/api/notifications` | Create a new notification (also publishes to Cloudflare Queue) |
| PATCH | `/api/notifications?id=N-X` | Mark a notification as read |
| DELETE | `/api/notifications?id=N-X` | Delete a notification |

---

### 21. Reports

**API endpoint:** `/api/reports`

Generate and export HR reports across all modules for a selected date range and format.

| Report Type | Description |
|---|---|
| `hr_summary` | Full employee roster snapshot |
| `attendance` | Time-in/out records for the period |
| `payroll` | Payroll ledger rows |
| `leave` | Leave requests and balances |
| `performance` | Performance review scores |
| `recruitment` | Job postings and applicant pipeline |
| `platform_usage` | Page-view and API usage metrics |
| `engagement` | Survey response aggregates |
| `tickets` | Support ticket activity |

**Formats:** `json`, `csv`, `xlsx`

Generating a report queues the job to `WORKDESK_QUEUE`; the queue consumer aggregates D1
data, serializes the output, and uploads the file to R2 for download.

**API:** `GET /api/reports` (list recent), `POST /api/reports` (generate new)

---

### 22. Super Admin

**Pages:** `super-admin/sa-portal.html`, `super-admin/sa-dashboard.html`

Platform-level administration for the WorkDesk owner / CEO. Completely separate from
Organization Admin access.

| Feature | Description |
|---|---|
| SA Login | Separate login page with SA-specific credentials |
| Organization List | View all organizations on the platform |
| Create Organization | Add a new org with name, domain, and admin contact |
| Edit / Deactivate Org | Modify org details or suspend access |
| Org Admin CRUD | Assign, update, or revoke Organization Admin credentials |

**Auth:** SA tokens contain `:sa:` in the base64-decoded payload; all SA endpoints verify this
before processing any request.

**API:** `POST /api/sa-auth`, `GET/POST/PUT/DELETE /api/sa-org-admins`

---

## Roles & Career Levels

WorkDesk uses a two-axis access model: **Roles** define what a user can do; **Career Levels** indicate seniority.

### Organizational Roles

| Role | Level | Description |
|---|---|---|
| **Entry Level** (Role 1) | Career L1–3 | Front-line staff. Can view and submit requests; all modifications require Supervisor approval. |
| **Supervisor** (Role 2) | Career L3–4 | Approves Entry Level requests. Limited edit access; self-modifications need Manager approval. |
| **Manager** (Role 3) | Career L5–6 | Full team management. Approves Supervisor-escalated requests. Self-modifications need Senior Manager approval. |
| **Senior Manager** (Role 4) | Career L6–7 | Cross-team oversight. Approves Manager requests. System-level changes require General Manager sign-off. |
| **General Manager** (Role 5) | Career L7–8 | Organization-wide authority. Final approver within the org. Can delegate Admin functions. |
| **Organization Admin** | — | Manages all org settings, user roles, and configurations. Assigned only by Super Admin. |
| **Super Admin** | — | Platform-level control (CEO / Platform Owner). Can create/modify/remove organizations and assign Org Admins. |

### Career Levels (1–8)

Career levels measure seniority and growth within a role track. They determine the scope of access but are always evaluated together with the employee's Role for final permission decisions.

| Level | Name | Typical Titles | Role Mapping |
|---|---|---|---|
| **L1** | Entry | Associates, Assistants, Trainees | Role 1 |
| **L2** | Junior | Coordinators, Junior Specialists | Role 1–2 |
| **L3** | Associate | Specialists, Analysts | Role 2 |
| **L4** | Mid-Level | Senior Specialists, Team Leads | Role 2–3 |
| **L5** | Senior | Senior Analysts, Supervisors | Role 3 |
| **L6** | Lead | Managers, Department Heads | Role 3–4 |
| **L7** | Principal | Senior Managers, Directors | Role 4–5 |
| **L8** | Executive | General Managers, VPs, C-Suite | Role 5+ |

---

## Access & Permissions

Permissions are derived from each employee's Role. All modifications flow through an approval chain. Changes are recorded as **immutable audit footprints** visible only to Manager-level users and above. Employees below the visibility threshold receive a notification/disclaimer that a change occurred, but cannot see the change detail.

### Approval Chain

```
Entry Level → Supervisor → Manager → Senior Manager → General Manager → Admin → Super Admin
```

Each level may approve requests from the level directly below it. Managers and above require approval from their own next level for self-modifications.

### Attendance Records & AUX Status

- AUX (availability) status **must be set manually** after login — it defaults to **Offline**.
- Every AUX status change is timestamped and recorded in the employee's attendance log.
- Attendance records are **immutable**. Any correction requires:
  1. A written explanation from the employee
  2. A supporting attachment (screenshot, email, etc.)
  3. Approval from the next-level manager
- Correction requests from Managers require approval from Senior Managers; Senior Managers require General Manager approval.

### Permission Summary

| Module / Action | Entry (L1–3) | Supervisor (L4) | Manager (L5–6) | Sr. Manager (L7) | GM / Admin (L8) |
|---|---|---|---|---|---|
| Dashboard — View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Employees — View | Own only | ✅ | ✅ | ✅ | ✅ |
| Employees — Edit | ❌ | Requires approval | ✅ | ✅ | ✅ |
| Attendance — View own | ✅ | ✅ | ✅ | ✅ | ✅ |
| Attendance — Request correction | Requires approval | Requires approval | Requires approval | Requires approval | ✅ |
| Attendance — Approve correction | ❌ | ✅ | ✅ | ✅ | ✅ |
| Leave — File request | ✅ | ✅ | ✅ | ✅ | ✅ |
| Leave — Approve | ❌ | ✅ | ✅ | ✅ | ✅ |
| Payroll — View own payslip | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payroll — Edit / Process | ❌ | Requires approval | Requires approval | ✅ | ✅ |
| Settings — Profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings — Roles & Permissions | ❌ | ❌ | View only | ✅ | ✅ |
| Settings — Organization | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Footprints — View | ❌ | Own only | ✅ | ✅ | ✅ |
| Organizations — Create / Delete | ❌ | ❌ | ❌ | ❌ | ⭐ Super Admin only |

---

| Layer | Technology |
|---|---|
| Frontend | Pure HTML5, CSS3 (custom design tokens), Vanilla ES6 JavaScript |
| Backend | Cloudflare Pages Functions (JavaScript) |
| Hosting | Cloudflare Pages |
| Database | Cloudflare D1 (SQLite, Workers binding) |
| Session Store | Cloudflare KV |
| File Storage | Cloudflare R2 |
| Background Jobs | Cloudflare Queues |
| AI | Cloudflare Workers AI / OpenAI (optional) |
| Fonts | Google Fonts — Inter |
| Assets / CDN | Cloudinary (logo asset) |

**No build step required.** No npm, no bundler, no framework.

---

## Project Structure

```
WorkDesk/
├── README.md                          ← This file
├── FEATURES.md                        ← Authoritative feature reference & API docs
├── DESIGN_SYSTEM.md                   ← Design tokens, brand guidelines
├── wrangler.toml                      ← Cloudflare Pages + Queue producer config
├── _headers                           ← Cloudflare Pages HTTP security headers
├── _redirects                         ← URL redirect rules
├── auth.js                            ← Shared logout() helper (included on every page)
│
├── ── HTML Pages ───────────────────────────────────────────────────────────
├── index.html                         ← Root redirect → login.html
├── login.html                         ← Authentication / sign-in
├── dashboard.html                     ← Main HRIS dashboard (KPIs, charts, quick actions)
├── employees.html                     ← Employee directory & CRUD
├── attendance.html                    ← Clock in/out, attendance log, manual entry
├── leave.html                         ← Leave requests: file, approve, reject
├── payroll.html                       ← Payroll ledger and payroll run
├── performance.html                   ← Performance reviews, goals, KPI tracking
├── recruitment.html                   ← Job postings and applicant pipeline
├── tickets.html                       ← Internal IT/HR help-desk
├── documents.html                     ← Document repository (R2-backed)
├── projects.html                      ← DeskProjects (coming soon placeholder)
├── messaging.html                     ← Direct and group messaging
├── timeline.html                      ← Company-wide announcement feed
├── engagement.html                    ← Pulse surveys and satisfaction scores
├── analytics.html                     ← HR metrics and charts
├── ai-assistant.html                  ← AI-powered HR Q&A (Workers AI / OpenAI)
├── knowledge.html                     ← Internal HR wiki and policies
├── integrations.html                  ← Third-party integrations (Slack, Zoom, Xero…)
├── settings.html                      ← Profile, org config, platform settings
│
├── super-admin/
│   ├── sa-portal.html                 ← Super Admin login
│   ├── sa-dashboard.html              ← Super Admin management dashboard
│   └── _headers                       ← Security headers for SA routes
│
├── assets/
│   ├── css/
│   │   └── styles.css                 ← Single global stylesheet (CSS design tokens)
│   ├── js/
│   │   ├── dashboard.js               ← Dashboard page logic
│   │   ├── messaging.js               ← Messaging page logic
│   │   └── timeline.js                ← Timeline page logic
│   └── images/
│       └── employees/                 ← Employee photos (named by Employee ID, e.g. EMP-001.svg)
│
├── functions/
│   └── api/                           ← Cloudflare Pages Functions (one file = one endpoint)
│       ├── auth.js                    ← POST/GET /api/auth
│       ├── employees.js               ← /api/employees
│       ├── attendance.js              ← /api/attendance
│       ├── leave.js                   ← /api/leave
│       ├── payroll.js                 ← /api/payroll
│       ├── performance.js             ← /api/performance
│       ├── recruitment.js             ← /api/recruitment
│       ├── tickets.js                 ← /api/tickets
│       ├── documents.js               ← /api/documents
│       ├── messages.js                ← /api/messages
│       ├── timeline.js                ← /api/timeline
│       ├── engagement.js              ← /api/engagement
│       ├── analytics.js               ← /api/analytics
│       ├── ai.js                      ← /api/ai
│       ├── knowledge.js               ← /api/knowledge
│       ├── integrations.js            ← /api/integrations
│       ├── notifications.js           ← /api/notifications  (queue producer)
│       ├── reports.js                 ← /api/reports        (queue producer)
│       ├── sa-auth.js                 ← /api/sa-auth
│       └── sa-org-admins.js           ← /api/sa-org-admins
│
└── queue-consumer/                    ← Standalone Cloudflare Worker (queue consumer)
    ├── wrangler.toml                  ← Consumer Worker config (D1 + R2 bindings)
    └── index.js                       ← Handles notification.created / payroll.run / report.generate
```

---

## Cloudflare Queue Integration

WorkDesk uses **Cloudflare Queues** to offload background jobs from the request/response cycle.

### How it works

1. A Pages Function (producer) publishes a message to `WORKDESK_QUEUE` after accepting an API request.
2. The standalone `queue-consumer` Worker picks up messages in batches and processes them asynchronously.

### Queue Events

| Event | Published by | Consumer action |
|---|---|---|
| `notification.created` | `POST /api/notifications` | INSERT into D1 `notifications` table |
| `payroll.run` | `POST /api/payroll/run` | Compute pay, batch INSERT into `payroll_ledger` |
| `report.generate` | `POST /api/reports` | Aggregate D1 data, serialize, upload to R2 |

### Setup

```bash
# 1. Create the queue
npx wrangler queues create workdesk-queue

# 2. Deploy the Pages site (producer binding is already active in wrangler.toml)
wrangler pages deploy .

# 3. Configure and deploy the consumer Worker
#    Edit queue-consumer/wrangler.toml with your database_id and bucket_name
cd queue-consumer && wrangler deploy
```

### Status

| Component | Status |
|---|---|
| Producer binding in wrangler.toml | ✅ Enabled |
| Producer code in notifications.js | ✅ Complete |
| Producer code in payroll.js | ✅ Complete |
| Producer code in reports.js | ✅ Complete |
| Consumer Worker (queue-consumer/) | ✅ Complete — deploy separately |

> All producers guard the queue call with `if (env.WORKDESK_QUEUE)`, so the API works in demo
> mode even when the queue is not yet configured.

---

## Deployment

WorkDesk is deployed on **Cloudflare Pages**.

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed

### Deploy Steps

```bash
# Install Wrangler
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# 1. Create D1 database
wrangler d1 create workdesk-db
# → Copy database_id into wrangler.toml [[d1_databases]]

# 2. Apply schema
wrangler d1 execute workdesk-db --file=./schema.sql

# 3. Create KV namespace (session store)
wrangler kv:namespace create "SESSIONS"
# → Copy id into wrangler.toml [[kv_namespaces]]

# 4. Create R2 bucket (file storage)
wrangler r2 bucket create workdesk-attachments

# 5. Create the queue
npx wrangler queues create workdesk-queue

# 6. Set secrets
wrangler secret put OPENAI_API_KEY    # optional — for AI Assistant

# 7. Deploy Pages site (includes queue producer binding)
wrangler pages deploy .

# 8. Deploy queue consumer Worker
cd queue-consumer && wrangler deploy
```

### Environment Variables

Uncomment and fill in `wrangler.toml` for non-sensitive config; use `wrangler secret put` for secrets:

```bash
# Non-sensitive (add to [vars] in wrangler.toml)
ENVIRONMENT = "production"
APP_NAME = "WorkDesk"
ALLOWED_EMAIL_DOMAIN = "yourcompany.com"

# Secrets (set via CLI — never commit)
wrangler secret put OPENAI_API_KEY   # optional: external LLM for AI Assistant
```

---

## Cloudflare Backend Notes

This section tracks every Cloudflare binding, secret, and configuration item required to run WorkDesk in production. Use it as a checklist when setting up a new deployment.

**Legend:** ✅ Already configured in source code &nbsp;|&nbsp; ❌ Must be set up by the deployer

---

### WorkDesk App — `workdesk-worker` (Cloudflare Pages project)

Deploy from the repository **root**. Config: `wrangler.toml` / `_headers` / `_redirects`. The Super Admin Panel (`sa-portal.html`, `sa-dashboard.html`, `/api/sa-auth`) is part of this same project.

#### Secrets (set via CLI — never commit)

| Secret | Status | Description | Command |
|---|---|---|---|
| `SA_USERNAME` | ❌ Required | Super-admin login username | `wrangler secret put SA_USERNAME --name workdesk-worker` |
| `SA_SECURITY_KEY` | ❌ Required | Super-admin second-factor key | `wrangler secret put SA_SECURITY_KEY --name workdesk-worker` |
| `SA_PASSWORD` | ❌ Required | Super-admin password | `wrangler secret put SA_PASSWORD --name workdesk-worker` |
| `OPENAI_API_KEY` | ❌ Optional | External LLM for AI Assistant | `wrangler secret put OPENAI_API_KEY --name workdesk-worker` |

After setting all three SA secrets, verify with:
```bash
wrangler secret list --name workdesk-worker
# Expected output lists SA_USERNAME, SA_SECURITY_KEY, SA_PASSWORD
```

#### Bindings (uncomment blocks in `wrangler.toml` after creating each resource)

| Binding | Status | Description | Setup command |
|---|---|---|---|
| D1 Database (`DB`) | ❌ Required | All app data (employees, payroll, attendance, …) | `wrangler d1 create workdesk-db` → paste `database_id` into `[[d1_databases]]` in `wrangler.toml`, then run `wrangler d1 execute workdesk-db --file=./database/schema.sql` |
| KV Namespace (`SESSIONS`) | ❌ Required | User session token storage | `wrangler kv:namespace create "SESSIONS"` → paste `id` into `[[kv_namespaces]]` in `wrangler.toml` |
| R2 Bucket (`ATTACHMENTS`) | ❌ Required | File uploads (documents, message attachments) | `wrangler r2 bucket create workdesk-attachments` → uncomment `[[r2_buckets]]` in `wrangler.toml` |
| Queue Producer (`WORKDESK_QUEUE`) | ❌ Optional | Background jobs (notifications, payroll, reports) | `wrangler queues create workdesk-queue` → uncomment `[[queues.producers]]` in `wrangler.toml` |
| AI Binding | ❌ Optional | Cloudflare Workers AI (AI Assistant page) | Enable **Workers AI** in Cloudflare Dashboard → uncomment `[ai]` in `wrangler.toml` |

#### Already Configured in Source

| Item | Status | What it does | File |
|---|---|---|---|
| SA auth endpoint | ✅ Configured | `POST /api/sa-auth` (3-factor login, timing-safe), `GET /api/sa-auth` (token verify) | `functions/api/sa-auth.js` |
| SA org-admin endpoint | ✅ Configured | `GET/POST/PUT/DELETE /api/sa-org-admins` — protected by SA token guard | `functions/api/sa-org-admins.js` |
| SA config check | ✅ Configured | `GET /api/sa-config-check` — verifies secrets are set | `functions/api/sa-config-check.js` |
| Security headers | ✅ Configured | `X-Frame-Options: DENY`, `X-Content-Type-Options`, CSP, `X-Robots-Tag: noindex` for SA pages/routes | `_headers` |
| Login portal | ✅ Configured | Not linked from the app; includes `noindex` meta tag | `sa-portal.html` |
| Dashboard | ✅ Configured | 8-hour session guard; token decoded and username cross-checked on load | `sa-dashboard.html` |

---

### Super Admin — Visibility &amp; Security Summary

The SA panel is protected at multiple layers to ensure it is **never publicly visible** and only accessible via a direct URL that is never linked publicly:

1. **No public links** — The main app does not link to the SA panel URL anywhere.
2. **`noindex` meta + `X-Robots-Tag`** — Search engines are instructed not to index any SA page or endpoint.
3. **Login wall** — `sa-portal.html` gates all access. `sa-dashboard.html` immediately redirects to the portal if no valid session is found.
4. **3-factor credentials** — Login requires `SA_USERNAME`, `SA_SECURITY_KEY`, and `SA_PASSWORD` simultaneously, all stored as encrypted Cloudflare secrets (never in source code).
5. **Timing-safe comparison** — All credential checks use HMAC-based constant-time comparison to prevent timing attacks.
6. **Token username verification** — `GET /api/sa-auth` and every request to `/api/sa-org-admins` decode the token and verify the embedded username against `env.SA_USERNAME`, preventing forged tokens.
7. **8-hour session expiry** — Client-side session expires automatically; KV-based server-side revocation is available (see optional `SA_SESSIONS` binding).

---

## API Endpoints

All API routes are Cloudflare Pages Functions in `functions/api/`. Every response is `application/json`.
All requests (except `POST /api/auth` and `POST /api/sa-auth`) require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth` | Sign in — returns session token |
| GET | `/api/auth` | Verify session token |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees` | Update employee |
| DELETE | `/api/employees?id=` | Delete employee |
| GET | `/api/attendance` | List attendance records |
| POST | `/api/attendance` | Manual attendance entry |
| POST | `/api/attendance/clock-in` | Clock in |
| POST | `/api/attendance/clock-out` | Clock out |
| GET | `/api/leave` | List leave requests |
| POST | `/api/leave` | File leave request |
| POST | `/api/leave/approve` | Approve leave |
| POST | `/api/leave/reject` | Reject leave |
| GET | `/api/payroll` | List payroll ledger |
| POST | `/api/payroll/run` | Run payroll for period (queued) |
| GET | `/api/performance` | List performance reviews |
| POST | `/api/performance` | Create review |
| PUT | `/api/performance` | Update review |
| GET | `/api/recruitment` | List postings / applicants |
| POST | `/api/recruitment` | Create job posting |
| PUT | `/api/recruitment` | Update posting / applicant |
| DELETE | `/api/recruitment?id=` | Archive posting |
| GET | `/api/tickets` | List tickets |
| POST | `/api/tickets` | Create ticket |
| PUT | `/api/tickets` | Update ticket status |
| DELETE | `/api/tickets?id=` | Delete ticket |
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Create document record |
| PUT | `/api/documents` | Update document metadata |
| DELETE | `/api/documents?id=` | Delete document |
| GET | `/api/messages` | List message threads |
| POST | `/api/messages` | Send message |
| DELETE | `/api/messages?id=` | Delete message |
| GET | `/api/timeline` | List timeline posts |
| POST | `/api/timeline` | Create post (leaders only) |
| POST | `/api/timeline/react` | Toggle reaction |
| POST | `/api/timeline/comments` | Add comment |
| DELETE | `/api/timeline?id=` | Delete post |
| GET | `/api/engagement` | List surveys / results |
| POST | `/api/engagement` | Submit survey response |
| POST | `/api/engagement/survey` | Create survey |
| GET | `/api/analytics` | Get analytics data |
| POST | `/api/ai` | AI chat prompt |
| GET | `/api/ai/history` | AI conversation history |
| GET | `/api/knowledge` | List knowledge articles |
| POST | `/api/knowledge` | Create article |
| PUT | `/api/knowledge` | Update article |
| DELETE | `/api/knowledge?id=` | Delete article |
| GET | `/api/integrations` | List integrations |
| POST | `/api/integrations` | Enable integration |
| PUT | `/api/integrations` | Update integration config |
| DELETE | `/api/integrations?id=` | Disable integration |
| GET | `/api/notifications` | List notifications for user |
| POST | `/api/notifications` | Create notification (queued) |
| PATCH | `/api/notifications?id=` | Mark notification as read |
| DELETE | `/api/notifications?id=` | Delete notification |
| GET | `/api/reports` | List recent reports |
| POST | `/api/reports` | Generate report (queued) |
| POST | `/api/sa-auth` | Super Admin login |
| GET | `/api/sa-org-admins` | List org admins (SA only) |
| POST | `/api/sa-org-admins` | Create org admin (SA only) |
| PUT | `/api/sa-org-admins` | Update org admin (SA only) |
| DELETE | `/api/sa-org-admins?id=` | Delete org admin (SA only) |

---

## Design System

WorkDesk uses a **token-based design system** defined in `assets/css/styles.css` (`:root` CSS variables) and documented in `DESIGN_SYSTEM.md`.

### Brand Colors

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#3A8F7B` | Buttons, active states, links |
| `--accent` | `#F4C86A` | Warnings, highlights |
| `--success` | `#3CB371` | Success states |
| `--danger` | `#E74C3C` | Error states, delete actions |
| `--text-main` | `#1A202C` | Body text |
| `--text-muted` | `#718096` | Secondary text |
| `--bg-main` | `#F7F8FA` | Page background |

### Typography

- **Font Family:** Inter (Google Fonts)
- **Weights:** 400, 500, 600, 700, 800

---

## Getting Started (Local Preview)

Since WorkDesk is a zero-build static site, you can preview it instantly with any local HTTP server.

### Option 1 — VS Code Live Server (Recommended)

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `login.html` → **Open with Live Server**.

### Option 2 — Python

```bash
cd /path/to/WorkDesk
python3 -m http.server 8080
# Open http://localhost:8080/login.html
```

### Option 3 — Node.js (npx serve)

```bash
npx serve .
# Open http://localhost:3000/login.html
```

### Default Login (Static / Demo)

Any valid email format + any password will navigate to the dashboard in static preview mode (the API call gracefully falls back when the Worker is not deployed).

---

## Guidelines & Conventions

### Naming Conventions

- **Employee IDs:** `EMP-001` format — three-digit zero-padded number prefixed with `EMP-`
- **Employee Photos:** Must be named exactly as the Employee ID (e.g., `EMP-001.jpg`, `EMP-001.svg`, `EMP-001.png`) and placed in `assets/images/employees/`
- **CSS Tokens:** Always use CSS custom properties from `:root` (e.g., `var(--primary)`). Never hardcode hex values.
- **JS Files:** One JavaScript file per page, located in `assets/js/`. Shared auth logic lives in `auth.js` at the project root.
- **API Files:** Each endpoint has its own file in `functions/api/`.

### Code Style

- **No frameworks, no bundler.** Keep the zero-build constraint.
- **Vanilla ES5/ES6** JavaScript only.
- **No inline styles** for design values — use CSS tokens.
- **HTML escaping** is required before rendering any user-provided data to prevent XSS (`escapeHtml()` helper is available in each JS file).
- **Accessibility:** All interactive elements must have `aria-label`, `role`, and keyboard support (Enter/Space).

### Security

- All HTTP security headers are defined in `_headers` (X-Frame-Options, CSP, etc.).
- Sessions are stored in `localStorage` under `workdesk_token` and `workdesk_display_name`.
- Logout clears `localStorage` and redirects to `login.html`.
- The Content Security Policy allows only `res.cloudinary.com` for external images and `fonts.googleapis.com` / `fonts.gstatic.com` for fonts.

### Adding a New Page

1. Copy the sidebar + topbar structure from any existing page (e.g., `employees.html`).
2. Set the correct `<li class="active">` item in the sidebar.
3. Add a new `<li>` entry in the sidebar of all other pages pointing to your new page.
4. If your page needs JavaScript, create `assets/js/yourpage.js` and include it at the bottom of the page.
5. If your page needs an API endpoint, create `functions/api/yourroute.js`.

---

## License

© WorkDesk — All rights reserved.

WorkDesk is proprietary software. Unauthorized copying, distribution, or modification of any part of this project is strictly prohibited.
