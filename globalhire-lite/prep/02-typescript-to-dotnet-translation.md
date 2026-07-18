# TypeScript To C#/.NET Translation Guide

This guide maps your existing JavaScript/TypeScript mental model into .NET vocabulary.

## Big Picture

| TypeScript stack | C#/.NET equivalent | Interview language |
| --- | --- | --- |
| Express app | ASP.NET Core Web API | "HTTP routing, middleware, DI, auth, JSON endpoints" |
| Express route handler | Minimal API endpoint or controller action | "Thin endpoint calls service logic" |
| Express middleware | ASP.NET Core middleware / endpoint filters | "Cross-cutting request behavior" |
| `requireRole()` | Authorization policy / role attribute | "Declarative authorization" |
| Zod schema | DTO plus validation | "Request contract and validation" |
| Prisma schema | EF Core entities and DbContext | "Relational model and ORM mapping" |
| Prisma transaction | EF Core transaction / SaveChanges unit | "Atomic multi-table write" |
| TypeScript type | C# class, record, interface, enum | "Compile-time contract" |
| Service function | C# service class method | "Business logic boundary" |
| Vitest | xUnit, NUnit, or MSTest | "Unit and integration testing" |
| TanStack Query | Same React library can remain | "Server-state management" |

## Express App To ASP.NET Core

TypeScript shape:

```ts
app.use('/api', requireAuth);
app.use('/api/workers', workerRouter);
```

.NET shape:

```csharp
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/workers", async (WorkerService workers) =>
{
    return Results.Ok(await workers.ListAsync());
});
```

Interview point:

> In Express, I manually compose middleware and routers. In ASP.NET Core, the same request pipeline exists, but dependency injection, authentication, authorization, and endpoint routing are first-class framework features.

## Zod To DTO Validation

TypeScript shape:

```ts
const input = createWorkerSchema.parse(req.body);
```

.NET shape:

```csharp
public sealed record CreateWorkerRequest(
    string FirstName,
    string LastName,
    string Email,
    string CountryCode,
    decimal SalaryAmount);
```

Validation choices:

- Data annotations: simple built-in validation.
- FluentValidation: richer validation rules.
- Manual service validation: useful for domain rules that need database state.

Interview point:

> I separate syntactic validation from business validation. An email format check can live on the DTO. A rule like "country rule must exist" belongs in the service because it depends on current data.

## Prisma To EF Core

Prisma idea:

```ts
await prisma.worker.findMany({
  where: { organizationId },
  include: { employment: true }
});
```

EF Core idea:

```csharp
var workers = await db.Workers
    .Where(worker => worker.OrganizationId == organizationId)
    .Include(worker => worker.Employment)
    .ToListAsync();
```

Interview point:

> Prisma and EF Core both let application code express relational queries through strongly typed models. The .NET idiom is LINQ over DbSet, with Include for eager-loading relationships.

## TypeScript Union Constants To C# Enums

TypeScript:

```ts
export const payrollStatuses = ["DRAFT", "CALCULATED", "APPROVED", "LOCKED"] as const;
```

C#:

```csharp
public enum PayrollRunStatus
{
    DRAFT,
    CALCULATED,
    APPROVED,
    LOCKED
}
```

Interview point:

> Workflow status values should be explicit. In C#, enums are a natural fit, though in a public API I would also think about versioning and serialization names.

## Service Functions To Service Classes

TypeScript:

```ts
export const calculatePayrollRun = async (actor, id, db = prisma) => {
  // business rules
};
```

C#:

```csharp
public sealed class PayrollService
{
    public Task<PayrollRun> CalculateAsync(User actor, string id)
    {
        // business rules
    }
}
```

Interview point:

> C# tends to organize this as classes registered in DI. I still want the same boundary: endpoints stay thin; services own business behavior.

## Error Handling

TypeScript:

```ts
throw new ApiError(400, "Payroll can only be calculated from DRAFT");
```

.NET:

```csharp
throw new InvalidOperationException("Payroll can only be calculated from DRAFT");
```

Better production .NET options:

- Custom domain exception mapped by exception middleware.
- `ProblemDetails` responses.
- Result objects for explicit success/failure.

Interview point:

> I want predictable API error responses. In ASP.NET Core I would use exception middleware or filters to normalize domain errors into ProblemDetails.

## Async/Await

Your TypeScript async instincts transfer well:

- JavaScript: `await prisma.worker.findMany(...)`
- C#: `await db.Workers.ToListAsync()`

Important .NET phrasing:

> Async in ASP.NET Core is mostly about freeing threads during I/O. Database calls, HTTP calls, file storage, and queues should be async. CPU-heavy work should not be made async just for style.

## Money Types

TypeScript demo used `number`/Prisma `Float`.

C# should use:

```csharp
decimal grossPay = monthlySalary + overtimePay;
```

Interview point:

> For money, I would use decimal or integer minor units. I would avoid binary floating point for payroll totals.

## Good Bridge Sentence

> My TypeScript experience gives me the architecture and domain instincts. In .NET, I am translating those instincts into ASP.NET Core conventions: DI, middleware, typed DTOs, service classes, EF Core/LINQ, async APIs, and xUnit tests.
