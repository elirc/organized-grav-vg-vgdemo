# 02 — What Is Done Well

These are the patterns in this codebase worth internalizing and reusing at a job. Each
section: what the code does, where, and the general principle.

## 1. Workflow state machines with guarded transitions

The payroll lifecycle is the best code in the repo. Look at
`migrated-dotnet/src/GlobalHireLite.Api/Services/PayrollService.cs`:

```csharp
if (run.Status != PayrollRunStatus.DRAFT)      return (null, "Payroll can only be calculated from DRAFT");
if (run.Status != PayrollRunStatus.CALCULATED) return (null, "Payroll must be CALCULATED before approval");
if (run.GrossTotal <= 0)                       return (null, "Payroll cannot be approved with zero gross total");
if (run.Status != PayrollRunStatus.APPROVED)   return (null, "Payroll must be APPROVED before lock");
```

`DRAFT → CALCULATED → APPROVED → LOCKED`, each transition checked at the entry point, and
the TS original adds `assertPayrollEditable` to block edits on `LOCKED` runs
(`payroll.service.ts:12`). Worker activation is the same idea
(`WorkerService.cs:93-109`): only `ONBOARDING` workers can activate, and only if all
required onboarding tasks are `APPROVED` **and** the contract is `SIGNED`.

**Why this matters:** most real-world CRUD bugs are not crashes — they're *invalid state
transitions*: a refund on an unshipped order, an invoice on a draft payroll. Juniors
write `UPDATE status = X` wherever the UI needs it; seniors enumerate the legal
transitions and enforce them in exactly one server-side place. When you interview, having
a story about "I modeled X as a state machine and rejected illegal transitions" is a
genuine mid-level signal.

(The flip side: the .NET version *also* leaves back doors around this state machine —
see file 03, "mass assignment.")

## 2. Multi-tenant data scoping as a reusable rule

Every list endpoint answers "what can *this* actor see?" consistently:

```csharp
// WorkerService.cs:111 — one place decides visibility
private IEnumerable<Worker> QueryForActor(User actor)
{
    if (actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST) return store.Workers;
    if (actor.Role == Role.WORKER) return store.Workers.Where(w => w.Id == actor.WorkerId);
    return store.Workers.Where(w => w.OrganizationId == actor.OrganizationId);
}
```

And `Program.cs:410` generalizes it for leave/timesheets/offboarding with
`FilterByActorWorkers<T>` — a small generic helper that computes the set of visible worker
IDs once, then filters any collection by it. That's a genuinely nice abstraction at the
right altitude: it removed four copies of the same visibility logic without inventing a
framework.

**The principle:** tenant isolation is a *data-access* concern, not a UI concern. Filter
at the query layer, in one named function, so a new endpoint can't accidentally forget.
The known-limitations note in the README says it well: "Frontend route hiding is
implemented for demo clarity; backend route guards remain the source of truth." That
sentence is a senior instinct — hiding a button is UX, not security.

## 3. Idempotent invoice creation

`Program.cs:313`:

```csharp
var existing = store.Invoices.FirstOrDefault(i => i.PayrollRunId == payrollRunId);
if (existing is not null) return Results.Ok(existing);   // don't create a duplicate
```

Clicking "Generate invoice" twice (or a client retrying a timed-out request) returns the
same invoice instead of creating two. Combined with the duplicate-payroll-run guard
(`PayrollService.cs:13` — same org + period + currency ⇒ reject), the money paths are
protected against double-submission.

**The principle:** any POST that creates something with real-world consequences (charges,
invoices, emails) must be safe to retry. The two standard tools are a *natural key check*
(what's done here) or an *idempotency key* header. Knowing to ask "what happens if this
request fires twice?" is a classic mid/senior interview differentiator.

## 4. Business-rule tests with exact expected values

`tests/GlobalHireLite.Api.Tests/PayrollServiceTests.cs` tests the rules that matter, not
the plumbing:

- period-end-before-start rejected
- duplicate run rejected
- **only ACTIVE workers and only APPROVED timesheets inside the period** count — the test
  seeds an inactive worker with an approved timesheet AND a submitted (unapproved)
  timesheet for the active worker, then asserts both are excluded
- exact money assertions: `OvertimePay == 337.50m`, `NetPay == 7,283.25m`
- illegal transitions rejected (approve before calculate, lock before approve)

**Why this is the right testing altitude:** these tests would survive a rewrite of the
HTTP layer, the storage layer, even the language (the TS repo has the *same* tests in
Vitest — `apps/api/src/tests/business-rules.test.ts`). Test the invariants your business
would lose money over; don't burn time asserting that Express calls your handler. The
hand-computed expected values (337.50 = 4h × (9000/160) × 1.5) also force the author to
verify the formula independently of the code — a discipline worth copying.

## 5. Central error handling (TS version)

The original stack has the canonical Express error trio:

- `utils/ApiError.ts` — an error type carrying an HTTP status
- `utils/asyncHandler.ts` — wraps async route handlers so rejected promises reach the
  error middleware instead of hanging the request
- `middleware/error.middleware.ts` — one place that converts any thrown error into a
  consistent JSON body and status

So services just `throw new ApiError(400, 'Payroll must be CALCULATED before approval')`
and never touch `res`. Business code stays pure of HTTP mechanics. Compare with the .NET
rewrite's tuple-returns (file 04) to feel the difference.

## 6. Avoiding N+1 queries (TS payroll calculation)

`apps/api/src/modules/payroll/payroll.service.ts:58-71` (commented out, still worth
reading): instead of querying country rules and timesheets per worker inside the loop, it
fetches **all** country rules once into a `Map`, fetches all approved timesheets for the
org/period once, pre-aggregates overtime per worker into a `Map`, and then the per-worker
loop is pure computation. Three queries total, regardless of worker count.

**The principle:** N+1 queries are the most common performance bug in CRUD apps and a
top-3 code-review comment you'll receive as a junior. The fix is always the same shape:
*fetch in bulk, index in memory (a Map keyed by ID), then join in the loop.* The TS code
is a textbook example.

It then writes the results atomically:

```ts
await db.$transaction(async (tx) => {
  await tx.payrollItem.deleteMany({ where: { payrollRunId: id } });
  await tx.payrollItem.createMany({ data: items });
  return tx.payrollRun.update({ where: { id }, data: { status: 'CALCULATED', ...totals } });
});
```

Delete-old-items + insert-new-items + update-totals either all happen or none do. If the
process dies mid-way you never get a `CALCULATED` run with half its items. (The .NET
version lost this property — see file 03.)

## 7. Audit logging as a first-class feature

Sensitive mutations write an `AuditLog` row: who (actor), what (entity type + ID), which
action, scoped to an organization (`WorkerService.cs:132`, `PayrollService.cs:78,92`).
The audit list endpoint applies the same tenant scoping as everything else. In HR/fintech
domains this isn't optional — "who approved this payroll and when" is a compliance
requirement. Having built one is a great interview story.

## 8. Data modeling (Prisma schema)

Even commented out, `apps/api/prisma/schema.prisma` is a strong reference:

- **Enums for every status** — the DB rejects garbage states, and the enum list *is* the
  documentation of the lifecycle.
- **Real relations with named inverses** (`@relation("TaskReviewer")`,
  `"PayrollApprover"`) — when a table references `User` twice (creator and approver), you
  must name the relations; juniors hit this and get confused.
- **Deliberate cascade rules** — `OnboardingTask`/`Timesheet` cascade-delete with their
  worker (derived data), but `PayrollItem → Worker` does **not** cascade (financial
  records must survive).
- **Unique constraints encoding business rules** — `Invoice.payrollRunId @unique` (one
  invoice per run), `Worker.userId @unique` (one profile per login), `@@index` on the
  foreign keys you actually filter by.
- **Nullable audit actor** (`actorUserId String?`) so deleting a user doesn't destroy
  history.

The one schema mistake — `Float` for money — is covered in file 03.

## 9. Sensible security posture (TS version)

The original API does the boring things right: `helmet()` for headers, a CORS *allowlist*
with `credentials: true` (not `origin: '*'`), JWT in an **httpOnly** cookie (JS can't
steal it via XSS) with a Bearer-header fallback for tooling, bcrypt password hashes, and
a single `app.use('/api', requireAuth)` line (`app.ts:45`) that makes authentication the
*default* — public routes are the exception, mounted above the line. "Secure by default,
opt out explicitly" beats per-route opt-in, where forgetting a guard = a breach.

## 10. Honest scope management

`README.md` has "Demo Disclaimers", "Known Limitations", and "Future Extensions"
sections. Writing down what the system deliberately does NOT do is a senior habit —
it converts "missing feature" from a bug report into a documented decision, and it's
exactly what a good PR description or design doc does.

---

### Takeaway list (steal these)

1. Enumerate legal state transitions; enforce them server-side in one place.
2. Tenant-scope at the data layer via one named function per entity.
3. Make money-creating POSTs idempotent (natural key or idempotency key).
4. Unit-test business invariants with hand-computed values; skip plumbing tests.
5. Throw domain errors; translate to HTTP in one middleware.
6. Kill N+1s: bulk fetch → Map by ID → join in memory.
7. Multi-step writes go in a transaction.
8. Audit who/what/when for anything money- or HR-shaped.
9. Encode business rules as DB constraints (unique, enums, FKs), not just app code.
10. Auth by default at the router root; document what you deliberately left out.
