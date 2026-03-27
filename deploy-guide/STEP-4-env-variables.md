# STEP 4 — Environment Variables

Set these **before** clicking the first deploy. You can also add/edit them later from the project settings.

---

## How to Add Environment Variables (during initial setup)

On the **Build settings** page scroll down to the **Environment variables (advanced)** section:

1. Click **Add variable**
2. Fill in the **Variable name** and **Value**
3. Repeat for each variable below
4. Use **Encrypt** (the lock icon) for all secret/password values

---

## Required Variables

### Super-Admin Portal (`/app/login.html` — Super Admin role)

> **Important:** `SA_SECURITY_KEY` must begin with `SA`, `SUPER`, or `CEO`
> (e.g. `SA-MyKey123`, `SUPER-SecretKey`, `CEO-2025`) so the login page can
> automatically detect the Super Admin role when the key is entered as the
> Employee ID.

| Variable          | Value (your choice)          | Encrypt? |
|-------------------|------------------------------|----------|
| `SA_USERNAME`     | e.g. `superadmin`            | ✅ Yes   |
| `SA_SECURITY_KEY` | e.g. `SA-yourSecretKey123`   | ✅ Yes   |
| `SA_PASSWORD`     | e.g. `Admin@StrongPass1`     | ✅ Yes   |

> **Demo / staging defaults (non-production only):** If these variables are not
> set and `ENVIRONMENT` is not `production`, the backend uses built-in demo
> credentials: Security Key = `SA-DEMO-2025`, Username = `CEO`,
> Password = `WorkDesk@2025`. Never use these defaults in a live deployment.

### Demo / Regular Login (`/app/login.html`)

The login page uses a **2-step flow**:
1. **Step 1 — Employee ID:** The system auto-detects your role:
   - `SA-…` / `SUPER-…` / `CEO` → Super Admin
   - `ADMIN-…` / `ADM-…` → Admin
   - anything else → Employee
2. **Step 2 — Username + Password:**
   - **Super Admin:** Username = `SA_USERNAME`, Password = `SA_PASSWORD`
     (the Employee ID entered in Step 1 is your Security Key = `SA_SECURITY_KEY`)
   - **Admin / Employee:** Username = Organization ID (`DEMO_ORG_ID`), Password = `DEMO_PASSWORD`

| Variable           | Value           | Encrypt? |
|--------------------|-----------------|----------|
| `DEMO_ORG_ID`      | `DEMO`          | No       |
| `DEMO_EMPLOYEE_ID` | `EMP001`        | No       |
| `DEMO_PASSWORD`    | your password   | ✅ Yes   |

> If you skip `DEMO_ORG_ID` / `DEMO_EMPLOYEE_ID`, they default to `DEMO` and `EMP001`.  
> If you skip `DEMO_PASSWORD`, the hardcoded default in `functions/api/auth.js` will be used — **not recommended for production**.

---

## How to Edit Variables After Deployment

1. Go to https://dash.cloudflare.com
2. **Workers & Pages** → **myworkdeskapp** → **Settings** → **Environment variables**
3. Click **Edit variables**, make your changes, then click **Save and deploy**

---

## Production vs Preview Environments

Cloudflare Pages has two environments:

| Environment  | When used                                  |
|--------------|--------------------------------------------|
| `Production` | Pushes to the `main` branch                |
| `Preview`    | Pushes to any other branch / pull requests |

Set your variables in **Production** (and optionally in **Preview** with test values).

---

➡️ Next: [STEP-5-deploy-and-verify.md](./STEP-5-deploy-and-verify.md)
