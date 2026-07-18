# Mission 25: Write the Docs That Don't Exist

## Doc 1: Junior Onboarding Checklist

Run setup from README, log in with seeded accounts, read frontend boot, route tree, backend app, shared schemas, and Prisma schema (`README.md:19-44`, `apps/api/prisma/seed.ts:58-73`, `apps/web/src/main.tsx:1-28`, `apps/web/src/App.tsx:1-44`, `apps/api/src/app.ts:1-59`, `packages/shared/src/index.ts:1-86`, `apps/api/prisma/schema.prisma:121-367`).

## Doc 2: Architecture Guide for New Engineers

Navigate by flow: route, page, API wrapper, backend mount, router, service, Prisma model, tests (`apps/web/src/App.tsx:21-42`, `apps/web/src/api/client.ts:1-19`, `apps/api/src/app.ts:43-56`, `apps/api/prisma/schema.prisma:121-367`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Doc 3: Code Review Checklist

Check schemas, auth, roles, org access, transaction boundaries, cache invalidation, and tests (`packages/shared/src/index.ts:33-86`, `apps/api/src/app.ts:43-56`, `apps/api/src/middleware/requireRole.middleware.ts:4-10`, `apps/api/src/middleware/auth.middleware.ts:39-45`, `apps/api/src/modules/workers/workers.service.ts:86-127`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Doc 4: Debugging Playbook

Auth failure: cookie, credentials, token extraction, JWT verify, user lookup, error handler (`apps/api/src/modules/auth/auth.controller.ts:10-15`, `apps/web/src/api/client.ts:3-12`, `apps/api/src/middleware/auth.middleware.ts:9-37`, `apps/api/src/middleware/error.middleware.ts:9-20`). Payroll wrong total: active worker filter, approved timesheet filter, overtime math, transaction, UI invalidation (`apps/api/src/modules/payroll/payroll.service.ts:51-111`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`).

## Doc 5: Change Playbook

Branch, update schema/model, update UI/API wrapper, update route/service, seed data, add tests, run workspace tests (`packages/shared/src/index.ts:33-86`, `apps/api/prisma/schema.prisma:121-367`, `apps/web/src/features/workers/NewWorkerPage.tsx:34-58`, `apps/web/src/api/workers.api.ts:4-12`, `apps/api/src/modules/workers/workers.routes.ts:70-126`, `apps/api/prisma/seed.ts:8-230`, `apps/api/src/tests/business-rules.test.ts:14-179`, `package.json:10-18`).

## Doc 6: Senior Ownership Notes

Monitor auth boundary, tenant isolation, payroll calculation, invoice lifecycle, and audit logs (`apps/api/src/middleware/auth.middleware.ts:16-48`, `apps/api/src/modules/payroll/payroll.service.ts:45-158`, `apps/api/src/modules/invoices/invoices.service.ts:20-137`, `apps/api/prisma/schema.prisma:355-367`). Improve typed API responses, CSRF hardening, pagination, service extraction, and integration tests (`apps/web/src/api/workers.api.ts:4-12`, `apps/api/src/modules/auth/auth.controller.ts:10-15`, `apps/api/src/modules/workers/workers.routes.ts:30-39`, `apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`, `apps/api/src/middleware/auth.middleware.ts:39-45`).

## Doc 7: Interview Walkthrough

Practice: "GlobalHire Lite is a TypeScript monorepo with React/Vite, Express/Prisma/Postgres, and shared Zod request contracts. Protected pages load session state, render role-aware routes, and call Express routes that enforce JWT auth, roles, org boundaries, and Prisma-backed rules" (`package.json:1-18`, `apps/web/src/main.tsx:18-28`, `apps/web/src/App.tsx:21-42`, `apps/api/src/app.ts:22-59`, `packages/shared/src/index.ts:33-86`). Then walk create worker from form to transaction (`apps/web/src/features/workers/NewWorkerPage.tsx:16-58`, `apps/api/src/modules/workers/workers.routes.ts:70-75`, `apps/api/src/modules/workers/workers.service.ts:75-130`).

