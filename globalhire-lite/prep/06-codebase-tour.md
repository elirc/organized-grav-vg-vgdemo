# Codebase Tour

This tour focuses on the migrated .NET/React folder and how it relates to the original TypeScript codebase.

## Root Structure

```text
globalhire-lite/
  apps/                  original TypeScript apps, now commented out
  packages/              original shared TypeScript package, now commented out
  docs/                  original learning and architecture notes
  migrated-dotnet/       new C#/.NET and React migration
  prep/                  interview prep material
```

## Migrated .NET Structure

```text
migrated-dotnet/
  GlobalHireLite.sln
  README.md
  src/
    GlobalHireLite.Api/
      Program.cs
      Contracts/
      Domain/
      Infrastructure/
      Services/
    GlobalHireLite.Web/
      src/
        App.tsx
        api.ts
        main.tsx
        styles.css
```

## API Files

### `Program.cs`

Owns:

- Service registration.
- JSON enum serialization.
- CORS.
- Route registration.
- Auth cookie handling.
- Endpoint handlers.

How to explain:

> This is an ASP.NET Core minimal API. It plays the role that `app.ts` and the Express routers played in the TypeScript version.

### `Domain/Enums.cs`

Owns:

- Roles.
- Worker statuses.
- Workflow statuses.
- Payroll and invoice statuses.

How to explain:

> The domain uses enums for constrained workflow states, which makes invalid values harder to pass around than raw strings.

### `Domain/Entities.cs`

Owns:

- Main domain records: User, Organization, Worker, Employment, PayrollRun, and related workflow entities.

How to explain:

> These records are the C# equivalent of the Prisma model plus TypeScript domain shapes. In a production EF Core version, these would likely become EF entities with relationships.

### `Contracts/Requests.cs`

Owns:

- Request DTOs for login, worker creation, payroll creation, leave requests, timesheets, documents, and offboarding.

How to explain:

> Request DTOs replace the role that Zod schemas played in TypeScript: they define the expected input shape. Production validation could use data annotations or FluentValidation.

### `Infrastructure/InMemoryGlobalHireStore.cs`

Owns:

- Seeded demo data.
- In-memory collections for all entities.

How to explain:

> This keeps the migration runnable without Postgres or Prisma. The next production step would be EF Core with a DbContext and migrations.

### `Services/WorkerService.cs`

Owns:

- Worker listing scoped to the actor.
- Worker detail access.
- Worker creation.
- Worker update.
- Worker activation business rules.

How to explain:

> This service is where worker lifecycle rules live. It keeps endpoint handlers from owning business logic.

### `Services/PayrollService.cs`

Owns:

- Payroll run creation.
- Payroll calculation.
- Approval.
- Locking.
- Payroll item aggregation.

How to explain:

> This is the clearest business-rule service. It includes active workers only, approved timesheets only, decimal money math, and explicit status transitions.

### `Services/DashboardService.cs`

Owns:

- Role-aware dashboard summaries.

How to explain:

> Dashboard data is derived from existing workflow records. It should not create new business truth.

### `Services/AuthorizationService.cs`

Owns:

- Simple role and organization checks.

How to explain:

> In production I would likely move toward ASP.NET Core authorization policies, but this service makes the migration's access rules visible.

## Web Files

### `src/api.ts`

Owns:

- Fetch wrapper.
- API methods.
- Cookie credentials.

How to explain:

> This is the frontend boundary with the backend. It keeps endpoint URLs out of page components.

### `src/App.tsx`

Owns:

- Routes.
- Login.
- App shell.
- Dashboard.
- Workers.
- Worker detail.
- Payroll.
- Resources.

How to explain:

> The migrated frontend is intentionally compact. It demonstrates the main workflows without recreating every original page one-to-one.

### `src/styles.css`

Owns:

- Layout and visual styling.

How to explain:

> Styling is not the main interview topic here. The important part is that the UI gives a path to exercise the API workflows.

## Original Codebase Relationship

The original code was organized as:

```text
apps/api       Express + Prisma + TypeScript
apps/web       React + Vite + TypeScript
packages/shared Zod schemas and shared constants
```

The migration maps that to:

```text
GlobalHireLite.Api       ASP.NET Core minimal API + C# services
GlobalHireLite.Web       React + Vite frontend
```

The old files were not deleted. They were commented out with `MIGRATION_NOTE` markers.

## What To Say In An Interview

High-level:

> I know this kind of domain from TypeScript work: multi-tenant HR workflows, role-based access, lifecycle state, and payroll-style calculations. I have been translating those patterns into .NET by using ASP.NET Core endpoints, C# domain models, service classes, dependency injection, and typed request contracts.

Technical:

> The migrated API keeps endpoints thin and moves worker and payroll rules into services. The next step would be replacing the in-memory store with EF Core and adding integration tests around tenant isolation and workflow transitions.

Production:

> I would harden authorization policies, move persistence to EF Core/Postgres or SQL Server, use transactions for multi-entity writes, add structured logging, and expand audit coverage.
