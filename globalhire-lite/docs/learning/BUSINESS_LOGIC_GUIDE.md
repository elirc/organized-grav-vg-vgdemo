# Business Logic Guide

This guide focuses on rules in the backend, because the backend is the source of truth.

## Worker Activation Rules

Where the logic lives:

- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts), `activateWorker()`

What it checks:

- Worker exists.
- Client/internal actor can access the worker organization.
- Worker status must be `ONBOARDING`.
- Every required onboarding task must be `APPROVED`.
- Employment contract must be `SIGNED`.

Why the rule exists:

- A worker should not become active until compliance/onboarding gates are complete.

Edge cases it handles:

- Missing worker.
- Wrong worker status.
- Incomplete required onboarding tasks.
- Unsigned contract.
- Client users trying to activate outside their organization.

Edge cases not handled yet:

- No detailed response listing exactly which tasks block activation.
- No formal state machine.
- No rule that only EOR can activate; current route allows `CLIENT_ADMIN`, `EOR_SPECIALIST`, and `PLATFORM_ADMIN`.

How to explain it:

> Activation is service-level business logic. The UI can show an Activate button, but the backend enforces that required tasks are approved and the contract is signed.

## Onboarding Task Generation

Where the logic lives:

- [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts), `onboardingTemplates()` and `createWorker()`

What it checks:

- Country rule exists for the worker’s `countryCode`.
- Conditional tasks are included based on `requiresSignedContract`, `requiresTaxId`, and `requiresBankDetails`.

Why the rule exists:

- The app models compliance as configurable country rules instead of hardcoding a single onboarding list.

Edge cases it handles:

- Missing country rule returns a clear `400`.

Edge cases not handled yet:

- No versioning of country rules.
- Updating a country rule does not update existing tasks.
- No per-organization overrides.

How to explain it:

> CountryRule is a tiny mocked compliance engine. It gives me a place to show how requirements can be data-driven without pretending the legal rules are real.

## Document Review

Where the logic lives:

- [apps/api/src/modules/documents/documents.routes.ts](../../apps/api/src/modules/documents/documents.routes.ts)

What it checks:

- Worker exists.
- Worker users can only access/upload their own documents.
- Organization access is enforced for list/create.
- Terminated workers cannot upload documents.
- Approve/reject requires `EOR_SPECIALIST` or `PLATFORM_ADMIN`.

Why the rule exists:

- Document review is an internal compliance step.

Edge cases it handles:

- Missing worker/document.
- Worker trying to access another worker’s documents.

Edge cases not handled yet:

- Approve/reject does not write audit logs.
- Approve/reject does not call `requireOrgAccess`, relying on internal/platform role access.
- There is no actual file storage.

How to explain it:

> Documents are metadata-only in this demo. I intentionally avoided file storage so the project stays focused on workflow and authorization.

## Leave Approval/Rejection

Where the logic lives:

- [apps/api/src/modules/leave/leave.service.ts](../../apps/api/src/modules/leave/leave.service.ts)

What it checks:

- Reviewer role must be `CLIENT_MANAGER`, `CLIENT_ADMIN`, or `EOR_SPECIALIST`.
- Leave request exists.
- Reviewer can access worker organization.
- Leave status must be `PENDING`.

Why the rule exists:

- Leave is a manager/admin approval workflow.

Edge cases it handles:

- Wrong reviewer role.
- Missing leave request.
- Cross-tenant review attempt.
- Approving already approved/rejected leave.

Edge cases not handled yet:

- No overlap checks.
- No allowance/accrual enforcement.
- No partial-day logic.

How to explain it:

> Leave is intentionally simple: status transition plus reviewer attribution. That keeps the approval workflow realistic without building a calendar engine.

## Timesheet Submission/Approval

Where the logic lives:

- [apps/api/src/modules/timesheets/timesheets.service.ts](../../apps/api/src/modules/timesheets/timesheets.service.ts)
- Submit endpoint in [apps/api/src/modules/timesheets/timesheets.routes.ts](../../apps/api/src/modules/timesheets/timesheets.routes.ts)

What it checks:

- Worker status cannot be `TERMINATED` for creation.
- Worker users use their own `workerId`.
- Reviewer role must be `CLIENT_MANAGER`, `CLIENT_ADMIN`, or `EOR_SPECIALIST`.
- Timesheet status must be `SUBMITTED` before approval/rejection.
- Organization access is enforced.

Why the rule exists:

- Only approved time should affect payroll.

Edge cases it handles:

- Terminated worker creating timesheet.
- Wrong reviewer role.
- Approving wrong status.

Edge cases not handled yet:

- No duplicate weekly timesheet prevention.
- No daily entries.
- No max overtime policy beyond schema max.

How to explain it:

> Timesheets are weekly summaries. I kept the model compact because the important demo connection is submitted -> approved -> payroll includes approved overtime.

## Payroll Calculation

Where the logic lives:

- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts), `calculatePayrollRun()`

What it checks:

- Payroll run exists.
- Actor can access payroll organization.
- Run must be `DRAFT`.
- Organization must have at least one `ACTIVE` worker.
- Each worker must have employment terms.
- Each worker must have a matching country rule.

Why the rule exists:

- Payroll totals should be calculated consistently on the backend.

Edge cases it handles:

- No active workers.
- Missing employment.
- Missing country rule.
- Approved overtime only.

Edge cases not handled yet:

- Multi-currency conversion.
- Real tax/payroll compliance.
- Benefits/deductions.
- Pay period proration.
- Decimal precision using money-safe types.

How to explain it:

> Payroll calculation is the best example of why business logic belongs in a service. The frontend does not calculate totals. It triggers a state transition, and the backend creates itemized rows and totals.

## Payroll State Transitions

Where the logic lives:

- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)

Rules:

- Create -> `DRAFT`
- Calculate: `DRAFT` -> `CALCULATED`
- Approve: `CALCULATED` -> `APPROVED`
- Lock: `APPROVED` -> `LOCKED`

Why the rule exists:

- Payroll should not be approved before totals exist.
- Locked payroll should be treated as finalized.

Edge cases handled:

- Cannot calculate non-draft.
- Cannot approve non-calculated.
- Cannot approve zero gross total.
- Cannot lock non-approved.

Edge cases not handled yet:

- `assertPayrollEditable()` exists and is tested, but there are no update payroll item endpoints where it is applied.
- No unlock or correction flow.

How to explain it:

> I modeled payroll as enum statuses and explicit service checks. This gives most of the value of a state machine without adding a state-machine library for a small demo.

## Invoice Generation

Where the logic lives:

- [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

What it checks:

- Payroll run exists.
- Actor can access organization.
- Payroll status is `APPROVED` or `LOCKED`.
- Existing invoice is returned instead of creating a duplicate.

Why the rule exists:

- Invoices should be based on approved payroll totals.

Edge cases handled:

- Duplicate invoice generation.
- Wrong payroll status.

Edge cases not handled yet:

- Invoice numbers are simple and ID-derived.
- No PDF generation.
- No payment integration.
- No tax/VAT handling.

How to explain it:

> Invoice generation is downstream from payroll. The app calculates subtotal plus an 8% platform fee and keeps a one-to-one payroll-to-invoice relationship.

## Offboarding Completion

Where the logic lives:

- [apps/api/src/modules/offboarding/offboarding.routes.ts](../../apps/api/src/modules/offboarding/offboarding.routes.ts)

What it checks:

- Completion route requires `EOR_SPECIALIST` or `PLATFORM_ADMIN`.
- Offboarding case exists.
- In a transaction, it marks the case completed, sets worker `TERMINATED`, and sets employment `endDate`.

Why the rule exists:

- Termination should update multiple related records together.

Edge cases handled:

- Missing case.
- Transaction keeps related updates together.

Edge cases not handled yet:

- Complete does not check current case status.
- No notice-period enforcement.
- No final payroll generation.
- Frontend does not expose complete action yet.

How to explain it:

> The important part is that completion is transactional: case, worker status, and employment end date move together.

## Audit Logging

Where the logic lives:

- Helper: [apps/api/src/modules/audit/audit.service.ts](../../apps/api/src/modules/audit/audit.service.ts)
- Direct transaction audit in `createWorker()`
- Audit route: [apps/api/src/modules/audit/audit.routes.ts](../../apps/api/src/modules/audit/audit.routes.ts)

What it checks:

- It does not enforce rules itself. It writes event records.

Why the rule exists:

- HR/payroll/compliance systems need traceability.

Edge cases handled:

- Supports optional organization and optional actor.
- Supports JSON metadata.

Edge cases not handled yet:

- No immutable database-level enforcement.
- Not every action logs audit events.
- No audit export/search filters beyond recent list.

How to explain it:

> Audit logging is lightweight but intentional. Even in a demo, I wanted to show who did what and when for important workflow events.

## Multi-Tenant Access Checks

Where the logic lives:

- [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts), `requireOrgAccess()`
- Worker scoping helper: [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts), `getWorkerWhereForActor()`

What it checks:

- `PLATFORM_ADMIN` and `EOR_SPECIALIST` bypass org checks.
- Client users must match `req.user.organizationId`.
- Workers are scoped to their own `workerId` in worker queries.

Why the rule exists:

- One platform serves multiple client organizations.

Edge cases handled:

- Client admin cannot create workers in another org.
- Worker cannot view another worker profile.
- Lists are filtered by actor.

Edge cases not handled yet:

- No Postgres row-level security.
- Some internal-only routes rely on role rather than org checks.
- Frontend route hiding is convenience only.

How to explain it:

> The backend handles tenant boundaries. The UI hides navigation by role, but route guards and query filters are the real protection.

## Role-Based Permission Checks

Where the logic lives:

- [apps/api/src/middleware/requireRole.middleware.ts](../../apps/api/src/middleware/requireRole.middleware.ts)
- [apps/web/src/hooks/useRole.ts](../../apps/web/src/hooks/useRole.ts)

What it checks:

- Backend: whether `req.user.role` is in the allowed list.
- Frontend: convenience booleans like `canPayroll`, `canReview`, `canManageWorkers`.

Why the rule exists:

- Different users should see and do different things.

Edge cases not handled yet:

- No central permission matrix.
- No role hierarchy abstraction.
- Some route access is broad for demo speed.

How to explain it:

> I intentionally kept RBAC explicit. In a real platform I would probably move to policy-based authorization, but here explicit route guards are easier to read and test.
