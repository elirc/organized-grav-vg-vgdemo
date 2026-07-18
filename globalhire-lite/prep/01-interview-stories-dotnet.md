# Interview Stories For C#/.NET Roles

These are story templates. Adjust the details so they are true to your actual experience. The strongest framing is: "I did this kind of work in TypeScript, and I understand how I would express it in .NET."

## Story 1: Multi-Tenant Worker Access

Prompt:

> Tell me about a time you worked on authorization or access control.

Situation:

> In a global employment platform, different users needed different access: platform operators could see multiple clients, client admins could see only their organization, and workers could see only their own records.

Task:

> I needed to make sure the API enforced tenant boundaries, not just the UI.

Action:

> I treated organization scope as a backend rule. The request loaded the current user, identified their role and organization, and then every worker/payroll query was filtered by that actor. For example, a worker list query was not just "get all workers"; it was "get workers visible to this actor." In a .NET API, I would implement the same pattern with ASP.NET Core middleware or endpoint filters to identify the user, then service methods that accept the actor and apply organization scoping before querying data.

Result:

> This made access rules explicit and testable. It also reduced the chance that a frontend navigation change would accidentally expose data.

C#/.NET language to use:

- "ASP.NET Core middleware can hydrate the current user."
- "Authorization policies are a cleaner production version of ad hoc role checks."
- "Service methods should accept actor context so tenant scoping is applied close to business logic."
- "I would test cross-tenant access with integration tests."

## Story 2: Worker Lifecycle And Onboarding

Prompt:

> Describe a business rule you had to model.

Situation:

> A worker could not become active until onboarding was complete.

Task:

> I needed to protect that state transition so a user could not activate a worker too early.

Action:

> I modeled the worker lifecycle with explicit statuses: ONBOARDING, ACTIVE, OFFBOARDING, TERMINATED. Activation checked three things: the worker was currently ONBOARDING, all required onboarding tasks were approved, and the employment contract was signed. That logic belonged in the backend service layer, not in the React button.

Result:

> The rule became easy to explain and test. The UI could show progress, but the API remained the source of truth.

C#/.NET language to use:

- "I would represent statuses with enums."
- "I would keep the transition rule in a WorkerService or domain service."
- "Request DTOs should not be trusted to set arbitrary state transitions."
- "Unit tests should cover invalid transitions, not just happy paths."

Possible C# sketch:

```csharp
if (worker.Status != WorkerStatus.ONBOARDING)
{
    throw new InvalidOperationException("Only onboarding workers can be activated.");
}

if (worker.OnboardingTasks.Any(task => task.Required && task.Status != OnboardingTaskStatus.APPROVED))
{
    throw new InvalidOperationException("Required onboarding tasks must be approved.");
}
```

## Story 3: Payroll Calculation

Prompt:

> Tell me about a complex calculation or workflow.

Situation:

> Payroll preview depended on workers, employment terms, country rules, approved timesheets, and the payroll period.

Task:

> I needed payroll totals to be deterministic, auditable, and protected by status transitions.

Action:

> I kept payroll calculation in a backend service. It included only ACTIVE workers, used only APPROVED timesheets, applied country-specific tax and employer cost percentages, wrote payroll items, and updated the payroll run from DRAFT to CALCULATED. Approval and locking were separate transitions.

Result:

> This gave a clear audit trail and made bugs easier to trace because payroll logic lived in one place.

C#/.NET language to use:

- "Use decimal for money, not double."
- "Use transactions when writing payroll items and aggregate totals."
- "Keep calculation deterministic and idempotent when recalculating a draft."
- "Approval and lock should be explicit state transitions."

Possible C# sketch:

```csharp
var hourlyRate = employment.SalaryAmount / 160m;
var overtimePay = overtimeHours * hourlyRate * 1.5m;
var grossPay = employment.SalaryAmount + overtimePay;
var employeeTax = grossPay * countryRule.EmployeeTaxPercent;
```

## Story 4: Migrating Patterns From TypeScript To .NET

Prompt:

> You have less C# experience than TypeScript. How would you ramp up?

Situation:

> My prior full-stack work used TypeScript, Express, Prisma, Zod, and React. The role uses C# and .NET.

Task:

> I need to show that I understand the architecture and can learn the idioms.

Action:

> I map concepts deliberately. Express routes map to ASP.NET Core endpoints/controllers. Middleware maps to ASP.NET Core middleware and authorization policies. Zod schemas map to request DTOs plus validation. Prisma models map to EF Core entities and DbContext. TypeScript services map to C# services registered with dependency injection.

Result:

> That lets me ramp faster because I am not learning the whole problem space from zero. I am translating familiar architectural responsibilities into the .NET ecosystem.

C#/.NET language to use:

- "Dependency injection is built into ASP.NET Core."
- "Async/await is standard for I/O-bound API work."
- "Records are useful for immutable DTOs."
- "EF Core expresses relational data through DbSet and LINQ."

## Story 5: Debugging A Workflow Bug

Prompt:

> Tell me how you debug production issues.

Situation:

> A payroll total looked wrong.

Task:

> I needed to find whether the bug was in frontend display, API filtering, data state, or calculation logic.

Action:

> I traced the request from the UI button to the API endpoint to the service method. Then I checked the inputs: payroll period, worker statuses, employment records, country rules, approved timesheets, and previous payroll items. I separated display formatting from backend calculation.

Result:

> This narrowed the issue quickly and gave us a targeted fix instead of changing code blindly.

C#/.NET language to use:

- "I would inspect logs around the endpoint and service method."
- "I would add tests for the failing case before fixing the calculation."
- "In .NET, I would use structured logging with ILogger and correlation IDs."
- "I would verify the LINQ query filters before assuming the math is wrong."

## Story 6: Production Hardening

Prompt:

> What would you improve in this system?

Answer:

> I would harden tenant isolation, add authorization policies, use decimal/integer cents for money, move all workflow rules into services, add database constraints and indexes, improve audit logging, add integration tests, and introduce observability. For document handling, I would move from metadata-only records to object storage with virus scanning and access controls. For payroll, I would integrate with a real provider rather than pretending the app calculates legal payroll.

.NET-specific additions:

- Use ASP.NET Core authorization policies instead of scattered role checks.
- Use EF Core migrations for schema evolution.
- Use FluentValidation or data annotations for request validation.
- Use ILogger, OpenTelemetry, and health checks.
- Use background services or a job framework for long-running work.
