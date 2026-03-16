# myWorkDesk Branding Guide

## Purpose

myWorkDesk uses branded workspace-centric terminology across the platform.
To help new users understand the standard HR system terms behind each branded name,
every navigation item displays a small information icon **ⓘ**.
Hovering over the icon shows the conventional HR term as a tooltip.

**Example:**

> DeskMates ⓘ  
> *Tooltip: Employees*

---

## Brand Philosophy

myWorkDesk is designed as a modern workspace operating system where traditional HR
software language is replaced with clean, intuitive workspace-based terminology.
The goal is a platform that feels modern, simple, and powerful while maintaining
enterprise capability.

**Official Tagline:** *The Intelligent Workspace Operating System*

---

## Core Platform Terminology

| Standard Term       | myWorkDesk Branding |
|---------------------|---------------------|
| Platform            | myWorkDesk          |
| Organization        | Workspace           |
| Employee            | DeskMate            |
| Manager             | DeskLead            |
| HR Admin            | Workspace Admin     |
| Super Admin         | Platform Owner      |
| User Account        | DeskID              |
| Department          | Unit                |
| Team                | DeskTeam            |

---

## Main Navigation Terminology

| Standard Page Name    | myWorkDesk Page Name |
|-----------------------|----------------------|
| Dashboard             | Control Center       |
| Employees             | DeskMates            |
| Attendance            | DeskPresence         |
| Leave                 | DeskAway             |
| Payroll               | PayDesk              |
| Performance           | ImpactDesk           |
| Recruitment           | TalentDesk           |
| Support Tickets       | HelpDesk             |
| Documents             | DocDesk              |
| Projects              | DeskProjects         |
| Messaging             | TalkDesk             |
| Timeline / Feed       | DeskStream           |
| Employee Engagement   | PulseDesk            |
| Analytics             | InsightDesk          |
| AI Assistant          | DeskAI               |
| Knowledge Base        | DeskWiki             |
| Integrations          | ConnectDesk          |
| Settings              | ControlDesk          |

---

## Module-Level Terminology

### Employee Management

| Standard Term         | myWorkDesk Branding  |
|-----------------------|----------------------|
| Employee Directory    | DeskMate Directory   |
| Add Employee          | Invite DeskMate      |
| Employee Profile      | DeskMate Profile     |
| Employee ID           | DeskID               |
| Employee Records      | DeskMate Records     |

### Attendance System

| Standard Term    | myWorkDesk Branding |
|------------------|---------------------|
| Attendance       | DeskPresence        |
| Clock In         | Start DeskSession   |
| Clock Out        | End DeskSession     |
| Attendance Log   | Presence Log        |
| Work Hours       | DeskHours           |

### Leave Management

| Standard Term  | myWorkDesk Branding |
|----------------|---------------------|
| Leave Request  | DeskAway Request    |
| Vacation Leave | TimeAway            |
| Sick Leave     | HealthAway          |
| Leave Balance  | Time Balance        |
| Leave Approval | Time Approval       |

### Payroll System

| Standard Term   | myWorkDesk Branding |
|-----------------|---------------------|
| Payroll         | PayDesk             |
| Payslip         | PayStatement        |
| Payroll Run     | PayCycle            |
| Salary          | PayBase             |
| Payroll Summary | PaySummary          |
| Payroll Ledger  | PayLedger           |

### Performance Management

| Standard Term       | myWorkDesk Branding |
|---------------------|---------------------|
| Performance         | ImpactDesk          |
| Performance Review  | Impact Review       |
| KPIs                | Impact Metrics      |
| Goals               | DeskGoals           |
| Employee Evaluation | Impact Score        |

### Recruitment System

| Standard Term    | myWorkDesk Branding |
|------------------|---------------------|
| Recruitment      | TalentDesk          |
| Job Posting      | Opportunity Post    |
| Applicants       | Talent Profile      |
| Candidates       | Talent Pool         |
| Hiring Pipeline  | Talent Flow         |

### Help Desk System

| Standard Term  | myWorkDesk Branding |
|----------------|---------------------|
| Support Ticket | Help Request        |
| Open Ticket    | Open Help Request   |
| Ticket Status  | Help Status         |
| Support Agent  | Help Specialist     |

### Document Management

| Standard Term        | myWorkDesk Branding |
|----------------------|---------------------|
| Documents            | DocDesk             |
| Upload Document      | Store File          |
| File Storage         | DocVault            |
| Document Repository  | DocLibrary          |

### Project Management

| Standard Term        | myWorkDesk Branding |
|----------------------|---------------------|
| Projects             | DeskProjects        |
| Project              | DeskProject         |
| Task Board           | DeskBoard           |
| Milestone            | DeskMilestone       |
| Task                 | DeskTask            |
| Team Collaboration   | DeskCollab          |

### Messaging System

| Standard Term | myWorkDesk Branding |
|---------------|---------------------|
| Messaging     | TalkDesk            |
| Chat          | DeskTalk            |
| Direct Message| Direct Talk         |
| Group Chat    | Team Talk           |
| Conversation  | TalkThread          |

### Company Timeline

| Standard Term | myWorkDesk Branding |
|---------------|---------------------|
| Timeline      | DeskStream          |
| Announcement  | DeskUpdate          |
| Activity Feed | Stream Activity     |
| Post          | Workspace Update    |

### Engagement System

| Standard Term      | myWorkDesk Branding |
|--------------------|---------------------|
| Employee Engagement| PulseDesk           |
| Survey             | Pulse Check         |
| Satisfaction Score | Pulse Score         |
| Feedback           | Pulse Feedback      |

### Analytics System

| Standard Term       | myWorkDesk Branding |
|---------------------|---------------------|
| Analytics           | InsightDesk         |
| HR Metrics          | Work Insights       |
| Performance Metrics | Impact Analytics    |
| Reports             | Insight Reports     |

### AI System

| Standard Term  | myWorkDesk Branding |
|----------------|---------------------|
| AI Assistant   | DeskAI              |
| Ask AI         | Ask DeskAI          |
| AI Suggestions | Smart Insights      |
| AI Reports     | AI Summary          |

### Knowledge System

| Standard Term          | myWorkDesk Branding |
|------------------------|---------------------|
| Knowledge Base         | DeskWiki            |
| Policies               | PolicyVault         |
| HR Handbook            | Workspace Guide     |
| Internal Documentation | KnowledgeVault      |

### Integrations System

| Standard Term   | myWorkDesk Branding |
|-----------------|---------------------|
| Integrations    | ConnectDesk         |
| Add Integration | Connect Service     |
| Third-Party Apps| Connected Apps      |

### Settings / Configuration

| Standard Term         | myWorkDesk Branding   |
|-----------------------|-----------------------|
| Settings              | ControlDesk           |
| User Settings         | DeskMate Controls     |
| Organization Settings | Workspace Controls    |
| Platform Settings     | System Controls       |

### Super Admin Terminology

| Standard Term          | myWorkDesk Branding      |
|------------------------|--------------------------|
| Super Admin            | Platform Owner           |
| Admin Dashboard        | Platform Control Center  |
| Organization Management| Workspace Governance     |
| Admin Accounts         | Workspace Controllers    |
| Platform Analytics     | Platform Insights        |

---

## Tooltip Implementation

Each branded navigation label includes an **ⓘ** info icon. When hovered, it shows
the conventional HR term so new users can orient themselves.

### HTML Structure

```html
<span class="nav-label">
  DeskMates
  <span class="nav-info-icon" data-term="Employees">ⓘ</span>
</span>
```

### CSS

```css
/* Info icon */
.nav-info-icon {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.7;
  margin-left: 4px;
  cursor: help;
  position: relative;
}

/* Tooltip bubble */
.nav-info-icon::after {
  content: attr(data-term);
  position: absolute;
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--text-main);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 200;
}

/* Show tooltip only when sidebar is expanded */
.sidebar:hover .nav-info-icon:hover::after {
  visibility: visible;
  opacity: 1;
}
```

### Collapsed Sidebar Behaviour

When the sidebar is collapsed (64 px), the `data-tooltip` attribute on the `<li>`
element shows the branded name as a tooltip on hover — no standard term is shown
in this state to keep the UI clean.

---

## Benefits

- Maintains strong product branding
- Helps new users understand terminology
- Improves onboarding experience
- Keeps UI clean and professional
- Creates a unique SaaS identity
