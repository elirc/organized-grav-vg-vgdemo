# User Story Backlog For Learning

These stories are designed to help you learn this codebase by building real features across the stack. They are ordered roughly from lower-risk UI work to deeper backend, schema, workflow, and testing work.

Each story includes the code areas you will touch and the engineering skill it is meant to strengthen.

## 1. Edit Worker Profile And Employment Terms

Story:
As a client admin, I want to edit a worker's job title, department, manager, salary, salary currency, and contract status from the worker detail page so that worker records stay current after the hire request is created.

Why this teaches the codebase:
This uses an existing backend endpoint but requires you to wire a real frontend edit workflow into React Query, forms, shared validation, and the worker detail screen.

Likely files:
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `apps/web/src/api/workers.api.ts`
- `packages/shared/src/index.ts`
- `apps/api/src/modules/workers/workers.routes.ts`

Acceptance criteria:
- Worker detail has an edit action for users allowed to patch workers.
- The form validates salary, currency, department, title, manager, and contract status.
- Successful save invalidates the worker query and updates the page.
- Unauthorized roles cannot see the edit action.
- A frontend test covers opening the form and submitting a valid update.

## 2. Add A Worker-Facing Leave Request Form

Story:
As a worker, I want to create a leave request from the Leave page so that I can submit vacation, sick, personal, or parental leave without an admin doing it for me.

Why this teaches the codebase:
You will connect a simple form to an existing service, understand role-dependent worker scoping, and learn how worker users differ from client admins.

Likely files:
- `apps/web/src/features/leave/LeavePage.tsx`
- `apps/web/src/api/resources.api.ts`
- `packages/shared/src/index.ts`
- `apps/api/src/modules/leave/leave.service.ts`
- `apps/api/src/modules/leave/leave.routes.ts`

Acceptance criteria:
- Workers can submit leave for themselves without choosing a worker ID.
- Client admins and managers can submit leave for a selected worker in their organization.
- The UI shows pending requests immediately after submission.
- End date cannot be before start date.
- Backend tests cover worker-scoped creation and cross-organization denial.

## 3. Add Timesheet Creation, Draft Save, And Submit

Story:
As a worker, I want to create a weekly timesheet, save it as a draft when allowed, and submit it for approval so that overtime can flow into payroll.

Why this teaches the codebase:
This story connects worker workflow data to payroll calculations and forces you to reason about status transitions.

Likely files:
- `apps/web/src/features/timesheets/TimesheetsPage.tsx`
- `apps/web/src/api/resources.api.ts`
- `packages/shared/src/index.ts`
- `apps/api/src/modules/timesheets/timesheets.routes.ts`
- `apps/api/src/modules/timesheets/timesheets.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`

Acceptance criteria:
- Users can create a timesheet with week start date, regular hours, overtime hours, and notes.
- Workers submit immediately or can explicitly submit a draft, depending on the rule you choose.
- Only `SUBMITTED` timesheets can be approved or rejected.
- Approved overtime appears in a recalculated payroll run for the matching period.
- Tests cover rejected or draft timesheets being excluded from payroll.

## 4. Build A Role-Aware Approval Inbox

Story:
As a manager or EOR specialist, I want a single approval inbox for pending onboarding tasks, uploaded documents, leave requests, and submitted timesheets so that I can handle review work without visiting every module separately.

Why this teaches the codebase:
You will design an aggregate API, reuse existing approval actions, and understand how different workflow modules share similar patterns.

Likely files:
- `apps/api/src/modules/dashboard/dashboard.routes.ts` or a new `approvals` module
- `apps/web/src/App.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/features/dashboard/DashboardPage.tsx`
- `apps/web/src/api/resources.api.ts`

Acceptance criteria:
- The API returns pending items scoped by role and organization.
- The UI groups approvals by type and links to the source record.
- Approve and reject actions reuse existing endpoints where possible.
- Workers cannot access the inbox.
- Tests cover role-specific inbox results.

## 5. Add Document Rejection Reasons And Audit Events

Story:
As an EOR specialist, I want to approve or reject worker documents with a rejection reason so that workers and admins understand what needs to be corrected.

Why this teaches the codebase:
Documents are currently metadata-only and lightly modeled. This story adds a small schema change, backend validation, audit logging, and UI display.

Likely files:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/documents/documents.routes.ts`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `packages/shared/src/index.ts`

Acceptance criteria:
- `WorkerDocument` stores an optional rejection reason and reviewed metadata if you choose to add reviewer fields.
- Rejecting a document requires a reason.
- Approving clears any previous rejection reason.
- Document approve/reject writes audit log events.
- Worker detail displays the latest rejection reason.

## 6. Tighten Onboarding State Transitions

Story:
As an EOR specialist, I want onboarding tasks to follow explicit status rules so that tasks cannot jump between invalid states.

Why this teaches the codebase:
The app already has task statuses, but routes currently allow broad updates. This story teaches service-layer state machines without adding a full state-machine library.

Likely files:
- `apps/api/src/modules/onboarding/onboarding.routes.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/tests/business-rules.test.ts`
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `apps/web/src/features/onboarding/OnboardingPage.tsx`

Acceptance criteria:
- `NOT_STARTED` or `REJECTED` tasks can be submitted.
- Only `SUBMITTED` tasks can be approved or rejected.
- Rejected tasks can be resubmitted and clear the old rejection reason.
- Approved tasks cannot be submitted again.
- Backend tests cover every allowed and blocked transition.

## 7. Improve Worker Activation Readiness

Story:
As a client admin or EOR specialist, I want to see exactly why a worker cannot be activated so that I can resolve missing onboarding, document, or contract requirements.

Why this teaches the codebase:
This turns an existing business rule into a better product workflow and asks you to expose backend reasoning cleanly to the frontend.

Likely files:
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/workers/workers.routes.ts`
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `apps/web/src/components/ui/Badge.tsx`

Acceptance criteria:
- Worker detail shows a readiness checklist for activation.
- The backend can return or derive missing required tasks, unsigned contract status, and optionally missing required documents.
- The Activate button is disabled or clearly explains blocked requirements.
- Attempting activation still enforces the rule on the backend.
- Tests cover blocked activation reasons.

## 8. Add Country Rule Create/Edit UI

Story:
As a platform admin, I want to create and edit country rule templates from the Country Rules page so that onboarding and payroll assumptions can be managed without changing seed data.

Why this teaches the codebase:
Country rules affect both onboarding generation and payroll calculation, so this is a good way to learn shared data dependencies.

Likely files:
- `apps/web/src/features/countryRules/CountryRulesPage.tsx`
- `apps/web/src/api/resources.api.ts`
- `apps/api/src/modules/countryRules/countryRules.routes.ts`
- `packages/shared/src/index.ts`
- `apps/api/prisma/seed.ts`

Acceptance criteria:
- Platform admins can add and edit country rules.
- Non-platform users can view rules but cannot mutate them.
- Percent fields are entered as user-friendly percentages and stored as decimals.
- Creating a worker in a newly added country generates the correct onboarding tasks.
- Tests cover role restrictions and validation.

## 9. Add Payroll Period Validation And Duplicate Protection

Story:
As a payroll user, I want payroll runs to reject invalid or duplicate periods so that payroll data remains consistent.

Why this teaches the codebase:
This story requires service-layer validation, Prisma querying, frontend error handling, and targeted tests.

Likely files:
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/payroll/payroll.routes.ts`
- `apps/web/src/features/payroll/PayrollPage.tsx`
- `packages/shared/src/index.ts`
- `apps/api/src/tests/business-rules.test.ts`

Acceptance criteria:
- `periodEnd` must be on or after `periodStart`.
- A second payroll run for the same organization, period, and currency is rejected.
- Client admins cannot create payroll runs outside their organization.
- The create payroll modal displays validation errors.
- Backend tests cover invalid periods, duplicates, and tenant scoping.

## 10. Add Payroll Calculation Details

Story:
As a payroll reviewer, I want each payroll item to show its calculation inputs so that I can explain gross pay, overtime, taxes, employer cost, and net pay.

Why this teaches the codebase:
You will improve a core business calculation and decide what to persist versus derive at read time.

Likely files:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/web/src/features/payroll/PayrollDetailPage.tsx`
- `apps/api/src/tests/business-rules.test.ts`

Acceptance criteria:
- Payroll item details include base salary, hourly rate, approved overtime hours, overtime multiplier, tax percent, and employer cost percent.
- The payroll detail page displays a transparent calculation breakdown.
- Existing totals remain correct.
- Recalculating a draft run refreshes item details.
- Tests assert item-level calculation inputs, not just totals.

## 11. Strengthen Invoice Lifecycle Rules

Story:
As a finance user, I want invoices to follow explicit lifecycle transitions so that draft, issued, paid, and void invoices cannot move into invalid states.

Why this teaches the codebase:
Invoices currently have simple route updates. This story adds a service layer and mirrors the payroll workflow pattern.

Likely files:
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/invoices/invoices.routes.ts`
- `apps/web/src/features/invoices/InvoicesPage.tsx`
- `apps/api/src/tests/business-rules.test.ts`

Acceptance criteria:
- Only `DRAFT` invoices can be issued.
- Only `ISSUED` invoices can be marked paid.
- Add a `void` action for `DRAFT` or `ISSUED` invoices if you choose to support it.
- All invoice transitions write audit events.
- Tests cover valid and invalid transitions.

## 12. Complete The Offboarding UI Workflow

Story:
As a client admin and EOR specialist, I want to request, approve, complete, and cancel offboarding cases from the UI so that the worker lifecycle can end without manual API calls.

Why this teaches the codebase:
Offboarding touches worker status, employment end date, audit logging, permissions, and list pages.

Likely files:
- `apps/web/src/features/offboarding/OffboardingPage.tsx`
- `apps/web/src/features/workers/WorkerDetailPage.tsx`
- `apps/web/src/api/resources.api.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`
- `apps/api/prisma/schema.prisma`

Acceptance criteria:
- Client admins can request offboarding for an active worker.
- EOR specialists can approve and complete cases.
- Completion sets worker status to `TERMINATED` and employment end date to the last working day.
- Canceling a case restores the worker to the appropriate prior status or follows a clearly documented rule.
- Backend tests cover completion and organization access.

## 13. Add Audit Log Search, Filters, And Metadata Detail

Story:
As an admin, I want to filter the audit log by actor, action, entity type, date range, and organization so that I can investigate workflow changes quickly.

Why this teaches the codebase:
This story is about API query design, database filtering, URL state, and table UX.

Likely files:
- `apps/api/src/modules/audit/audit.routes.ts`
- `apps/web/src/features/audit/AuditLogPage.tsx`
- `apps/web/src/api/resources.api.ts`
- `apps/api/prisma/schema.prisma`

Acceptance criteria:
- Audit API accepts filter query params and remains tenant-scoped.
- Audit page has filter controls and preserves filters in query keys or URL params.
- Metadata JSON can be expanded for a log row.
- Results are ordered newest first.
- Tests cover client admin tenant scoping and internal user access.

## 14. Build Organization Settings And User Management

Story:
As a client admin, I want to update my organization's settings and view users in my organization so that the Settings page becomes a real tenant administration surface.

Why this teaches the codebase:
The current Settings page is a placeholder. This story teaches organization routes, tenant scoping, and basic admin UI design.

Likely files:
- `apps/web/src/features/dashboard/SettingsPage.tsx`
- `apps/api/src/modules/organizations/organizations.routes.ts`
- `apps/api/prisma/schema.prisma`
- `apps/web/src/api/resources.api.ts`
- `packages/shared/src/index.ts`

Acceptance criteria:
- Client admins can edit allowed fields for their own organization.
- Platform admins can edit any organization and optionally suspend/reactivate organizations.
- Users can view organization members with names, emails, and roles.
- Workers and managers cannot mutate organization settings.
- Tests cover organization scoping.

## 15. Add Authorization Matrix Integration Tests

Story:
As a developer, I want integration tests that prove each role can only access the routes and tenant data they are allowed to access so that future features do not weaken authorization.

Why this teaches the codebase:
This is the deepest learning story because it exercises auth, cookies or bearer tokens, route guards, org scoping, seed/test setup, and expected failures.

Likely files:
- `apps/api/src/app.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/middleware/requireRole.middleware.ts`
- `apps/api/src/modules/*/*.routes.ts`
- `apps/api/src/tests/*`
- `apps/api/prisma/schema.prisma`

Acceptance criteria:
- Tests use Supertest against the Express app.
- Tests authenticate as each demo role or create test users directly.
- Matrix covers workers, payroll, invoices, audit log, country rules, organizations, leave, and timesheets.
- Cross-organization access is rejected for client users.
- Internal users and platform users have clearly documented differences.

## Suggested Build Order

1. Stories 1-3: learn existing frontend-to-backend request flow.
2. Stories 4-7: learn workflow state, role checks, and service rules.
3. Stories 8-12: learn schema changes and lifecycle-oriented product work.
4. Stories 13-15: learn production-style filtering, tenant admin, and authorization testing.

## The Big Picture

By the end of these stories, you will have touched:
- React forms, pages, reusable UI, React Query, and role-aware navigation.
- Shared Zod schemas used by both frontend and backend.
- Express routes, middleware, services, and error handling.
- Prisma schema changes, migrations, transactions, and seed data.
- Business rules for onboarding, payroll, invoices, leave, timesheets, and offboarding.
- Tests for service logic, frontend behavior, and API authorization.
