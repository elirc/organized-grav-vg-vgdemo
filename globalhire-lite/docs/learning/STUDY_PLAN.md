# 5-Day Study Plan

This plan is designed for interview preparation. The goal is not to memorize every file. The goal is to understand the main data model, the request flow, the business rules, and the tradeoffs well enough to explain them naturally.

## Day 1: Architecture And Data Model

Theme:
Understand what the app is, how it is organized, and how the database models fit together.

Files to read:
- `README.md`
- `docs/learning/CODEBASE_OVERVIEW.md`
- `docs/learning/DOMAIN_MODEL_EXPLAINED.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/web/src/App.tsx`
- `apps/api/src/app.ts`

Flows to trace:
- Open the app and log in as Client Admin.
- Visit `/dashboard`, `/workers`, and one worker detail page.
- Compare what you see in the UI to seeded records in `apps/api/prisma/seed.ts`.

Things to run locally:
- Start Postgres if needed.
- Start the API.
- Start the web app.
- Visit `http://localhost:4000/api/health`.
- Visit `http://localhost:5173`.

Questions to answer out loud:
- What is GlobalHire Lite?
- What is an Employer of Record in this simplified demo?
- What are the most important models?
- Why is `Organization` central to the system?
- What is the difference between `User` and `Worker`?

Code-reading exercise:
In `apps/api/prisma/schema.prisma`, follow this chain:
`Organization` -> `Worker` -> `Employment` -> `OnboardingTask` -> `PayrollItem`.

Explain what each relation means in plain English.

Mock interview exercise:
Give a 2-minute project pitch using this shape:
1. What the app does.
2. What stack it uses.
3. What workflows it supports.
4. What engineering concepts it demonstrates.
5. What is intentionally simplified.

## Day 2: Auth, RBAC, And Multi-Tenancy

Theme:
Understand login, current-user state, role checks, and organization scoping.

Files to read:
- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/hooks/useAuth.tsx`
- `apps/web/src/api/client.ts`
- `apps/web/src/api/auth.api.ts`
- `apps/api/src/modules/auth/auth.routes.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/web/src/hooks/useRole.ts`
- `apps/web/src/components/layout/Sidebar.tsx`

Flows to trace:
- Login as Platform Admin.
- Login as Client Admin.
- Login as Worker.
- Notice how sidebar links and visible actions change by role.
- Try to explain why the UI hiding links is helpful but not sufficient for security.

Things to run locally:
- Use browser dev tools Network tab during login.
- Inspect `POST /api/auth/login`.
- Inspect `GET /api/auth/me`.
- Confirm cookies are included in requests.

Questions to answer out loud:
- How does login work from React to Express?
- Where is the JWT created?
- How does the browser send auth on later requests?
- What does `requireAuth()` do?
- What does `requireRole()` do?
- How does tenant scoping work?
- Why can Platform Admin see more than Client Admin?

Code-reading exercise:
Trace `LoginPage.tsx` -> `useAuth.tsx` -> `auth.api.ts` -> `client.ts` -> `auth.routes.ts` -> `auth.controller.ts` -> `auth.service.ts`.

Write down one sentence for what each file contributes.

Mock interview exercise:
Answer this question out loud:

"How did you implement auth and role-based access in this app, and what would you improve for production?"

Use this answer pattern:
- Current implementation
- Why it is enough for the demo
- What production would need next

## Day 3: Worker And Onboarding Workflow

Theme:
Understand the hiring/onboarding part of the lifecycle.

Files to read:
- `apps/web/src/features/workers/WorkersPage.tsx`
- `apps/web/src/features/workers/NewWorkerPage.tsx`
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `apps/web/src/features/onboarding/OnboardingPage.tsx`
- `apps/web/src/api/workers.api.ts`
- `packages/shared/src/index.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/onboarding/onboarding.routes.ts`
- `apps/api/src/modules/documents/documents.routes.ts`

Flows to trace:
- Client Admin creates a worker.
- Generated onboarding tasks appear on the worker detail page.
- Worker submits an onboarding task.
- EOR Specialist approves the task.
- Try activating a worker before and after required tasks are approved and contract is signed.

Things to run locally:
- Log in as Client Admin and create a worker.
- Log in as EOR Specialist and review onboarding.
- Watch API requests in the Network tab.

Questions to answer out loud:
- What happens when a worker is created?
- How are onboarding tasks generated?
- How do country rules affect onboarding?
- What must be true before a worker becomes active?
- Where is activation enforced?
- Why should activation be backend logic instead of frontend logic?

Code-reading exercise:
Open `apps/api/src/modules/workers/workers.service.ts`.

Find:
- `onboardingTemplates()`
- `createWorker()`
- `activateWorker()`

For each function, write:
- Inputs
- Main checks
- Database writes
- Audit log behavior

Mock interview exercise:
Walk through "Client admin creates a worker" from UI to database in 3 minutes.

Use these checkpoints:
- React page
- Shared Zod schema
- API client
- Express route
- Service function
- Prisma transaction
- Models touched
- UI invalidation/update

## Day 4: Payroll, Invoice, Leave, Timesheets, And Offboarding

Theme:
Understand the operational workflows after a worker is active.

Files to read:
- `apps/web/src/features/payroll/PayrollPage.tsx`
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`
- `apps/web/src/features/invoices/InvoicesPage.tsx`
- `apps/web/src/features/leave/LeavePage.tsx`
- `apps/web/src/features/timesheets/TimesheetsPage.tsx`
- `apps/web/src/features/offboarding/OffboardingPage.tsx`
- `apps/web/src/api/payroll.api.ts`
- `apps/web/src/api/resources.api.ts`
- `apps/api/src/modules/payroll/payroll.routes.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/invoices/invoices.routes.ts`
- `apps/api/src/modules/leave/leave.service.ts`
- `apps/api/src/modules/timesheets/timesheets.service.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`

Flows to trace:
- Create payroll run.
- Calculate payroll.
- Approve payroll.
- Lock payroll.
- Generate invoice.
- Approve or reject a leave request.
- Approve or reject a timesheet.
- Complete offboarding.

Things to run locally:
- Log in as Client Admin and view payroll.
- Log in as EOR Specialist and approve/lock payroll.
- Open a payroll detail page and inspect totals.
- Open invoices and verify the generated invoice.

Questions to answer out loud:
- Why are only active workers included in payroll?
- How does approved overtime affect payroll?
- What are the payroll states?
- Why can locked payroll not be modified?
- How is an invoice calculated from payroll?
- What does offboarding completion update?

Code-reading exercise:
Open `apps/api/src/modules/payroll/payroll.service.ts`.

Trace these functions:
- `createPayrollRun()`
- `calculatePayrollRun()`
- `approvePayrollRun()`
- `lockPayrollRun()`

Then open `apps/api/src/modules/invoices/invoices.service.ts` and explain how invoice totals are derived.

Mock interview exercise:
Give a 5-minute technical walkthrough of payroll:
- Data model
- API flow
- Service rules
- Calculations
- State transitions
- Tests
- Limitations

## Day 5: Tests, Demo Script, And Interview Q&A

Theme:
Practice explaining the project clearly and honestly.

Files to read:
- `docs/learning/INTERVIEW_DEMO_SCRIPT.md`
- `docs/learning/INTERVIEW_QUESTION_BANK.md`
- `docs/learning/PRODUCTION_IMPROVEMENTS.md`
- `docs/learning/BUSINESS_LOGIC_GUIDE.md`
- `apps/api/src/tests/business-rules.test.ts`
- `apps/web/src/features/auth/LoginPage.test.tsx`
- `apps/web/src/features/workers/WorkersPage.test.tsx`
- `apps/web/src/features/onboarding/OnboardingPage.test.tsx`
- `apps/web/src/features/payroll/PayrollDetailPage.test.tsx`
- `TESTING.md`

Flows to trace:
- Login demo path.
- Worker creation demo path.
- Onboarding approval demo path.
- Payroll and invoice demo path.
- One honest limitation/future improvement.

Things to run locally:
- Run backend tests.
- Run frontend tests.
- Run the UI and practice the exact demo path.
- Open code editor tabs in the order you would show them during an interview.

Questions to answer out loud:
- What tests exist and why?
- What would you test next?
- What is the weakest part of the app?
- What did you intentionally simplify?
- How would you make this production-ready?

Code-reading exercise:
Open `apps/api/src/tests/business-rules.test.ts`.

For each test, identify:
- Business rule being tested
- Service function under test
- Why the rule matters
- What related case is not tested yet

Mock interview exercise:
Do a 10-minute mock demo:
1. 30-second summary.
2. UI walkthrough.
3. Open `schema.prisma`.
4. Open `workers.service.ts`.
5. Open `payroll.service.ts`.
6. Open `auth.middleware.ts`.
7. Open one frontend page and one API client.
8. End with tradeoffs and production improvements.

## Final Checklist

You should be able to explain these without notes:

- What GlobalHire Lite does.
- The difference between `User`, `Worker`, `Employment`, and `Organization`.
- Why `Organization` is the tenant boundary.
- How login works from `LoginPage.tsx` to `auth.service.ts`.
- How the JWT cookie is used by later API calls.
- Why frontend role checks are not enough by themselves.
- How backend RBAC is enforced with `requireRole()`.
- How tenant scoping is enforced with organization checks and scoped Prisma queries.
- What happens when a client admin creates a worker.
- How country rules generate onboarding tasks.
- Why activation requires approved tasks and a signed contract.
- How leave and timesheet approval work.
- How payroll calculation includes active workers and approved overtime.
- What the payroll state transitions are.
- How invoice totals are generated.
- What offboarding completion changes.
- Where audit logs are written.
- Which business rules are covered by tests.
- Which areas are intentionally simplified.
- What you would improve first in production.

## Suggested Code Tabs For Interview Practice

Keep these files ready:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/hooks/useAuth.tsx`
- `apps/web/src/api/client.ts`
- `apps/web/src/features/workers/NewWorkerPage.tsx`
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`
- `packages/shared/src/index.ts`
- `apps/api/src/tests/business-rules.test.ts`

## One-Sentence Mental Model

GlobalHire Lite is a tenant-scoped workflow app where the backend owns role checks, state transitions, and payroll/onboarding rules, while the React frontend provides a role-aware dashboard for driving those workflows through REST APIs.
