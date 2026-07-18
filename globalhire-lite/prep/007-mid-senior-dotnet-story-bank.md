# Mid/Senior .NET Story Bank — Enhanced Edition

These are practice stories for mid/senior C#/.NET interviews. Each story now has three layers you can use depending on how deep the interviewer goes:

- **Elevator Version** — one to two sentences, enough to orient the interviewer and invite a follow-up
- **Full Story** — the four-minute version with situation, decision, and outcome
- **War Story Detail** — the specific color and friction that makes the story sound lived-in, not rehearsed from a blog post

**How to practice:** Read each story aloud. Do not read the war story detail until you can deliver the full story without notes. The detail should feel like something you remember, not something you recite.

---

## 1. Service Layer Over Fat Controllers

**Elevator Version:**
> "I pushed an API from having business logic scattered across endpoint handlers to a thin controller / rich service pattern — mainly because payroll and activation rules are high enough risk that they deserve explicit ownership and testability."

**Full Story:**
The API I worked on had started clean but grew over time. Worker activation, payroll calculation, approvals, and audit event writes were each added incrementally, and they ended up living close to the HTTP layer. The problem wasn't style — it was risk. If a bug existed in the activation logic, the only place to test it was with a full HTTP request to a running server. There was no unit test surface.

I separated transport concerns from domain concerns. Endpoint handlers were responsible for binding requests, resolving the current user, enforcing coarse authorization, and delegating to a service. They owned HTTP shape. The service owned rules, checked preconditions, wrote the state change, and emitted audit events. That boundary made each layer independently testable.

The concrete benefit: we could write `ActivateWorker_RequiresApprovedRequiredTasks` as a pure unit test with a mocked database — three lines of setup, no HTTP. That test ran in milliseconds and caught edge cases we never would have exercised through an end-to-end suite.

**War Story Detail:**
The moment I knew the pattern was justified was when we needed to add an emergency admin override for worker activation. An EOR specialist needed to activate a worker even if one optional onboarding task was stuck in pending, because the task was administrative and the worker was already employed. If the activation logic had lived in the endpoint handler, the override would have been an if-branch right next to the HTTP response construction — impossible to test and easy to break on the next change. Because it lived in the service, I could add an `allowOverride` parameter to `ActivateAsync`, add a policy check that only `EOR_SPECIALIST` could pass `allowOverride = true`, and write a test for the override case in isolation. The change took two hours instead of a day.

**C#/.NET to use:**
```csharp
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<IPayrollService, PayrollService>();

app.MapPost("/api/workers/{id}/activate",
    async (string id, IWorkerService workers, CurrentUser actor) =>
        Results.Ok(await workers.ActivateAsync(actor, id)));
```

---

## 2. Authorization Policies Instead Of Scattered Role Checks

**Elevator Version:**
> "I moved from ad hoc `if role == X` guards toward named capability policies in ASP.NET Core — the goal was a permission model you could reason about, not rediscover endpoint by endpoint."

**Full Story:**
Early in the codebase, permissions were checked inline: "if the user is a CLIENT_ADMIN, allow this." That's fine at first. But as more roles were added — EOR_SPECIALIST, MANAGER, PLATFORM_ADMIN — and as more endpoints were added, the role checks became inconsistent. Two endpoints that should have had the same policy had slightly different role lists. One was missing a role. Another was overly permissive.

I defined capabilities instead of roles at each endpoint:
- `CanManageWorkers`
- `CanReviewTimesheets`
- `CanRunPayroll`
- `CanViewWorkerProfile`

Those became named policies. Any endpoint protecting payroll actions used `CanRunPayroll`. Adding a new role that should run payroll meant updating one policy registration, not auditing every payroll endpoint.

I also separated two kinds of checks: the policy checked "can this role attempt this action?" and the service layer checked "can this specific actor access this specific record?" A client admin passes `CanManageWorkers`, but a service query filters to their org's workers only. Both layers are necessary.

**War Story Detail:**
The bug that convinced the team was a timesheet approval endpoint. Two different engineers had added role checks to it at different times. One check allowed `MANAGER` and `CLIENT_ADMIN`. A later check in a different branch allowed `CLIENT_ADMIN` and `EOR_SPECIALIST`. Both were merged. The combined result allowed all three — correct — but for the wrong reason and with no single source of truth. When a new `SENIOR_MANAGER` role was added six months later, nobody remembered to add it to the timesheet approval endpoint because there was no canonical list to update. The policy approach would have made that a one-line registration change.

**C#/.NET to use:**
```csharp
options.AddPolicy("CanRunPayroll", policy =>
    policy.RequireRole("PLATFORM_ADMIN", "EOR_SPECIALIST", "CLIENT_ADMIN"));

options.AddPolicy("CanManageWorkers", policy =>
    policy.RequireAssertion(ctx =>
        ctx.User.IsInRole("CLIENT_ADMIN") || ctx.User.IsInRole("EOR_SPECIALIST")));
```

---

## 3. Preventing Cross-Tenant Data Leaks

**Elevator Version:**
> "In an HR and payroll platform, a cross-tenant data leak isn't a theoretical risk — it's catastrophic. I designed service methods to enforce tenant scope at the query layer, not the navigation layer."

**Full Story:**
The platform served multiple client organizations. A client admin for Company A should never see Company B's workers, timesheets, or payroll. That seems obvious, but the risk creeps in through detail endpoints.

List endpoints usually get tenant filtering because they're the first thing you build. But detail endpoints — "get worker by ID," "get payroll item by ID" — often get only role checks ("is this user a client admin?") without also checking ownership ("is this worker in the client admin's org?"). An attacker with a valid client admin session who guesses or enumerates record IDs gets data they shouldn't have.

My pattern: every service method that touches a specific entity takes the actor context and applies an ownership check before returning anything. It's not defensive in the sense of "add checks everywhere just in case" — it's structural. The method signature forces the question: whose context is this query running in?

I backed this with integration tests using two seeded organizations. Every endpoint that accepted a worker ID or payroll ID had a test for "org A admin tries to access org B record, expects 403." That test suite found two missed checks on the first run.

**War Story Detail:**
One of the missed checks was subtle. The worker document download endpoint checked that the requester was a client admin. It did not check that the document belonged to a worker in the client admin's org. Documents were stored with a worker reference, but the endpoint only validated the document ID and the user role. A client admin who obtained a document ID — possibly from a support conversation, or by inspecting network traffic — could download a document from another org. The fix was one additional query: after fetching the document, check `document.Worker.OrganizationId == actor.OrganizationId`. One line of code, but high-stakes if missing.

**C#/.NET to use:**
```csharp
Task<WorkerDetailDto> GetWorkerAsync(CurrentUser actor, string workerId);

// Inside the service:
var worker = await db.Workers
    .Where(w => w.Id == workerId && w.OrganizationId == actor.OrganizationId)
    .FirstOrDefaultAsync()
    ?? throw new NotFoundException();
```

---

## 4. Deterministic Payroll Calculation

**Elevator Version:**
> "I designed the payroll calculation to be deterministic, backend-owned, and transactional — the goal was that every total should be explainable from its inputs, and every status transition should be an explicit event."

**Full Story:**
Payroll had a lifecycle: `DRAFT → CALCULATED → APPROVED → LOCKED`. The calculation service owned the DRAFT-to-CALCULATED transition. It ran inside a database transaction: delete any existing draft payroll items, load only active workers, pull only approved timesheets within the period, fetch country rules, compute gross pay and employer costs using decimal arithmetic, write new payroll items, update run totals, advance the status. If anything failed, the whole transaction rolled back — no partial payroll states.

The "only approved timesheets" rule was important. A timesheet in PENDING status might get approved after calculation was run. Recalculating should be safe — idempotent. The delete-then-rewrite approach inside a transaction made that safe.

Approval and lock were separate, explicit transitions. Approving a calculated run moved it to APPROVED. Locking it (usually after submitting to a payroll provider) moved it to LOCKED. A locked run could not be recalculated or modified — that protection prevented retroactive corrections to approved and paid payroll.

**War Story Detail:**
The idempotency question came up during a support escalation. A client admin double-clicked the "Calculate Payroll" button, and the first response was slow, so the second request fired before the first responded. We didn't have distributed locking at the time. The first request was in the middle of writing payroll items when the second one ran — and both succeeded because each was within its own transaction, but neither saw the other's writes. The result was doubled payroll items. We added an idempotency check: before starting calculation, acquire an optimistic lock on the run record (check a version field), and if two requests race, the second one gets a 409 and is rejected by the client. The simpler version is just checking the run status at the start of the transaction under a lock — if it's already CALCULATED, return early.

**C#/.NET to use:**
```csharp
var hourlyRate = employment.SalaryAmount / 160m;
var overtimePay = overtimeHours * hourlyRate * 1.5m;
var grossPay = employment.SalaryAmount + overtimePay;
var employerCost = grossPay * countryRule.EmployerCostPercent;
var employeeTax = grossPay * countryRule.EmployeeTaxPercent;
var netPay = grossPay - employeeTax;
```

---

## 5. Migration Without Breaking API Contracts

**Elevator Version:**
> "When migrating implementations, I map external contracts first — routes, request shapes, response shapes, auth behavior — before touching any internal structure. Behavior preservation comes before code quality."

**Full Story:**
Migrations fail when you conflate "changing the implementation" with "improving the behavior." The correct order is: first, inventory every contract that external code depends on. Then reproduce that behavior in the new implementation. Then clean up internals.

Contracts for a web API include more than just routes. They include JSON field names and casing, enum string values (is it `"ACTIVE"` or `"active"` or `"Active"`?), validation error shape, auth cookie names and behavior, HTTP status codes for specific errors, and date serialization format. Any of these can break a frontend if they change unexpectedly.

My practice: write a contract inventory document first. Then write parity tests — call both old and new endpoints with the same seed data and diff the responses on the fields that matter. Then migrate, keeping parity tests green. Only after behavior parity is confirmed do I start improving internal structure.

**War Story Detail:**
The enum casing gotcha bit us during a migration rehearsal. The TypeScript API was serializing enum values as uppercase strings — `"ACTIVE"`, `"DRAFT"`. The .NET default for a JSON-serialized enum is its integer value (0, 1, 2...) unless you configure a converter. I had added `JsonStringEnumConverter` but hadn't configured case — it was outputting `"Active"`, `"Draft"`. The React app was doing strict equality comparisons against uppercase strings. Every status badge in the UI was broken: it showed "Unknown" because `"Active" !== "ACTIVE"`. The parity test caught it immediately. The fix was `JsonStringEnumConverter` with `JsonNamingPolicy.UpperCaseName` (or a custom converter). But without the parity test, that would have been a runtime bug discovered by a frontend dev wondering why all workers showed as "Unknown status."

**Mapping table to reference:**
| TypeScript/Node | .NET |
|---|---|
| Express route handler | ASP.NET Core endpoint or controller action |
| Express middleware | ASP.NET Core middleware / filters / policies |
| Zod schema | C# DTO + FluentValidation |
| Prisma model | EF Core entity |
| Prisma client | DbContext |
| Service function | Injected service class |
| Vitest | xUnit / NUnit |
| Supertest integration test | WebApplicationFactory + HttpClient |

---

## 6. Date Boundary Bug In Payroll Or Leave

**Elevator Version:**
> "Date handling in HR workflows looks simple until you mix timezone-sensitive timestamps with business-context calendar dates — I learned to separate them at the type level, not just by convention."

**Full Story:**
Payroll periods are calendar dates: June 1 to June 30. They have no timezone. A server in a different timezone should not shift a June 1 period start to May 31. Leave requests are the same — a worker requesting Monday through Friday is requesting business calendar dates, not UTC midnight moments.

But audit events, created-at timestamps, and last-modified times are exact moments and should be stored as UTC with timezone information.

Mixing these concepts causes bugs. A payroll period stored as a `DateTime` with `Kind = Utc` can shift to the previous day for users in a timezone west of UTC when the server is rendering a "period start" label. A timesheet week start stored as a timestamp can include or exclude timesheets depending on server timezone if the comparison isn't explicit about how to truncate.

I use `DateOnly` for all business-date concepts: period start and end, leave start and end, timesheet week start. I use `DateTimeOffset` for all event-timestamp concepts. That distinction is visible in the type system and prevents accidental cross-contamination.

**War Story Detail:**
The bug that made this concrete was a payroll period boundary test that failed only on a CI server in UTC+0 when run at 11pm local time for a developer in UTC-5. The developer's "today" was November 30. The CI server's "today" was December 1. The test was computing a payroll period for "this month" using `DateTime.Today` — which gave December on CI and November locally. The test had been green locally for weeks. It failed on CI intermittently, only near midnight. This is the canonical timezone bug: it's invisible in local testing and only shows up under specific wall-clock conditions. Switching to `DateOnly` and explicit period inputs (not derived from "today") made the test deterministic.

**C#/.NET to use:**
- `DateOnly` for payroll period start/end, leave start/end, timesheet week start
- `DateTimeOffset` or UTC `DateTime` for created-at, updated-at, audit timestamps
- Test boundary cases: period start included, period end included, one day outside excluded, leap day, month-end
- Never use `DateTime.Today` or `DateTime.Now` in business-date calculations — inject a clock abstraction

---

## 7. Dashboard Performance And Query Shape

**Elevator Version:**
> "I replaced a dashboard that was loading full entity graphs in memory with focused aggregate queries — the page went from seconds to milliseconds, and the fix was about data shape, not caching."

**Full Story:**
The dashboard was built during a rapid prototype phase. It needed to show active worker counts, recent payroll runs, pending approvals, and open onboarding tasks. The implementation loaded everything: organizations with all their workers, timesheets, payroll runs, and onboarding tasks. Then it computed counts and summaries in C# loops.

The problem scaled with data. At 10 workers per org it was fast. At 100 it was slow. At 500 it was visibly broken for a demo with a large client.

The fix was separating the queries by what each dashboard widget actually needed:
- Active worker count: a `COUNT` query filtered by org and status
- Recent payroll runs: a `SELECT` of the five most recent runs, projecting only summary fields
- Pending approvals: a `COUNT` query on timesheets in PENDING status

Each query was small and focused. No `Include()` chains. No in-memory aggregation. The database did the work it's designed for.

**War Story Detail:**
There was a secondary issue we found during the fix. One of the dashboard widgets showed "workers with incomplete onboarding." The original query loaded all workers with all their onboarding tasks and filtered in C#. When I moved it to a database query, I discovered that the index on `onboarding_tasks.status` didn't exist. The query was doing a full table scan. We added the index and the query went from 800ms to 12ms. The point isn't that indexes are magic — it's that you can't see missing indexes until you inspect the generated SQL, which the original in-memory approach completely hid.

**C#/.NET to use:**
```csharp
// Before (slow):
var orgs = await db.Organizations
    .Include(o => o.Workers).ThenInclude(w => w.Timesheets)
    .Include(o => o.PayrollRuns)
    .ToListAsync();

// After (fast):
var activeWorkers = await db.Workers
    .Where(w => w.OrganizationId == orgId && w.Status == WorkerStatus.Active)
    .CountAsync();

var recentPayroll = await db.PayrollRuns
    .Where(r => r.OrganizationId == orgId)
    .OrderByDescending(r => r.CreatedAt)
    .Select(r => new PayrollSummaryDto(r.Id, r.Status, r.GrossTotal))
    .Take(5)
    .ToListAsync();
```

---

## 8. Audit Logging For Sensitive Workflows

**Elevator Version:**
> "In payroll and HR, audit logging is part of the trust model — it's not technical logging, it's the answer to 'what happened and who approved it?' when a client disputes a payroll amount."

**Full Story:**
The audit log I designed recorded who took an action, on what entity, in what org, and with what structured context. Not a text message — a structured record with typed fields.

The events that mattered most were workflow transitions: WORKER_ACTIVATED, PAYROLL_CALCULATED, PAYROLL_APPROVED, INVOICE_GENERATED, OFFBOARDING_COMPLETED. Each event was a record you could query: show me all payroll approvals for this organization in June.

The important implementation detail: for high-risk events, the audit write should happen in the same database transaction as the business change. If you write the business change and then the audit in separate operations, you can end up with a state change that has no audit record — exactly the scenario that's hardest to reconstruct later.

**War Story Detail:**
We had a client dispute where they claimed a worker had been deactivated without their knowledge. The support team needed to answer: who deactivated this worker, when, and through what workflow step? Without structured audit events, the only answer was "look at the git blame for the worker record" — which showed the last update, not the history. With audit events, the answer was a single query: `SELECT * FROM audit_events WHERE entity_id = ? AND action = 'WORKER_DEACTIVATED'`. It showed an EOR specialist had completed the offboarding workflow at a specific time, and the actor ID matched their account. The dispute was resolved in minutes instead of days.

**C#/.NET to use:**
```csharp
await audit.RecordAsync(new AuditEvent
{
    ActorUserId = actor.Id,
    OrganizationId = run.OrganizationId,
    EntityType = "PayrollRun",
    EntityId = run.Id,
    Action = "PAYROLL_APPROVED",
    Metadata = JsonSerializer.SerializeToDocument(new { grossTotal = run.GrossTotal })
});
```

---

## 9. Extensible Country Rules

**Elevator Version:**
> "I modeled country-specific employment rules as data rather than code branches — so adding a new country was a database insert, not a code change."

**Full Story:**
Employment law varies by country: statutory vacation days, notice periods, whether workers need a tax ID or bank details before they can be paid, employer cost percentages. The naive implementation is a switch statement or a pile of if-country-code branches. That approach requires a deployment every time a new country is added.

I moved simple country rules to a configuration table. When creating a worker for a given country, the onboarding service reads that country's record and generates the required onboarding tasks. If `requiresTaxId` is true, a "Tax information" task is added. If `requiresBankDetails` is true, a "Bank details" task is added. Adding a new country means inserting a new row.

The honest design acknowledgment: this works for boolean and percentage configuration. It doesn't work for complex legal rules, tiered rates with threshold logic, or country-specific workflow variations. For those, I'd separate simple configuration from a provider integration that handles legal compliance rules externally.

**War Story Detail:**
The edge case that tested the model was a country that required a bank account for monthly payroll but allowed cash payment for first-time contractors. The boolean `requiresBankDetails` didn't capture that nuance. We added a separate rule: `bankDetailsRequiredForContractType`. That worked for the immediate need. But it made clear that the country rule model would grow unboundedly if we tried to encode every legal nuance as fields. The right long-term answer is to own the workflow orchestration (create the task, track its completion) but source the specific legal requirements from a compliance provider API rather than a config table we maintain.

---

## 10. Minimal APIs Versus Controllers

**Elevator Version:**
> "The choice between minimal APIs and controllers comes down to module size and convention needs — I prefer minimal APIs for compact services and migrations, and controllers for larger systems where action filters and conventions pay off."

**Full Story:**
Both approaches work. The question is what serves the team.

Minimal APIs are better when: the service is small, the route surface needs to be legible at a glance, you want less ceremony, and route grouping keeps things organized. For a migration scaffold where I want to prove parity quickly, minimal APIs let me see all routes in a few hundred lines.

Controllers are better when: the API has many endpoints per resource, action filters or conventions matter, API versioning is in play, or the team is already fluent in MVC patterns. For a large multi-module system, a `WorkersController` and a `PayrollRunsController` give you clear groupings and let you apply filters at the controller level.

The thing that doesn't change: domain logic belongs in services, not in the endpoint style. A `WorkersController.ActivateAsync` and a `MapPost("/workers/{id}/activate")` both call `WorkerService.ActivateAsync`. The endpoint style is a transport choice.

**War Story Detail:**
I had a conversation about this at an API design review. Someone wanted to put payroll calculation logic directly into the minimal API handler to keep the file "self-contained." I argued that handler self-containment was a local benefit with a global cost — if the payroll calculation logic is in a lambda, it can't be unit tested without spinning up the whole web host, and two similar handlers will share no code. The counterargument was that services add indirection that slows reading. We compromised: handlers could contain query logic for simple reads, but any write that involved multiple steps, status transitions, or audit events went into a service. That's a rule of thumb I still use.

---

## 11. Disagreement About Architecture Scope

**Elevator Version:**
> "I argued for service boundaries and tests on high-risk workflows, and let simpler CRUD run without them — the frame I used was blast radius, not philosophy."

**Full Story:**
The disagreement was about whether to introduce a service layer before shipping the first version. The argument against: services add indirection, slow down initial development, and might not be needed if the app stays small. The argument for: payroll and worker activation are high-stakes; if those rules are wrong, it's a financial and trust problem.

My position was risk-based, not architectural. I didn't argue that every endpoint needs a service. I separated the surface:
- Simple admin lookup (list countries, get org settings): route-level logic acceptable for now
- Worker activation: service plus unit tests on precondition rules
- Payroll calculation: service plus tests, must be transactional
- Cross-tenant access: must have integration tests

The "blast radius if wrong" question made the conversation concrete. A wrong country list lookup is a cosmetic bug. Wrong worker activation allows a worker into payroll before their contract is signed. Wrong payroll calculation affects real money. Those are not equivalent.

**War Story Detail:**
The outcome was a compromise that I think was actually better than my original position. For the payroll and activation paths, we added services. For the document metadata endpoints (list documents, get document details), we shipped without a service and left them as query handlers. Six months later, the document endpoints never needed to change. The payroll service was modified four times with new business rules. If I had insisted on services everywhere, we would have spent time abstracting code that never changed. The risk-based framing meant we spent abstraction effort where it paid off.

**Quote to use in the interview:**
> "I don't add abstraction to make code look enterprise. I add structure where the business risk justifies the overhead."

---

## 12. Mentoring A Teammate Through A Domain Codebase

**Elevator Version:**
> "I onboarded a new teammate by giving them a reading path — one complete workflow from the route to the service to the database to the test — instead of asking them to explore randomly."

**Full Story:**
The codebase had grown to maybe 30 endpoints across three domains. A new engineer joined mid-sprint. There was no onboarding document. Asking them to "read the code" would have taken days and left gaps.

I gave them a reading path instead: start with Program.cs and service registrations, then follow one worker activation request from the route through the service to the database query to the test. That single flow exposed the dependency injection pattern, the actor context convention, the service method structure, the EF Core query shape, and the test setup style. Everything else in the codebase was a variation on that pattern.

Then I gave them a first task designed to build confidence and teach the codebase: add a validation check to the offboarding workflow that verifies all outstanding timesheets are approved before offboarding can complete. It required reading an existing service, understanding a state transition, writing a guard condition, and writing a unit test. Medium complexity, no ambiguity, clear success criteria.

**War Story Detail:**
The reading-path approach came from my own experience joining a codebase with no documentation. I spent two days trying to understand the system by reading files alphabetically, which is the worst possible strategy. The codebase made sense only once I found one entry point and traced it through. Once I traced it, every other part of the codebase was a familiar variation. I built the reading-path document after that experience specifically to save the next person from the same two-day confusion.

---

## 13. Risk-Based Testing Plan

**Elevator Version:**
> "I prioritize tests by blast radius — tenant isolation and payroll calculation get integration tests and unit tests, simple static lookups don't need either."

**Full Story:**
The temptation in a mature project is to chase coverage percentages. That's a proxy metric, not a risk metric. A 95% coverage number tells you how many lines were executed, not whether the dangerous business rules are protected.

My approach: list every workflow in the system, then rank them by what breaks if they're wrong. Tier 1 (tenant isolation, payroll calculation, worker activation) gets unit tests on business rules AND integration tests on access control. Tier 2 (timesheet submission, document upload, onboarding task approval) gets unit tests on rules. Tier 3 (static lookups, config reads) gets nothing, or a happy-path smoke test.

For .NET specifically, this means:
- Unit tests (xUnit) on service methods: `ActivateWorker_RequiresSignedContract`, `CalculatePayroll_UsesOnlyApprovedTimesheets`, `CalculatePayroll_ExcludesInactiveWorkers`
- Integration tests (WebApplicationFactory): cross-tenant access returns 403, unauthorized role returns 401, workflow transition rejected when preconditions unmet
- Test data builders for readable setup

**War Story Detail:**
The test that saved the most time in practice was the cross-tenant integration test. The test seeded two organizations, created a worker in each, logged in as an admin of org A, and tried to GET and PUT the org B worker. The first time I ran this test suite after wiring it up, it caught three endpoints that were missing tenant checks — all of them added after the original tenant isolation pass, by different engineers who didn't know the convention. The test didn't require them to know the convention; it just required them to not break the test. The cost of writing the test suite was maybe two hours. The cost of finding those three gaps in a security audit would have been much higher.

---

## 14. Background Job Boundary For Slow Work

**Elevator Version:**
> "I designed the API to handle slow or unreliable work asynchronously — validate and record intent synchronously, then let background processing do the heavy lifting with retries."

**Full Story:**
Invoice generation, document virus scanning, payroll provider submission, and notification sends are all operations that should not block the HTTP response. They're slow, they involve external calls, and they can fail in ways that should be retried, not surfaced to the user as a 500.

The pattern: the API endpoint validates the request and records the intent (creates a job record), returns a "202 Accepted" with a status polling URL, and exits. A background worker picks up the job, does the work, updates job status, and optionally notifies the user when done.

The important design constraints on the background work:
- Jobs must be idempotent: if the worker runs the same job twice (retry scenario), the second run should not create duplicate invoices or duplicate notifications
- Job status must be queryable: the API should have a way to check whether invoice generation is complete
- Failures should be logged with the job ID as a correlation key

**War Story Detail:**
The idempotency constraint came up when we had a processing node crash mid-job during a load test. The job had partially completed — it had called the invoice provider and received an invoice ID, but hadn't recorded the result before the crash. When the job was retried, it called the invoice provider again and created a duplicate invoice. The provider charged per invoice. We had to reconcile manually. After that, we added a two-phase design: first write the provider invoice ID to the job record (idempotency key), then mark the job complete. On retry, if an invoice ID already exists in the job record, skip the provider call and proceed to the completion step. That pattern — "write the external ID before marking complete" — prevents duplicate creation on retry.

---

## 15. Recovering From A Bad Release

**Elevator Version:**
> "When something breaks in production, my first move is to narrow the blast radius, not fix the code — understand what's affected before touching anything."

**Full Story:**
A release that changes a workflow rule or breaks a contract will affect users actively using the system. The priority is: understand the scope first, communicate second, fix third.

My incident triage order:
1. Confirm symptoms: what is broken, for which users, and since when?
2. Isolate the layer: is it frontend display, API contract, auth, query filtering, or service logic?
3. Reproduce with realistic data — not a unit test, a full request with production-like state
4. Identify the smallest safe rollback or fix
5. Add a regression test before shipping the fix
6. Write a short postmortem if the blast radius was meaningful

The regression test step is non-negotiable. If you fix without a test, the same bug can come back with the next change that touches the same code.

**War Story Detail:**
The most painful bad release I've seen was a migration that changed the JSON field name for worker status from `status` to `workerStatus` in the API response. The backend change was correct — the new name was more explicit. But the React app was reading `worker.status` everywhere. Every worker status badge in the app showed "—" instead of ACTIVE or ONBOARDING. We didn't have parity tests at the time. The discovery was a Slack message from a client admin during a board demo saying "all our workers show as blank." The fix took 20 minutes. The contract inventory + parity test approach I described in story 5 was added to our process directly as a result of this incident.

**C#/.NET to use:**
```csharp
logger.LogWarning(
    "Payroll calculation failed for run {PayrollRunId} by user {UserId}: {ErrorMessage}",
    runId,
    actor.Id,
    ex.Message);
```

---

## 16. Improving API Response Shapes

**Elevator Version:**
> "I moved API responses from raw entity shapes to explicit DTOs — the main benefit was decoupling the frontend from our database internals and reducing over-fetching."

**Full Story:**
The early API returned ORM entities directly. That's fast to build but creates long-term problems: any database change can break the frontend, related entities are included unpredictably depending on EF Core loading state, and list endpoints return far more fields than the list view needs.

I introduced explicit DTO records for list responses and detail responses. List DTOs contained only the fields a list view needs (id, name, status, country). Detail DTOs contained the full view. The mapping happened at the query layer — EF Core `Select()` projections — so the database never loaded more than what the DTO needed.

The secondary benefit: I could change a column name in the database without changing the API response, because the projection translated between them. And I could add computed fields to the DTO (like `fullName = firstName + " " + lastName`) without adding a column to the database.

**War Story Detail:**
The over-fetching problem was most visible when a support engineer added a "quick lookup" feature — an endpoint that returned a worker by employee number. He used the existing worker detail endpoint. That endpoint included the worker's full employment record, all onboarding tasks, all documents, and the org record through navigation properties. The quick lookup feature was triggering a query that loaded potentially hundreds of related records just to display a name and status. We caught it during a load test. The fix was a dedicated lookup DTO with a projection that fetched exactly three fields. Response time went from ~300ms to ~20ms.

**C#/.NET to use:**
```csharp
public sealed record WorkerListItemDto(
    string Id,
    string FullName,
    string JobTitle,
    string CountryCode,
    WorkerStatus Status);

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

---

## 17. Build Versus Buy For Payroll And Compliance

**Elevator Version:**
> "For a global employment product, you should own the workflow and the customer experience, and buy the legally sensitive payroll calculation and compliance rules from a provider — the risk of getting that boundary wrong is enormous."

**Full Story:**
There's a temptation in HR/payroll products to build everything: calculate taxes, compute statutory benefits, generate legal contracts. The product becomes more differentiated if it handles more.

The problem is that employment law changes, varies by country, and is the kind of thing that creates legal liability if wrong. A tax calculation that's off by a percentage in Germany isn't a bug — it's potentially a compliance violation.

My position: the product should own workflow orchestration, approvals, auditability, and customer experience. Legal payroll calculation, tax withholding, statutory benefits, and country-specific compliance rules should be sourced from specialized providers who maintain those rules as their core product. The app calls the provider; the provider owns the legal correctness.

To make this clean in code, I hide provider logic behind an interface. Swapping providers, adding retry logic, and handling provider failures happen behind the interface, invisible to the rest of the app.

**War Story Detail:**
The moment this framing clicked was when I was asked to add Portugal to the list of supported countries. Portugal has specific rules about how overtime is calculated, what counts as a 13th/14th salary month, and how termination payments are computed. Encoding all of that accurately would have required reading Portuguese employment law, cross-referencing with a labor attorney, and testing with real payroll data. That's a six-week project for one country. A provider that already supports Portugal could be integrated in a week. The build-vs-buy question answered itself.

**C#/.NET to use:**
```csharp
public interface IPayrollProvider
{
    Task<PayrollQuote> PreviewAsync(PayrollPreviewRequest request);
    Task<PayrollSubmissionResult> SubmitAsync(PayrollSubmission request);
}
```

---

## 18. Refactoring While Maintaining Backward Compatibility

**Elevator Version:**
> "I refactor by protecting behavior first — document the external contract, add tests around high-risk behavior, then change internals without changing the contract."

**Full Story:**
Refactoring and migration are different. Refactoring changes internal structure. Migration changes behavior. A refactor that accidentally changes behavior is a migration with no announcement.

My sequence:
1. Document the existing contract: routes, response shapes, status codes, enum values, auth behavior
2. Add characterization tests — tests that document current behavior, even if that behavior isn't ideal
3. Move logic into services without changing behavior
4. Add tests for previously untested edge cases
5. Clean up internals
6. Only then consider API contract changes, which should be versioned

The characterization tests are the safety net. They're not testing ideal behavior — they're asserting "this is what currently happens." If a refactor breaks a characterization test, something changed that a consumer might depend on.

**War Story Detail:**
The most important characterization test we wrote captured an undocumented behavior: the worker list endpoint returned workers sorted by `createdAt` descending. No documentation. No explicit order clause. It just happened to work that way because of how EF Core materialized the result. The React UI was rendering them in that order and the team had started to rely on it. When I added an explicit `OrderBy` for performance (to use an index), I changed the order — alphabetically by last name, which the index supported. The frontend broke in a subtle way: the "most recently added workers" that the client admin expected at the top of the list were now sorted alphabetically. The characterization test caught it. The fix was to restore the `OrderByDescending(w => w.CreatedAt)` and add the index on `CreatedAt` instead.

---

## Quick Practice Order

These five stories cover the widest interview surface — practice them first:

1. Service layer over fat controllers (architecture + risk reasoning)
2. Preventing cross-tenant data leaks (security + testing discipline)
3. Deterministic payroll calculation (complex workflow + financial correctness)
4. Migration without breaking API contracts (technical judgment + backward compatibility)
5. Disagreement about architecture scope (technical influence + communication)

Then add:

6. Risk-based testing plan (engineering maturity)
7. Dashboard performance and query shape (performance + database knowledge)
8. Audit logging for sensitive workflows (product thinking + reliability)
9. Date boundary bug (precision + debugging discipline)
10. Build vs buy for payroll/compliance (architectural breadth)
