# Architectural Cartography

Architectural cartography means reading the codebase by responsibilities and data flow instead of getting lost in file names.

## The System In One Sentence

GlobalHire Lite is a multi-tenant EOR workflow application where users manage workers through onboarding, active employment, leave, timesheets, payroll, invoicing, and offboarding.

## The Main Boundaries

### Frontend Boundary

Owns:

- Routing and page composition.
- Forms and user interactions.
- Calling API endpoints.
- Displaying role-aware navigation and actions.

Does not own:

- Tenant security.
- Payroll truth.
- Workflow state authority.

Interview phrase:

> The frontend can guide the user, but the backend must enforce the rules.

### API Boundary

Owns:

- Authentication and current-user resolution.
- RBAC and organization scoping.
- Request validation.
- Business workflow transitions.
- Reading/writing durable state.
- Audit events.

Interview phrase:

> The API is the source of truth for business rules and authorization.

### Domain Boundary

Core nouns:

- Organization
- User
- Worker
- Employment
- CountryRule
- OnboardingTask
- WorkerDocument
- LeaveRequest
- Timesheet
- PayrollRun
- PayrollItem
- Invoice
- OffboardingCase
- AuditLog

Interview phrase:

> Organization is the tenant boundary; Worker is the lifecycle center; PayrollRun and Invoice are financial workflow records.

## Route Map

In the migrated .NET API, route registration lives in:

- `migrated-dotnet/src/GlobalHireLite.Api/Program.cs`

Important route groups:

- `/api/auth`: login, logout, current user.
- `/api/organizations`: tenant organizations.
- `/api/workers`: worker list, details, create, update, activate.
- `/api/workers/{id}/onboarding`: onboarding tasks.
- `/api/workers/{id}/documents`: document metadata.
- `/api/leave-requests`: leave workflow.
- `/api/timesheets`: timesheet workflow.
- `/api/payroll-runs`: payroll lifecycle.
- `/api/invoices`: invoice records and generation.
- `/api/offboarding-cases`: offboarding lifecycle.
- `/api/country-rules`: demo compliance/payroll assumptions.
- `/api/dashboard`: role-aware dashboard summary.
- `/api/audit-log`: audit trail.

## Service Map

In the migrated .NET API:

- `WorkerService`: worker visibility, creation, update, activation.
- `PayrollService`: payroll creation, calculation, approval, locking.
- `DashboardService`: role-aware dashboard aggregation.
- `AuthorizationService`: role and organization checks.
- `InMemoryGlobalHireStore`: seeded demo data and collections.

Production version would likely add:

- `AuthService`
- `OnboardingService`
- `LeaveService`
- `TimesheetService`
- `InvoiceService`
- `OffboardingService`
- `AuditService`
- EF Core `DbContext`

## Three Critical Flows

### 1. Login

Flow:

```text
React login form
-> POST /api/auth/login
-> API finds user
-> cookie/session is set
-> React calls /api/auth/me
-> shell renders role-aware UI
```

What to say:

> I would keep identity resolution in middleware or a shared auth service, then inject or pass actor context into business services.

### 2. Create Worker

Flow:

```text
React worker form
-> POST /api/workers
-> role check
-> organization scope check
-> country rule lookup
-> worker + employment + onboarding tasks + audit log
```

What to say:

> This should be transactional in a persisted database. If worker creation succeeds but onboarding task creation fails, the system should not be left half-created.

### 3. Calculate Payroll

Flow:

```text
Payroll page button
-> POST /api/payroll-runs/{id}/calculate
-> check run is DRAFT
-> load ACTIVE workers
-> load APPROVED timesheets in period
-> apply country rules
-> write payroll items and totals
-> status becomes CALCULATED
-> audit event
```

What to say:

> Payroll is a backend-owned deterministic workflow. The UI should trigger it and display it, not recalculate it independently.

## Where Bugs Usually Hide

- Authorization is checked in the UI but missing in the API.
- Organization filters are applied to list endpoints but not detail endpoints.
- Workflow transitions allow invalid jumps.
- Payroll uses unapproved timesheets.
- Money is represented with floating point types.
- Multi-table writes are not transactional.
- Audit logs are partial or inconsistent.
- React caches are not invalidated after mutations.

## How To Sound Senior

Say:

> I would first identify the domain boundary and the actor context. Then I would trace the request through validation, authorization, service logic, persistence, and response shape.

Say:

> For an EOR product, correctness and tenant isolation matter more than clever code.

Say:

> I would put high-risk rules around payroll, worker activation, and offboarding under tests before refactoring.

Avoid:

> I would just add another endpoint.

Instead:

> I would ask which role can perform it, which organization owns the data, what state transitions are allowed, what should be audited, and what tests prove it.
