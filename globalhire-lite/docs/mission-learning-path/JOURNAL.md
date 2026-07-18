# Mission Learning Path Journal

## Mission Design Rationale

The missions start with boot and folders because every later trace depends on entry points and ownership (`apps/web/src/main.tsx:1-28`, `apps/api/src/app.ts:1-59`, `package.json:5-18`). They move to contracts, components, routes, state, hooks, middleware, and then full-stack features because this mirrors how engineers debug real product behavior (`packages/shared/src/index.ts:33-86`, `apps/web/src/components/ui/Button.tsx:1-25`, `apps/web/src/features/workers/WorkersPage.tsx:13-20`, `apps/api/src/middleware/auth.middleware.ts:16-48`).

## Code Paths Chosen

Worker creation teaches the full stack because it connects form validation, API wrappers, route guards, a service transaction, and audit logs (`apps/web/src/features/workers/NewWorkerPage.tsx:16-58`, `apps/api/src/modules/workers/workers.service.ts:75-130`). Payroll teaches business rules because it filters active workers, approved timesheets, country rules, and totals (`apps/api/src/modules/payroll/payroll.service.ts:45-125`). Invoice lifecycle teaches reusable transitions and focused tests (`apps/api/src/modules/invoices/invoices.service.ts:20-54`, `apps/api/src/tests/invoice-rules.test.ts:6-103`).

## Skill By Tier

Junior missions train locating code and explaining one file. Mid-level missions train cross-file tracing and diff review. Senior missions train invariant thinking: name the rule, name the owner file, name the test or missing test (`apps/api/src/tests/business-rules.test.ts:14-179`).

