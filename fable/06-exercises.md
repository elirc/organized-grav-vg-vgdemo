# 06 — Exercises Against This Codebase

Reading reviews doesn't build skill; fixing the code does. These exercises are ordered by
difficulty and target the live `.NET` implementation (plus the migrated web app) unless
noted. Each has acceptance criteria — treat them as the PR description you'd write.
Do them in order; later ones assume earlier ones.

**Before anything: Exercise 0.**

---

## Exercise 0 — Put the project under real version control (30 min)

1. Create a git repo **at the project root** (`globalhire-lite/`), not your home directory.
2. Write a `.gitignore` covering `node_modules/`, `bin/`, `obj/`, `*.log`,
   `*.tsbuildinfo`, `.env` (keep `.env.example`).
3. Commit the current state. Then, in a second commit, **delete every commented-out
   original file** (`apps/`, `packages/`) — they live in commit #1 forever.
4. From now on, every exercise below is its own branch + commit(s) with messages that
   explain *why*.

**Acceptance:** `git log` tells the story; `grep -r "MIGRATION_NOTE" .` returns nothing;
no log/env/build files tracked.

---

## Tier 1 — Junior-solidifying (each ≤ half a day)

### 1.1 Fix the stuck `useLoad` hook
In `GlobalHireLite.Web/src/App.tsx`: reset `error` when a reload starts, add a `loading`
flag, and add effect cleanup (a `cancelled` flag or `AbortController`) so a slow response
for worker A can't overwrite worker B's page.
**Acceptance:** navigating quickly between two worker detail pages always shows the right
worker; a failed request followed by a successful reload clears the error; no React
"setState on unmounted component" warnings.

### 1.2 Stop swallowing activation errors
`api.activateWorker(worker.id).catch(() => undefined)` hides messages like "Employment
contract must be SIGNED before activation."
**Acceptance:** failed activation shows the server's message to the user; the Activate
button only renders for workers in `ONBOARDING` status.

### 1.3 Respect the run's currency
The dashboard/payroll pages format everything with a hardcoded USD formatter.
**Acceptance:** amounts render using each run's/item's `Currency` field
(`Intl.NumberFormat` per currency).

### 1.4 Add boundary validation to worker creation
Reject: empty first/last name, invalid email format, `SalaryAmount <= 0`, unknown
`CountryCode`, `StartDate` more than ~1 year in the past. Use whatever mechanism you
like (manual checks are fine; MiniValidation/FluentValidation is nicer) — but validation
must run **before** any store mutation.
**Acceptance:** each bad input returns 400 with a field-specific message; a test per rule.

### 1.5 Sync the docs
Make `README.md`'s demo credentials and run instructions match the live .NET app.
**Acceptance:** a stranger can go from clone → logged in using only the README.

---

## Tier 2 — Mid-level (each ~1 day; these are the highest-value ones)

### 2.1 Real authentication
Replace the ID-as-token scheme: hash passwords (BCrypt.Net or ASP.NET Core's
`PasswordHasher<T>`), remove the plaintext `Password` default from the entity, and issue
a **signed JWT** (or an opaque random session ID stored server-side) in the httpOnly
cookie. Keep the Bearer fallback but for the JWT, not the user ID.
**Acceptance:** `Bearer user-admin` returns 401; tokens survive restart validation (JWT)
or are revocable (sessions — explain which trade-off you chose in the PR description);
no plaintext password anywhere; login still works from the web app.

### 2.2 Close the authorization holes
- `submit`/`approve`/`reject` on onboarding tasks: resolve the task's worker and require
  `CanAccessWorker`; approve/reject additionally require a reviewer role.
- Leave/timesheet approve/reject: require `CLIENT_MANAGER | CLIENT_ADMIN | EOR_SPECIALIST`
  **and** same-org; a worker may still `cancel` their own leave and `submit` their own
  timesheet, but never approve/reject their own records.
- Consolidate: delete the static `CanAccessWorker`/`CanAccessOrganization` in
  `Program.cs`; `AuthorizationService` becomes the single home.
**Acceptance:** integration tests (see 2.5) prove: worker can't approve own leave;
client admin of org B gets 403 on org A's tasks; all previous happy paths still pass.

### 2.3 Kill the mass assignment
Remove `Status` from `UpdateWorkerRequest`. Add explicit transition rules to offboarding:
`REQUESTED → IN_REVIEW → APPROVED → COMPLETED`, `CANCELLED` reachable from any non-final
state, nothing leaves `COMPLETED`/`CANCELLED`; only non-WORKER roles may transition.
**Acceptance:** `PATCH /workers/{id}` with `status` is rejected (or the field simply no
longer exists); `REQUESTED → COMPLETED` in one hop returns 400; tests enumerate the legal
and a sample of illegal transitions.

### 2.4 Structured errors
Introduce `ServiceError(ErrorKind, string)` (`NotFound | Forbidden | Validation |
Conflict`) as the error half of the service tuples, and ONE helper that maps kind →
status code. Delete every `error == "some message"` comparison.
**Acceptance:** `Forbidden` service results return 403 (they currently return 400 from
several paths); grep for `== "` in Program.cs finds no error-message comparisons.

### 2.5 Integration tests through the HTTP layer
Use `WebApplicationFactory<Program>` to test real requests: login → cookie → call
endpoints as each role. This is the safety net every exercise above needs.
**Acceptance:** at least: 401 without auth; 403 cross-org read AND write; worker
self-approval blocked; the full payroll happy path (create → calculate → approve → lock →
invoice) as a client admin.

### 2.6 Typed API contracts
Replace `WithDetails`/`WithItems` anonymous objects with response DTO records; add
Swashbuckle/OpenAPI; make `GET /workers` return a thin `WorkerSummary` list and
`GET /workers/{id}` the rich detail. Then delete `entry.worker ?? entry` from the
frontend and type `api.ts` (write the types by hand, or generate a client from the
OpenAPI doc).
**Acceptance:** `/swagger` shows real schemas for every endpoint; `api.ts` has zero
`any`; the workers list endpoint no longer serializes timesheets/documents/payroll items.

---

## Tier 3 — Senior-stretch (multi-day)

### 3.1 Real persistence
Swap `InMemoryGlobalHireStore` for EF Core + PostgreSQL (the Prisma schema in
`apps/api/prisma/schema.prisma` is your data-model spec — port it, including the unique
constraints and cascade decisions). Register `DbContext` as scoped; wrap payroll
calculation (delete items + insert items + update totals) in a transaction; add EF
migrations and a seed.
**Acceptance:** app survives restart with data intact; killing the process mid-calculate
never leaves a `CALCULATED` run with missing items; `dotnet ef database update` from
scratch works; all Tier-2 integration tests pass against Postgres (Testcontainers is the
professional way).

### 3.2 Pagination + filtering done properly
Add `?page/pageSize` (or cursor) + the search/status/country filters to `GET /workers`
and `GET /audit-log`, translated to SQL (not in-memory `.Where` after fetching all rows).
Return `{ items, total, page, pageSize }`.
**Acceptance:** with 10k seeded workers, listing stays fast and the response stays small;
frontend table pages through results.

### 3.3 Optimistic concurrency
Add a `RowVersion`/`xmin` concurrency token to `Worker` and `Employment`. On conflict
return 409 with a clear message; frontend offers "reload and retry."
**Acceptance:** a test simulating two concurrent edits gets one success and one 409 —
never a silent last-write-wins.

### 3.4 Currency-safety in payroll
Currently a payroll run in USD will happily include a worker whose salary currency is
CAD, adding the numbers as if they were the same unit.
Decide and implement a policy (simplest: calculate rejects the run and names the workers
whose `SalaryCurrency` ≠ run currency), and write the test first.
**Acceptance:** the failing test you wrote first now passes; policy documented in README.

### 3.5 Write the migration parity ledger (retrospective)
Diff the TS original against the .NET rewrite and produce `PARITY.md`: every endpoint,
auth rule, validation, transaction, and audit call — kept / dropped / changed. You'll
find the security regressions from file 03 plus a few this review didn't list.
**Acceptance:** the table is complete for auth + workers + payroll + leave; each "dropped"
row links to the exercise (or new issue) that restores it. This document is also your
best interview artifact from the whole repo.

### 3.6 CI
GitHub Actions (or equivalent): restore, build, test (both .NET and web), lint, on every
push. Add a status badge.
**Acceptance:** a PR that breaks a payroll test shows red before review.

---

## How to work these like a professional

- One branch and one focused PR-shaped commit series per exercise; write the PR
  description (problem → approach → how verified) even with no reviewer.
- Write or update a test in the same change as every behavior fix — the Tier-2 security
  fixes especially. "How did you verify it?" is the question every senior asks.
- When you finish Tier 2, redo the timing: the fixes that felt hard (auth, structured
  errors) will feel mechanical. That delta *is* the level-up.
