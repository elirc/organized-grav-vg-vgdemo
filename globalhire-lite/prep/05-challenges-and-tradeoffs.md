# Challenges And Tradeoffs In A .NET EOR Codebase

Use this file to prepare for "what could go wrong?" and "how would you improve it?" questions.

## Challenge 1: Tenant Isolation

Problem:

Multi-tenant HR systems store sensitive worker and payroll data. A small missing filter can leak another client's data.

What can go wrong:

- List endpoint filters by organization, but detail endpoint does not.
- Frontend hides links but API still returns data.
- Platform-level roles are over-broad.
- Tests do not cover cross-tenant access.

.NET solution language:

- Use ASP.NET Core authorization policies.
- Put tenant checks in services or query specifications.
- Add integration tests for every sensitive route.
- Consider database row-level security for high-risk data.

Interview line:

> In a multi-tenant employment platform, tenant isolation is not a UI concern. It has to be enforced in the backend and tested across list, detail, and mutation endpoints.

## Challenge 2: Workflow State Transitions

Problem:

Worker, onboarding, payroll, invoice, and offboarding states must move in allowed sequences.

What can go wrong:

- Payroll moves from DRAFT directly to LOCKED.
- Worker becomes ACTIVE before required tasks are approved.
- Offboarding completes without updating employment end date.
- Invoice is generated for an unapproved payroll run.

.NET solution language:

- Model statuses as enums.
- Keep transition logic in services.
- Reject invalid transitions with domain errors.
- Unit test valid and invalid transitions.

Interview line:

> I like explicit state transitions because they make business rules readable, testable, and auditable.

## Challenge 3: Money And Payroll Math

Problem:

Payroll-style calculations require careful numeric choices.

What can go wrong:

- Using binary floating point.
- Rounding inconsistently.
- Including unapproved timesheets.
- Recalculating locked payroll.
- Mixing currencies.

.NET solution language:

- Use `decimal` or integer minor units.
- Define rounding rules.
- Use transactions when replacing payroll items and totals.
- Prevent modifications to locked payroll.
- Store currency with every financial amount.

Interview line:

> Even for a payroll preview, I would treat financial calculations as backend-owned, deterministic, and covered by tests.

## Challenge 4: Validation Split

Problem:

Some validation is about shape; some is about business state.

Examples:

- Email format: request validation.
- Salary must be positive: request validation.
- Country rule must exist: service/domain validation.
- Payroll run must be DRAFT: service/domain validation.

.NET solution language:

- DTO validation for shape.
- FluentValidation or data annotations for simple rules.
- Service validation for database-dependent rules.
- ProblemDetails for consistent API errors.

Interview line:

> I separate request validation from domain validation so the code does not pretend a DTO can know current business state.

## Challenge 5: Audit Logging

Problem:

HR/payroll workflows need a history of who did what and when.

What can go wrong:

- Audit events are missing on important mutations.
- Audit records can be modified.
- Metadata is inconsistent.
- Logs are not correlated with requests.

.NET solution language:

- Central AuditService.
- Write audit events inside the same transaction as the business change.
- Use structured metadata.
- Add correlation IDs.
- Consider immutable append-only storage for sensitive events.

Interview line:

> For employee lifecycle and payroll workflows, auditability is part of correctness.

## Challenge 6: Route Logic Growing Too Large

Problem:

Small route handlers often accumulate business rules.

What can go wrong:

- Hard to test.
- Duplicate rules.
- Inconsistent authorization.
- Routes become difficult to read.

.NET solution language:

- Keep controllers/minimal endpoints thin.
- Move business rules to services.
- Use DI to compose services.
- Test services directly.

Interview line:

> Thin endpoints and tested services make the code easier to change without changing behavior accidentally.

## Challenge 7: EF Core Query Performance

Problem:

Relational domains can accidentally create slow queries.

What can go wrong:

- N+1 queries.
- Loading too much related data.
- Missing indexes on tenant or foreign-key fields.
- Filtering in memory instead of in SQL.

.NET solution language:

- Use LINQ carefully.
- Use `Include` intentionally.
- Project to DTOs for list views.
- Add indexes for `OrganizationId`, `WorkerId`, and date ranges.
- Inspect generated SQL for hot paths.

Interview line:

> I would keep list endpoints projection-focused and avoid loading full object graphs unless the page needs them.

## Challenge 8: React Cache Invalidation

Problem:

Frontend server-state can become stale after mutations.

What can go wrong:

- Worker detail shows old onboarding status.
- Payroll totals do not refresh after calculation.
- Dashboard counts lag behind actions.

Solution language:

- In TanStack Query, invalidate affected queries after mutations.
- Keep API response shapes predictable.
- Prefer backend truth over local optimistic assumptions for high-risk workflows.

Interview line:

> For payroll and workflow state, I would rather refetch authoritative backend state than rely on optimistic frontend math.

## Challenge 9: Migration Risk

Problem:

Moving from TypeScript/Node to C#/.NET can preserve bugs or introduce new ones.

What can go wrong:

- Different JSON serialization names.
- Date handling changes.
- Enum casing changes.
- Auth cookie behavior differs.
- ORM query behavior differs.

.NET solution language:

- Add contract tests for important API responses.
- Preserve route names and response shapes during migration.
- Test date boundaries.
- Verify cookie/CORS behavior with the browser.
- Add side-by-side parity tests for business services.

Interview line:

> I would migrate by preserving externally visible behavior first, then improving internals once parity is proven.
