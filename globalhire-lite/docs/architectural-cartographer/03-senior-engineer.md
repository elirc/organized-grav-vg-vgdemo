# Senior Engineer Guide

## Architectural Critique

- Scalability: 3/5. Modules are clear, but unpaginated lists and broad includes will need attention as data grows (`apps/api/src/modules/workers/workers.routes.ts:30-39`, `apps/api/src/modules/payroll/payroll.routes.ts:17-30`).
- TypeScript discipline: 3/5. Request schemas are shared, but frontend response types often use `any` (`packages/shared/src/index.ts:33-86`, `apps/web/src/api/workers.api.ts:4-12`).
- Separation of concerns: 3/5. Worker/payroll services are testable, while onboarding/timesheet route callbacks hold business logic (`apps/api/src/modules/workers/workers.service.ts:75-165`, `apps/api/src/modules/payroll/payroll.service.ts:45-158`, `apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`).
- Testability: 4/5. Service functions accept injected `db` mocks and business-rule tests already exist (`apps/api/src/modules/payroll/payroll.service.ts:15-16`, `apps/api/src/tests/business-rules.test.ts:14-179`).
- Maintainability: 3/5. Feature layout is simple, but repeated `any` and one-line routes reduce clarity (`apps/web/src/App.tsx:2-17`, `apps/api/src/modules/payroll/payroll.routes.ts:55-57`).
- Security posture: 3/5. HTTP-only cookies and guards exist, but default JWT secret and no explicit CSRF layer require production hardening (`apps/api/src/modules/auth/auth.controller.ts:10-15`, `apps/api/src/config/env.ts:6-13`).
- Performance: 3/5. Dashboard parallelizes work, but payroll loads all country rules and worker list includes all onboarding tasks (`apps/api/src/modules/dashboard/dashboard.routes.ts:43-62`, `apps/api/src/modules/payroll/payroll.service.ts:51-65`, `apps/api/src/modules/workers/workers.routes.ts:30-39`).

## Performance Audit

```ts
// Based on apps/api/src/modules/payroll/payroll.service.ts:51-58
const workers = await db.worker.findMany({ where: { organizationId: run.organizationId, status: 'ACTIVE' }, include: { employment: true } });
const countryCodes = [...new Set(workers.map((worker: any) => worker.countryCode))];
const countryRules = await db.countryRule.findMany({
  where: { countryCode: { in: countryCodes } }, // Fetch only rules needed by this run.
});
```

```ts
// Based on apps/api/src/modules/workers/workers.routes.ts:30-39
const workers = await prisma.worker.findMany({
  where: filters,
  include: { employment: true, _count: { select: { onboardingTasks: true } } }, // Avoid shipping every task for list rows.
  orderBy: { createdAt: 'desc' },
});
```

## Security Audit

```ts
// Based on apps/api/src/config/env.ts:6-13
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32), // Production should require an explicit strong secret.
  JWT_EXPIRES_IN: z.string().default('7d'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
});
```

```ts
// Based on apps/api/src/app.ts:36-44
app.use(express.json());
app.use(cookieParser());
// Add CSRF protection for unsafe methods before protected business routes.
app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
```

## TypeScript Discipline Review

Keep the shared-schema pattern for inputs (`packages/shared/src/index.ts:33-86`). Reduce `api<any>` in frontend wrappers by defining response DTOs for worker list/detail and payroll detail (`apps/web/src/api/workers.api.ts:4-12`, `apps/web/src/api/payroll.api.ts:3-10`).

## Custom Abstractions Inventory

`api<T>` wraps fetch and JSON errors (`apps/web/src/api/client.ts:1-19`). `useAuth` owns session cache and login/logout mutations (`apps/web/src/hooks/useAuth.tsx:14-48`). `useRole` derives UI permissions (`apps/web/src/hooks/useRole.ts:3-17`). `asyncHandler` forwards async route errors (`apps/api/src/utils/asyncHandler.ts:1-7`). `requireOrgAccess` enforces tenant boundaries (`apps/api/src/middleware/auth.middleware.ts:39-45`). `onboardingTemplates` generates country-rule-based tasks (`apps/api/src/modules/workers/workers.service.ts:12-67`).

## Testing Assessment And Runnable Test

Existing tests cover worker activation, payroll rules, leave approval, and invoice transitions (`apps/api/src/tests/business-rules.test.ts:14-179`, `apps/api/src/tests/invoice-rules.test.ts:6-103`). Add this test for invoice idempotency, which follows the existing mock style and protects the `if (run.invoice) return run.invoice` branch (`apps/api/src/modules/invoices/invoices.service.ts:62-71`):

```ts
it('returns existing invoice when payroll already has one', async () => {
  const existingInvoice = { id: 'invoice-existing', payrollRunId: 'payroll-1', status: 'DRAFT' };
  const db = {
    payrollRun: { findUnique: vi.fn().mockResolvedValue({ id: 'payroll-1', organizationId: 'org-1', status: 'APPROVED', invoice: existingInvoice }) },
    invoice: { create: vi.fn() },
  };
  await expect(generateInvoice(actor as any, 'payroll-1', db as any, vi.fn() as any)).resolves.toBe(existingInvoice);
  expect(db.invoice.create).not.toHaveBeenCalled();
});
```

## Bug Injection Exercise

1. Client admin sees another organization's workers: test `getWorkerWhereForActor` and worker list filtering (`apps/api/src/modules/workers/workers.service.ts:69-73`).
2. Payroll includes onboarding workers: test active-worker filter (`apps/api/src/modules/payroll/payroll.service.ts:51-55`).
3. Worker approves own timesheet: test reviewer role guard (`apps/api/src/modules/timesheets/timesheets.service.ts:30-35`).
4. Invoice generated before payroll approval: test approved/locked guard (`apps/api/src/modules/invoices/invoices.service.ts:62-67`).
5. Bad cookie crashes instead of 401: test `requireAuth` catch path (`apps/api/src/middleware/auth.middleware.ts:16-37`).

## Git History Learning Exercise

This workspace did not expose Git metadata during inspection, so infer realistic history from code. Analyze these commit messages: `feat(workers): create hire request flow` (`apps/api/src/modules/workers/workers.service.ts:75-130`); `feat(auth): add cookie session and protected shell` (`apps/api/src/modules/auth/auth.controller.ts:7-25`, `apps/web/src/routes/ProtectedRoute.tsx:5-13`); `feat(payroll): calculate active-worker payroll` (`apps/api/src/modules/payroll/payroll.service.ts:45-125`); `test(invoices): cover lifecycle transitions` (`apps/api/src/tests/invoice-rules.test.ts:6-103`); `docs: add demo setup and accounts` (`README.md:19-44`, `apps/api/prisma/seed.ts:58-73`).

## If I Owned This Codebase

Add response DTOs: effort M, impact high (`apps/web/src/api/workers.api.ts:4-12`). Extract onboarding services: effort M, impact medium (`apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`). Add CSRF protection: effort M, impact high (`apps/api/src/modules/auth/auth.controller.ts:10-15`). Add pagination: effort M, impact medium (`apps/api/src/modules/workers/workers.routes.ts:30-39`). Add auth/org integration tests: effort M, impact high (`apps/api/src/middleware/auth.middleware.ts:39-45`).

