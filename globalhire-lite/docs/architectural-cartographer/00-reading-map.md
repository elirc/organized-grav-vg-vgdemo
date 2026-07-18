# Reading Map

## Mental Model

React pages render role-aware EOR workflows, TanStack Query owns server data, API wrapper modules call Express routes, middleware attaches identity and enforces roles/org boundaries, Prisma persists the domain, and shared Zod schemas define key request contracts (`apps/web/src/main.tsx:9-28`, `apps/web/src/api/client.ts:1-19`, `apps/api/src/app.ts:22-59`, `apps/api/prisma/schema.prisma:121-367`, `packages/shared/src/index.ts:33-86`).

## Top 10 Files To Read In Order

1. `README.md`: product, stack, setup, demo users, workflows (`README.md:1-54`).
2. `package.json`: workspaces and scripts (`package.json:5-18`).
3. `apps/web/src/main.tsx`: providers and query defaults (`apps/web/src/main.tsx:9-28`).
4. `apps/web/src/App.tsx`: route skeleton (`apps/web/src/App.tsx:21-42`).
5. `apps/api/src/app.ts`: middleware and route mounting (`apps/api/src/app.ts:22-59`).
6. `apps/api/prisma/schema.prisma`: durable domain model (`apps/api/prisma/schema.prisma:121-367`).
7. `packages/shared/src/index.ts`: roles, statuses, schemas, inferred types (`packages/shared/src/index.ts:3-86`).
8. `apps/web/src/hooks/useAuth.tsx`: session cache and login/logout behavior (`apps/web/src/hooks/useAuth.tsx:14-48`).
9. `apps/api/src/modules/workers/workers.service.ts`: worker lifecycle rules (`apps/api/src/modules/workers/workers.service.ts:12-165`).
10. `apps/api/src/modules/payroll/payroll.service.ts`: payroll business rules (`apps/api/src/modules/payroll/payroll.service.ts:45-158`).

For each file, ask: what does it own, what does it import, what does it return, and which downstream file would break if its contract changed.

## Three Important Data Flows

1. Login: `LoginPage` calls auth context, `authApi.login` posts credentials, backend sets `globalhire_token`, and `/auth/me` hydrates session (`apps/web/src/features/auth/LoginPage.tsx:1-64`, `apps/web/src/hooks/useAuth.tsx:21-37`, `apps/web/src/api/auth.api.ts:13-17`, `apps/api/src/modules/auth/auth.controller.ts:7-25`).
2. Create worker: form uses shared schema, API wrapper posts, route parses schema, service transaction writes worker/employment/tasks/audit, then UI navigates to detail (`apps/web/src/features/workers/NewWorkerPage.tsx:16-23`, `apps/web/src/api/workers.api.ts:7`, `apps/api/src/modules/workers/workers.routes.ts:70-75`, `apps/api/src/modules/workers/workers.service.ts:86-130`).
3. Calculate payroll: detail button calls wrapper, route checks role, service reads active workers and approved timesheets, writes items/totals, and invalidation refreshes UI (`apps/web/src/features/payroll/PayrollDetailPage.tsx:14-31`, `apps/web/src/api/payroll.api.ts:7`, `apps/api/src/modules/payroll/payroll.routes.ts:55-57`, `apps/api/src/modules/payroll/payroll.service.ts:51-125`).

## Pre-Reading Checklist

1. Can I name all workspaces (`package.json:5-8`)?
2. Can I find frontend boot (`apps/web/src/main.tsx:18-28`)?
3. Can I find API listen (`apps/api/src/server.ts:1-7`)?
4. Can I explain public auth before protected routes (`apps/api/src/app.ts:43-44`)?
5. Can I name the auth cookie (`apps/api/src/modules/auth/auth.controller.ts:10-15`)?
6. Can I find worker relations (`apps/api/prisma/schema.prisma:159-188`)?
7. Can I find create-worker validation (`packages/shared/src/index.ts:33-46`)?
8. Can I find role-aware sidebar logic (`apps/web/src/components/layout/Sidebar.tsx:10-20`)?
9. Can I find backend role enforcement (`apps/api/src/middleware/requireRole.middleware.ts:4-10`)?
10. Can I find business-rule tests (`apps/api/src/tests/business-rules.test.ts:14-179`)?

## Red Flags Checklist

- New frontend `any` response types (`apps/web/src/api/workers.api.ts:4-12`).
- State-changing routes without role or org checks (`apps/api/src/middleware/requireRole.middleware.ts:4-10`, `apps/api/src/middleware/auth.middleware.ts:39-45`).
- Multi-table writes without transactions (`apps/api/src/modules/workers/workers.service.ts:86-127`).
- Mutations without navigation or query invalidation (`apps/web/src/features/workers/NewWorkerPage.tsx:20-23`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`).
- Payroll changes that include non-active workers or unapproved timesheets (`apps/api/src/modules/payroll/payroll.service.ts:51-70`).
- Schema changes without seed/test updates (`apps/api/prisma/schema.prisma:121-367`, `apps/api/prisma/seed.ts:8-230`).
- Security-sensitive env defaults (`apps/api/src/config/env.ts:6-13`).
- Route files accumulating business logic that should be tested in services (`apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`).

