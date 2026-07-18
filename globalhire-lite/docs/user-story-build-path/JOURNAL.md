# User Story Build Path Journal

The sequence starts with visible UI so you can safely practice reading existing JSX (`apps/web/src/features/workers/WorkersPage.tsx:47-66`, `apps/web/src/features/dashboard/DashboardPage.tsx:46-91`). It then moves into API/state changes using existing route and query patterns (`apps/web/src/api/client.ts:1-19`, `apps/api/src/modules/dashboard/dashboard.routes.ts:8-75`). Harder stories touch persistence and business rules because `Worker`, `PayrollRun`, and `Invoice` are the areas where product changes carry real risk (`apps/api/prisma/schema.prisma:159-367`, `apps/api/src/modules/payroll/payroll.service.ts:45-158`, `apps/api/src/modules/invoices/invoices.service.ts:20-137`).

A tech lead would watch role mismatch between UI and backend, missing org checks, frontend `any`, and mutation flows that forget invalidation (`apps/web/src/hooks/useRole.ts:3-17`, `apps/api/src/middleware/requireRole.middleware.ts:4-10`, `apps/api/src/middleware/auth.middleware.ts:39-45`, `apps/web/src/api/workers.api.ts:4-12`, `apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`).

