# 05 — The Junior → Mid/Senior Playbook for CRUD Web Development

This file generalizes everything the codebase illustrates into the competencies that
actually separate levels at CRUD web-app jobs. Format: what the junior version of the
skill looks like, what the senior version looks like, and where this repo demonstrates
the gap. The uncomfortable truth about CRUD work: the framework is the easy 20%. The
career-making 80% is data integrity, authorization, state, and the judgment about where
to spend complexity.

---

## 1. Version control is your safety net, not a chore

- **Junior:** commits when the feature is "done"; keeps old code commented out "just in
  case"; commits `.env` and log files; sometimes runs `git init` in the wrong directory.
- **Senior:** commits before *and* during risky work, in small reviewable units with
  messages that explain *why*; deletes dead code fearlessly because history has it;
  treats `.gitignore` as part of project setup; uses branches for experiments.
- **In this repo:** 87 files commented out + no history before the snapshot import (file 04). One `git init` +
  one commit would have made the entire `MIGRATION_NOTE` apparatus unnecessary.

Habit to build now: `git log --oneline` on any repo you open, before reading code.
History tells you what the team actually values.

## 2. Authentication ≠ Authorization ≠ Tenancy (three separate layers)

- **Junior:** "there's a login, so it's secure." Checks roles sometimes, where the bug
  report demanded it.
- **Senior:** designs three explicit layers and can point at each in the code:
  1. **AuthN** — who are you? (unforgeable token → user; `requireAuth` at the router
     root so it's the default, `apps/api/src/app.ts:45`)
  2. **AuthZ (action)** — may your *role* do this action type? (reviewer-role predicates)
  3. **AuthZ (resource/tenancy)** — may you touch *this record*? (org scoping on every
     ID-resolving endpoint, in one reusable guard per entity)
- **In this repo:** the TS version has all three; the .NET version kept 1 (weakly) and 3
  (mostly) but dropped 2 on approvals — so workers approve their own leave (03/A4), and
  onboarding-task writes lost 3 entirely (03/A3).

Interview phrases that signal this competency: "IDOR", "tenant isolation at the query
layer", "separation of duties on approvals", "deny by default".

## 3. Validate at the boundary; trust nothing from the client

- **Junior:** validates whatever the UI validates; server assumes the frontend behaved.
- **Senior:** every request body passes through a declared schema (Zod /
  FluentValidation / DataAnnotations) before business code sees it; update DTOs contain
  **only user-editable fields** (mass-assignment defense, 03/A5); server-side rules never
  rely on the client having hidden a button.
- **In this repo:** Zod in the TS auth module vs. nothing in .NET; `UpdateWorkerRequest`
  exposing `Status` is the canonical mass-assignment case study.

## 4. Model workflows as state machines

- **Junior:** `status` is a string column set wherever convenient.
- **Senior:** enumerates states and legal transitions, enforces them in one server-side
  place, and makes transitions their own endpoints (`/approve`, `/activate`) with their
  own authorization. Asks "who may cause this transition, and from which states?"
  for every arrow in the diagram.
- **In this repo:** payroll DRAFT→CALCULATED→APPROVED→LOCKED done right
  (`PayrollService.cs`); offboarding `PATCH /{status}` accepting any value done wrong
  (`Program.cs:352`). Both in the same codebase — compare them side by side.

## 5. Money and time are not ordinary numbers

- **Junior:** `float salary`, `new Date()` everywhere, timezone bugs at month boundaries.
- **Senior:** `decimal`/integer-cents for money with an explicit rounding policy; dates
  vs instants kept distinct (`DateOnly` for "week starting June 1", `DateTime` UTC for
  "approved at"); currency stored next to every amount; never sums amounts across
  currencies.
- **In this repo:** Prisma `Float` (wrong) vs .NET `decimal` + `DateOnly` (right);
  per-item rounding then summing (a policy — make it explicit, 03/B2); `Currency` is
  carried on runs/items but the payroll calc happily mixes a USD-salaried worker into any
  run currency — a good bug to find and fix as an exercise.

## 6. Database craft: the four reflexes

1. **Transactions** around multi-write operations (TS `db.$transaction` in payroll calc;
   lost in the rewrite).
2. **Constraints as the last line of defense** — unique keys, FKs, enums, NOT NULL. App
   code has bugs; the schema shouldn't let them corrupt data
   (`Invoice.payrollRunId @unique` = "one invoice per run" survives any app bug).
3. **N+1 elimination** — bulk fetch, index into a Map, join in memory
   (`payroll.service.ts:58-71` is a model answer).
4. **Pagination from day one** on every list endpoint (absent here — the classic demo→prod
   failure).

Add for senior: know *optimistic concurrency* (a `version` column; "someone else edited
this record" instead of last-write-wins) — the worker `Update` here would silently
clobber concurrent edits.

## 7. Error handling: one mapping, no prose-parsing

- **Junior:** try/catch in every handler, ad-hoc status codes, error strings compared
  with `==` (this repo: `error == "Worker not found" ? 404 : 400`).
- **Senior:** picks ONE channel (typed exceptions + central middleware, or structured
  Result objects) and maps error-kind→HTTP-status in exactly one place; never encodes
  meaning in message text; returns consistent error bodies (`{ message, code }`) the
  frontend can rely on.
- **In this repo:** `ApiError` + error middleware (TS, good) vs string tuples (.NET,
  fragile). Both styles are defensible; mixing message-parsing into it is not.

## 8. API contracts are promises — write them down

- **Junior:** returns whatever object the ORM produced; frontend types everything `any`
  and adapts to whatever arrives (`entry.worker ?? entry`).
- **Senior:** explicit request/response DTOs per endpoint; consistent envelopes;
  thin DTOs for lists, rich for details; OpenAPI generated from the code and a typed
  client generated from that — so a backend rename becomes a frontend *compile error*
  instead of a production `undefined`.
- **In this repo:** anonymous C# objects → no schema → `Promise<any>` client → shape
  sniffing. One decision at the API layer caused three downstream problems (file 04 §3-4).

## 9. Frontend server-state: don't rebuild the wheel

- **Junior:** `useEffect` + `fetch` + `useState` per page; refetch by reloading; swallows
  errors to stop the console going red.
- **Senior:** distinguishes *server state* (someone else owns it; it goes stale) from
  *UI state* (yours); uses TanStack Query/SWR for caching, dedup, invalidation-after-
  mutation, and race-safety; every user action surfaces success/failure; loading, empty,
  and error states are all designed.
- **In this repo:** the original app used TanStack Query; the rewrite's `useLoad` hook
  reintroduces the race/leak/stuck-error bugs (03/B3) — the four-bug analysis of that
  hook is a ready-made interview answer.

## 10. Testing: invariants first

- **Junior:** either no tests, or snapshot/plumbing tests that break on every refactor
  and catch nothing.
- **Senior:** a small pyramid — many unit tests on business rules with hand-computed
  values (this repo's payroll tests are the model), a few integration tests through the
  real HTTP + DB stack (missing here — and they're exactly what would have caught the
  authorization regressions), a smoke E2E on the money path. Tests double as executable
  specs: `CalculateIncludesOnlyActiveWorkersAndApprovedTimesheetsInThePayrollPeriod` *is*
  the requirement.
- **Anti-pattern to recognize:** production code that knows it's being tested
  (`if (db === prisma) audit(...)` — 03/B5). Inject dependencies instead.

## 11. Object lifetimes and concurrency

- **Junior:** DI is copy-pasted incantation; "it worked on my machine" under one user.
- **Senior:** can say what Singleton/Scoped/Transient mean, why a DbContext is scoped,
  why a singleton holding mutable `List<T>`s breaks under concurrent requests (03/B1),
  and asks "what happens when two requests do this at the same time?" on every write
  path. Knows a web server is a concurrent system even when your code has no threads
  in it.

## 12. Migrations and rewrites need a parity ledger

- **Junior:** ports the happy path, demos it, declares victory.
- **Senior:** builds a checklist of every endpoint, auth rule, validation, and error
  behavior; ports *behavior*, not just features; knows the strangler-fig pattern for
  live systems; watches specifically for the invisible things — security checks,
  transactions, audit calls — because the demo works without them.
- **In this repo:** the rewrite kept every *visible* feature and dropped bcrypt, JWT,
  Zod, transactions, reviewer roles, and several audit calls — a perfect specimen of
  why parity ledgers exist. Reconstruct one as an exercise (file 06).

## 13. Judgment: spend complexity where the domain demands it

The meta-skill over all of the above. For every abstraction, ask *"what concrete, current
problem does this solve?"* — keep the audit log and the visibility helper (crisp
answers), cut the two-method DI service and the comment-graveyard (no answer). Uniformity
is a feature: half-in-services/half-inline (file 04 §5) is worse than either choice
applied consistently. And "we deliberately don't do X" written in the README is senior
output too.

---

## Using this codebase in interviews

You will be asked "tell me about a project." This repo, *with the fixes from file 06
done*, supports strong stories:

- **A security story:** "During a TS→.NET migration I found the rewrite had replaced JWT
  auth with an ID-as-token scheme and dropped resource-level checks — workers could
  approve their own leave. I wrote integration tests that pinned every auth rule, then
  fixed…" (03/A1-A4)
- **A data-integrity story:** payroll state machine + idempotent invoices + why money is
  decimal + the rounding policy (02 §1-3, 03/B2).
- **A performance story:** the N+1 elimination pattern in payroll calc, and thin-vs-rich
  DTOs for list endpoints (02 §6, 04 §4).
- **A frontend story:** the four bugs in the hand-rolled `useLoad` hook and why server
  state belongs in TanStack Query (03/B3).
- **A judgment story:** what you deleted (dead code, the duplicate authz logic, the
  anonymous envelopes) and why deleting was the senior move (04).

The pattern in all five: *symptom → underlying category → general fix → how you verified
it.* Practice saying each in ninety seconds.
