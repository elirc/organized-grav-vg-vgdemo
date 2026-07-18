# Interview Stories For C#/.NET Roles — Enhanced Edition

These are story frameworks for C#/.NET interviews. Each one has three layers:
- **Quick Prompt Response** — the one-sentence version to orient the interviewer
- **Full Story** — the STAR-shaped narrative to walk through
- **War Story Detail** — the specific concrete color that makes it sound real and rehearsed

The rule of thumb: start with the Quick Prompt Response, then move into the Full Story, then let the Deeper Technical Detail out only if the interviewer probes. Most interviewers stop probing after the full story. If they push, that's a good sign.

---

## Story 1: Multi-Tenant Worker Access

**Prompt this answers:**
- "Tell me about a time you worked on authorization or access control."
- "How do you prevent data leaks in a multi-tenant system?"
- "What security concern would you look for in this kind of app?"

---

**Quick Prompt Response:**

> "I worked on an HR platform where different users needed fundamentally different views of the data — platform admins, client org admins, and individual workers — and the challenge was making sure those boundaries lived in the backend, not just the UI."

---

**Full Story (STAR):**

**Situation:** We had a global employment platform where the same API served multiple types of users: platform operators who managed multiple client organizations, client admins who could only see their own org's workers and payroll, and workers who could only see their own profile. The first version was working, but tenant boundaries were partly enforced through frontend navigation — if a client admin guessed a worker ID from another org, the detail endpoint would still return it.

**Task:** I needed to make the API enforce tenant rules itself, not rely on the UI to hide the right links. This mattered especially for payroll and personal data.

**Action:** I introduced the concept of an "actor context" — the API always resolved who was making the request (their ID, role, and org ID) before any data query ran. Then every service method for workers or payroll took that actor context and applied a scope rule before touching the database. A worker list for a client admin was not "get all workers" — it was "get workers where OrganizationId equals actor.OrganizationId." For detail endpoints I added an explicit ownership check: after loading the worker, verify the worker's org matches the actor's org, or throw a 403. For workers viewing their own profile, I added a separate check that the requested worker ID matched the actor's own worker ID.

**Result:** The cross-tenant risk went from "UI-only protection" to "enforced at the service layer with testable rules." We added integration tests that seeded two organizations, then tried to access org B's workers as an org A admin, and confirmed a 403 came back instead of data. That test suite also caught a bug we hadn't noticed: the timesheet detail endpoint was missing the tenant check even though the list endpoint had it.

**Reflection:** If I were doing this in .NET from the start, I would use a CurrentUser object hydrated in middleware and accepted by every service method, plus authorization policies for role-level checks and service-level query scoping for record-level checks. I would also write the integration test for cross-tenant access before writing the feature code — that constraint makes the right design obvious.

---

**War Story Detail (use if probed):**

The bug we found during the tenant isolation pass was a good example of how this kind of risk hides. The worker list endpoint had the org filter. But there was a separate "worker detail by employee number" endpoint that a client admin could use to look up a worker before sending a contract amendment. That endpoint was added later by a different person and had only a role check ("is this a client admin?") but not a tenant check ("is this worker in the client admin's org?"). A determined client admin could enumerate employee numbers and get details on workers outside their org. We caught it because the integration test we added was systematic — it tested every endpoint that accepted a worker ID, not just the ones we thought might have the bug.

**C#/.NET language to use when telling this:**
- "I would hydrate the current user in ASP.NET Core middleware using claims from the JWT or session."
- "Authorization policies handle role-level gates; service-layer query scoping handles record-level ownership."
- "I use `WebApplicationFactory` integration tests to test cross-tenant access with two seeded organizations."
- "The pattern I prefer is passing `CurrentUser actor` into every service method so the scoping rule is close to the query."

---

## Story 2: Worker Lifecycle And State Machine

**Prompt this answers:**
- "Describe a business rule you had to model in code."
- "Tell me about a time you protected data integrity."
- "How do you handle state transitions in a domain model?"

---

**Quick Prompt Response:**

> "I modeled a worker lifecycle as an explicit state machine — ONBOARDING, ACTIVE, OFFBOARDING, TERMINATED — and put the transition guard logic in the service layer so the UI couldn't bypass it."

---

**Full Story (STAR):**

**Situation:** We had a worker management system where a worker went through onboarding before they could be activated and start showing up in payroll. The original version had some guards, but they were scattered — a React button was disabled if onboarding wasn't done, and there was a backend check, but it was a soft warning, not an enforcement. Someone discovered you could call the API directly and activate a worker who hadn't completed required tasks or signed their contract.

**Task:** My job was to make activation enforce its own preconditions at the service layer, regardless of what the frontend did.

**Action:** I made the lifecycle explicit with an enum: `ONBOARDING`, `ACTIVE`, `OFFBOARDING`, `TERMINATED`. The activation service method checked three things in order: the worker's current status was `ONBOARDING` (anything else threw an exception), all required onboarding tasks had status `APPROVED` (optional tasks didn't block), and the employment contract was signed. If any check failed, we returned a structured error that the UI could display. The transition rules were the source of truth; the UI showing a disabled button was just a convenience.

**Result:** We could now write unit tests for each activation precondition independently. The tests caught two edge cases we hadn't thought about: a worker whose required tasks were all approved but whose contract was missing because it was uploaded to the wrong document slot, and a worker who was accidentally `OFFBOARDING` rather than `ONBOARDING` due to a data migration error. Both would have slipped through the old soft-check approach.

**Reflection:** I would extend this pattern to the offboarding transition too — offboarding shouldn't be completable until final timesheets are submitted and payroll is settled. And I'd add a transition history table so you can see when a worker moved between states and who triggered it.

---

**War Story Detail (use if probed):**

The contract-missing edge case was interesting because it revealed a UX problem in addition to a code problem. The onboarding checklist showed "contract signed: yes" because a document had been uploaded under a different category. The activation check I added looked for a document of type `EMPLOYMENT_CONTRACT` with status `SIGNED` specifically, and it failed on this worker. When I dug into it, the onboarding coordinator had uploaded the contract under "Other Documents" because the contract upload slot wasn't clearly labeled in the UI. So the service-layer check actually surfaced a UI labeling problem we might not have caught otherwise. Fixing the rule fixed the data quality issue too.

**C#/.NET language to use:**
- "I would model statuses with an enum and keep the transition rule in a WorkerService or domain service."
- "Request DTOs should not be trusted to set arbitrary status values directly — only explicit transition methods."
- "Unit tests should cover invalid transitions — wrong starting status, missing tasks, unsigned contract — not just the happy path."
- "I would store a transition history for audit and debugging."

**Possible C# sketch:**
```csharp
public async Task ActivateWorkerAsync(CurrentUser actor, string workerId)
{
    var worker = await GetWorkerForActorAsync(actor, workerId);

    if (worker.Status != WorkerStatus.Onboarding)
        throw new InvalidOperationException("Only workers in ONBOARDING status can be activated.");

    if (worker.OnboardingTasks.Any(t => t.Required && t.Status != OnboardingTaskStatus.Approved))
        throw new InvalidOperationException("All required onboarding tasks must be approved.");

    if (!worker.Employment.ContractSigned)
        throw new InvalidOperationException("Employment contract must be signed before activation.");

    worker.Status = WorkerStatus.Active;
    worker.ActivatedAt = DateTimeOffset.UtcNow;
    await audit.RecordAsync(actor, "WORKER_ACTIVATED", worker.Id);
    await db.SaveChangesAsync();
}
```

---

## Story 3: Deterministic Payroll Calculation

**Prompt this answers:**
- "Tell me about a complex calculation or workflow."
- "How do you handle financial data safely?"
- "Tell me about making something auditable."

---

**Quick Prompt Response:**

> "I designed a payroll calculation service that was deterministic, transactional, and protected by explicit status transitions — the goal was that every result should be explainable by its inputs."

---

**Full Story (STAR):**

**Situation:** The payroll preview feature was popular with clients because it let them see projected costs before approving payroll. But the calculation lived partly in the frontend — the React app was summing hours and applying a hardcoded rate it received from the API. That meant the displayed total could be different from the backend total if the user had stale data, or if the country rule changed between sessions.

**Task:** I needed to move the authoritative calculation to the backend service layer, make it deterministic, and tie it to explicit status transitions so the workflow was traceable.

**Action:** I built a `PayrollCalculationService` that owned the entire computation. It accepted a payroll run in `DRAFT` status, loaded only `ACTIVE` workers, pulled only `APPROVED` timesheets within the payroll period, fetched country rules by country code, and computed gross pay, employer costs, and employee tax estimates using `decimal` arithmetic. It wrote individual `PayrollItem` records for each worker, updated aggregate totals on the `PayrollRun`, and moved the run status from `DRAFT` to `CALCULATED`. The whole operation was wrapped in a database transaction so partial writes couldn't leave the run in a broken state.

**Result:** The frontend could now just display what the backend calculated and approved. Auditors could trace any payroll total back to the specific workers, timesheets, and country rules that were used. When a calculation looked wrong, we could isolate whether it was a bad timesheet, wrong employment term, or missing country rule — instead of debugging shared frontend state.

**Reflection:** The biggest improvement I'd make now is idempotency. If the calculate endpoint is called twice on the same draft run, the second call should delete and rewrite the payroll items atomically rather than doubling them. That wasn't a bug we hit, but it's the kind of thing you want to be explicit about before going to production.

---

**War Story Detail (use if probed):**

There was a country rule edge case that took us a while to find. One country had different employer cost rates for workers above and below a statutory income threshold. Our initial model had a single `EmployerCostPercent` per country rule. The calculation was technically correct for most workers but wrong for high earners in that country. We found it during a client demo when an EOR specialist noticed the employer cost for a senior consultant looked too low. Fixing it meant adding a tiered rate structure to the country rule model and updating the calculation to check which tier applied. The lesson was that financial rules always have more edge cases than the happy path suggests, and it's worth asking "are there thresholds or exceptions?" when modeling a new country.

**C#/.NET language to use:**
- "Use `decimal` for money — never `double` or `float`."
- "Wrap payroll item writes and aggregate total updates in a database transaction."
- "Make the calculation idempotent so recalculating a draft is safe."
- "Approval and lock should be separate, explicit status transitions after calculation."

**Possible C# sketch:**
```csharp
var hourlyRate = employment.SalaryAmount / 160m;
var overtimePay = overtimeHours * hourlyRate * 1.5m;
var grossPay = employment.SalaryAmount + overtimePay;
var employerCost = grossPay * countryRule.EmployerCostPercent;
var employeeTax = grossPay * countryRule.EmployeeTaxPercent;
var netPay = grossPay - employeeTax;
```

---

## Story 4: Migrating From TypeScript To .NET

**Prompt this answers:**
- "You have less C# experience than TypeScript. How would you ramp up?"
- "Tell me about learning a new stack quickly."
- "How do you apply skills across technology stacks?"

---

**Quick Prompt Response:**

> "I approach a stack transition by mapping architectural responsibilities first — I already understand what the layers need to do, so I'm learning idioms, not concepts from scratch."

---

**Full Story (STAR):**

**Situation:** My production work has been in TypeScript — Express/Node APIs, Prisma for ORM, Zod for validation, React on the frontend. The role I was interviewing for uses C# and ASP.NET Core. I didn't have deep .NET production experience, but I understood the architecture well enough to translate it deliberately.

**Task:** I needed to demonstrate that I could be effective quickly, and that my TypeScript experience would transfer — not be a liability.

**Action:** I built a concrete translation map:

| TypeScript/Node concept | .NET equivalent |
|---|---|
| Express route handler | ASP.NET Core endpoint or controller action |
| Express middleware | ASP.NET Core middleware, filters, policies |
| Zod schema | Request DTO plus FluentValidation or data annotations |
| Prisma model | EF Core entity |
| Prisma client | DbContext |
| Service function | Injected service class |
| Vitest unit test | xUnit or NUnit test |
| Supertest integration test | WebApplicationFactory + HttpClient |

Then I read through an ASP.NET Core tutorial not to "learn the framework" but specifically to answer: how does dependency injection work, how does middleware chain, how does EF Core query building compare to Prisma, and how does async/await behave. Those were the four things I needed to be dangerous. I also built a small proof-of-concept API that reproduced the worker activation flow from my existing work.

**Result:** By the time I was practicing for interviews, I could speak about both stacks and explain the translation clearly. I wasn't pretending to have years of C# production experience — I was showing that I understood the architecture and had a concrete ramp plan.

**Reflection:** The most useful thing I did was build the small POC. Reading docs gives you vocabulary. Building something forces you to hit the actual friction points — and those friction points are what the interviewer is really asking about when they probe.

---

**War Story Detail (use if probed):**

The friction point I hit in the POC was EF Core's tracking behavior. In Prisma, you query, get a plain object, mutate it, and call `update()` explicitly. In EF Core, by default the entity you load is tracked, and `SaveChangesAsync()` detects changes automatically. That's a different mental model, and if you're not careful you can accidentally update things you didn't mean to update. I had a case in the POC where loading a worker to check their status also loaded their employment through a navigation property, and a downstream calculation modified a field on the employment object, which got saved as a side effect. Learning about `AsNoTracking()` and being deliberate about when to track and when not to track was the sharpest learning moment of the whole exercise.

**C#/.NET language to use:**
- "Dependency injection is a first-class feature of ASP.NET Core — services, repositories, and DbContext all registered in `Program.cs`."
- "Async/await is standard for all I/O-bound work."
- "Records are a clean way to define immutable DTOs."
- "I find EF Core LINQ queries natural coming from Prisma, though the tracking model has different defaults."

---

## Story 5: Debugging A Financial Calculation Bug

**Prompt this answers:**
- "Tell me how you debug production issues."
- "Tell me about the hardest bug you solved."
- "How do you isolate a problem under pressure?"

---

**Quick Prompt Response:**

> "A payroll total looked wrong. I traced the calculation from the UI display back to the API input parameters, then to the service logic, and found the bug was in the data state — not the math."

---

**Full Story (STAR):**

**Situation:** An EOR specialist ran payroll preview for a client and the gross total looked about 15% lower than expected for one worker. The number wasn't obviously wrong — no zero, no obviously wrong decimal — it was just slightly off. That's the harder kind of bug because you can't tell at a glance whether it's a display issue, a rounding problem, or a data issue.

**Task:** I needed to find the root cause without touching production data, and without a reproducible unit test yet.

**Action:** I started at the UI — what was being displayed matched exactly what the API was returning, so it wasn't a frontend formatting issue. I checked the API response for that worker's payroll item: the hours worked were correct, the employment salary amount was correct, but the overtime multiplier was 1.0 instead of 1.5. I traced back to where overtime was calculated: the timesheet had 48 hours logged for the week, and the employment type was marked as "full-time exempt." The country rule for that country had a flag `overtimeEligible: false` for exempt workers — except this worker had been reclassified from exempt to non-exempt last month, and the employment record was updated, but the cached country rule snapshot on the payroll run still had the old exemption flag from when the draft was first created. The fix was to refresh country rules from the source at calculation time rather than caching them on draft creation.

**Result:** We fixed the calculation, added a unit test for the overtime-eligible vs exempt case, and updated the documentation for the draft creation flow. The bug was small in dollars but important to catch because it was the kind of error that could compound across many workers.

**Reflection:** The key lesson was: separate your hypotheses before you start changing code. I had three competing theories — frontend display issue, rounding error, wrong input data — and I eliminated them one at a time instead of jumping to a fix. That discipline kept the debugging session short.

---

**War Story Detail (use if probed):**

The reason the bug was hard to spot was that the payroll preview total was "close enough" for most workers — only workers with overtime who had been recently reclassified were affected. There were two such workers on the run. One of them happened to have no overtime that period, so they looked fine. Only the second one caught the eye of the EOR specialist because she knew that worker had clocked 10+ overtime hours. If she hadn't known the worker's history, we might not have caught it until payroll was approved.

**C#/.NET language to use:**
- "I would inspect structured logs around the endpoint, using correlation IDs to connect the frontend request to the service call."
- "I would write a failing test reproducing the exact worker/timesheet/country-rule combination before changing the code."
- "In .NET, I'd use `ILogger` with structured properties so I can grep logs for a specific worker or payroll run."
- "I'd verify the EF Core generated SQL to confirm the query was pulling the right records before assuming the calculation logic was wrong."

---

## Story 6: Production Hardening Discussion

**Prompt this answers:**
- "What would you improve in this system?"
- "How production-ready is this codebase?"
- "What risks do you see here?"

---

**Quick Prompt Response:**

> "I'd prioritize in order of blast radius: first tenant isolation tests, then financial calculation correctness, then observability, then API contract stability — each of those failures has a different kind of damage."

---

**Full Story (structured answer, not STAR):**

This kind of question rewards a risk-prioritized answer rather than a laundry list.

**Tier 1 — Security and data integrity (fix before production traffic):**
- Tenant isolation integration tests covering every endpoint that accepts a worker or payroll ID
- Replace scattered role checks with ASP.NET Core authorization policies
- Use `decimal` for all money fields — no `double`
- Add database constraints and unique indexes where the app assumes uniqueness

**Tier 2 — Correctness and auditability:**
- Move all workflow guard logic into service classes with unit tests
- Wrap multi-step writes (payroll calculation, offboarding completion) in transactions
- Add structured audit events for all workflow transitions
- Make payroll calculation idempotent (safe to recalculate a draft)

**Tier 3 — Observability and operability:**
- Add `ILogger` structured logging with correlation IDs
- Add OpenTelemetry tracing at service boundaries
- Add health check endpoints
- Add alerting for unexpected 5xx rates or slow endpoints

**Tier 4 — Architecture improvements:**
- Move document handling from metadata-only records to actual object storage (Azure Blob, S3) with access-controlled URLs
- Integrate a real payroll provider instead of demo calculation
- Add background job infrastructure for slow work like invoice generation

**C#/.NET language to use:**
- "ASP.NET Core authorization policies over scattered `if role == X` checks."
- "EF Core migrations for schema evolution — no raw schema changes."
- "FluentValidation or data annotations for request validation at API boundaries."
- "BackgroundService or a durable queue (Hangfire, Azure Service Bus) for retryable background work."
- "`WebApplicationFactory` integration tests for tenant isolation and workflow correctness."
