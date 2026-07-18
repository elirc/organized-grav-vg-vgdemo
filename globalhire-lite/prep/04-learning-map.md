# C#/.NET Learning Map

This learning map is tailored to an interview for a C#/.NET role involving a codebase like GlobalHire Lite.

## Phase 1: Speak The Basics

Goal:

Be able to read and discuss a C# API without freezing on syntax.

Learn:

- Classes, records, interfaces, enums.
- Nullable reference types.
- `async` / `await` and `Task<T>`.
- LINQ basics: `Where`, `Select`, `FirstOrDefault`, `Any`, `Sum`.
- Dependency injection.

Practice:

- Read `migrated-dotnet/src/GlobalHireLite.Api/Domain/Entities.cs`.
- Read `migrated-dotnet/src/GlobalHireLite.Api/Services/PayrollService.cs`.
- Explain why `decimal` is used for payroll math.

Interview answer:

> C# gives me stronger runtime and compile-time structure than JavaScript. I pay attention to nullable values, enums for workflow states, and async APIs for I/O.

## Phase 2: Understand ASP.NET Core

Goal:

Explain how requests move through a .NET API.

Learn:

- `Program.cs` startup.
- Middleware pipeline.
- Minimal APIs vs controllers.
- Built-in dependency injection.
- CORS.
- Cookies and auth.
- JSON serialization.

Practice:

- Read `migrated-dotnet/src/GlobalHireLite.Api/Program.cs`.
- Count route groups.
- Trace `/api/payroll-runs/{id}/calculate`.

Interview answer:

> ASP.NET Core has the same pipeline idea as Express, but more framework support around DI, auth, configuration, and middleware.

## Phase 3: Learn EF Core Concepts

Goal:

Talk about how the in-memory demo would become a database-backed app.

Learn:

- `DbContext`.
- `DbSet<T>`.
- Entity relationships.
- `Include`.
- Migrations.
- Transactions.
- LINQ queries.

Practice:

Rewrite this mental model:

```text
InMemoryGlobalHireStore.Workers
```

as:

```text
db.Workers
```

Then imagine:

```csharp
await db.Workers
    .Where(worker => worker.OrganizationId == organizationId)
    .Include(worker => worker.Employment)
    .ToListAsync();
```

Interview answer:

> The migration scaffold uses in-memory data for demo speed, but in production I would introduce EF Core entities, DbContext, migrations, indexes, and transactional writes.

## Phase 4: Authorization And Multi-Tenancy

Goal:

Answer security questions confidently.

Learn:

- Authentication vs authorization.
- Role-based authorization.
- Policy-based authorization.
- Claims.
- Tenant scoping.
- Cross-tenant tests.

Practice:

Explain these roles:

- `PLATFORM_ADMIN`
- `EOR_SPECIALIST`
- `CLIENT_ADMIN`
- `CLIENT_MANAGER`
- `WORKER`

Then answer:

> Can a worker see another worker's payroll item?

Best answer:

> No. The backend should load the actor context and scope worker-related data either to the worker's own id or to the actor's organization, depending on role.

## Phase 5: Business Rules And Testing

Goal:

Show that you know where domain logic belongs.

Learn:

- Unit tests for service logic.
- Integration tests for API authorization.
- Invalid state transition tests.
- Test data builders.

Practice:

Write test names verbally:

- `CalculatePayroll_RejectsNonDraftRun`
- `CalculatePayroll_UsesOnlyApprovedTimesheets`
- `ActivateWorker_RequiresSignedContract`
- `WorkerList_DoesNotReturnOtherOrganizationWorkers`

Interview answer:

> I focus tests on the rules that could create financial, security, or workflow correctness problems.

## Phase 6: Production Readiness

Goal:

Discuss tradeoffs maturely.

Learn:

- Structured logging with `ILogger`.
- OpenTelemetry basics.
- Health checks.
- Secrets/configuration.
- Background jobs.
- Database indexes.
- Decimal money types.
- Audit log design.

Interview answer:

> For a real EOR product, I would prioritize correctness, tenant isolation, auditability, and observability before adding broad feature surface area.

## Seven-Day Prep Plan

Day 1:

- Read this prep folder.
- Practice the core interview angle in `README.md`.

Day 2:

- Read the migrated .NET domain files.
- Explain each entity in one sentence.

Day 3:

- Read `Program.cs`.
- Trace five routes out loud.

Day 4:

- Study `WorkerService`.
- Practice the onboarding and activation story.

Day 5:

- Study `PayrollService`.
- Practice the payroll calculation story.

Day 6:

- Study TypeScript-to-.NET translations.
- Practice answering "How will you ramp up in C#?"

Day 7:

- Mock interview yourself:
  - architecture overview
  - auth and RBAC
  - payroll
  - production hardening
  - one challenge story
