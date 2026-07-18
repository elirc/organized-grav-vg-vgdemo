# Backend Guide

## What To Read First

Read these files in order:

1. [apps/api/src/server.ts](../../apps/api/src/server.ts)
2. [apps/api/src/app.ts](../../apps/api/src/app.ts)
3. [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)
4. [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)
5. [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
6. [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
7. [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)
8. [apps/api/prisma/seed.ts](../../apps/api/prisma/seed.ts)

## Server Entry Point

[apps/api/src/server.ts](../../apps/api/src/server.ts) imports the Express `app` and listens on `env.PORT`.

This file is intentionally tiny. It keeps server startup separate from app configuration, which makes the Express app easier to test or reuse.

## Express App Setup

[apps/api/src/app.ts](../../apps/api/src/app.ts) configures:

- `helmet()` for basic security headers.
- CORS for local dev origins.
- JSON body parsing.
- Cookie parsing.
- `/api/health`.
- Public auth routes.
- `requireAuth` for all protected routes.
- Domain routers.
- Not-found and error handlers.

Important ordering:

```text
/api/auth mounted first
/api protected by requireAuth
domain routers mounted after requireAuth
errorHandler mounted last
```

This order means login is public, but most business routes require a valid session.

## Route Registration

Main routers:

- Auth: [apps/api/src/modules/auth/auth.routes.ts](../../apps/api/src/modules/auth/auth.routes.ts)
- Organizations: [apps/api/src/modules/organizations/organizations.routes.ts](../../apps/api/src/modules/organizations/organizations.routes.ts)
- Workers: [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts)
- Onboarding: [apps/api/src/modules/onboarding/onboarding.routes.ts](../../apps/api/src/modules/onboarding/onboarding.routes.ts)
- Documents: [apps/api/src/modules/documents/documents.routes.ts](../../apps/api/src/modules/documents/documents.routes.ts)
- Leave: [apps/api/src/modules/leave/leave.routes.ts](../../apps/api/src/modules/leave/leave.routes.ts)
- Timesheets: [apps/api/src/modules/timesheets/timesheets.routes.ts](../../apps/api/src/modules/timesheets/timesheets.routes.ts)
- Payroll: [apps/api/src/modules/payroll/payroll.routes.ts](../../apps/api/src/modules/payroll/payroll.routes.ts)
- Invoices: [apps/api/src/modules/invoices/invoices.routes.ts](../../apps/api/src/modules/invoices/invoices.routes.ts)
- Offboarding: [apps/api/src/modules/offboarding/offboarding.routes.ts](../../apps/api/src/modules/offboarding/offboarding.routes.ts)
- Dashboard: [apps/api/src/modules/dashboard/dashboard.routes.ts](../../apps/api/src/modules/dashboard/dashboard.routes.ts)
- Audit: [apps/api/src/modules/audit/audit.routes.ts](../../apps/api/src/modules/audit/audit.routes.ts)

## Middleware

### Auth Middleware

[apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)

Key pieces:

- `tokenFromRequest()` reads `globalhire_token` cookie or bearer token.
- `requireAuth()` verifies JWT, loads user, attaches `req.user`.
- `requireOrgAccess()` checks tenant boundary.
- `canReviewPeopleWorkflows()` centralizes reviewer roles.

Important learning point:

`requireAuth()` was patched to pass unauthenticated errors into `next()` rather than throwing outside Express error handling. This matters because async middleware errors can crash Express 4 if not handled correctly.

### Role Middleware

[apps/api/src/middleware/requireRole.middleware.ts](../../apps/api/src/middleware/requireRole.middleware.ts)

Simple guard:

```ts
requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN'])
```

If `req.user.role` is not included, it throws a 403.

### Error Middleware

[apps/api/src/middleware/error.middleware.ts](../../apps/api/src/middleware/error.middleware.ts)

Handles:

- Zod validation errors as 400.
- `ApiError` as its status code.
- Unknown errors as 500.

## Controllers And Services

Auth follows a clearer split:

- routes -> controller -> service

Example:

- [apps/api/src/modules/auth/auth.routes.ts](../../apps/api/src/modules/auth/auth.routes.ts)
- [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts)
- [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)

Many other modules use route handlers directly and call services only for bigger business logic. This is a known demo tradeoff.

Best service files:

- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
- [apps/api/src/modules/leave/leave.service.ts](../../apps/api/src/modules/leave/leave.service.ts)
- [apps/api/src/modules/timesheets/timesheets.service.ts](../../apps/api/src/modules/timesheets/timesheets.service.ts)
- [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

## Prisma Usage

Prisma schema: [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)  
Prisma client export: [apps/api/src/db/prisma.ts](../../apps/api/src/db/prisma.ts)

Common Prisma patterns:

- `findUnique`
- `findMany`
- `create`
- `update`
- nested create, such as worker -> employment/onboarding tasks
- `$transaction`, such as worker creation and offboarding completion

Example: `createWorker()` creates Worker, Employment, OnboardingTask, and AuditLog in one transaction.

## Zod Validation

Shared schemas:

- [packages/shared/src/index.ts](../../packages/shared/src/index.ts)

Examples:

- `loginSchema` in auth controller.
- `createWorkerSchema` in workers route.
- `payrollRunSchema` in payroll route.
- `leaveRequestSchema` in leave route.
- `timesheetSchema` in timesheets route.

Some schemas are inline, such as worker patch and offboarding request. That is okay for small route-specific shapes, but consistency could be improved.

## Audit Logging

Helper:

- [apps/api/src/modules/audit/audit.service.ts](../../apps/api/src/modules/audit/audit.service.ts)

Audit logs are written for:

- Worker creation
- Worker activation
- Onboarding submitted/approved/rejected
- Leave approved/rejected
- Timesheet approved
- Payroll calculated/approved
- Invoice generated/issued
- Offboarding requested/completed

Weak spot:

- Not every update action is audited. Document approve/reject and invoice mark-paid are examples that could use audit events.

## Seed Data

[apps/api/prisma/seed.ts](../../apps/api/prisma/seed.ts) creates:

- 3 organizations
- 5 demo users
- 6 country rules
- 10 workers across statuses
- documents
- leave requests
- timesheets
- payroll runs
- invoice
- offboarding case
- audit logs

This file is important for demo prep because it tells the story you can show in the UI.

## How To Trace An API Request

Example: create worker.

1. Route registered in [apps/api/src/app.ts](../../apps/api/src/app.ts): `/api/workers`.
2. Request hits `requireAuth`.
3. Route handler in [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts).
4. `requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN'])`.
5. Body parsed by `createWorkerSchema`.
6. Service function `createWorker()` in [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts).
7. Prisma transaction writes Worker, Employment, OnboardingTask, AuditLog.
8. Route returns the created worker.

## Most Important Backend Logic

Show these in an interview:

- `requireAuth()` and `requireOrgAccess()` in [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)
- `createWorker()` and `activateWorker()` in [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
- `calculatePayrollRun()` in [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
- `generateInvoice()` in [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)
- Offboarding transaction in [apps/api/src/modules/offboarding/offboarding.routes.ts](../../apps/api/src/modules/offboarding/offboarding.routes.ts)
