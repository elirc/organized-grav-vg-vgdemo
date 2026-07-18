# Testing

## Current Status

The original TypeScript tests still exist, but the TypeScript implementation was commented out during the C#/.NET migration. The active migrated test coverage now lives under:

- `migrated-dotnet/tests/GlobalHireLite.Api.Tests`

The migrated test project contains 10 xUnit service tests. These should be run with `dotnet test` after installing the .NET SDK.

## What Is Covered

Migrated .NET backend service tests cover:

- Worker activation fails when required onboarding tasks are incomplete.
- Worker activation fails when the employment contract is not signed.
- Worker activation succeeds when required onboarding tasks are approved and the contract is signed.
- Client admin worker lists are scoped to their organization.
- Payroll creation rejects invalid period ranges and duplicate runs.
- Payroll calculation includes only active workers and approved timesheets in the payroll period.
- Payroll approval and locking enforce status transitions.
- Payroll calculation and worker activation write audit events.

Backend business-rule tests cover:

- Worker activation fails when required onboarding tasks are incomplete.
- Worker activation succeeds when required tasks are approved and the contract is signed.
- Payroll calculation queries only active workers.
- Payroll calculation includes approved overtime only.
- Payroll cannot be approved before calculation.
- Locked payroll cannot be modified.
- Leave approval updates status and reviewer.

Frontend smoke tests cover:

- Login page renders demo login buttons.
- Workers page renders seeded-style worker rows.
- Onboarding page shows task status badges.
- Payroll detail page shows payroll totals.

## Run Tests

```bash
cd globalhire-lite
npm test
```

For migrated .NET tests, install the .NET SDK and run:

```bash
cd globalhire-lite/migrated-dotnet
dotnet test
```

## Why These Tests

The tests focus on business logic that would be costly to break in a real HR/payroll product: activation gates, payroll inclusion rules, approval transitions, and role-facing UI surfaces.

## Production Coverage To Add

- .NET API integration tests with `WebApplicationFactory`.
- Auth cookie/session tests for the migrated API.
- Invoice generation and invoice lifecycle tests for the migrated API.
- Offboarding transition tests, especially completion and worker termination.
- Leave and timesheet review endpoint tests.
- Dashboard authorization and aggregation tests.
- API integration tests against an isolated Postgres database.
- Authorization matrix tests for every role and tenant boundary.
- End-to-end tests for the full hire-to-invoice lifecycle.
- Validation tests for all create/update endpoints.
- Accessibility tests for core frontend workflows.
