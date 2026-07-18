# Important Files Map

This is the 30-40% of the repo that gives you most of the system understanding.

## App Setup And Config

File: [package.json](../../package.json)  
Purpose: Root npm workspace scripts.  
Key responsibilities: Runs dev servers, builds, tests, Prisma commands through workspaces.  
Interacts with: `apps/api/package.json`, `apps/web/package.json`, `packages/shared/package.json`.  
Why it matters for the interview: Shows this is a small monorepo with one-command project workflows.

File: [docker-compose.yml](../../docker-compose.yml)  
Purpose: Local PostgreSQL container.  
Key responsibilities: Defines `postgres:16-alpine`, database, user, password, port `5432`.  
Interacts with: `DATABASE_URL` in [apps/api/.env.example](../../apps/api/.env.example).  
Why it matters for the interview: Shows how the SQL database runs locally.

File: [tsconfig.base.json](../../tsconfig.base.json)  
Purpose: Shared TypeScript settings and path alias.  
Key responsibilities: Defines strict TypeScript settings and `@globalhire/shared` alias.  
Interacts with: API/web/shared tsconfig files.  
Why it matters for the interview: Explains how shared schemas are imported from both apps.

## Backend Entry Points

File: [apps/api/src/server.ts](../../apps/api/src/server.ts)  
Purpose: Starts the API server.  
Key responsibilities: Imports `app` and listens on `env.PORT`.  
Interacts with: [apps/api/src/app.ts](../../apps/api/src/app.ts), [apps/api/src/config/env.ts](../../apps/api/src/config/env.ts).  
Why it matters for the interview: The first backend file to open when explaining server startup.

File: [apps/api/src/app.ts](../../apps/api/src/app.ts)  
Purpose: Builds the Express app.  
Key responsibilities: Adds Helmet, CORS, JSON parsing, cookie parsing, health route, auth routes, protected routes, and error handling.  
Interacts with: every backend router and middleware.  
Why it matters for the interview: Best single file to explain API architecture and route protection.

File: [apps/api/src/config/env.ts](../../apps/api/src/config/env.ts)  
Purpose: Environment variable validation.  
Key responsibilities: Loads dotenv and validates `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `PORT`.  
Interacts with: server, auth, CORS, Prisma connection indirectly.  
Why it matters for the interview: Shows practical config validation.

File: [apps/api/src/db/prisma.ts](../../apps/api/src/db/prisma.ts)  
Purpose: Prisma Client singleton.  
Key responsibilities: Exports `prisma`.  
Interacts with: all route/service files that query the database.  
Why it matters for the interview: This is the database gateway.

## Backend Middleware

File: [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)  
Purpose: Authentication and organization access helper.  
Key responsibilities: Reads JWT from cookie or bearer token, loads user, attaches `req.user`, defines `requireOrgAccess`, defines review-role helper.  
Interacts with: auth routes, protected routes, service functions.  
Why it matters for the interview: Central to auth, RBAC, and multi-tenancy.

File: [apps/api/src/middleware/requireRole.middleware.ts](../../apps/api/src/middleware/requireRole.middleware.ts)  
Purpose: Simple role guard.  
Key responsibilities: Allows only listed roles.  
Interacts with: workers, payroll, invoices, country rules, audit, offboarding routes.  
Why it matters for the interview: Shows explicit, readable authorization.

File: [apps/api/src/middleware/error.middleware.ts](../../apps/api/src/middleware/error.middleware.ts)  
Purpose: Centralized API error responses.  
Key responsibilities: Handles Zod validation errors, `ApiError`, and unexpected errors.  
Interacts with: `ApiError`, `asyncHandler`, all routes.  
Why it matters for the interview: Shows how API failures are shaped.

## Backend Modules

File: [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)  
Purpose: Login and current-user lookup.  
Key responsibilities: Validates password with bcrypt, signs JWT, returns public user fields.  
Interacts with: auth controller, User model.  
Why it matters for the interview: Best file to explain authentication mechanics.

File: [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts)  
Purpose: Auth HTTP handlers.  
Key responsibilities: Parses login schema, sets HTTP-only cookie, clears cookie on logout, returns `/me`.  
Interacts with: `loginSchema`, `auth.service`, Express response cookies.  
Why it matters for the interview: Shows backend/frontend session bridge.

File: [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)  
Purpose: Worker business logic.  
Key responsibilities: Generates onboarding templates, scopes worker queries by actor, creates worker/employment/tasks/audit in a transaction, activates workers.  
Interacts with: CountryRule, Worker, Employment, OnboardingTask, AuditLog.  
Why it matters for the interview: One of the highest-value files to explain.

File: [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts)  
Purpose: Worker REST endpoints.  
Key responsibilities: Lists, reads, creates, patches, activates workers, wires worker offboarding endpoint.  
Interacts with: `workers.service`, Prisma, `requireRole`, `requireOrgAccess`.  
Why it matters for the interview: Shows data scoping and route-to-service flow.

File: [apps/api/src/modules/onboarding/onboarding.routes.ts](../../apps/api/src/modules/onboarding/onboarding.routes.ts)  
Purpose: Onboarding checklist endpoints.  
Key responsibilities: Lists tasks, submits tasks, approves/rejects tasks, writes audit logs.  
Interacts with: OnboardingTask, Worker, AuditLog.  
Why it matters for the interview: Shows workflow state transition through status fields.

File: [apps/api/src/modules/documents/documents.routes.ts](../../apps/api/src/modules/documents/documents.routes.ts)  
Purpose: Document metadata endpoints.  
Key responsibilities: Lists/creates metadata-only documents, approves/rejects documents.  
Interacts with: WorkerDocument, Worker.  
Why it matters for the interview: Shows intentionally mocked file upload.

File: [apps/api/src/modules/leave/leave.service.ts](../../apps/api/src/modules/leave/leave.service.ts)  
Purpose: Leave business logic.  
Key responsibilities: Creates leave request, approves/rejects pending requests, checks reviewer roles and org access.  
Interacts with: LeaveRequest, Worker, AuditLog.  
Why it matters for the interview: Clean example of service-level workflow rule.

File: [apps/api/src/modules/timesheets/timesheets.service.ts](../../apps/api/src/modules/timesheets/timesheets.service.ts)  
Purpose: Timesheet business logic.  
Key responsibilities: Creates worker timesheets, approves/rejects submitted timesheets, blocks terminated workers.  
Interacts with: Timesheet, Worker, AuditLog, Payroll calculation.  
Why it matters for the interview: Connects worker workflow to payroll.

File: [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)  
Purpose: Payroll business logic.  
Key responsibilities: Creates run, calculates active workers only, includes approved overtime only, approves, locks.  
Interacts with: PayrollRun, PayrollItem, Worker, Employment, Timesheet, CountryRule, AuditLog.  
Why it matters for the interview: The strongest business-logic demo file.

File: [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)  
Purpose: Invoice generation.  
Key responsibilities: Requires approved/locked payroll, calculates platform fee, creates invoice, logs audit event.  
Interacts with: PayrollRun, Invoice, AuditLog.  
Why it matters for the interview: Shows connecting payroll to finance workflow.

File: [apps/api/src/modules/offboarding/offboarding.routes.ts](../../apps/api/src/modules/offboarding/offboarding.routes.ts)  
Purpose: Offboarding workflow endpoints.  
Key responsibilities: Creates cases, approves/cancels/completes cases, terminates worker and sets employment end date.  
Interacts with: OffboardingCase, Worker, Employment, AuditLog.  
Why it matters for the interview: Shows final lifecycle transition.

File: [apps/api/src/modules/dashboard/dashboard.routes.ts](../../apps/api/src/modules/dashboard/dashboard.routes.ts)  
Purpose: Role-aware dashboard summary.  
Key responsibilities: Returns different dashboard payloads for worker versus client/internal users.  
Interacts with: Worker, LeaveRequest, Timesheet, PayrollRun, OffboardingCase.  
Why it matters for the interview: Shows practical aggregation and role-aware API responses.

File: [apps/api/src/modules/audit/audit.service.ts](../../apps/api/src/modules/audit/audit.service.ts)  
Purpose: Audit log helper.  
Key responsibilities: Creates AuditLog records with actor, entity, action, message, metadata.  
Interacts with: workflow services/routes.  
Why it matters for the interview: Good HR/payroll systems talking point.

## Prisma And Database

File: [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma)  
Purpose: Database schema.  
Key responsibilities: Defines enums, models, relationships, constraints, indexes.  
Interacts with: every backend Prisma query.  
Why it matters for the interview: Best file to explain the domain model.

File: [apps/api/prisma/seed.ts](../../apps/api/prisma/seed.ts)  
Purpose: Demo data creation.  
Key responsibilities: Creates country rules, organizations, users, workers, documents, leave, timesheets, payroll runs, invoice, offboarding case, audit logs.  
Interacts with: Prisma models and `onboardingTemplates`.  
Why it matters for the interview: Shows the app’s demo story.

## Frontend Entry Points

File: [apps/web/src/main.tsx](../../apps/web/src/main.tsx)  
Purpose: React bootstrapping.  
Key responsibilities: Sets up QueryClientProvider, BrowserRouter, AuthProvider, App.  
Interacts with: `useAuth`, `App`.  
Why it matters for the interview: Shows app-level providers.

File: [apps/web/src/App.tsx](../../apps/web/src/App.tsx)  
Purpose: Route table.  
Key responsibilities: Maps URL paths to feature pages and wraps protected routes.  
Interacts with: all feature pages and `ProtectedRoute`.  
Why it matters for the interview: Fast way to show frontend scope.

## Frontend Layout And Routing

File: [apps/web/src/routes/ProtectedRoute.tsx](../../apps/web/src/routes/ProtectedRoute.tsx)  
Purpose: Auth-gated route wrapper.  
Key responsibilities: Shows loading, redirects to login, wraps protected pages with AppShell.  
Interacts with: `useAuth`, `AppShell`.  
Why it matters for the interview: Shows frontend session protection.

File: [apps/web/src/components/layout/Sidebar.tsx](../../apps/web/src/components/layout/Sidebar.tsx)  
Purpose: Role-aware navigation.  
Key responsibilities: Hides or shows links using `useRole`.  
Interacts with: `useRole`, React Router.  
Why it matters for the interview: Demonstrates UI-level role awareness.

File: [apps/web/src/components/layout/Topbar.tsx](../../apps/web/src/components/layout/Topbar.tsx)  
Purpose: Top navigation and logout.  
Key responsibilities: Shows current user and signs out.  
Interacts with: `useAuth`, `authApi.logout`.  
Why it matters for the interview: Small but useful auth UX example.

## Frontend API Clients

File: [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts)  
Purpose: Shared fetch wrapper.  
Key responsibilities: Base URL, cookies, JSON headers, error throwing.  
Interacts with: every API module.  
Why it matters for the interview: Shows how frontend talks to backend.

File: [apps/web/src/api/auth.api.ts](../../apps/web/src/api/auth.api.ts)  
Purpose: Auth API calls.  
Key responsibilities: Login, logout, current user.  
Interacts with: `useAuth`, backend auth routes.  
Why it matters for the interview: Frontend side of login flow.

File: [apps/web/src/api/workers.api.ts](../../apps/web/src/api/workers.api.ts)  
Purpose: Worker API calls.  
Key responsibilities: List/get/create/update/activate workers and fetch onboarding/documents.  
Interacts with: worker pages and backend worker/onboarding routes.  
Why it matters for the interview: Worker workflow bridge.

File: [apps/web/src/api/payroll.api.ts](../../apps/web/src/api/payroll.api.ts)  
Purpose: Payroll API calls.  
Key responsibilities: List/get/create/calculate/approve/lock/generate invoice.  
Interacts with: payroll pages and backend payroll/invoice routes.  
Why it matters for the interview: Great file to show action-based workflow calls.

## Frontend Feature Modules

File: [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx)  
Purpose: Login screen.  
Key responsibilities: React Hook Form, Zod validation, demo login buttons, calls `useAuth.login`.  
Interacts with: `loginSchema`, `useAuth`.  
Why it matters for the interview: Best frontend entry into auth.

File: [apps/web/src/features/dashboard/DashboardPage.tsx](../../apps/web/src/features/dashboard/DashboardPage.tsx)  
Purpose: Role-aware dashboard UI.  
Key responsibilities: Fetches `/dashboard`, renders worker or operations summary.  
Interacts with: `resourcesApi.dashboard`, `useRole`.  
Why it matters for the interview: Good page to open first in demo.

File: [apps/web/src/features/workers/WorkersPage.tsx](../../apps/web/src/features/workers/WorkersPage.tsx)  
Purpose: Worker directory.  
Key responsibilities: Search/filter state, worker query, table rendering, create worker link.  
Interacts with: `workersApi.list`, `useRole`.  
Why it matters for the interview: Shows list/read UI and server state.

File: [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)  
Purpose: Create worker form.  
Key responsibilities: React Hook Form, shared Zod schema, country/org lookups, create mutation.  
Interacts with: `createWorkerSchema`, `workersApi.create`, `resourcesApi.countryRules`.  
Why it matters for the interview: Best frontend example of form -> API -> redirect.

File: [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx)  
Purpose: Worker profile and onboarding actions.  
Key responsibilities: Loads worker detail, shows employment/country/onboarding/documents/payroll, submits/approves/rejects tasks, activates worker.  
Interacts with: worker API, onboarding routes, document routes, role helper.  
Why it matters for the interview: Richest single frontend page.

File: [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)  
Purpose: Payroll workflow actions.  
Key responsibilities: Shows totals/items, calculates/approves/locks/generates invoice based on role and status.  
Interacts with: `payrollApi`, backend payroll service.  
Why it matters for the interview: Best UI for state transitions.

## Shared Types And Utilities

File: [packages/shared/src/index.ts](../../packages/shared/src/index.ts)  
Purpose: Shared enums and Zod schemas.  
Key responsibilities: Roles, statuses, request validation schemas, TypeScript input types.  
Interacts with: API routes and frontend forms.  
Why it matters for the interview: Shows avoiding duplicated request validation.

File: [apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx)  
Purpose: Frontend auth state provider.  
Key responsibilities: Fetches `/auth/me`, exposes login/logout, updates query cache.  
Interacts with: `authApi`, `ProtectedRoute`, `Topbar`, `LoginPage`.  
Why it matters for the interview: Explains frontend auth state.

File: [apps/web/src/hooks/useRole.ts](../../apps/web/src/hooks/useRole.ts)  
Purpose: Role convenience flags.  
Key responsibilities: Converts user role to UI booleans like `canPayroll` and `canReview`.  
Interacts with: sidebar and feature pages.  
Why it matters for the interview: Shows simple UI authorization logic.

## Tests

File: [apps/api/src/tests/business-rules.test.ts](../../apps/api/src/tests/business-rules.test.ts)  
Purpose: Backend business-rule tests.  
Key responsibilities: Tests activation, payroll, locked payroll, leave approval.  
Interacts with: service functions.  
Why it matters for the interview: Shows targeted testing strategy.

File: [apps/web/src/features/auth/LoginPage.test.tsx](../../apps/web/src/features/auth/LoginPage.test.tsx)  
Purpose: Login UI smoke test.  
Key responsibilities: Asserts demo login buttons render.  
Interacts with: React Testing Library and mocked auth hook.  
Why it matters for the interview: Shows basic frontend confidence without over-testing.
