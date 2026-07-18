# Interview Question Bank

This question bank is based on the actual GlobalHire Lite codebase. The goal is to help you answer like a practical mid-level full-stack engineer: clear about what works, honest about tradeoffs, and ready to open the relevant files.

## Project Overview

### 1. What is GlobalHire Lite?

Concise answer:
GlobalHire Lite is a full-stack Employer of Record demo app for managing international workers through onboarding, leave, timesheets, payroll previews, invoicing, and offboarding.

Detailed answer:
The project models a simplified EOR workflow. A client admin can create workers, country rules generate onboarding tasks, workers move through onboarding into active employment, approved leave and timesheets feed operational workflows, payroll previews calculate simplified pay totals, invoices can be generated, and offboarding can terminate a worker. It is intentionally a portfolio/interview project, so it focuses on readable full-stack architecture and realistic workflow rules instead of real payroll or legal compliance.

Code references:
- `README.md`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/web/src/App.tsx`

### 2. What problem were you trying to demonstrate?

Concise answer:
I wanted to demonstrate realistic CRUD plus workflow software: auth, role-based access, multi-tenant data scoping, service-layer business rules, SQL data modeling, and a React dashboard UI.

Detailed answer:
I chose an EOR-style domain because it naturally involves multiple roles, tenant boundaries, status transitions, audit logs, and financial calculations. Those are good interview topics because they show judgment beyond basic CRUD. The app is scoped small enough to explain, but it has enough business logic to discuss real design decisions.

Code references:
- `docs/ARCHITECTURE.md`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/middleware/auth.middleware.ts`

## Architecture

### 3. How is the monorepo organized?

Concise answer:
The repo is split into `apps/api` for Express, `apps/web` for React, and `packages/shared` for shared Zod schemas and TypeScript constants.

Detailed answer:
The backend owns database access, auth, route protection, and business rules. The frontend owns user interaction, routing, forms, and server-state fetching. The shared package holds request schemas and role/status constants that both sides can use. That keeps validation and types consistent without introducing a heavy internal package system.

Code references:
- `apps/api/src/app.ts`
- `apps/web/src/main.tsx`
- `packages/shared/src/index.ts`

### 4. Why use Express instead of something heavier like NestJS?

Concise answer:
Express keeps the demo understandable and explicit. The route/controller/service structure gives enough organization without framework ceremony.

Detailed answer:
For a mid-level portfolio app, I wanted an architecture that is easy to trace in an interview. Express route files register endpoints, controllers or route handlers validate input, and service files hold business logic. A more production-grade system might use NestJS for dependency injection, module boundaries, decorators, and testing ergonomics, but here that would add complexity the app does not need.

Code references:
- `apps/api/src/app.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`

### 5. Why use Prisma?

Concise answer:
Prisma gives typed database access, clear schema modeling, and readable relation queries without hand-writing SQL for every endpoint.

Detailed answer:
This app has a relational domain: users belong to organizations, workers have employment records, onboarding tasks, payroll items, invoices, and audit logs. Prisma makes those relationships visible in `schema.prisma` and gives service code type-safe queries. The tradeoff is that Prisma abstracts SQL details, so for very complex reporting or performance tuning I might add raw SQL, views, or carefully tuned indexes.

Code references:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/db/prisma.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`

### 6. Where does business logic live?

Concise answer:
The most important business logic lives in backend service files, especially worker, payroll, leave, timesheet, invoice, and audit services.

Detailed answer:
Controllers and route handlers should stay thin: they parse input, apply auth middleware, and call services. Business rules like "only active workers are included in payroll" and "worker activation requires approved onboarding tasks and a signed contract" live in services. Some modules, like onboarding and offboarding, still keep route-level logic, which is acceptable for the demo but would be a refactor target in production.

Code references:
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/leave/leave.service.ts`
- `apps/api/src/modules/timesheets/timesheets.service.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/onboarding/onboarding.routes.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`

## React Choices

### 7. Why use TanStack Query?

Concise answer:
Most frontend state in this app is server state, so TanStack Query handles fetching, caching, invalidation, loading, and error states.

Detailed answer:
Pages like workers, payroll, invoices, and dashboard all display API data. TanStack Query lets each page declare what data it needs and then invalidate queries after mutations. For example, after creating a worker, the workers query is invalidated so the list refreshes. This avoids manually keeping duplicated server state in React component state.

Code references:
- `apps/web/src/main.tsx`
- `apps/web/src/hooks/useAuth.tsx`
- `apps/web/src/features/workers/WorkersPage.tsx`
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`

### 8. Why use React Hook Form and Zod?

Concise answer:
React Hook Form keeps forms lightweight, and Zod gives reusable validation schemas.

Detailed answer:
The login and worker creation forms use React Hook Form with Zod resolvers. The worker creation form reuses the shared `createWorkerSchema`, so frontend validation matches backend validation. In production I would be more deliberate about keeping shared schemas versioned and compatible across deployments.

Code references:
- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/features/workers/NewWorkerPage.tsx`
- `packages/shared/src/index.ts`
- `apps/api/src/modules/workers/workers.routes.ts`

### 9. How does role-based UI work?

Concise answer:
The frontend uses `useRole()` to hide or show navigation and actions, while the backend enforces the real permissions.

Detailed answer:
The sidebar and buttons use role helpers like `canManageWorkers`, `canReview`, and `canPayroll`. That makes the UI feel role-aware. But hiding buttons is not security, so backend routes also use `requireAuth`, `requireRole`, and organization access checks. In an interview, emphasize that the backend is the source of truth.

Code references:
- `apps/web/src/hooks/useRole.ts`
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/api/src/middleware/auth.middleware.ts`

## Node/Express Choices

### 10. How does an API request flow through the backend?

Concise answer:
It enters `app.ts`, passes global middleware, passes `requireAuth` for protected routes, hits a module route, validates input, calls service logic, queries Prisma, and returns JSON or an error.

Detailed answer:
For example, payroll calculation starts at `POST /api/payroll-runs/:id/calculate` in `payroll.routes.ts`. The route requires an authenticated user and appropriate role. It calls `calculatePayrollRun()` in `payroll.service.ts`, which checks status, organization access, active workers, approved timesheets, country rules, and then writes payroll items and totals in a transaction.

Code references:
- `apps/api/src/app.ts`
- `apps/api/src/modules/payroll/payroll.routes.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/middleware/error.middleware.ts`

### 11. How are errors handled?

Concise answer:
Business errors throw `ApiError`; unexpected errors and Zod errors are normalized by centralized Express error middleware.

Detailed answer:
Services throw `ApiError` for expected conditions like unauthorized access, invalid state transitions, or missing records. The error middleware maps those to JSON responses with status codes. Zod validation errors are also formatted centrally. This keeps routes cleaner and makes API failures predictable for the frontend.

Code references:
- `apps/api/src/utils/ApiError.ts`
- `apps/api/src/middleware/error.middleware.ts`
- `apps/api/src/utils/asyncHandler.ts`

## TypeScript

### 12. How does TypeScript help in this project?

Concise answer:
TypeScript makes API data shapes, Prisma models, role checks, and form validation easier to reason about.

Detailed answer:
The backend gets generated Prisma types from the schema. The shared package exports role/status constants and Zod-inferred request types. On the frontend, API wrappers and forms use typed values, so common mistakes like wrong field names or invalid enums are caught earlier. The app is still not fully end-to-end typed from routes to clients, which would be a future improvement.

Code references:
- `apps/api/prisma/schema.prisma`
- `packages/shared/src/index.ts`
- `apps/web/src/api/client.ts`

## SQL and Prisma

### 13. How is the database model designed?

Concise answer:
The model centers on `Organization`, `User`, `Worker`, and `Employment`, with workflow tables for onboarding, documents, leave, timesheets, payroll, invoices, offboarding, and audit logs.

Detailed answer:
`Organization` provides the tenant boundary. `User` represents someone who logs in. `Worker` represents the employment subject. `Employment` stores salary and contract details. Workflow tables attach to workers or payroll runs. This design makes it easy to show lifecycle transitions while keeping each concept separate.

Code references:
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `docs/learning/DOMAIN_MODEL_EXPLAINED.md`

### 14. What are the biggest data-model tradeoffs?

Concise answer:
Money uses `Float`, compliance rules are simplified, and some workflow constraints are enforced in service code rather than database constraints.

Detailed answer:
For a demo, `Float` keeps payroll calculations easy to read. In production I would use `Decimal` or integer cents, add more indexes, more unique constraints, database migrations, stronger referential rules, and possibly row-level security. The current model is optimized for interview clarity, not production-grade financial accuracy.

Code references:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/payroll/payroll.service.ts`

## Auth, RBAC, and Multi-Tenancy

### 15. How does login work?

Concise answer:
The frontend posts credentials to `/api/auth/login`; the backend verifies bcrypt password hashes, signs a JWT, and stores it in an HTTP-only cookie.

Detailed answer:
`LoginPage.tsx` calls `useAuth().login`, which calls `authApi.login`. The backend `auth.service.ts` finds the user by email, compares the password hash, signs a JWT with user id, role, and organization id, and sets the `globalhire_token` cookie in `auth.controller.ts`. Later requests include that cookie automatically because the fetch client uses `credentials: "include"`.

Code references:
- `apps/web/src/features/auth/LoginPage.tsx`
- `apps/web/src/hooks/useAuth.tsx`
- `apps/web/src/api/client.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.controller.ts`

### 16. How does RBAC work?

Concise answer:
RBAC is implemented with explicit middleware and route-level role arrays.

Detailed answer:
Routes use `requireRole(["CLIENT_ADMIN", "EOR_SPECIALIST"])` style checks. The auth middleware attaches the current user to `req.user`. The role middleware checks whether the current user has one of the allowed roles. This is intentionally simple and readable. In production I might use policy-based authorization or declarative permissions.

Code references:
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/api/src/modules/payroll/payroll.routes.ts`

### 17. How is tenant data protected?

Concise answer:
Client users are scoped to their `organizationId`; platform and EOR roles can cross organizations; workers can only access their own worker data.

Detailed answer:
Most important entities have an organization relationship either directly or through worker/payroll. Backend services and route handlers check organization access before returning or changing data. For example, worker listing uses `getWorkerWhereForActor()` to scope the Prisma query, and payroll services call `requireOrgAccess()`.

Code references:
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`

## Business Logic

### 18. How does worker activation work?

Concise answer:
A worker can become `ACTIVE` only when they are `ONBOARDING`, all required onboarding tasks are `APPROVED`, and their employment contract is `SIGNED`.

Detailed answer:
The activation rule is in `activateWorker()` in `workers.service.ts`. It loads the worker with onboarding tasks and employment, checks organization access, checks worker status, checks required task statuses, checks contract status, then updates the worker and writes an audit log. This is a good example of service-layer business logic.

Code references:
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/api/src/tests/business-rules.test.ts`

### 19. How are onboarding tasks generated?

Concise answer:
When a worker is created, the worker's country rule determines which onboarding tasks are required.

Detailed answer:
`createWorker()` loads the `CountryRule` for the worker country and calls `onboardingTemplates(rule)`. Base tasks are always generated, and country-specific fields like `requiresTaxId`, `requiresBankDetails`, and `requiresSignedContract` control additional required tasks. This models a simplified compliance engine.

Code references:
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/schema.prisma`

### 20. How does payroll calculation work?

Concise answer:
Payroll includes only active workers, uses monthly salary, adds approved overtime from timesheets, calculates simplified employee tax and employer cost from country rules, and stores payroll items plus run totals.

Detailed answer:
`calculatePayrollRun()` checks that the run is `DRAFT`, loads active workers for the organization, pulls approved timesheets within the period, calculates overtime from salary divided by 160, applies country rule percentages, deletes previous items, creates new payroll items, updates totals, and writes an audit log. This is intentionally not real payroll.

Code references:
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/tests/business-rules.test.ts`
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`

### 21. How does offboarding work?

Concise answer:
Client admins can request offboarding, and EOR/platform users can complete it, which sets the worker to `TERMINATED` and updates the employment end date.

Detailed answer:
Offboarding is implemented in `offboarding.routes.ts`. Requesting offboarding creates an `OffboardingCase`, updates worker status to `OFFBOARDING`, and writes an audit log. Completing offboarding updates the case, worker, employment record, and audit log in a transaction. The current implementation is intentionally simple and does not model legal termination complexity.

Code references:
- `apps/api/src/modules/offboarding/offboarding.routes.ts`
- `apps/api/prisma/schema.prisma`

## Testing

### 22. What tests exist?

Concise answer:
The backend has focused business-rule tests, and the frontend has a few smoke tests for key pages.

Detailed answer:
Backend tests cover activation rules, payroll worker inclusion, overtime, payroll state restrictions, locked payroll behavior, and leave approval. Frontend tests cover login demo buttons, workers page rendering, onboarding status badges, and payroll totals. This is not complete production coverage, but it targets high-value behavior.

Code references:
- `apps/api/src/tests/business-rules.test.ts`
- `apps/web/src/features/auth/LoginPage.test.tsx`
- `apps/web/src/features/workers/WorkersPage.test.tsx`
- `apps/web/src/features/onboarding/OnboardingPage.test.tsx`
- `apps/web/src/features/payroll/PayrollDetailPage.test.tsx`
- `TESTING.md`

### 23. What would you test next?

Concise answer:
I would add API integration tests for auth and tenant isolation, plus frontend tests around mutations and role-specific UI.

Detailed answer:
The current tests focus on service-level business rules. The next most valuable tests would verify that one client cannot access another organization's workers, workers cannot access other workers, payroll endpoints enforce roles, and frontend pages react correctly to failed mutations. I would also add tests for offboarding and invoice generation.

Code references:
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`

## Debugging

### 24. How would you debug a failed login?

Concise answer:
I would check the frontend API base URL, CORS/cookie settings, API health endpoint, and `auth.service.ts` credential logic.

Detailed answer:
This app uses cookies, so failed login can come from the API not running, wrong `VITE_API_URL`, CORS origin mismatch, missing `credentials: "include"`, invalid seeded user, or JWT/cookie configuration. I would start with `/api/health`, browser network tab, then the backend logs.

Code references:
- `apps/web/src/api/client.ts`
- `apps/web/src/hooks/useAuth.tsx`
- `apps/api/src/app.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.controller.ts`

### 25. How would you trace a payroll bug?

Concise answer:
I would start at `PayrollDetailPage.tsx`, inspect the API call in `payroll.api.ts`, then trace into `payroll.routes.ts` and `payroll.service.ts`.

Detailed answer:
Most payroll behavior is backend-owned. I would verify the run status, active workers, employment records, country rules, approved timesheets in the date range, and totals written to `PayrollRun` and `PayrollItem`. The service test file is also useful because it encodes expected business behavior.

Code references:
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`
- `apps/web/src/api/payroll.api.ts`
- `apps/api/src/modules/payroll/payroll.routes.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/tests/business-rules.test.ts`

## Tradeoffs

### 26. What did you intentionally keep simple?

Concise answer:
I kept authorization explicit, workflows service-based, payroll estimated, documents metadata-only, and frontend state mostly server-driven.

Detailed answer:
The goal was a clear interview demo, not a real EOR system. I avoided a policy engine, workflow engine, file storage, payment processor, background jobs, and real compliance engine. That keeps the code easy to inspect and explain. The tradeoff is that production concerns like legal accuracy, scale, observability, and security hardening are intentionally incomplete.

Code references:
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/documents/documents.routes.ts`
- `docs/learning/PRODUCTION_IMPROVEMENTS.md`

### 27. What is one weakness you would call out proactively?

Concise answer:
Some modules still keep business logic directly in route files instead of dedicated services.

Detailed answer:
Workers and payroll have clear service files, but onboarding, documents, and offboarding contain more route-level logic. For a demo this is readable, but as the app grows I would move those into service modules to improve testability and consistency.

Code references:
- `apps/api/src/modules/onboarding/onboarding.routes.ts`
- `apps/api/src/modules/documents/documents.routes.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`

## Scalability and Security

### 28. How would this scale to production?

Concise answer:
I would strengthen authorization, add database constraints and indexes, use decimal money types, add background jobs, improve observability, and integrate real providers.

Detailed answer:
The current shape can grow because business logic is already centralized in backend services for core workflows. Production changes would include policy-based authorization, Postgres row-level security, real migrations, stronger audit trails, external document storage, payroll provider integration, background job processing, more tests, structured logs, metrics, and CI/CD.

Code references:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `docs/learning/PRODUCTION_IMPROVEMENTS.md`

### 29. What security concerns remain?

Concise answer:
The app has basic JWT cookie auth and route guards, but production would need CSRF protection, stronger cookie settings, rate limiting, audit immutability, secret management, and deeper tenant isolation tests.

Detailed answer:
Using HTTP-only cookies is a good start, but same-site and secure cookie behavior depends on environment. There is no CSRF strategy, no rate limiting, no account lockout, no password reset, and tenant isolation needs more integration tests. I would also add row-level security and structured security logging for a real multi-tenant HR/payroll system.

Code references:
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/app.ts`

## Accessibility

### 30. What accessibility work exists and what is missing?

Concise answer:
The UI uses semantic forms and buttons in many places, but it has not had a dedicated accessibility pass.

Detailed answer:
There are labeled form fields through reusable components and keyboard-friendly native controls. However, production would need stronger focus management for modals, ARIA review, color contrast checks, screen-reader testing, and end-to-end keyboard navigation checks.

Code references:
- `apps/web/src/components/ui/FormField.tsx`
- `apps/web/src/components/ui/Modal.tsx`
- `apps/web/src/features/auth/LoginPage.tsx`

## Learning and Challenge

### 31. What was challenging about this project?

Concise answer:
The hardest part is keeping the workflow rules clear while connecting many entities across frontend, backend, and database.

Detailed answer:
The domain touches workers, onboarding tasks, employment records, timesheets, payroll items, invoices, and audit logs. The challenge is making those relationships realistic without over-engineering. The service layer and Prisma schema are the main tools for keeping that understandable.

Code references:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`

### 32. What did you learn?

Concise answer:
I learned how to model realistic workflow software with clear tenant boundaries, role checks, status transitions, and service-layer rules.

Detailed answer:
The project reinforced that full-stack apps are not just screens and endpoints. The important part is where rules live, how data is scoped, how state transitions are protected, and how the UI reflects backend truth. It also made the tradeoffs around simplicity versus production hardening very concrete.

Code references:
- `docs/learning/BUSINESS_LOGIC_GUIDE.md`
- `docs/learning/REQUEST_FLOW_TRACES.md`
- `docs/learning/PRODUCTION_IMPROVEMENTS.md`
