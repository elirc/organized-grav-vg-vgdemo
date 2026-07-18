# Architecture Reference Suite

## Doc 1: Junior Onboarding Guide

Run setup from the README and log in with seeded accounts (`README.md:19-44`, `apps/api/prisma/seed.ts:58-73`). Read `main.tsx`, `App.tsx`, `app.ts`, shared schemas, and Prisma schema before changing code (`apps/web/src/main.tsx:1-28`, `apps/web/src/App.tsx:1-44`, `apps/api/src/app.ts:1-59`, `packages/shared/src/index.ts:1-86`, `apps/api/prisma/schema.prisma:121-367`).

## Doc 2: Mid-Level Architecture Guide

The system layers are React providers/routes, feature pages, API wrappers, Express middleware/routers, domain services, Prisma client, and Postgres schema (`apps/web/src/main.tsx:18-28`, `apps/web/src/api/client.ts:1-19`, `apps/api/src/app.ts:22-59`, `apps/api/src/db/prisma.ts:1-3`). `Worker` is the central lifecycle model, and `PayrollRun` is the main calculation aggregate (`apps/api/prisma/schema.prisma:159-188`, `apps/api/prisma/schema.prisma:284-322`).

## Doc 3: Senior Ownership Guide

Protect tenant isolation, lifecycle transitions, payroll totals, invoice state, and auditability first (`apps/api/src/middleware/auth.middleware.ts:39-45`, `apps/api/src/modules/workers/workers.service.ts:132-165`, `apps/api/src/modules/payroll/payroll.service.ts:45-158`, `apps/api/src/modules/invoices/invoices.service.ts:20-137`, `apps/api/prisma/schema.prisma:355-367`).

## Doc 4: Code Review Guide

Review request schema, auth/role/org checks, persistence changes, transaction boundaries, UI cache invalidation, and tests in that order (`packages/shared/src/index.ts:33-86`, `apps/api/src/app.ts:43-56`, `apps/api/src/middleware/requireRole.middleware.ts:4-10`, `apps/api/src/middleware/auth.middleware.ts:39-45`, `apps/api/prisma/schema.prisma:121-367`, `apps/api/src/modules/workers/workers.service.ts:86-127`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Doc 5: Debugging Guide

Auth bugs: trace cookie set, client credentials, token extraction, JWT verification, and `req.user` assignment (`apps/api/src/modules/auth/auth.controller.ts:10-15`, `apps/web/src/api/client.ts:3-12`, `apps/api/src/middleware/auth.middleware.ts:9-37`). Payroll bugs: trace active worker filter, approved timesheet filter, calculation, transaction, and UI invalidation (`apps/api/src/modules/payroll/payroll.service.ts:51-111`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`). Visibility bugs: trace role hook, sidebar, `requireRole`, and `requireOrgAccess` (`apps/web/src/hooks/useRole.ts:3-17`, `apps/web/src/components/layout/Sidebar.tsx:10-20`, `apps/api/src/middleware/requireRole.middleware.ts:4-10`, `apps/api/src/middleware/auth.middleware.ts:39-45`).

## Doc 6: Change Playbook

Start at the route/page, update shared schema if request shape changes, update Prisma/seed if persistence changes, update API wrapper, add route/service logic with guards, then add tests (`apps/web/src/App.tsx:21-42`, `packages/shared/src/index.ts:33-86`, `apps/api/prisma/schema.prisma:121-367`, `apps/api/prisma/seed.ts:8-230`, `apps/web/src/api/workers.api.ts:4-12`, `apps/api/src/modules/workers/workers.routes.ts:70-126`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Doc 7: Interview Walkthrough

Say: "GlobalHire Lite is a TypeScript monorepo with React/Vite, Express/Prisma/Postgres, and shared Zod request contracts" (`package.json:1-18`, `apps/web/package.json:1-36`, `apps/api/package.json:1-35`, `packages/shared/src/index.ts:1-86`). Then walk create-worker: form validation, API wrapper, protected route, schema parse, transactional worker/employment/onboarding/audit creation, and navigation (`apps/web/src/features/workers/NewWorkerPage.tsx:16-23`, `apps/api/src/modules/workers/workers.routes.ts:70-75`, `apps/api/src/modules/workers/workers.service.ts:86-130`).

