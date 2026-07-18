# Five Story Requirements

These are the five stories selected for the first implementation pass. They were chosen because they exercise the codebase from several angles: React forms, role-aware UI, Express service rules, workflow transitions, React Query invalidation, audit logging, and backend tests.

## Story 1: Edit Worker Profile And Employment Terms

As a client admin, EOR specialist, or platform admin, I want to edit a worker's role and employment details from the worker detail page so that the employee record stays accurate after creation.

Functional requirements:
- Allow editing `jobTitle`, `department`, `salaryAmount`, `salaryCurrency`, and `contractStatus`.
- Limit the UI action to roles that can update workers.
- Save through `PATCH /api/workers/:id`.
- Refresh the worker detail data after a successful save.
- Show API errors without hiding the current worker details.

Learning goals:
- Understand `WorkerDetailPage.tsx`.
- Use React Query mutations and invalidation.
- Understand how nested employment data is patched by `workers.routes.ts`.

## Story 2: Create Leave Requests From The UI

As a worker or client-side reviewer, I want to create leave requests from the Leave page so that leave can enter the approval workflow from the product UI.

Functional requirements:
- Workers submit leave for themselves.
- Non-workers select a visible worker before submitting.
- Capture leave type, start date, end date, and reason.
- Save through `POST /api/leave-requests`.
- Refresh the leave table after creation.
- Show API errors.

Learning goals:
- Understand worker-scoped service behavior in `leave.service.ts`.
- Practice role-aware form fields.
- Connect a simple create form to an existing route.

## Story 3: Create And Submit Timesheets

As a worker or admin, I want to create weekly timesheets and submit drafts so that approved overtime can feed payroll.

Functional requirements:
- Workers create timesheets for themselves.
- Non-workers select a visible worker before submitting.
- Capture week start date, regular hours, overtime hours, and notes.
- Save through `POST /api/timesheets`.
- Add a submit action for `DRAFT` timesheets through `POST /api/timesheets/:id/submit`.
- Preserve existing approve and reject actions.
- Refresh the timesheet table after create, submit, approve, or reject.

Learning goals:
- Understand timesheet status transitions.
- See how approved timesheets affect payroll calculations.
- Practice adding new actions to an existing table workflow.

## Story 4: Payroll Period Validation And Duplicate Protection

As a payroll user, I want invalid or duplicate payroll periods to be rejected so that payroll runs remain consistent.

Functional requirements:
- Reject payroll runs where `periodEnd` is before `periodStart`.
- Reject duplicate payroll runs for the same organization, period start, period end, and currency.
- Preserve existing organization access checks.
- Surface creation failures in the payroll create modal.
- Add backend tests for invalid period and duplicate period behavior.

Learning goals:
- Strengthen service-level validation.
- Learn how dates are normalized by `toDate()`.
- Add targeted business-rule tests.

## Story 5: Invoice Lifecycle Rules

As a finance user, I want invoice status transitions to be explicit so that invoices cannot skip or repeat lifecycle states.

Functional requirements:
- Only `DRAFT` invoices can be issued.
- Only `ISSUED` invoices can be marked paid.
- `DRAFT` and `ISSUED` invoices can be voided.
- Invoice transitions write audit logs.
- The invoice detail page exposes allowed actions for issue, mark paid, and void.
- Add backend tests for valid and invalid transitions.

Learning goals:
- Move route-level mutation logic into service functions.
- Apply the same workflow style used by payroll to invoices.
- Understand audit logging for finance-adjacent state changes.
