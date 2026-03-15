# WorkDesk Hub

> **WorkDesk** is a comprehensive Human Resource Information System (HRIS) built as a zero-dependency, static web application deployed on Cloudflare Pages. It covers everything from employee management to payroll, attendance, messaging, and more — all in a clean, modern interface.

🌐 **Live Demo:** [https://workdesk.pages.dev](https://workdesk.pages.dev)

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
   - [Messaging](#7-messaging)
   - [Timeline](#8-timeline--announcements)
   - [Settings](#9-settings)
3. [Roles & Career Levels](#roles--career-levels)
4. [Access & Permissions](#access--permissions)
5. [Tech Stack](#tech-stack)
6. [Project Structure](#project-structure)
7. [Deployment](#deployment)
8. [API Endpoints](#api-endpoints)
9. [Design System](#design-system)
10. [Getting Started (Local Preview)](#getting-started-local-preview)
11. [Guidelines & Conventions](#guidelines--conventions)
12. [License](#license)

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

---

### 9. Settings

**Page:** `settings.html`

Central configuration hub for profiles, roles, permissions, and organization settings.

| Section | Access | Description |
|---|---|---|
| Profile Settings | All users | Update display name, email, position, department, password |
| Roles & Career Levels | All users (view) | Reference guide for the 5 organizational roles and 8 career levels |
| Access & Permissions | Manager+ (edit) | Role-based permission matrix; approval chain documentation |
| Organization Settings | Admin+ | Org name, industry, size, timezone, country; manage Admin users |
| Platform Settings | Admin+ | Time format (12h/24h), date format, currency, work week start, notifications, audit footprints |

**Super Admin exclusive features** (Platform Settings tab):
- Create a new Organization
- Modify or deactivate Organizations
- Add / remove Organization Admin access

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
| Backend | Cloudflare Workers (JavaScript) |
| Hosting | Cloudflare Pages |
| Database | Cloudflare D1 (SQLite, Workers binding) |
| Session Store | Cloudflare KV |
| File Storage | Cloudflare R2 |
| Fonts | Google Fonts — Inter |
| Assets / CDN | Cloudinary (logo asset) |

**No build step required.** No npm, no bundler, no framework.

---

## Project Structure

```
WorkDesk/
├── README.md                          ← This file
├── DESIGN_SYSTEM.md                   ← Design tokens, brand guidelines
├── wrangler.toml                      ← Cloudflare Workers/Pages config
├── _headers                           ← Cloudflare Pages HTTP security headers
├── index.html                         ← Root redirect to login.html
├── login.html                         ← Authentication page
├── dashboard.html                     ← Main HRIS dashboard
├── employees.html                     ← Employee directory & management
├── attendance.html                    ← Attendance tracking
├── leave.html                         ← Leave request management
├── payroll.html                       ← Payroll overview
├── messaging.html                     ← Internal messaging
├── timeline.html                      ← Announcement feed
├── settings.html                      ← Settings (profile, roles, permissions, org, platform)
├── auth.js                            ← Shared auth helpers (login/logout)
├── Baground theme login page .png     ← Login background image
├── assets/
│   ├── css/
│   │   └── styles.css                 ← Single global stylesheet (CSS tokens)
│   ├── js/
│   │   ├── dashboard.js               ← Dashboard page logic
│   │   ├── messaging.js               ← Messaging page logic
│   │   └── timeline.js                ← Timeline page logic
│   └── images/
│       └── employees/                 ← Employee photos (named by Employee ID)
│           ├── EMP-001.svg
│           ├── EMP-002.svg
│           └── …
└── functions/
    └── api/
        ├── auth.js                    ← POST /api/auth — login endpoint
        ├── employees.js               ← GET/POST /api/employees
        ├── attendance.js              ← GET/POST /api/attendance
        ├── leave.js                   ← GET/POST /api/leave
        └── payroll.js                 ← GET /api/payroll
```

---

## Deployment

WorkDesk is deployed on **Cloudflare Pages**.

🌐 **Live URL:** [https://workdesk.pages.dev](https://workdesk.pages.dev)

### Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed

### Deploy Steps

```bash
# Install Wrangler
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy .
```

### Environment Variables (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"
APP_NAME = "WorkDesk"
ALLOWED_EMAIL_DOMAIN = "yourcompany.com"
```

---

## API Endpoints

All API routes are handled by Cloudflare Workers in the `functions/api/` directory.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth` | Login — validates credentials, returns session token |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create or update an employee record |
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance` | Log a clock-in or clock-out event |
| GET | `/api/leave` | List leave requests |
| POST | `/api/leave` | Submit or update a leave request |
| GET | `/api/payroll` | Get payroll records |

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
