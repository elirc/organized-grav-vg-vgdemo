# Migrated .NET Feature User Stories And Implementation Plans

These stories are designed for the migrated codebase in `migrated-dotnet/`.

They assume the current migrated shape:

- API: `migrated-dotnet/src/GlobalHireLite.Api`
- Web: `migrated-dotnet/src/GlobalHireLite.Web`
- Tests: `migrated-dotnet/tests/GlobalHireLite.Api.Tests`

Each plan is written so a junior software engineer can follow it without guessing where to start.

## 1. Worker Profile Edit Workflow

**User Story**

As a client admin, I want to edit a worker's job title, department, manager, salary, salary currency, and contract status so that worker records stay accurate after creation.

**Why It Matters**

Worker records change after hiring. A real HR/EOR workflow needs safe updates with role checks, validation, and visible feedback.

**Implementation Plan**

1. Review the existing backend update path in `Services/WorkerService.cs`, especially `Update`.
2. Review the request shape in `Contracts/Requests.cs`, especially `UpdateWorkerRequest`.
3. Confirm `Program.cs` has `PATCH /api/workers/{id}` wired to `WorkerService.Update`.
4. In `GlobalHireLite.Web/src/api.ts`, add or confirm an API helper:

   ```ts
   updateWorker: (id: string, body: any) =>
     request<any>(`/workers/${id}`, {
       method: 'PATCH',
       body: JSON.stringify(body),
     })
   ```

5. In `GlobalHireLite.Web/src/App.tsx`, update `WorkerDetailPage`.
6. Add local state for edit mode:

   ```ts
   const [editing, setEditing] = useState(false);
   ```

7. Create a simple edit form with inputs for:
   - jobTitle
   - department
   - salaryAmount
   - salaryCurrency
   - contractStatus
8. Pre-fill the form from the loaded worker detail response.
9. On submit, call `api.updateWorker(worker.id, payload)`.
10. After success, call `reload()` from `useLoad` or refetch the worker detail.
11. Show a small success message or close the edit form.
12. Handle backend errors by showing the error text near the form.
13. Keep the backend as the source of truth: do not update the UI optimistically for salary or status.
14. Add tests in `WorkerServiceTests.cs`:
   - client admin can update a worker in their org
   - client admin cannot update a worker in another org
   - salary update changes the matching employment record
15. Update `TESTING.md` with the new coverage.

**Acceptance Criteria**

- Client admins, EOR specialists, and platform admins can update allowed fields.
- Unauthorized roles cannot update a worker.
- Salary changes update the `Employment` record.
- Worker detail refreshes after save.
- Backend tests cover success and forbidden cases.

## 2. Worker Creation UI

**User Story**

As a client admin, I want to create a worker from the React app so that I can start onboarding a new hire without manually calling the API.

**Why It Matters**

The migrated API already supports worker creation, but the UI needs a full workflow to exercise country rules and onboarding generation.

**Implementation Plan**

1. Review `CreateWorkerRequest` in `Contracts/Requests.cs`.
2. Review `WorkerService.Create` to understand required fields and onboarding generation.
3. Add `createWorker` to `GlobalHireLite.Web/src/api.ts`.
4. In `App.tsx`, add a route under the shell:

   ```tsx
   <Route path="/workers/new" element={<NewWorkerPage />} />
   ```

5. Add a "New worker" button to `WorkersPage` linking to `/workers/new`.
6. Implement `NewWorkerPage` in the same file or split it into a new component file if you decide to organize the frontend later.
7. Add fields:
   - firstName
   - lastName
   - email
   - countryCode
   - jobTitle
   - department
   - employmentType
   - startDate
   - salaryAmount
   - salaryCurrency
   - organizationId
8. Use simple client-side validation:
   - required text fields cannot be empty
   - salary must be greater than zero
   - country code must be two letters
   - currency must be three letters
9. On submit, call `api.createWorker`.
10. On success, navigate to `/workers/{id}`.
11. Display backend validation errors.
12. Add `WorkerServiceTests` for:
   - worker creation creates employment
   - worker creation creates onboarding tasks
   - missing country rule returns an error
13. Add a note in the docs that real production validation should use a shared validation approach.

**Acceptance Criteria**

- User can create a worker from the UI.
- Created worker has an employment record.
- Created worker gets onboarding tasks based on country rule.
- UI navigates to worker detail after creation.
- Tests cover the service behavior.

## 3. Activation Readiness Checklist

**User Story**

As a client admin or EOR specialist, I want to see why a worker cannot be activated so that I know which onboarding requirements to complete.

**Why It Matters**

Right now activation can fail with one error. A readiness checklist turns backend rules into a clearer product experience.

**Implementation Plan**

1. Add a new response model or helper method in `WorkerService`.
2. Create a method:

   ```csharp
   public object GetActivationReadiness(User actor, string workerId)
   ```

3. The method should check:
   - worker exists
   - actor can access worker organization
   - worker status is `ONBOARDING`
   - required onboarding tasks are approved
   - employment contract is signed
4. Return a shape like:

   ```csharp
   new {
       canActivate = false,
       missing = new[] {
           "Required onboarding tasks are incomplete",
           "Employment contract must be SIGNED"
       }
   }
   ```

5. Add endpoint in `Program.cs`:

   ```csharp
   GET /api/workers/{id}/activation-readiness
   ```

6. Add `activationReadiness` to `api.ts`.
7. In `WorkerDetailPage`, load readiness data.
8. Render checklist items near the Activate button.
9. Disable or visually de-emphasize the Activate button when `canActivate` is false.
10. Keep backend enforcement in `Activate`; do not rely on the UI.
11. Add tests:
   - returns missing task reason
   - returns missing contract reason
   - returns `canActivate = true` after requirements are met

**Acceptance Criteria**

- Worker detail shows activation readiness.
- Blocked activation explains missing requirements.
- Backend activation still rejects invalid activation.
- Tests cover readiness outcomes.

## 4. Leave Request Creation

**User Story**

As a worker, I want to submit a leave request so that my manager or admin can review it.

**Why It Matters**

Leave is a core worker self-service workflow and helps test worker-scoped authorization.

**Implementation Plan**

1. Review `CreateLeaveRequest` in `Contracts/Requests.cs`.
2. Review leave endpoints in `Program.cs`.
3. Add `createLeaveRequest` to `api.ts`.
4. In `ResourcesPage` or a new `LeavePage`, render a leave request form.
5. Fields:
   - workerId, optional for non-worker users
   - leaveType
   - startDate
   - endDate
   - reason
6. If the current user is `WORKER`, hide workerId and let the backend infer it.
7. Validate end date is not before start date on the client.
8. Submit to `POST /api/leave-requests`.
9. After success, reload leave requests.
10. In backend tests, create a worker user in the store with `WorkerId`.
11. Test worker can create leave for self.
12. Test worker cannot create leave for another worker.
13. Test end date before start date returns error.

**Acceptance Criteria**

- Workers can submit leave for themselves.
- Admin-style users can submit leave for visible workers.
- Invalid date ranges are rejected.
- Leave list refreshes after creation.
- Tests cover worker scoping.

## 5. Leave Approval And Rejection UI

**User Story**

As a manager or admin, I want to approve or reject leave requests from the UI so that worker leave can move through review.

**Why It Matters**

The backend has review endpoints. The UI should make them usable and should refresh state after mutation.

**Implementation Plan**

1. Confirm endpoints in `Program.cs`:
   - `PATCH /api/leave-requests/{id}/approve`
   - `PATCH /api/leave-requests/{id}/reject`
   - `PATCH /api/leave-requests/{id}/cancel`
2. Add API helpers in `api.ts`.
3. In the leave list UI, show status badges.
4. For requests with `PENDING` status, show Approve and Reject buttons to non-worker users.
5. On click, call the correct API helper.
6. Disable buttons while the request is in progress.
7. Reload leave requests after the mutation.
8. Add tests around the service or endpoint helper logic if you extract review logic into a `LeaveService`.
9. Recommended backend improvement: move `ReviewLeave` local function from `Program.cs` into a `LeaveService` for easier testing.
10. Once moved, add tests:
    - approve sets status and reviewed metadata
    - reject sets status and reviewed metadata
    - forbidden actor cannot review

**Acceptance Criteria**

- Pending leave requests can be approved or rejected from UI.
- Status updates after action.
- Workers cannot review leave.
- Backend review logic has service-level tests after extraction.

## 6. Timesheet Creation And Submission

**User Story**

As a worker, I want to create and submit a weekly timesheet so that approved overtime can be included in payroll.

**Why It Matters**

Timesheets connect worker self-service to payroll calculation, which makes this a high-value workflow.

**Implementation Plan**

1. Review `CreateTimesheetRequest`.
2. Review `POST /api/timesheets` in `Program.cs`.
3. Add `createTimesheet` and `submitTimesheet` to `api.ts`.
4. Create a `TimesheetsPage` or expand `ResourcesPage`.
5. Fields:
   - workerId for admin users
   - weekStartDate
   - regularHours
   - overtimeHours
   - notes
6. Validate hours are between 0 and 80.
7. On create, backend returns a DRAFT timesheet.
8. Add a Submit button for DRAFT timesheets.
9. Confirm `PATCH /api/timesheets/{id}/submit` changes status to `SUBMITTED`.
10. Add tests:
    - invalid hours rejected
    - worker creates timesheet for self
    - submitted timesheet can later be approved
    - draft/submitted timesheets are excluded from payroll until approved

**Acceptance Criteria**

- User can create a timesheet.
- User can submit a draft timesheet.
- Invalid hours are rejected.
- Payroll includes only approved overtime.
- Tests cover payroll exclusion.

## 7. Timesheet Approval Inbox

**User Story**

As a manager, I want a list of submitted timesheets that need approval so that I can review work quickly.

**Why It Matters**

This adds an operational queue instead of forcing managers to browse all timesheets.

**Implementation Plan**

1. Add a new endpoint:

   ```text
   GET /api/approvals/timesheets
   ```

2. Create a new service, `ApprovalService.cs`.
3. The service should:
   - load current actor
   - reject workers
   - find timesheets with status `SUBMITTED`
   - scope to actor organization unless platform/EOR role
4. Add endpoint registration in `Program.cs`.
5. Add `approvalTimesheets` to `api.ts`.
6. Add an "Approvals" route in React.
7. Render submitted timesheets with worker name, week, hours, and actions.
8. Reuse approve/reject API helpers.
9. Add tests:
   - worker gets forbidden
   - client manager sees only org timesheets
   - platform admin sees all submitted timesheets

**Acceptance Criteria**

- Managers/admins can see submitted timesheets needing review.
- Workers cannot access approval inbox.
- Approve/reject actions update the list.
- Tests cover role and tenant scoping.

## 8. Document Upload Metadata Form

**User Story**

As a worker or admin, I want to add document metadata to a worker profile so that required onboarding documents can be tracked.

**Why It Matters**

The migrated app does not store actual files, but metadata still supports onboarding and compliance workflows.

**Implementation Plan**

1. Review `CreateDocumentRequest`.
2. Confirm endpoints:
   - `GET /api/workers/{workerId}/documents`
   - `POST /api/workers/{workerId}/documents`
3. Add `workerDocuments` and `createWorkerDocument` to `api.ts`.
4. In `WorkerDetailPage`, add a Documents panel.
5. Display existing documents:
   - fileName
   - documentType
   - status
   - createdAt
6. Add a document metadata form with:
   - fileName
   - documentType
7. Submit to backend.
8. Reload worker detail or documents.
9. Add tests:
   - actor can add document for accessible worker
   - actor cannot add document for inaccessible worker
   - document defaults to `UPLOADED`

**Acceptance Criteria**

- Worker detail shows documents.
- User can add document metadata.
- New document appears after submit.
- Unauthorized document creation is rejected.
- Tests cover access and default status.

## 9. Document Review Workflow

**User Story**

As an EOR specialist, I want to approve or reject worker documents with a reason so that workers know what needs to be fixed.

**Why It Matters**

Document review is a common HR workflow and adds meaningful state transitions.

**Implementation Plan**

1. Update `WorkerDocument` in `Domain/Entities.cs`:
   - add `ReviewedById`
   - add `ReviewedAt`
   - add `RejectionReason`
2. Add request contract:

   ```csharp
   public sealed record RejectDocumentRequest(string RejectionReason);
   ```

3. Create `DocumentService.cs`.
4. Add methods:
   - `Approve(User actor, string documentId)`
   - `Reject(User actor, string documentId, string reason)`
5. Rules:
   - only non-worker review roles can approve/reject
   - approving clears rejection reason
   - rejecting requires reason
   - review is tenant-scoped through the worker
6. Add endpoints:
   - `PATCH /api/documents/{id}/approve`
   - `PATCH /api/documents/{id}/reject`
7. Add audit events for both transitions.
8. Add UI buttons in the Documents panel.
9. Add tests for approve, reject, missing reason, and forbidden actor.

**Acceptance Criteria**

- Reviewers can approve/reject documents.
- Rejection requires a reason.
- Worker detail displays rejection reason.
- Audit events are written.
- Tests cover valid and invalid review.

## 10. Country Rule Management UI

**User Story**

As a platform admin, I want to create and edit country rules so that onboarding and payroll assumptions can be updated without code changes.

**Why It Matters**

Country rules drive onboarding templates and payroll calculations, so managing them through UI makes the app more realistic.

**Implementation Plan**

1. Review `CountryRule` in `Domain/Entities.cs`.
2. Add request DTOs:
   - `CreateCountryRuleRequest`
   - `UpdateCountryRuleRequest`
3. Create `CountryRuleService.cs`.
4. Add methods:
   - `List`
   - `Create`
   - `Update`
5. Rules:
   - only platform admins can mutate
   - country code must be unique
   - percent fields must be between 0 and 1
   - currency must be 3 letters
6. Add endpoints in `Program.cs`:
   - `POST /api/country-rules`
   - `PATCH /api/country-rules/{countryCode}`
7. Add API helpers in `api.ts`.
8. In `ResourcesPage`, replace read-only country rule table with editable controls for platform admins.
9. Use percentage-friendly inputs in UI, converting `12` to `0.12` before sending or clearly label decimal inputs.
10. Add tests:
    - platform admin can create rule
    - client admin cannot create rule
    - duplicate country code rejected
    - invalid percent rejected

**Acceptance Criteria**

- Platform admin can create/edit country rules.
- Non-platform users cannot mutate rules.
- Worker creation in a new country uses the new rule.
- Tests cover validation and role restrictions.

## 11. Payroll Calculation Breakdown

**User Story**

As a payroll reviewer, I want each payroll item to show calculation inputs so that I can explain how gross pay and net pay were produced.

**Why It Matters**

Payroll reviewers need transparency, not just totals.

**Implementation Plan**

1. Update `PayrollItem` in `Domain/Entities.cs` to include:
   - BaseSalary
   - HourlyRate
   - ApprovedOvertimeHours
   - OvertimeMultiplier
   - EmployeeTaxPercent
   - EmployerCostPercent
2. Update `PayrollService.Calculate`.
3. When creating each item, store the input values used in the calculation.
4. Keep totals unchanged.
5. Update `WithItems` response to include these fields automatically through item object.
6. In `PayrollPage`, add an expandable details row or show item breakdown inside a simple list.
7. Display:
   - base salary
   - overtime hours
   - overtime pay
   - tax percent
   - employer cost percent
   - net pay
8. Add tests:
   - item stores approved overtime hours
   - item stores tax and employer percentages
   - gross and net totals still match expected values

**Acceptance Criteria**

- Payroll item includes calculation inputs.
- UI displays breakdown.
- Existing payroll totals remain correct.
- Tests assert item-level details.

## 12. Invoice Generation From Approved Payroll

**User Story**

As a finance user, I want to generate an invoice from an approved payroll run so that payroll costs can be billed.

**Why It Matters**

The API currently has invoice generation logic in `Program.cs`. This story makes it testable and visible in the UI.

**Implementation Plan**

1. Create `InvoiceService.cs`.
2. Move invoice generation logic from `Program.cs` into `InvoiceService.GenerateFromPayroll`.
3. Rules:
   - payroll run must exist
   - actor must access payroll organization
   - payroll status must be `APPROVED` or `LOCKED`
   - one invoice per payroll run
4. Add audit event `INVOICE_GENERATED`.
5. Keep endpoint:

   ```text
   POST /api/payroll-runs/{payrollRunId}/invoice
   ```

6. Update endpoint to call the service.
7. Add API helper in `api.ts`.
8. In `PayrollPage`, show "Generate invoice" for approved/locked runs.
9. Add an invoice table in `ResourcesPage` or a new `InvoicesPage`.
10. Add tests:
    - rejects draft payroll
    - generates invoice for approved payroll
    - duplicate generation returns existing invoice
    - invoice totals include subtotal plus platform fee

**Acceptance Criteria**

- Approved payroll can generate invoice from UI.
- Draft payroll cannot generate invoice.
- Duplicate invoice is prevented.
- Tests cover lifecycle rules.

## 13. Invoice Lifecycle Actions

**User Story**

As a finance user, I want to issue, mark paid, and void invoices so that invoice state reflects the billing workflow.

**Why It Matters**

Invoice status should follow explicit transitions, just like payroll.

**Implementation Plan**

1. Extend `InvoiceService.cs`.
2. Add methods:
   - `Issue`
   - `MarkPaid`
   - `Void`
3. Rules:
   - only `DRAFT` invoices can be issued
   - only `ISSUED` invoices can be marked paid
   - only `DRAFT` or `ISSUED` invoices can be voided
   - `PAID` invoices cannot be voided in this first version
4. Add endpoints:
   - `PATCH /api/invoices/{id}/issue`
   - `PATCH /api/invoices/{id}/mark-paid`
   - `PATCH /api/invoices/{id}/void`
5. Add audit events:
   - `INVOICE_ISSUED`
   - `INVOICE_PAID`
   - `INVOICE_VOIDED`
6. Add API helpers in `api.ts`.
7. Add action buttons in invoice table.
8. Disable invalid actions based on status.
9. Add tests for every valid and invalid transition.

**Acceptance Criteria**

- Invoice actions are available from UI.
- Invalid transitions are blocked by backend.
- Audit events are written.
- Tests cover transition matrix.

## 14. Offboarding Request UI

**User Story**

As a client admin, I want to request offboarding for an active worker so that termination workflows can be tracked.

**Why It Matters**

Offboarding completes the worker lifecycle and touches worker status, permissions, and audit history.

**Implementation Plan**

1. Review `CreateOffboardingRequest`.
2. Add `createOffboardingCase` to `api.ts`.
3. Add a "Request offboarding" button to `WorkerDetailPage` for active workers.
4. Open a form with:
   - reason
   - lastWorkingDay
   - notes
5. Submit to `POST /api/offboarding-cases`.
6. On success, reload worker detail.
7. Confirm worker status changes to `OFFBOARDING`.
8. Show offboarding cases in worker detail.
9. Add tests:
   - client admin can request offboarding for org worker
   - request sets worker status to `OFFBOARDING`
   - worker cannot request offboarding for another worker

**Acceptance Criteria**

- Active worker can be moved into offboarding from UI.
- Form requires reason and last working day.
- Worker status updates after request.
- Tests cover status change and access.

## 15. Offboarding Completion Workflow

**User Story**

As an EOR specialist, I want to approve and complete offboarding so that a worker can be marked terminated at the end of employment.

**Why It Matters**

Completion should be controlled and auditable because it ends employment.

**Implementation Plan**

1. Move offboarding update logic from `Program.cs` into `OffboardingService.cs`.
2. Add methods:
   - `Approve`
   - `Complete`
   - `Cancel`
3. Rules:
   - only `REQUESTED` can move to `APPROVED`
   - only `APPROVED` can move to `COMPLETED`
   - completing sets worker status to `TERMINATED`
   - canceling sets status to `CANCELLED`
4. Optional improvement: add `Employment.EndDate` update on completion.
5. Add endpoints or keep existing status endpoint but route to service.
6. Add UI actions in offboarding list.
7. Add audit events for approve, complete, and cancel.
8. Add tests:
   - approve requested case
   - complete approved case
   - reject completing requested case directly
   - complete sets worker terminated

**Acceptance Criteria**

- Offboarding has clear state transitions.
- Completion terminates worker.
- Invalid jumps are rejected.
- Audit events are written.
- Tests cover transition rules.

## 16. Audit Log Filters

**User Story**

As an admin, I want to filter audit logs by action, entity type, actor, organization, and date range so that I can investigate changes quickly.

**Why It Matters**

Audit logs become useful only when users can search and narrow them.

**Implementation Plan**

1. Create `AuditService.cs`.
2. Add an `AuditFilterRequest` or use query parameters in endpoint.
3. Supported filters:
   - action
   - entityType
   - actorUserId
   - organizationId
   - dateFrom
   - dateTo
4. Move audit list logic from `Program.cs` into service.
5. Keep tenant scoping:
   - platform/EOR can search broadly
   - client users only see own organization
6. Add endpoint query handling in `Program.cs`.
7. Add API helper:

   ```ts
   auditLog: (filters?: Record<string, string>) => ...
   ```

8. Add an Audit page or expand Resources page.
9. Render filter controls.
10. Reload results when filters change.
11. Add tests:
    - action filter works
    - entity type filter works
    - client admin cannot filter into another org

**Acceptance Criteria**

- Audit log supports filters.
- Tenant scoping is preserved.
- UI has filter controls.
- Tests cover filters and access.

## 17. Organization Settings Page

**User Story**

As a client admin, I want to edit my organization's industry and headquarters country so that organization profile data stays current.

**Why It Matters**

This creates a real tenant settings workflow and exercises organization scoping.

**Implementation Plan**

1. Add `UpdateOrganizationRequest` to `Contracts/Requests.cs`.
2. Create `OrganizationService.cs`.
3. Add methods:
   - `List`
   - `Update`
4. Rules:
   - client admins can update only their org
   - platform admins can update any org
   - workers cannot update org settings
5. Add endpoint:

   ```text
   PATCH /api/organizations/{id}
   ```

6. Add `updateOrganization` to `api.ts`.
7. Add a Settings route in React.
8. Form fields:
   - name, if allowed
   - industry
   - headquartersCountry
9. Submit update and reload organizations.
10. Add tests:
    - client admin updates own org
    - client admin cannot update another org
    - worker forbidden

**Acceptance Criteria**

- Settings page edits organization fields.
- Tenant scoping is enforced.
- UI shows errors.
- Tests cover role and org restrictions.

## 18. Role-Aware Navigation And Permissions Cleanup

**User Story**

As a user, I want navigation and action buttons to reflect my role so that I only see workflows I can use.

**Why It Matters**

The backend enforces security, but role-aware UI makes the app easier to use.

**Implementation Plan**

1. In React, create helper functions:
   - `canManageWorkers(user)`
   - `canRunPayroll(user)`
   - `canReviewApprovals(user)`
   - `canManageCountryRules(user)`
2. Put them in a new file:

   ```text
   GlobalHireLite.Web/src/permissions.ts
   ```

3. Update the sidebar links in `App.tsx`.
4. Hide Payroll from workers if workers do not need it.
5. Hide Country Rule edit buttons from non-platform users.
6. Hide worker creation from workers/managers.
7. Keep all backend authorization checks unchanged.
8. Add simple frontend tests later when a frontend test setup exists for migrated app.
9. Add backend tests where UI hiding corresponds to important API denial.

**Acceptance Criteria**

- Navigation changes based on role.
- Action buttons align with backend permissions.
- Backend remains source of truth.
- Permission helpers are centralized.

## 19. API Error Response Standardization

**User Story**

As a frontend developer, I want all API errors to have a consistent shape so that UI error handling is simple and predictable.

**Why It Matters**

Consistent errors reduce duplicated frontend code and improve debugging.

**Implementation Plan**

1. Review current `Error` helper in `Program.cs`.
2. Create a shared error response record:

   ```csharp
   public sealed record ApiErrorResponse(string Message, string? Code = null);
   ```

3. Update `Error` helper to return this shape.
4. Add optional error codes for common cases:
   - `FORBIDDEN`
   - `NOT_FOUND`
   - `VALIDATION_ERROR`
   - `INVALID_STATE`
5. Update services to return consistent error messages.
6. Optional next step: introduce a `Result<T>` type instead of tuples.
7. Update `api.ts` error parsing to expect `{ message, code }`.
8. Add tests for key endpoints once API integration tests exist.
9. Add service tests for important error strings/codes where possible.

**Acceptance Criteria**

- Errors consistently return `message`.
- Common errors include a stable `code`.
- Frontend displays error messages correctly.
- Docs describe error response shape.

## 20. API Integration Test Harness

**User Story**

As a developer, I want integration tests for the migrated API so that routes, auth cookies, and service wiring are tested together.

**Why It Matters**

Service tests are useful, but they do not prove that HTTP routing, cookies, serialization, and dependency injection are wired correctly.

**Implementation Plan**

1. Add package reference to test project:

   ```xml
   <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
   ```

2. Update `Program.cs` to expose a partial Program class for tests:

   ```csharp
   public partial class Program { }
   ```

3. Create `ApiIntegrationTests.cs`.
4. Use `WebApplicationFactory<Program>`.
5. Write first test:
   - `GET /api/health` returns 200 and service name.
6. Write auth test:
   - `POST /api/auth/login` with demo credentials returns user and sets cookie.
7. Write protected route test:
   - `GET /api/workers` without auth returns 401.
8. Write authenticated route test:
   - login, keep cookie, call `GET /api/workers`, expect success.
9. Write role/tenant test:
   - create or seed a second org/worker in test service override
   - verify client admin cannot access other org worker
10. Document how to run:

   ```text
   cd migrated-dotnet
   dotnet test
   ```

**Acceptance Criteria**

- Integration test project runs with service tests.
- Health endpoint is tested.
- Login cookie behavior is tested.
- Protected route rejects anonymous requests.
- Authenticated request succeeds.
- Tenant boundary has at least one integration test.

## Suggested Build Order

1. Worker profile edit.
2. Worker creation UI.
3. Activation readiness checklist.
4. Leave request creation.
5. Timesheet creation and submission.
6. Payroll calculation breakdown.
7. Invoice generation service extraction.
8. Invoice lifecycle actions.
9. Offboarding request and completion.
10. Audit log filters.
11. API integration test harness.

## Notes For Junior Engineers

- Start with one story at a time.
- Read the existing service before adding new code.
- Add or update request DTOs before wiring endpoints.
- Keep endpoints thin; put business rules in services.
- Add tests for invalid states, not only happy paths.
- Keep React forms simple at first.
- After every backend change, update the frontend API wrapper if the UI needs it.
- Never trust UI role hiding as security; backend checks must still exist.
