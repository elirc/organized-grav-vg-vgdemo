# Interview Demo Script

## 30-Second Summary

GlobalHire Lite is a full-stack Employer of Record demo app. It lets a client company manage international workers through worker creation, onboarding, leave, timesheets, payroll preview, invoice preview, and offboarding. I built it with React, TypeScript, Node, Express, Prisma, PostgreSQL, Zod, and TanStack Query to demonstrate realistic CRUD plus workflow state transitions.

## 2-Minute Project Pitch

GlobalHire Lite is a lightweight version of an EOR platform. The main idea is that a client organization can hire workers in multiple countries, generate country-based onboarding tasks, track documents and approvals, manage leave and timesheets, calculate a simplified payroll preview, generate an invoice, and eventually offboard a worker.

From an engineering perspective, the interesting parts are:

- Role-based access for platform, EOR, client admin, manager, and worker roles.
- Multi-tenant scoping so client users only see their own organization.
- Service-layer business rules for worker activation, payroll calculation, payroll state transitions, leave/timesheet approvals, and invoice generation.
- A relational data model in Prisma/PostgreSQL.
- Shared Zod schemas used by both frontend forms and backend request validation.

I intentionally kept it realistic but not over-engineered. It does not implement real payroll, legal compliance, file storage, e-signatures, or payments. Instead, it shows where those concerns would fit.

## 5-Minute Walkthrough

1. Open `/login`.
2. Log in as `client.admin@acme.test`.
3. Show the dashboard: active workers, onboarding workers, pending approvals, current payroll, offboarding.
4. Open Workers and create a worker.
5. Open the worker detail page and show generated onboarding tasks.
6. Log out and log in as `eor.specialist@globalhire.test`.
7. Approve/reject onboarding tasks.
8. Open Payroll, show a calculated/approved/locked run, and show payroll items.
9. Generate or view an invoice.
10. Open Audit Log and explain traceability.

## 10-Minute Deeper Technical Walkthrough

### Architecture

Open:

- [apps/api/src/app.ts](../../apps/api/src/app.ts)
- [apps/web/src/App.tsx](../../apps/web/src/App.tsx)
- [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)

Say:

> The project is a small monorepo with an Express API, React/Vite frontend, and shared Zod schemas. The backend owns business rules and data access. The frontend is mostly server-state driven with TanStack Query.

### Auth/RBAC

Open:

- [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)
- [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)
- [apps/api/src/middleware/requireRole.middleware.ts](../../apps/api/src/middleware/requireRole.middleware.ts)
- [apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx)

Say:

> Login validates the password with bcrypt, signs a JWT, and stores it in an HTTP-only cookie. Protected routes use `requireAuth`; role checks are explicit with `requireRole`. I kept this readable rather than building a large permission framework.

### Multi-Tenancy

Open:

- [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)
- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)

Say:

> Client users have an `organizationId`. Platform and EOR users can operate across organizations. Worker users are scoped to their own worker profile. The backend enforces this through `requireOrgAccess` and query filters like `getWorkerWhereForActor`.

### Worker/Onboarding

Open:

- [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)
- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
- [apps/api/src/modules/onboarding/onboarding.routes.ts](../../apps/api/src/modules/onboarding/onboarding.routes.ts)

Say:

> Worker creation creates the worker, employment record, onboarding tasks, and audit log in one transaction. The onboarding list is generated from country rules.

### Payroll/Invoice

Open:

- [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)
- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
- [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

Say:

> Payroll is where most business rules live. It includes only active workers and approved overtime. The state transition is DRAFT to CALCULATED to APPROVED to LOCKED. Invoice generation is allowed only after approval or lock.

## Suggested Demo Path Through The UI

1. `/login`: click Login as Client Admin.
2. `/dashboard`: explain summary cards.
3. `/workers`: show search/filter and statuses.
4. `/workers/new`: create a simple worker.
5. Worker detail: show employment, country rules, onboarding checklist.
6. Log in as EOR Specialist.
7. Worker detail: approve/reject onboarding tasks.
8. `/leave`: approve/reject a pending leave request.
9. `/timesheets`: approve/reject a submitted timesheet.
10. `/payroll`: open a payroll run.
11. `/payroll/:id`: explain totals/items and transitions.
12. `/invoices`: show invoice preview.
13. `/audit-log`: show workflow traceability.

## Code Editor Files To Open

Architecture:

- [apps/api/src/app.ts](../../apps/api/src/app.ts)
- [apps/web/src/App.tsx](../../apps/web/src/App.tsx)
- [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)

Business logic:

- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
- [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

Frontend/backend interaction:

- [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts)
- [apps/web/src/api/payroll.api.ts](../../apps/web/src/api/payroll.api.ts)
- [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)

Auth:

- [apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx)
- [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts)
- [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)

Tests:

- [apps/api/src/tests/business-rules.test.ts](../../apps/api/src/tests/business-rules.test.ts)

## What To Say If Asked Why You Built It This Way

> I optimized for a realistic but explainable demo. I used explicit route guards and service-level checks because they are easy to read and test. I used enums for workflow states rather than a full state-machine library because the workflows are small. I used Prisma because it makes the relational model clear and lets me move quickly while still using PostgreSQL.

## What To Say About Tradeoffs

> The app is intentionally not production-complete. It does not implement real payroll compliance, document storage, payments, notifications, or e-signatures. Some backend modules put logic directly in routes instead of services. Some frontend actions are demo buttons instead of full forms. I would improve those if I were turning this into a production product, but for an interview project I prioritized readable end-to-end workflows.

## What To Say About Future Improvements

- Add full frontend create forms for leave, timesheets, and offboarding.
- Move remaining route-level business logic into services.
- Add API integration tests with a test Postgres database.
- Add policy-based authorization or row-level security.
- Add real document storage and signed URLs.
- Add background jobs for payroll processing.
- Add observability, structured logs, request IDs, and CI/CD.
