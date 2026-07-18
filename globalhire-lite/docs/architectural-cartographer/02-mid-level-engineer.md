# Mid-Level Engineer Guide

## Architecture Diagram

```text
Browser
 -> React providers: QueryClientProvider, BrowserRouter, AuthProvider (apps/web/src/main.tsx:18-28)
 -> Route tree and protected shell (apps/web/src/App.tsx:21-42, apps/web/src/routes/ProtectedRoute.tsx:5-13)
 -> Feature pages and API wrappers (apps/web/src/features, apps/web/src/api/client.ts:1-19)
 -> Express middleware and routers (apps/api/src/app.ts:22-59)
 -> Domain services/routes (apps/api/src/modules)
 -> Prisma client and Postgres schema (apps/api/src/db/prisma.ts:1-3, apps/api/prisma/schema.prisma:121-367)
```

## Type System Deep Dive

Shared Zod schemas define runtime request validation and inferred TypeScript inputs (`packages/shared/src/index.ts:33-86`). `NewWorkerPage` uses `zodResolver(createWorkerSchema)` and `useForm<CreateWorkerInput>` (`apps/web/src/features/workers/NewWorkerPage.tsx:5-18`). The worker route parses the same schema before calling the service (`apps/api/src/modules/workers/workers.routes.ts:70-75`). The weak spot is response `any` in web API modules (`apps/web/src/api/workers.api.ts:4-12`, `apps/web/src/api/payroll.api.ts:3-10`).

## State Management Deep Dive

The worker list keeps filters in local React state and fetched workers in TanStack Query cache (`apps/web/src/features/workers/WorkersPage.tsx:13-20`). Payroll detail keeps server state under `['payroll-run', id]` and refreshes it after mutations (`apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`). Domain analogy: filters are a coordinator's temporary search note; query data is the official worker directory.

## API Contract Map

Auth routes: login/logout/me (`apps/api/src/modules/auth/auth.routes.ts:5-9`). Workers: list/detail/create/update/activate/offboarding (`apps/api/src/modules/workers/workers.routes.ts:14-126`). Onboarding: list/submit/approve/reject tasks (`apps/api/src/modules/onboarding/onboarding.routes.ts:18-103`). Payroll: list/detail/create/calculate/approve/lock (`apps/api/src/modules/payroll/payroll.routes.ts:17-57`). Invoices: list/detail/generate/issue/paid/void (`apps/api/src/modules/invoices/invoices.routes.ts:11-65`).

## Component Interaction Map

`App` nests business pages under `ProtectedRoute` (`apps/web/src/App.tsx:21-42`). `ProtectedRoute` reads auth state and renders `AppShell` plus `<Outlet />` for authenticated users (`apps/web/src/routes/ProtectedRoute.tsx:5-13`). `AppShell` composes `Sidebar`, `Topbar`, and page content (`apps/web/src/components/layout/AppShell.tsx:5-15`). `Sidebar` hides nav items based on `useRole` booleans (`apps/web/src/components/layout/Sidebar.tsx:8-40`, `apps/web/src/hooks/useRole.ts:3-17`).

## Full-Stack Feature Trace: Create Worker

1. `/workers/new` renders `NewWorkerPage` (`apps/web/src/App.tsx:25-27`).
2. Form uses shared schema and submits to `workersApi.create` (`apps/web/src/features/workers/NewWorkerPage.tsx:16-23`, `apps/web/src/features/workers/NewWorkerPage.tsx:34-58`).
3. `workersApi.create` posts to `/workers` (`apps/web/src/api/workers.api.ts:7`).
4. API route is protected globally and role-gated locally (`apps/api/src/app.ts:43-47`, `apps/api/src/modules/workers/workers.routes.ts:70-75`).
5. Service checks org/country rule, then transactionally creates worker, employment, onboarding tasks, and audit log (`apps/api/src/modules/workers/workers.service.ts:75-130`).

```ts
// apps/api/src/modules/workers/workers.service.ts:86-127
const worker = await db.$transaction(async (tx: Db) => {
  const created = await tx.worker.create({
    data: {
      organizationId,             // Tenant boundary.
      status: 'ONBOARDING',        // New hire lifecycle state.
      employment: { create: { ... } }, // Employment record created with worker.
      onboardingTasks: { create: onboardingTemplates(rule).map((task) => ({ ...task, status: 'NOT_STARTED' })) },
    },
    include: { employment: true, onboardingTasks: true },
  });
  await tx.auditLog.create({ data: { action: 'WORKER_CREATED', entityId: created.id, message: `Worker ${created.firstName} ${created.lastName} was created` } });
  return created;
});
```

## Diff Reading Exercise

Hypothetical change: add `preferredName` to workers. Review in this order: Prisma worker model (`apps/api/prisma/schema.prisma:159-188`), shared create schema (`packages/shared/src/index.ts:33-46`), worker create service (`apps/api/src/modules/workers/workers.service.ts:87-114`), patch schema/update route (`apps/api/src/modules/workers/workers.routes.ts:78-111`), form/list/detail UI (`apps/web/src/features/workers/NewWorkerPage.tsx:34-58`, `apps/web/src/features/workers/WorkersPage.tsx:47-66`), seed/test coverage (`apps/api/prisma/seed.ts:75-145`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Non-Obvious Patterns

Route order creates public/private API boundaries (`apps/api/src/app.ts:43-56`). Services accept optional `db` arguments so tests can inject mocks (`apps/api/src/modules/payroll/payroll.service.ts:15-16`, `apps/api/src/tests/business-rules.test.ts:118-147`). UI role hiding is convenience; backend middleware/services enforce security (`apps/web/src/components/layout/Sidebar.tsx:10-20`, `apps/api/src/middleware/requireRole.middleware.ts:4-10`).

## Mid-Level Socratic Checkpoint

1. Why does worker creation need a transaction?
2. What breaks if schema and form drift?
3. How does UI role hiding differ from backend role checks?
4. Which query key refreshes payroll detail?
5. Where does tenant isolation happen?
6. Which tables does payroll calculation read?
7. Which line proves only approved overtime is used?
8. Where would you add a worker field?

How to self-grade: cite `workers.service.ts:86-127`, `NewWorkerPage.tsx:16-18`, `Sidebar.tsx:10-20`, `requireRole.middleware.ts:4-10`, `PayrollDetailPage.tsx:14-18`, `auth.middleware.ts:39-45`, `payroll.service.ts:51-70`, and `schema.prisma:159-188`.

