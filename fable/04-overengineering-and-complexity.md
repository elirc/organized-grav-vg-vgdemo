# 04 — Over-engineering, Under-engineering, and Accidental Complexity

"Over-engineering" isn't just too many design patterns. It's any place where the
*mechanism* is more complicated than the *problem* — including doing something manually
that a standard tool does better. This codebase has examples of both directions, and the
gap between them is exactly the junior→senior gap: seniors spend complexity only where
the domain demands it.

---

## 1. The comment-out migration (the headline lesson)

Every one of the 88 original TypeScript files looks like this:

```ts
// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import bcrypt from 'bcryptjs';
// import jwt, { type SignOptions } from 'jsonwebtoken';
// ...every single line, prefixed with //
```

Even `index.css`, `schema.prisma`, `.eslintrc.cjs`, and `index.html` got the treatment.
Meanwhile the git repository has **no commits at all**, so there was no history to rely
on — which is presumably *why* the code was preserved as comments.

Why this matters so much:

- **Dead code is a tax on every future reader.** Searching the repo for `payroll` returns
  two implementations, one of which must be mentally discarded every time. Tooling
  (grep, IDE navigation, refactoring tools) can't tell the corpse from the live code.
- **Commented code rots invisibly.** It can't compile, can't run, can't be tested. Within
  months nobody knows whether it *ever* worked in its current form.
- **It signals a missing safety net.** The only reason to keep code as comments is fear
  of losing it — and version control exists precisely to remove that fear.

What the senior version of this migration looks like:

```bash
git init && git add . && git commit -m "TS/Express/Prisma implementation"   # safety net
git switch -c dotnet-migration
# ... build migrated-dotnet, DELETE apps/ when parity is reached ...
git commit -m "Replace Express API with ASP.NET Core implementation"
# The old code is one `git show main:apps/api/src/...` away, forever.
```

And for a *production* system (where you can't big-bang cut over), the pattern to know by
name is the **strangler fig**: run old and new side by side, route traffic
endpoint-by-endpoint to the new system, delete the old one when nothing routes to it.
Being able to describe that pattern, plus a **parity checklist** (every endpoint, every
auth rule, every validation — checked off as ported), is a strong mid-level interview
answer to "tell me about a migration."

Related repo-hygiene items in the same spirit: committed log files, committed `.env`,
`tsconfig.tsbuildinfo` in the tree, and a git repo apparently rooted at the Windows home
directory (the status shows `NTUSER.DAT`, `Downloads/`, etc. as untracked). Initialize
repos at the project root, and let `.gitignore` do its job.

## 2. Stringly-typed error handling (.NET services)

Every service method returns a tuple:

```csharp
public (Worker? Worker, string? Error) Create(User actor, CreateWorkerRequest input)
```

…and then the route layer *parses the string* to choose a status code (`Program.cs:108`):

```csharp
return error is not null
    ? Error(error, error == "Worker not found" ? StatusCodes.Status404NotFound
                                               : StatusCodes.Status400BadRequest)
    : Results.Ok(worker);
```

Problems: renaming an error message silently changes an HTTP status; "Forbidden" comes
back as 400 instead of 403 from several service paths (e.g. `PayrollService.Create`
returns `(null, "Forbidden")` and the route maps it to 400); and every caller re-invents
the mapping. The result-tuple *idea* is fine (it makes failure explicit in the
signature), but the error needs to be **structured**, not prose:

```csharp
public sealed record ServiceError(ErrorKind Kind, string Message);   // NotFound | Forbidden | Validation | Conflict
// one extension method maps Kind -> status code, used by every endpoint
```

Or go the other way — exceptions plus one exception-handling middleware, which is what
the TS original did with `ApiError`. **The senior point isn't which style you pick; it's
that error→status mapping must live in exactly one place.** Whenever you see `==` against
a human-readable message, you've found a refactor.

## 3. Anonymous response objects = an API without a contract

`WorkerService.WithDetails` (`WorkerService.cs:118`) and `PayrollService.WithItems`
(`PayrollService.cs:107`) return `new { worker, organization, employment, ... }` —
C# anonymous types. Consequences:

- Endpoints have **no declared response type** — no OpenAPI/Swagger schema, nothing to
  generate a typed client from.
- Shapes are **inconsistent between endpoints**: `GET /workers` returns
  `{ worker: {...}, ... }` envelopes, but other code paths return bare workers — which is
  why the frontend contains `const worker = entry.worker ?? entry;` (`App.tsx:167`).
  When your client has to *guess* the response shape, the API is the bug.
- `Update` returns `(object?, string?)` — the type system has given up.

Fix: define response DTO records (`WorkerDetailResponse`, `PayrollRunWithItemsResponse`).
It's ~30 lines, restores compile-time checking on both sides, and enables Swagger. This
is under-engineering that *creates* complexity downstream — the frontend's `any`-typing
and shape-sniffing are the interest payments on this shortcut.

## 4. List endpoints that return everything about everything

`WorkerService.List` maps every row through `WithDetails`, which gathers **nine related
collections per worker** — onboarding tasks, documents, leave, timesheets, payroll items,
offboarding cases, country rule, organization, employment. On the in-memory store that's
O(workers × collections) full scans; translated naively to a database it's the N+1 query
festival from hell. And the workers *list page* uses almost none of it (name, title,
country, status).

**The rule: list views get thin DTOs; detail views get rich ones.** A `WorkerSummary`
(id, name, title, country, status, onboarding %) for `GET /workers`, the full object only
for `GET /workers/{id}`. This is the single most common API-design review comment in CRUD
work, and it's also a *pagination* conversation: this API has no paging anywhere — fine
at 3 workers, a page-crash at 10,000. Knowing to ask "what happens when this table has a
million rows?" is a mid-level reflex.

## 5. `Program.cs` as a 460-line junk drawer — inconsistent layering

Workers and payroll go through services. Documents, leave, timesheets, invoices, and
offboarding have their business logic **inline in route lambdas** (e.g. invoice
creation with fee math at `Program.cs:305-330`). Neither choice is wrong for a small app —
the *inconsistency* is the problem: a reader can't predict where logic lives, and the
inline endpoints are exactly the ones missing audit logs and authorization checks
(coincidence? no — no service seam means no shared checklist).

Minimal APIs scale fine if you group endpoints per feature file
(`app.MapGroup("/api/leave-requests")` + a `LeaveEndpoints.cs`). The rule of thumb:
**pick an altitude and apply it uniformly** — uniformity is itself a feature, because
reviewers and new hires navigate by pattern.

Also filed here: `AuthorizationService` registered in DI (`Program.cs:24`) holding two
pure functions with no state — while `Program.cs` defines duplicate static versions of
the same checks anyway (see 03/B4). Either it's the one home for authz rules, or it
shouldn't exist. A class named `...Service` containing two static-able methods is the
classic "pattern because patterns are what professionals do" tell; the cure is asking
"what would I lose if this were a static class?"

## 6. Where the effort budget actually went

Zoom out and count implementations: two complete backends, two complete frontends, plus
`docs/architectural-cartographer/`, `docs/mission-learning-path/`,
`docs/user-story-build-path/`, and ten `prep/` interview documents. That's a lot of
parallel artifacts for one demo, and several contradict each other (README vs live seed
data; `packages/shared/` exists but the live code doesn't use it).

This is a *portfolio* repo, so the docs have a purpose — but the lesson generalizes:
**effort spent broadening is effort not spent deepening.** One implementation with real
auth, validation, pagination, and CI would demonstrate more seniority than two
implementations that each lack them. In interviews, depth beats breadth every time:
"here's my payroll state machine, its 6 tests, and the race condition I fixed" lands
harder than "I built it twice in two languages."

## 7. Things that are NOT over-engineering (calibration)

Just as important — a senior also recognizes when complexity is *earned*. None of these
should be "simplified" away:

- **The audit log.** In an EOR/payroll domain, this is a requirement, not gold-plating.
- **`FilterByActorWorkers<T>`** (`Program.cs:410`) — a five-line generic that deleted
  four copies of visibility logic. Right-sized abstraction.
- **Onboarding tasks generated from `CountryRule` flags**
  (`InMemoryGlobalHireStore.OnboardingTemplates`) — data-driven behavior where the
  variation genuinely is per-country data.
- **The duplicate-payroll-run guard and idempotent invoice creation** — cheap insurance
  on money paths.
- **Five roles.** It could have been two, but role-matrix thinking is the point of the
  domain.

The calibration question for every abstraction: *"what concrete, current problem does
this solve?"* — the audit log and the visibility helper have crisp answers; the DI'd
two-method `AuthorizationService` and the `entry.worker ?? entry` envelope do not.
