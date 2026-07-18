# Tier 3 Senior Missions

### Mission 18: Reverse-Engineer the Architecture Decisions
**Tier:** Senior
**Time Estimate:** 50 minutes
**Goal:** Infer why the repo uses apps, shared schemas, middleware, services, and Prisma.
**The Concept:** Architecture is the operating model: who owns intake, approval, recordkeeping, and reporting.
**Design Intent Before You Read the Code:** Look for boundaries that reduce coupling: shared schemas, services, middleware, and Prisma relations (`packages/shared/src/index.ts:33-86`, `apps/api/src/modules/workers/workers.service.ts:75-165`, `apps/api/src/app.ts:43-56`, `apps/api/prisma/schema.prisma:121-367`).
**Find It In The Code:** Open those ranges.
```ts
// apps/api/src/modules/payroll/payroll.service.ts:45-55
const run = await db.payrollRun.findUnique({ where: { id } }); // Service owns rule context.
requireOrgAccess(run.organizationId, { user: actor } as any);  // Tenant rule near business rule.
if (run.status !== 'DRAFT') throw new ApiError(400, 'Payroll can only be calculated from DRAFT');
```
**The Aha Moment:** Good boundaries make important rules easy to find.
**Socratic Checkpoint:** 1. Why shared schemas? 2. Why services? 3. Why middleware? 4. Why Prisma schema? 5. Which boundary is weakest?

How to self-grade: cite shared schema, services, middleware order, Prisma schema, and frontend `any`.
**Connects To:** Mission 19 and Mission 21.

### Mission 19: Find the Bugs Before They Happen
**Tier:** Senior
**Time Estimate:** 55 minutes
**Goal:** Predict defects from code shape.
**The Concept:** Bug prediction is pre-approval review: catch risky records before payroll depends on them.
**Design Intent Before You Read the Code:** Look for repeated auth, `any`, missing invalidation, and status machines (`auth.middleware.ts:39-45`, `workers.api.ts:4-12`, `invoices.service.ts:20-54`).
**Find It In The Code:** Open `payroll.service.ts:51-111`, `invoices.service.ts:62-71`, `workers.api.ts:4-12`, and `PayrollDetailPage.tsx:14-18`.
```ts
// apps/api/src/modules/invoices/invoices.service.ts:62-71
if (!['APPROVED', 'LOCKED'].includes(run.status)) throw new ApiError(400, 'Invoice can only be generated after payroll approval');
if (run.invoice) return run.invoice; // Idempotency guard.
```
**The Aha Moment:** The best bug reports start as invariant checks.
**Socratic Checkpoint:** 1. What protects invoice generation? 2. What protects payroll calculation? 3. What type weakness hides UI bugs? 4. What cache weakness shows stale status? 5. What auth weakness leaks tenant data?

How to self-grade: cite invoice guard, payroll filters, `any`, invalidation, and org access.
**Connects To:** Mission 20 and Mission 23.

### Mission 20: The Bug Injection Challenge
**Tier:** Senior
**Time Estimate:** 60 minutes
**Goal:** Describe bugs by symptom and test scenario without changing production code.
**The Concept:** A bug injection challenge is a compliance drill: simulate a bad workflow and prove the system refuses it.
**Design Intent Before You Read the Code:** Existing service tests use mocked databases (`apps/api/src/tests/business-rules.test.ts:14-227`, `apps/api/src/tests/invoice-rules.test.ts:6-117`).
**Find It In The Code:** Open those tests.
```ts
// apps/api/src/tests/business-rules.test.ts:131-147
timesheetFindMany: (args: any) => {
  expect(args.where.status).toBe('APPROVED'); // Assert query guard, not only result.
  return Promise.resolve([{ workerId: 'worker-1', overtimeHours: 10 }]);
}
```
**The Aha Moment:** A senior test makes invisible query conditions visible.
**Socratic Checkpoint:** 1. How test tenant leakage? 2. Duplicate invoice? 3. Terminated worker leave? 4. Invalid session? 5. Stale payroll UI?

How to self-grade: name service/component test locations and cite `requireOrgAccess`, `generateInvoice`, `createLeaveRequest`, `requireAuth`, and payroll invalidation.
**Connects To:** Mission 23 and Mission 24.

### Mission 21: Performance X-Ray
**Tier:** Senior
**Time Estimate:** 50 minutes
**Goal:** Audit expensive reads and render paths.
**The Concept:** Performance is payroll batching: do only the work needed for the current run.
**Design Intent Before You Read the Code:** Check broad reads, includes, unpaginated lists, and repeated calculations (`payroll.service.ts:51-65`, `workers.routes.ts:30-39`, `dashboard.routes.ts:43-62`).
**Find It In The Code:** Open those ranges.
```ts
// apps/api/src/modules/payroll/payroll.service.ts:57-65
const countryRules = await db.countryRule.findMany(); // Loads all country rules.
const approvedTimesheets = await db.timesheet.findMany({ where: { status: 'APPROVED', worker: { organizationId: run.organizationId } } }); // Scoped by org and status.
```
**The Aha Moment:** The correct query is the smallest query that preserves the rule.
**Socratic Checkpoint:** 1. What over-fetches? 2. Which list lacks pagination? 3. Which dashboard queries run in parallel? 4. What include may grow? 5. What index helps workers?

How to self-grade: cite payroll rules, worker list include, dashboard `Promise.all`, and `schema.prisma:186-188`.
**Connects To:** Mission 18 and Mission 22.

### Mission 22: The Security Audit
**Tier:** Senior
**Time Estimate:** 60 minutes
**Goal:** Audit auth, roles, tenant boundaries, cookies, and secrets.
**The Concept:** Security is who may approve which workflow for which organization.
**Design Intent Before You Read the Code:** Follow cookie creation, JWT verification, `req.user`, role middleware, org checks, and env requirements (`auth.controller.ts:7-17`, `auth.middleware.ts:9-48`, `requireRole.middleware.ts:4-10`, `env.ts:6-13`).
**Find It In The Code:** Open those ranges plus `app.ts:43-56`.
```ts
// apps/api/src/middleware/auth.middleware.ts:16-37
const token = tokenFromRequest(req);                // Cookie or bearer token.
const payload = jwt.verify(token, env.JWT_SECRET);  // Integrity depends on secret.
const user = await prisma.user.findUnique({ where: { id: payload.sub } });
req.user = { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId };
```
**The Aha Moment:** Frontend role hiding is convenience; backend checks are security.
**Socratic Checkpoint:** 1. Where cookie set? 2. Is it HTTP-only? 3. Where JWT verified? 4. Where tenant checked? 5. Which env default is risky?

How to self-grade: cite `auth.controller.ts:10-15`, `auth.middleware.ts:16-45`, `app.ts:43-56`, and `env.ts:6-13`.
**Connects To:** Mission 23 and Mission 19.

### Mission 23: Write the Test That Doesn't Exist
**Tier:** Senior
**Time Estimate:** 70 minutes
**Goal:** Add a focused test for a risky untested behavior.
**The Concept:** A test is a permanent reviewer assigned to one business rule.
**Design Intent Before You Read the Code:** Existing tests mock service dependencies; follow that style (`business-rules.test.ts:14-227`, `invoice-rules.test.ts:6-117`).
**Find It In The Code:** Open `invoices.service.ts:62-71` and `invoice-rules.test.ts:6-117`.
```ts
// apps/api/src/modules/invoices/invoices.service.ts:62-71
const run = await db.payrollRun.findUnique({ where: { id: payrollRunId }, include: { invoice: true } });
if (run.invoice) return run.invoice; // Dedicated idempotency test should assert invoice.create is not called.
```
**The Aha Moment:** Test the branch that protects money or identity first.
**Socratic Checkpoint:** 1. Which invoice branch lacks direct coverage? 2. What mock DB methods? 3. What should not be called? 4. What returns? 5. Where test lives?

How to self-grade: propose an `invoice-rules.test.ts` test that mocks `payrollRun.findUnique`, asserts `invoice.create` is not called, and cites `invoices.service.ts:62-71`.
**Connects To:** Mission 20 and Mission 24.

### Mission 24: The Git History Tells a Story
**Tier:** Senior
**Time Estimate:** 45 minutes
**Goal:** Infer system evolution from code when Git metadata is unavailable.
**The Concept:** History is the audit log of code; tests and abstractions still tell a story.
**Design Intent Before You Read the Code:** This workspace did not expose Git metadata during inspection, so infer evolution from tests and abstractions (`business-rules.test.ts:14-179`, `invoice-rules.test.ts:6-103`, `invoices.service.ts:20-54`).
**Find It In The Code:** Open those ranges.
```ts
// apps/api/src/modules/invoices/invoices.service.ts:20-54
const transitionInvoice = async (actor, id, transition, db = prisma, auditWriter?) => {
  if (!transition.allowedStatuses.includes(invoice.status)) throw new ApiError(400, transition.errorMessage); // Centralized repeated rule.
  const updated = await db.invoice.update({ where: { id: invoice.id }, data: { status: transition.status } });
  await writeInvoiceAudit(db, auditWriter, { metadata: { fromStatus: invoice.status, toStatus: transition.status } });
  return updated;
};
```
**The Aha Moment:** Abstractions often appear after repeated workflows.
**Socratic Checkpoint:** 1. What commit introduced shared schemas? 2. Invoice transitions? 3. Payroll rules? 4. Auth cookies? 5. What commit next?

How to self-grade: cite shared schema, invoice helper/tests, payroll service/tests, auth controller/middleware, and propose a next commit like typed response DTOs or CSRF hardening.
**Connects To:** Mission 25 because action references preserve what you learned.

