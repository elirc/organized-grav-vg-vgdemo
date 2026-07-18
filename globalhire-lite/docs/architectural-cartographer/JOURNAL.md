# Architectural Cartographer Journal

## First-Pass Mental Model

GlobalHire Lite is an npm-workspaces TypeScript monorepo with React/Vite on the frontend, Express/Prisma/Postgres on the backend, and a shared Zod package for important request contracts (`package.json:1-18`, `apps/web/package.json:1-36`, `apps/api/package.json:1-35`, `packages/shared/package.json:1-14`). The frontend wraps the app in TanStack Query, React Router, and Auth context (`apps/web/src/main.tsx:9-28`). The API mounts public auth routes, then protects later `/api` routes with `requireAuth` (`apps/api/src/app.ts:43-56`).

## Key Discoveries

- `Worker` is the central domain record because it relates to employment, onboarding tasks, documents, leave, timesheets, payroll items, and offboarding cases (`apps/api/prisma/schema.prisma:159-188`).
- Worker creation is the best end-to-end teaching flow: the form uses `createWorkerSchema`, the web wrapper posts to `/workers`, the route parses the same schema, and the service transaction creates worker, employment, onboarding tasks, and audit log (`apps/web/src/features/workers/NewWorkerPage.tsx:16-23`, `apps/web/src/api/workers.api.ts:4-12`, `apps/api/src/modules/workers/workers.routes.ts:70-75`, `apps/api/src/modules/workers/workers.service.ts:75-130`).
- Payroll is the densest business-rule flow: only draft runs calculate, only active workers are included, approved timesheets supply overtime, and totals/items are written transactionally (`apps/api/src/modules/payroll/payroll.service.ts:45-125`).
- Auth exists as JWT in an HTTP-only cookie; the backend also accepts bearer tokens (`apps/api/src/modules/auth/auth.controller.ts:10-15`, `apps/api/src/middleware/auth.middleware.ts:9-37`).

## Teaching Anchors

Chosen anchors: `main.tsx`, `App.tsx`, `app.ts`, `packages/shared/src/index.ts`, `schema.prisma`, `useAuth`, `useRole`, `workers.service.ts`, and `payroll.service.ts` because they reveal providers, routes, middleware, contracts, persistence, session state, role decisions, worker lifecycle, and payroll rules (`apps/web/src/main.tsx:1-28`, `apps/web/src/App.tsx:1-44`, `apps/api/src/app.ts:1-59`, `packages/shared/src/index.ts:1-86`, `apps/api/prisma/schema.prisma:121-367`, `apps/web/src/hooks/useAuth.tsx:1-48`, `apps/web/src/hooks/useRole.ts:1-17`, `apps/api/src/modules/workers/workers.service.ts:12-165`, `apps/api/src/modules/payroll/payroll.service.ts:45-158`).

## Where To Slow Down

Juniors should slow down where frontend routes and backend routes use similar paths but different files, such as onboarding (`apps/web/src/App.tsx:27-29`, `apps/api/src/modules/onboarding/onboarding.routes.ts:18-29`). Mid-level engineers should slow down around `requireOrgAccess`, because tenant isolation is shared middleware plus route/service usage (`apps/api/src/middleware/auth.middleware.ts:39-45`, `apps/api/src/modules/workers/workers.routes.ts:61-65`). Senior engineers should be skeptical of frontend `any` response types and env defaults (`apps/web/src/api/workers.api.ts:4-12`, `apps/web/src/api/payroll.api.ts:3-10`, `apps/api/src/config/env.ts:6-13`).

## Checkpoint Use

For each checkpoint, answer with file names and line ranges. A strong answer identifies ownership, data movement, and the next source file to inspect.

