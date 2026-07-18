# Request Flow Traces

Use these traces to practice walking an interviewer through code from browser action to database write.

## Flow 1: Login As A Demo User

User action in UI: click a demo login button or submit the login form on [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx).

React component/page involved: `LoginPage`.

Frontend form/schema involved:

- `useForm<LoginInput>()` in `LoginPage`.
- `zodResolver(loginSchema)` from [packages/shared/src/index.ts](../../packages/shared/src/index.ts).
- Demo buttons call `submit({ email, password: 'Password123!' })`.

Frontend API call:

- `useAuth.login()` in [apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx).
- `authApi.login()` in [apps/web/src/api/auth.api.ts](../../apps/web/src/api/auth.api.ts).
- `post('/auth/login', { email, password })` through [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts).

Backend route/controller:

- `POST /api/auth/login` in [apps/api/src/modules/auth/auth.routes.ts](../../apps/api/src/modules/auth/auth.routes.ts).
- Controller: [apps/api/src/modules/auth/auth.controller.ts](../../apps/api/src/modules/auth/auth.controller.ts).

Backend service/business logic:

- `authService.login(email, password)` in [apps/api/src/modules/auth/auth.service.ts](../../apps/api/src/modules/auth/auth.service.ts).
- Looks up user by email.
- Compares password with `bcrypt.compare`.
- Signs JWT using `jsonwebtoken`.
- Returns public user data.

Prisma/database models touched:

- `User`
- Optional `workerProfile` relation to get `workerId` for worker users.

Important validation:

- `loginSchema` validates email and password shape.
- Invalid credentials throw `ApiError(401, 'Invalid email or password')`.

Important authorization checks:

- Login itself is public.
- After login, protected routes use `requireAuth` in [apps/api/src/middleware/auth.middleware.ts](../../apps/api/src/middleware/auth.middleware.ts).

Resulting database changes:

- No database write. Login only reads the user and sets an HTTP-only cookie named `globalhire_token`.

UI update after success:

- `useAuth` stores the returned user in TanStack Query cache under `['me']`.
- `LoginPage` navigates to `/dashboard`.

Interview explanation:

> The login path is intentionally simple. The frontend validates the form with the shared Zod schema, posts credentials to the API, the backend verifies the bcrypt password, signs a JWT, and stores it in an HTTP-only cookie. After that, protected API routes read the cookie and attach `req.user`.

## Flow 2: Client Admin Creates A Worker

User action in UI: client admin opens `/workers/new`, fills the hire request, and clicks Create worker.

React component/page involved:

- [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)

Frontend form/schema involved:

- `createWorkerSchema` from [packages/shared/src/index.ts](../../packages/shared/src/index.ts)
- React Hook Form with `zodResolver(createWorkerSchema)`

Frontend API call:

- `workersApi.create(input)` in [apps/web/src/api/workers.api.ts](../../apps/web/src/api/workers.api.ts)
- `POST /api/workers`

Backend route/controller:

- [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts)
- Route: `workerRouter.post('/')`
- Guard: `requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN'])`
- Body parsing: `createWorkerSchema.parse(req.body)`

Backend service/business logic:

- `createWorker()` in [apps/api/src/modules/workers/workers.service.ts](../../apps/api/src/modules/workers/workers.service.ts)

It checks:

- Client admins can only create inside their own `organizationId`.
- A `CountryRule` must exist for the worker country.
- Worker creation happens inside a Prisma transaction.

Prisma/database models touched:

- `CountryRule`: read by country code.
- `Worker`: created with status `ONBOARDING`.
- `Employment`: created through nested Prisma create.
- `OnboardingTask`: created from `onboardingTemplates(rule)`.
- `AuditLog`: created with action `WORKER_CREATED`.

Important validation:

- Required fields, email format, date string, positive salary, employment type enum.

Important authorization checks:

- `requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN'])`
- Extra service check prevents `CLIENT_ADMIN` from passing another organization ID.

Resulting database changes:

- New `Worker`
- New `Employment`
- Several `OnboardingTask` rows
- New `AuditLog`

UI update after success:

- `NewWorkerPage` navigates to `/workers/${worker.id}`.

Interview explanation:

> Worker creation is a good example of keeping business logic out of the UI. The frontend submits a validated request, but the backend decides the organization, verifies the country rule, creates the worker and employment terms, generates onboarding tasks, and writes an audit log in one transaction.

## Flow 3: Onboarding Task Is Submitted And Approved

User action in UI:

- Worker or client admin clicks Submit on a task.
- EOR specialist clicks Approve or Reject.

React component/page involved:

- [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx)
- Read-only task list page: [apps/web/src/features/onboarding/OnboardingPage.tsx](../../apps/web/src/features/onboarding/OnboardingPage.tsx)

Frontend form/schema involved:

- No full form for task submission.
- Reject uses a hardcoded demo body: `{ rejectionReason: 'Needs clearer demo evidence' }`.

Frontend API call:

- `post('/onboarding-tasks/:taskId/submit')`
- `post('/onboarding-tasks/:taskId/approve')`
- `post('/onboarding-tasks/:taskId/reject', body)`

Backend route/controller:

- [apps/api/src/modules/onboarding/onboarding.routes.ts](../../apps/api/src/modules/onboarding/onboarding.routes.ts)

Backend service/business logic:

- Logic is currently inside route handlers, not a separate service.
- `getTask()` loads the task and worker.
- Submit sets `status: 'SUBMITTED'`, `submittedAt`, clears rejection reason.
- Approve sets `status: 'APPROVED'`, `reviewedAt`, and `reviewedById`.
- Reject sets `status: 'REJECTED'`, `reviewedAt`, `reviewedById`, and `rejectionReason`.

Prisma/database models touched:

- `OnboardingTask`
- `Worker`
- `AuditLog`

Important validation:

- Reject parses `rejectSchema` from [packages/shared/src/index.ts](../../packages/shared/src/index.ts).

Important authorization checks:

- Submit:
  - Worker can only submit their own task.
  - `requireOrgAccess(task.worker.organizationId, req)` prevents cross-tenant access.
  - Terminated workers cannot submit onboarding tasks.
- Approve/reject:
  - `requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN'])`.

Resulting database changes:

- `OnboardingTask.status` changes.
- Submit/approve/reject timestamps are set.
- Audit log is written for submitted/approved/rejected.

UI update after success:

- `WorkerDetailPage` invalidates `['worker', id]` so TanStack Query refetches the worker detail.

Interview explanation:

> Onboarding is modeled as simple task rows with enum statuses. I avoided a state machine library because transitions are simple, but the API still enforces who can submit and who can approve. If this grew, I would move these route-level handlers into a dedicated onboarding service.

## Flow 4: Payroll Run Is Created, Calculated, Approved, And Locked

User action in UI:

- Client admin/internal user opens `/payroll`.
- Clicks Create run in [apps/web/src/features/payroll/PayrollPage.tsx](../../apps/web/src/features/payroll/PayrollPage.tsx).
- Opens a payroll run detail page.
- Clicks Calculate, Approve, Lock in [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx).

React component/page involved:

- `PayrollPage`
- `PayrollDetailPage`

Frontend form/schema involved:

- Create payroll run uses an inline `FormData` modal form in `PayrollPage`.
- Backend validates with `payrollRunSchema` from [packages/shared/src/index.ts](../../packages/shared/src/index.ts).

Frontend API call:

- `payrollApi.create(input)` -> `POST /api/payroll-runs`
- `payrollApi.calculate(id)` -> `POST /api/payroll-runs/:id/calculate`
- `payrollApi.approve(id)` -> `POST /api/payroll-runs/:id/approve`
- `payrollApi.lock(id)` -> `POST /api/payroll-runs/:id/lock`

Backend route/controller:

- [apps/api/src/modules/payroll/payroll.routes.ts](../../apps/api/src/modules/payroll/payroll.routes.ts)

Backend service/business logic:

- [apps/api/src/modules/payroll/payroll.service.ts](../../apps/api/src/modules/payroll/payroll.service.ts)

Important service functions:

- `createPayrollRun()`
- `calculatePayrollRun()`
- `approvePayrollRun()`
- `lockPayrollRun()`

Calculation logic:

```text
hourlyRate = monthlySalary / 160
overtimePay = approvedOvertimeHours * hourlyRate * 1.5
grossPay = monthlySalary + overtimePay
employeeTax = grossPay * countryRule.employeeTaxPercent
employerCost = grossPay * countryRule.employerCostPercent
netPay = grossPay - employeeTax
```

Prisma/database models touched:

- `PayrollRun`
- `PayrollItem`
- `Worker`
- `Employment`
- `Timesheet`
- `CountryRule`
- `AuditLog`

Important validation:

- Create parses `payrollRunSchema`.
- Calculate requires `status === 'DRAFT'`.
- Calculate requires at least one `ACTIVE` worker.
- Approve requires `status === 'CALCULATED'`.
- Approve requires `grossTotal > 0`.
- Lock requires `status === 'APPROVED'`.

Important authorization checks:

- Payroll routes require `CLIENT_ADMIN`, `EOR_SPECIALIST`, or `PLATFORM_ADMIN`.
- Approve and lock require `EOR_SPECIALIST` or `PLATFORM_ADMIN`.
- `requireOrgAccess` scopes client admins to their own organization.

Resulting database changes:

- Create: new `PayrollRun` in `DRAFT`.
- Calculate: deletes existing items for the run, creates new `PayrollItem` rows, updates totals and status to `CALCULATED`.
- Approve: sets status `APPROVED`, `approvedById`, `approvedAt`.
- Lock: sets status `LOCKED`, `lockedAt`.

UI update after success:

- `PayrollDetailPage` invalidates `['payroll-run', id]`.

Interview explanation:

> Payroll is the cleanest service-layer example. The UI only asks for transitions. The backend decides whether the transition is legal, calculates totals, and persists itemized payroll rows. This keeps payroll rules testable and prevents the frontend from becoming the source of truth.

## Flow 5: Invoice Is Generated From Payroll

User action in UI: on payroll detail, click Generate invoice when a payroll run is approved or locked.

React component/page involved:

- [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)
- Invoice pages: [apps/web/src/features/invoices/InvoicesPage.tsx](../../apps/web/src/features/invoices/InvoicesPage.tsx)

Frontend API call:

- `payrollApi.generateInvoice(id)` in [apps/web/src/api/payroll.api.ts](../../apps/web/src/api/payroll.api.ts)
- `POST /api/payroll-runs/:id/generate-invoice`

Backend route/controller:

- Route is mounted through [apps/api/src/modules/invoices/invoices.routes.ts](../../apps/api/src/modules/invoices/invoices.routes.ts).

Backend service/business logic:

- `generateInvoice()` in [apps/api/src/modules/invoices/invoices.service.ts](../../apps/api/src/modules/invoices/invoices.service.ts)

It checks:

- Payroll run exists.
- Actor can access the payroll organization.
- Payroll status is `APPROVED` or `LOCKED`.
- If invoice already exists, return it instead of creating a duplicate.

Prisma/database models touched:

- `PayrollRun`
- `Invoice`
- `AuditLog`

Important calculation:

```text
subtotal = payrollRun.grossTotal + payrollRun.employerCostTotal
platformFee = subtotal * 0.08
total = subtotal + platformFee
```

Resulting database changes:

- New `Invoice` with status `DRAFT`.
- Audit log with action `INVOICE_GENERATED`.

UI update after success:

- Payroll detail refetches. The run now includes `invoice`, so the Generate invoice button is hidden.

Interview explanation:

> Invoice generation intentionally depends on payroll state. The payroll run is the source of financial totals, and the invoice adds the platform fee. Returning an existing invoice also prevents accidental duplicate invoices from repeated clicks.

## Flow 6: Worker Submits Leave Or Timesheet

User action in UI:

- The current frontend has list/approval screens for leave and timesheets.
- The backend supports creation through `POST /api/leave-requests` and `POST /api/timesheets`.
- There is not currently a polished frontend form for creating leave/timesheets.

Frontend component/page involved:

- [apps/web/src/features/leave/LeavePage.tsx](../../apps/web/src/features/leave/LeavePage.tsx)
- [apps/web/src/features/timesheets/TimesheetsPage.tsx](../../apps/web/src/features/timesheets/TimesheetsPage.tsx)

Frontend API call:

- Current UI primarily calls approval/rejection helpers in [apps/web/src/api/resources.api.ts](../../apps/web/src/api/resources.api.ts).
- Creation endpoints exist on backend but do not have dedicated frontend form helpers.

Backend route/controller:

- [apps/api/src/modules/leave/leave.routes.ts](../../apps/api/src/modules/leave/leave.routes.ts)
- [apps/api/src/modules/timesheets/timesheets.routes.ts](../../apps/api/src/modules/timesheets/timesheets.routes.ts)

Backend service/business logic:

- `createLeaveRequest()`, `approveLeaveRequest()`, `rejectLeaveRequest()` in [apps/api/src/modules/leave/leave.service.ts](../../apps/api/src/modules/leave/leave.service.ts)
- `createTimesheet()`, `approveTimesheet()`, `rejectTimesheet()` in [apps/api/src/modules/timesheets/timesheets.service.ts](../../apps/api/src/modules/timesheets/timesheets.service.ts)

Prisma/database models touched:

- `LeaveRequest`
- `Timesheet`
- `Worker`
- `AuditLog` for approval actions

Important validation:

- `leaveRequestSchema`
- `timesheetSchema`

Important authorization checks:

- Worker creation uses actor’s own `workerId`.
- Non-worker creation requires `workerId`.
- Reviewers must be `CLIENT_MANAGER`, `CLIENT_ADMIN`, or `EOR_SPECIALIST`.
- Organization access is checked.
- Terminated workers cannot create leave or timesheets.

UI update after success:

- Approval screens invalidate `['leave']` or `['timesheets']`.

Interview explanation:

> This is one of the honest demo boundaries. The backend workflow exists, including validation and approval rules, but the frontend currently focuses on review screens rather than creation forms. I would add worker-facing create forms next.

## Flow 7: Offboarding Is Requested And Completed

User action in UI:

- The current frontend has an offboarding list at [apps/web/src/features/offboarding/OffboardingPage.tsx](../../apps/web/src/features/offboarding/OffboardingPage.tsx).
- Backend supports requesting offboarding through `POST /api/workers/:workerId/offboarding`.
- Backend supports approve/complete/cancel through `/api/offboarding-cases/:id/...`.
- There is not currently a polished frontend form/action flow for requesting or completing offboarding.

Backend route/controller:

- Worker offboarding request is wired in [apps/api/src/modules/workers/workers.routes.ts](../../apps/api/src/modules/workers/workers.routes.ts) to `createOffboardingForWorker`.
- Offboarding actions live in [apps/api/src/modules/offboarding/offboarding.routes.ts](../../apps/api/src/modules/offboarding/offboarding.routes.ts).

Backend service/business logic:

- Logic is currently route-level.
- Request creates `OffboardingCase` and updates worker status to `OFFBOARDING`.
- Complete updates offboarding case to `COMPLETED`, worker to `TERMINATED`, and employment end date to `lastWorkingDay`.

Prisma/database models touched:

- `OffboardingCase`
- `Worker`
- `Employment`
- `AuditLog`

Important validation:

- `offboardingSchema` validates reason, last working day, and optional notes.

Important authorization checks:

- Request requires `CLIENT_ADMIN` or `PLATFORM_ADMIN`.
- Complete requires `EOR_SPECIALIST` or `PLATFORM_ADMIN`.
- Request checks organization access.
- Cancel checks organization access.
- Approve/complete are internal/platform only and do not currently call `requireOrgAccess` because those roles can operate across organizations.

Resulting database changes:

- Request: new offboarding case, worker status `OFFBOARDING`, audit log.
- Complete: case status `COMPLETED`, worker status `TERMINATED`, employment `endDate`, audit log.

Interview explanation:

> Offboarding is implemented on the backend as a lifecycle transition, but the frontend currently only lists cases. That is a conscious MVP boundary. The important part to show is the transaction that terminates the worker and updates employment end date together.
