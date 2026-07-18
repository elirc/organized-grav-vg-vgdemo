# Mid/Senior .NET Story Bank

These are polished practice stories for mid/senior C#/.NET interviews. They are written as first-person examples you can rehearse, then adjust to match your exact experience and wording.

Each story has two parts:

- **High-Level Answer**: the short version to start with in an interview.
- **Deeper Technical Detail**: the extra detail to add if the interviewer probes.

## 1. Service Layer Over Fat Controllers

**High-Level Answer**

In a workflow-heavy HR platform, I worked on an API where endpoint handlers were starting to collect too much business logic. Worker activation, payroll calculation, approvals, and audit events were all being handled close to the HTTP layer. I pushed the architecture toward thin controllers and service classes so endpoints handled request/response concerns while services owned the domain rules. That made the code easier to test, easier to review, and safer to extend.

**Deeper Technical Detail**

The key decision was separating transport concerns from business behavior. A controller or minimal API endpoint should bind the request, identify the actor, enforce broad authorization, and call a service. It should not know every rule for activating a worker or recalculating payroll.

In .NET terms, I would register services through dependency injection:

```csharp
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<IPayrollService, PayrollService>();
```

Then the endpoint becomes a small orchestration layer:

```csharp
app.MapPost("/api/workers/{id}/activate",
    async (string id, IWorkerService workers, CurrentUser actor) =>
        Results.Ok(await workers.ActivateAsync(actor, id)));
```

The deeper benefit is testability. I can unit test `WorkerService.ActivateAsync` with cases like incomplete onboarding, unsigned contract, wrong tenant, and valid activation without needing to run the whole web server. For a mid/senior role, the important point is not "always add layers"; it is that high-risk rules deserve clear ownership and tests.

## 2. Authorization Policies Instead Of Scattered Role Checks

**High-Level Answer**

I worked with a permissions model where different roles could perform different workflow actions: client admins managed workers, managers approved timesheets, EOR specialists reviewed onboarding, and workers could access only their own profile. Instead of letting every endpoint invent its own role logic, I would move toward capability-based authorization policies in ASP.NET Core. That makes the permission model easier to understand and change.

**Deeper Technical Detail**

Role checks like `if role == CLIENT_ADMIN` are easy at first, but they become brittle as the product grows. A better mid/senior approach is to define business capabilities:

- `CanManageWorkers`
- `CanReviewTimesheets`
- `CanRunPayroll`
- `CanViewWorkerProfile`
- `CanCompleteOffboarding`

In ASP.NET Core, those can become policies:

```csharp
options.AddPolicy("CanRunPayroll", policy =>
    policy.RequireRole("PLATFORM_ADMIN", "EOR_SPECIALIST", "CLIENT_ADMIN"));
```

For more complex checks, I would use authorization handlers because role alone is not enough. Tenant scope matters too. A client admin may be allowed to manage workers, but only inside their organization. A worker may view a worker profile, but only their own.

So my split would be:

- Authorization policy: can this actor attempt this action?
- Service/query scoping: can this actor access this specific data?

That keeps the security model explicit and avoids UI-only enforcement.

## 3. Preventing Cross-Tenant Data Leaks

**High-Level Answer**

One of the highest-risk problems in an HR or payroll product is cross-tenant data exposure. I approached that by making tenant scope part of the backend service design, not something the frontend controls. Every sensitive query had to be answered in terms of the current actor: what organization are they in, what role do they have, and are they trying to access their own data or someone else's?

**Deeper Technical Detail**

The pattern I like is passing actor context into service methods:

```csharp
Task<IReadOnlyList<WorkerDto>> ListWorkersAsync(CurrentUser actor, WorkerFilter filter);
Task<WorkerDetailDto> GetWorkerAsync(CurrentUser actor, string workerId);
```

Then the service applies tenant rules before returning anything:

- Platform admins and EOR specialists can see cross-organization data.
- Client admins and managers are scoped to their `OrganizationId`.
- Workers are scoped to their own `WorkerId`.

In EF Core, I would keep the tenant filter in the query:

```csharp
query = query.Where(worker => worker.OrganizationId == actor.OrganizationId);
```

I would also add integration tests for list, detail, and mutation endpoints. A common mistake is protecting list endpoints but forgetting detail endpoints. Another is checking access before fetching one object, but then including related records from another tenant through a careless join or include.

For a real production system, I would also consider database-level protections, such as row-level security, because defense in depth matters when worker and payroll data are involved.

## 4. Deterministic Payroll Calculation

**High-Level Answer**

I worked through a payroll-style workflow where totals depended on active workers, employment terms, approved timesheets, country rules, and a payroll period. The important architectural choice was to make payroll calculation deterministic and backend-owned. The UI could trigger the calculation, but the service owned the rules, wrote payroll items, updated totals, and moved the run through explicit statuses.

**Deeper Technical Detail**

The payroll run had a lifecycle:

```text
DRAFT -> CALCULATED -> APPROVED -> LOCKED
```

The calculation service enforced:

- Only `DRAFT` runs can be calculated.
- Only `ACTIVE` workers are included.
- Only `APPROVED` timesheets count.
- Payroll uses the period start and end dates.
- Country rules drive employer cost and employee tax assumptions.
- Money uses `decimal`, not floating point.
- Locked payroll cannot be modified.

The calculation itself might look like:

```csharp
var hourlyRate = employment.SalaryAmount / 160m;
var overtimePay = overtimeHours * hourlyRate * 1.5m;
var grossPay = employment.SalaryAmount + overtimePay;
var employeeTax = grossPay * countryRule.EmployeeTaxPercent;
var netPay = grossPay - employeeTax;
```

The architectural detail is that payroll item writes and run total updates should be transactional. If the service deletes old draft items, writes new items, and updates totals, those changes need to succeed or fail together.

The interview point is that financial workflow logic needs to be traceable. If someone asks why a worker's pay changed, the system should show which worker, which period, which timesheets, and which rule set were used.

## 5. Migration Without Breaking API Contracts

**High-Level Answer**

I worked on a migration plan where the implementation technology changed, but the product behavior needed to stay stable. The safest approach was to identify the external contracts first: routes, request shapes, response shapes, auth behavior, roles, statuses, and workflow transitions. Only after those were mapped did I focus on the internal .NET structure.

**Deeper Technical Detail**

The mistake in migrations is starting with code style instead of behavior. I would first make a contract inventory:

- `POST /api/auth/login`
- `GET /api/workers`
- `POST /api/workers/{id}/activate`
- `POST /api/payroll-runs/{id}/calculate`
- response fields expected by the React UI
- enum serialization names
- cookie or bearer token behavior
- validation errors

Then I would map implementation concepts:

| Old pattern | .NET pattern |
| --- | --- |
| Express router | ASP.NET Core endpoint/controller |
| TypeScript type/Zod schema | C# DTO plus validation |
| Prisma model | EF Core entity |
| Service function | Injected service class |
| Express middleware | ASP.NET Core middleware/policies |

The production-quality version would include parity tests. For example, seed representative data, call the old and new endpoints, and compare important response fields. I would also be especially careful with dates, enum casing, cookies, and validation behavior because those are common migration footguns.

My principle is: preserve behavior first, then improve internals.

## 6. Date Boundary Bug In Leave Or Payroll

**High-Level Answer**

I have seen date handling become deceptively tricky in HR workflows. Payroll periods, leave dates, and timesheet week starts are business dates, while audit events are timestamps. I solved this by separating date-only concepts from timestamp concepts and testing boundary cases explicitly.

**Deeper Technical Detail**

The risk is mixing concepts. A payroll period like `2026-06-01` to `2026-06-30` should not shift because a server runs in a different timezone. A leave request start date is usually a calendar date in business context. An audit event, on the other hand, is a precise moment.

In modern C#, I would use:

- `DateOnly` for payroll period start/end, leave start/end, timesheet week start.
- `DateTimeOffset` or UTC `DateTime` for audit timestamps and created/updated times.

I would test:

- period start included
- period end included
- timesheet just outside the period excluded
- leap day or month-end dates
- timezone conversion at API boundaries

The deeper architectural point is that date semantics should be visible in the type system. If everything is a timestamp, the code invites accidental conversion bugs.

## 7. Dashboard Performance And Query Shape

**High-Level Answer**

I worked on dashboard-style features where it was tempting to load a large object graph and compute everything in memory. I pushed toward projection and aggregate queries instead. A dashboard needs counts, recent records, and summaries; it usually does not need every related entity.

**Deeper Technical Detail**

A slow version of a dashboard often does this:

```csharp
var organizations = await db.Organizations
    .Include(o => o.Workers)
    .ThenInclude(w => w.Timesheets)
    .Include(o => o.PayrollRuns)
    .ToListAsync();
```

That can explode quickly. A better approach is separate, focused queries:

```csharp
var activeWorkers = await db.Workers
    .Where(w => w.OrganizationId == organizationId && w.Status == WorkerStatus.ACTIVE)
    .CountAsync();

var recentPayroll = await db.PayrollRuns
    .Where(r => r.OrganizationId == organizationId)
    .OrderByDescending(r => r.CreatedAt)
    .Select(r => new PayrollSummaryDto(r.Id, r.Status, r.GrossTotal))
    .Take(5)
    .ToListAsync();
```

I would also add indexes on:

- `OrganizationId`
- `WorkerId`
- payroll period dates
- timesheet week start dates
- status fields used in filters

The senior-level point is that performance is often about data shape. Fetch exactly what the page needs, and inspect generated SQL when a query matters.

## 8. Audit Logging For Sensitive Workflows

**High-Level Answer**

In HR and payroll workflows, audit logging is not just technical logging. It is part of the product's trust model. I designed audit events around who performed an action, what entity changed, when it happened, and why it mattered. That made workflow changes traceable for operations and debugging.

**Deeper Technical Detail**

An audit record should include:

- actor user id
- organization id
- entity type
- entity id
- action
- message
- structured metadata
- timestamp

Examples:

- `WORKER_CREATED`
- `ONBOARDING_TASK_APPROVED`
- `PAYROLL_CALCULATED`
- `PAYROLL_APPROVED`
- `INVOICE_GENERATED`
- `OFFBOARDING_COMPLETED`

In .NET, I would centralize this in an `AuditService`:

```csharp
await audit.RecordAsync(new AuditEvent
{
    ActorUserId = actor.Id,
    OrganizationId = run.OrganizationId,
    EntityType = "PayrollRun",
    EntityId = run.Id,
    Action = "PAYROLL_APPROVED"
});
```

For high-risk business changes, the audit write should happen in the same transaction as the business update. Otherwise, you can end up with the state changed but no audit event, which is exactly when you most need the history.

## 9. Extensible Country Rules

**High-Level Answer**

I worked with a domain where country-specific rules affected onboarding requirements and payroll assumptions. The architectural choice was to make simple rules data-driven instead of hardcoding every country path in application code. That made it easier to add or adjust rules without rewriting the workflow.

**Deeper Technical Detail**

The country rule model included fields like:

- country code
- currency
- statutory vacation days
- notice period days
- requires tax id
- requires bank details
- requires signed contract
- employer cost percent
- employee tax percent

When creating a worker, the service reads the country rule and generates onboarding tasks:

```text
if requiresTaxId -> add Tax information task
if requiresBankDetails -> add Bank details task
if requiresSignedContract -> add Contract signed task
```

The design tradeoff is that data-driven rules are good for simple configuration, but not all compliance can be modeled as a few booleans. In production, I would separate:

- simple configuration rules
- workflow policy
- external compliance/legal provider integrations

That keeps the app flexible without pretending it can encode every employment law rule internally.

## 10. Minimal APIs Versus Controllers

**High-Level Answer**

I had to think through whether a .NET API should use minimal APIs or controllers. My view is that minimal APIs are good for compact services and migrations where the route surface should be easy to see, while controllers can be better for larger systems with many modules, filters, conventions, and versioning needs. The choice should serve readability and testability, not fashion.

**Deeper Technical Detail**

Minimal APIs are useful when:

- the service is small or medium-sized
- endpoint definitions are straightforward
- you want less ceremony
- route grouping keeps things readable

Controllers are useful when:

- many endpoints belong to clear resource modules
- you need action filters or conventions
- API versioning is important
- a team is already standardized around MVC patterns

For a GlobalHire-style system, I could start with minimal APIs for a migration scaffold:

```csharp
app.MapPost("/api/payroll-runs/{id}/calculate", CalculatePayroll);
```

Then move toward grouped endpoints or controllers as modules grow:

```text
WorkersController
PayrollRunsController
OnboardingController
OffboardingController
```

The important thing is not the endpoint style; it is keeping domain logic in services and keeping the API contract clear.

## 11. Disagreement About How Much Architecture To Add

**High-Level Answer**

I had a disagreement about whether to ship workflow logic directly in endpoints or introduce a service boundary first. I did not argue that every part of the app needed more architecture. Instead, I separated low-risk CRUD from high-risk rules. For payroll, tenant isolation, and worker activation, I argued for services and tests because mistakes there could create security or financial issues.

**Deeper Technical Detail**

My position was risk-based:

- Low-risk admin lookup endpoint: route-level logic may be acceptable temporarily.
- Payroll calculation: service plus tests.
- Worker activation: service plus tests.
- Cross-tenant access: integration tests.
- Offboarding completion: transaction and audit event.

That framing helped because it avoided a philosophical argument. The question became: "What is the blast radius if this code is wrong?"

I would say this in an interview:

> I do not add abstraction just to make code look enterprise. I add structure where the business risk justifies it.

The outcome was a compromise: ship simple code where appropriate, but protect high-risk workflows with clearer boundaries.

## 12. Mentoring A Teammate Through A Domain Codebase

**High-Level Answer**

I helped a teammate ramp into a domain-heavy codebase by giving them a reading path instead of asking them to browse randomly. We traced one complete workflow from the frontend to the API to the service and persistence model. That made the system much easier to understand.

**Deeper Technical Detail**

The reading path was:

1. Application startup and route registration.
2. Auth middleware or current-user resolution.
3. Domain models.
4. One important service, like worker activation or payroll calculation.
5. The frontend page that triggers the workflow.
6. Tests for the business rule.

For a .NET codebase, I would start with:

- `Program.cs`
- route/controller for the workflow
- request DTO
- service class
- entity model or DbContext query
- test file

Then I would give them a small first task, such as adding a new validation rule or an audit event, with a test. That builds confidence and teaches the codebase through a real change.

The leadership point is that onboarding is not just being nice. It reduces future review burden and helps the team move faster.

## 13. Risk-Based Testing Plan

**High-Level Answer**

I created a testing strategy based on risk instead of trying to cover every line equally. In an HR/payroll system, the highest-risk areas are tenant isolation, payroll calculation, worker lifecycle transitions, invoice generation, and offboarding. I focused tests there first.

**Deeper Technical Detail**

The tests I would prioritize in .NET:

Service unit tests:

- `ActivateWorker_RequiresApprovedRequiredTasks`
- `ActivateWorker_RequiresSignedContract`
- `CalculatePayroll_RejectsNonDraftRun`
- `CalculatePayroll_UsesOnlyApprovedTimesheets`
- `CalculatePayroll_ExcludesInactiveWorkers`

API integration tests:

- client cannot access another organization's worker
- worker cannot access another worker's profile
- payroll endpoint rejects unauthorized roles
- invoice cannot be generated before payroll approval

In ASP.NET Core, I would use:

- xUnit for unit tests
- `WebApplicationFactory` for integration tests
- test data builders for readable setup

The senior-level point is that test strategy should follow business risk. Payroll and security deserve more rigor than simple static lookup endpoints.

## 14. Background Job Boundary For Slow Work

**High-Level Answer**

I thought through how to handle slow or unreliable work such as invoice generation, document processing, provider sync, or notifications. The API should validate the request and record intent quickly, while background processing handles retryable work. That keeps the user experience responsive and makes failures easier to recover from.

**Deeper Technical Detail**

The synchronous path:

```text
POST /api/payroll-runs/{id}/invoice
-> validate actor
-> validate payroll status
-> create job/event
-> return accepted/status
```

The background path:

```text
worker picks up job
-> generate invoice
-> call provider if needed
-> record result
-> write audit event
-> notify user
```

In .NET, I would start simple with `BackgroundService` only if the deployment model supports it. For production reliability, I would prefer a durable queue and a worker service. Depending on the environment, that might be Azure Queue/Service Bus, Hangfire, or another queue-backed system.

The key design points:

- jobs should be idempotent
- retries should not duplicate invoices
- job status should be visible
- failures should be logged with correlation ids

## 15. Recovering From A Bad Release

**High-Level Answer**

In a bad-release scenario, I focus on narrowing impact first, then finding the smallest safe fix. For example, if a workflow calculation or access rule changed unexpectedly, I would trace the affected request, reproduce it with the specific actor and data state, patch the broken rule, and add a regression test.

**Deeper Technical Detail**

My incident approach:

1. Confirm symptoms and affected users.
2. Check whether it is frontend display, API contract, authorization, query filtering, or service logic.
3. Reproduce with realistic data.
4. Identify the smallest safe rollback or patch.
5. Add a regression test for the missed scenario.
6. Write a short postmortem if the blast radius was meaningful.

For a .NET API, I would want structured logs:

```csharp
logger.LogWarning(
    "Payroll calculation failed for run {PayrollRunId} by user {UserId}",
    runId,
    actor.Id);
```

I would also want correlation ids across frontend and backend so support or engineering can trace one user action through the system.

The story shows ownership: fix the issue, communicate clearly, and improve the system so the same issue is less likely.

## 16. Improving API Response Shapes

**High-Level Answer**

I worked on making API responses easier for frontend developers to consume by moving away from exposing raw persistence models everywhere. I prefer explicit DTOs for list and detail responses because they make contracts clear, reduce accidental over-fetching, and decouple the UI from database internals.

**Deeper Technical Detail**

Returning raw entities can cause problems:

- too many fields leak to the client
- related data shape changes unexpectedly
- circular references can appear with ORMs
- list endpoints return more data than needed
- database refactors become frontend breaking changes

In .NET, I would define response records:

```csharp
public sealed record WorkerListItemDto(
    string Id,
    string FullName,
    string JobTitle,
    string CountryCode,
    WorkerStatus Status);
```

Then project directly in EF Core:

```csharp
var workers = await db.Workers
    .Where(w => w.OrganizationId == actor.OrganizationId)
    .Select(w => new WorkerListItemDto(
        w.Id,
        w.FirstName + " " + w.LastName,
        w.JobTitle,
        w.CountryCode,
        w.Status))
    .ToListAsync();
```

The result is better performance and a clearer API contract.

## 17. Build Versus Buy For Payroll And Compliance

**High-Level Answer**

For a global employment product, I would not pretend that a normal product team should build all payroll and compliance logic from scratch. The better architecture is to own workflow orchestration, approvals, auditability, and customer experience, while integrating specialized providers for legally sensitive payroll and compliance calculations.

**Deeper Technical Detail**

The app can own:

- worker lifecycle
- onboarding checklist
- document workflow
- approvals
- payroll run status
- invoice status
- audit log
- customer dashboard

External providers may own:

- legal payroll calculation
- tax withholding
- statutory benefits
- country-specific compliance
- payments

In .NET, I would hide provider-specific logic behind interfaces:

```csharp
public interface IPayrollProvider
{
    Task<PayrollQuote> PreviewAsync(PayrollPreviewRequest request);
    Task<PayrollSubmissionResult> SubmitAsync(PayrollSubmission request);
}
```

That keeps the core workflow independent from a single vendor. It also supports retries, reconciliation, and provider replacement.

The tradeoff is that provider integration adds complexity, but it reduces legal and operational risk.

## 18. Refactoring While Maintaining Backward Compatibility

**High-Level Answer**

I approached refactoring by protecting behavior first. Before changing internals, I documented the existing contract, added tests around high-risk behavior, and kept route/request/response shapes stable. Then I refactored behind service boundaries so the UI and users did not experience unexpected changes.

**Deeper Technical Detail**

The safe refactor sequence:

1. Identify public contracts.
2. Add characterization tests for current behavior.
3. Move logic into a service without changing behavior.
4. Replace duplicated logic with shared methods.
5. Add stricter tests for edge cases.
6. Improve internal naming and structure.
7. Only then consider API contract changes, preferably versioned.

In a .NET migration, that might mean preserving:

- route URLs
- JSON field names
- enum string values
- auth cookie behavior
- validation error shape
- workflow state transitions

The senior-level point is that refactoring is not just cleaning code. It is changing structure while managing risk. The best refactors make the next change easier without creating surprise work for other teams.

## Quick Practice Order

Start by practicing these five out loud:

1. Service layer over fat controllers.
2. Preventing cross-tenant data leaks.
3. Deterministic payroll calculation.
4. Migration without breaking API contracts.
5. Disagreement about how much architecture to add.

Then practice:

6. Risk-based testing plan.
7. Dashboard performance.
8. Audit logging.
9. Date boundary bug.
10. Build versus buy for payroll/compliance.
