# Architecture Deep Dive

## Monorepo Structure

Choice: npm workspaces with three main areas.

```text
apps/
  api/    Express + Prisma backend
  web/    React + Vite frontend
packages/
  shared/ shared Zod schemas and TypeScript types
```

Why it makes sense: the project is small enough that frontend, backend, and shared validation can live together. That makes it easy to demo, run tests, and keep request shapes consistent.

Tradeoff: the shared package points directly to TypeScript source. That works well with Vite/tsx in dev, but the compiled API server currently has rough edges because the compiled JS can still resolve the shared package source. For production packaging, the shared package should build to `dist` and expose compiled JS/types.

Production version: separate build outputs per package, CI that builds shared first, generated OpenAPI or typed RPC, and deployable artifacts per app.

## Backend Structure

Important backend entry points:

- [apps/api/src/server.ts](../../apps/api/src/server.ts): starts the Express app.
- [apps/api/src/app.ts](../../apps/api/src/app.ts): configures middleware and route mounting.
- [apps/api/src/db/prisma.ts](../../apps/api/src/db/prisma.ts): exports the Prisma Client.
- [apps/api/src/config/env.ts](../../apps/api/src/config/env.ts): loads and validates environment variables.

Choice: modular folders under `apps/api/src/modules`.

Why it makes sense: each domain area has its own route/service files, such as workers, payroll, invoices, leave, and timesheets.

Tradeoff: the implementation is not perfectly consistent. Auth has routes/controller/service files, while many modules put controller-like code directly in `*.routes.ts`. This is acceptable for a demo but less clean than the originally intended `routes -> controller -> service -> prisma` pattern.

Production version: standardize every module around route, controller, service, repository/data-access, and tests.

## Frontend Structure

Important frontend entry points:

- [apps/web/src/main.tsx](../../apps/web/src/main.tsx): creates React root and providers.
- [apps/web/src/App.tsx](../../apps/web/src/App.tsx): declares routes.
- [apps/web/src/routes/ProtectedRoute.tsx](../../apps/web/src/routes/ProtectedRoute.tsx): protects authenticated pages.
- [apps/web/src/components/layout/AppShell.tsx](../../apps/web/src/components/layout/AppShell.tsx): wraps authenticated screens.

Choice: feature folders under `apps/web/src/features`.

Why it makes sense: each page lives near its domain, and shared UI primitives live in `components/ui`.

Tradeoff: some pages are intentionally compact and inline several UI concerns. For example, [apps/web/src/features/payroll/PayrollPage.tsx](../../apps/web/src/features/payroll/PayrollPage.tsx) contains the modal form inline. That is readable for an interview project but would be split into smaller components as complexity grows.

Production version: split large feature pages into form/table/action components, add stronger loading/error/empty states, and improve accessibility.

## Shared Types And Schemas

Shared schemas live in [packages/shared/src/index.ts](../../packages/shared/src/index.ts).

Choice: Zod schemas such as `loginSchema`, `createWorkerSchema`, `payrollRunSchema`, `leaveRequestSchema`, and `timesheetSchema`.

Why it makes sense: the frontend can use the same validation rules with React Hook Form, and the backend can parse the same request shapes.

Tradeoff: the shared package is small and hand-maintained. It does not cover every backend route. Some route-specific schemas still live inline in route files, such as worker patching in [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts).

Production version: generate API client/types from OpenAPI, or use a typed API framework. Also build the shared package to compiled JS.

## Database And Prisma Structure

Choice: Prisma schema in [apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma), seed script in [apps/api/prisma/seed.ts](../../apps/api/prisma/seed.ts).

Why it makes sense: Prisma is readable for demos. You can show models, relationships, enums, and queries without deep SQL ceremony.

Tradeoff: the project currently uses `prisma db push` during local setup and does not include committed migration files. That is fine for quick demo setup but not how a production team should manage schema history.

Production version: committed migrations, migration review, data migration scripts, database backups, and environment-specific migration rollout.

## API Layer

Routes are registered in [apps/api/src/app.ts](../../apps/api/src/app.ts):

```text
/api/auth              public auth routes
/api                   requireAuth applied here
/api/workers           worker routes
/api/payroll-runs      payroll routes
/api/invoices          invoice routes mounted through /api
...
```

Choice: REST endpoints using Express Router.

Why it makes sense: REST is familiar, easy to demo, and maps cleanly to workflows like `POST /payroll-runs/:id/calculate`.

Tradeoff: some endpoints are action-oriented RPC-style REST, such as `/approve`, `/lock`, and `/generate-invoice`. That is pragmatic for workflow transitions but not purely resource-oriented REST.

Production version: document routes with OpenAPI, standardize response envelopes, add pagination, and use request IDs.

## Service And Business Logic Layer

The strongest service files are:

- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)
- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)
- [apps/api/src/modules/leave/leave.service.ts](../../apps/api/src/modules/leave/leave.service.ts)
- [apps/api/src/modules/timesheets/timesheets.service.ts](../../apps/api/src/modules/timesheets/timesheets.service.ts)
- [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

Choice: put high-risk workflow rules in service functions.

Why it makes sense: worker activation, payroll calculation, and leave/timesheet approval are business logic, not UI logic.

Tradeoff: some modules still keep logic directly in route files, especially onboarding, documents, offboarding, country rules, dashboard, and organizations.

Production version: move all domain transitions to services and test them directly.

## Validation Layer

Choice: Zod on both frontend and backend.

Examples:

- Login form uses `loginSchema` in [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx).
- Worker form uses `createWorkerSchema` in [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx).
- Backend worker creation parses `createWorkerSchema` in [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts).

Why it makes sense: one schema can validate both form input and request body.

Tradeoff: not every route has a shared schema, and response types mostly use `any` in the frontend API clients.

Production version: typed API responses, stronger schema coverage, and API contract tests.

## Auth And RBAC Layer

Choice: JWT in `globalhire_token` HTTP-only cookie, plus explicit route guards.

Files:

- [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts)
- [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts)
- [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts)
- [apps/api/src/middleware/requireRole.middleware.ts](../../apps/api/src/middleware/requireRole.middleware.ts)

Why it makes sense: simple, understandable, and easy to demo. The backend remains the source of truth.

Tradeoff: authorization is scattered across routes and services. It is readable, but not centralized.

Production version: policy-based authorization, permission matrix tests, row-level security, refresh tokens, CSRF strategy for cookie auth, and better session management.

## Frontend Routing

Choice: route table in [apps/web/src/App.tsx](../../apps/web/src/App.tsx), guarded by [apps/web/src/routes/ProtectedRoute.tsx](../../apps/web/src/routes/ProtectedRoute.tsx).

Why it makes sense: simple route discovery. Interviewers can see the whole app surface in one file.

Tradeoff: route access is not strongly enforced in the router itself; the sidebar hides links using `useRole`, and the backend enforces actual access.

Production version: route metadata with role requirements, better unauthorized screens, and deep-link protection in the UI.

## Frontend API Client

Choice: a small fetch wrapper in [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts).

Why it makes sense: central place for base URL, JSON headers, cookies, and error handling.

Tradeoff: it does not handle token refresh, retry, structured errors, cancellation, or response validation.

Production version: generated API client, response schemas, request tracing, and consistent error objects.

## State And Data Fetching

Choice: TanStack Query for server state.

Examples:

- Dashboard: [apps/web/src/features/dashboard/DashboardPage.tsx](../../apps/web/src/features/dashboard/DashboardPage.tsx)
- Workers: [apps/web/src/features/workers/WorkersPage.tsx](../../apps/web/src/features/workers/WorkersPage.tsx)
- Payroll detail: [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)

Why it makes sense: most app state is server state. Query keys and invalidation keep the UI fresh after mutations.

Tradeoff: query keys are hand-authored and not centralized.

Production version: query-key factory, optimistic updates where useful, and richer cache invalidation.

## Form Handling

Choice: React Hook Form + Zod resolver.

Examples:

- Login form: [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx)
- Worker creation form: [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)

Why it makes sense: forms stay compact, validation is declarative, and schemas can be shared.

Tradeoff: not every workflow has a polished form. Some actions use hardcoded demo payloads, such as document metadata and onboarding rejection in [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx).

Production version: full forms for leave/timesheet/offboarding creation, reason modals, accessibility improvements, and field-level server error mapping.

## Error Handling

Backend choice: `ApiError`, `asyncHandler`, and centralized `errorHandler`.

Files:

- [apps/api/src/utils/ApiError.ts](../../apps/api/src/utils/ApiError.ts)
- [apps/api/src/utils/asyncHandler.ts](../../apps/api/src/utils/asyncHandler.ts)
- [apps/api/src/middleware/error.middleware.ts](../../apps/api/src/middleware/error.middleware.ts)

Frontend choice: the fetch wrapper throws `Error`, and pages show basic error messages in some places.

Tradeoff: enough for demo clarity, but not a complete UX or observability story.

Production version: structured error codes, logging, tracing, toast notifications, and consistent empty/error states.
