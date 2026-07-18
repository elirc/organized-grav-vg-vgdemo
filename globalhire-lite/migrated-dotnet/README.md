# GlobalHire Lite .NET Migration

This folder contains the migrated C#/.NET implementation of the original TypeScript monorepo.

## Structure

- `src/GlobalHireLite.Api`: ASP.NET Core minimal API that mirrors the original Express routes.
- `src/GlobalHireLite.Web`: React/Vite frontend that calls the .NET API.

The API uses seeded in-memory data so it can run without Prisma or Postgres while the C# migration is taking shape.

## Run

Install the .NET SDK first. It was not available on this machine when the migration files were created.

```powershell
cd migrated-dotnet/src/GlobalHireLite.Api
dotnet run
```

In a second terminal:

```powershell
cd migrated-dotnet/src/GlobalHireLite.Web
npm install
npm run dev
```

Demo login:

- `admin@globalhire.test`
- `password123`

## Tests

The migrated API has an xUnit test project for service-level business rules.

```powershell
cd migrated-dotnet
dotnet test
```

Covered areas include worker activation gates, tenant-scoped worker listing, payroll period validation, duplicate payroll run prevention, payroll calculation inputs, and payroll approval/lock transitions.
