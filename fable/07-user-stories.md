# 07 — 25 User Stories: Very Easy → Mid-Level

These are *feature-shaped* user stories against the live code
(`migrated-dotnet/src/GlobalHireLite.Api/` and `migrated-dotnet/src/GlobalHireLite.Web/`).
Where file 06 was "fix what's broken," this file is "build what's missing" — the way work
actually arrives at a job: as a product request you must translate into files, functions,
and tests yourself. The implementation plans here are deliberately *high-level*; figuring
out the exact code is the exercise.

Conventions used below:

- **API** = `migrated-dotnet/src/GlobalHireLite.Api/`
- **Web** = `migrated-dotnet/src/GlobalHireLite.Web/src/`
- **Tests** = `migrated-dotnet/tests/GlobalHireLite.Api.Tests/`
- Every story = one branch, one PR-shaped commit series, acceptance criteria verified
  before you move on. Stories build on each other — do them in order where noted.

---

## Tier A — Warm-ups (stories 1–5): touch one file, learn the codebase

### Story 1 — Version-stamped health check
> As an operator, I want `/api/health` to report the app version and start time, so I can
> confirm which build is running after a deploy.

**Acceptance:** `GET /api/health` returns `{ ok, service, version, startedAtUtc }`;
version also appears in small text at the bottom of the web sidebar.

**Plan:**
- API: in `Program.cs`, capture `var startedAt = DateTime.UtcNow;` before `app.Run()` and
  read the version via `typeof(Program).Assembly.GetName().Version` (set `<Version>` in
  `GlobalHireLite.Api.csproj`). Extend the existing `MapGet("/api/health")` lambda.
- Web: add `health: () => request<Health>('/health')` to `api.ts` (define the `Health`
  type — your first non-`any` response type). In `App.tsx`, render the version in the
  `Shell` sidebar under the nav links.
- *Lesson:* the smallest possible full-stack slice — one endpoint, one typed client call,
  one component change.

### Story 2 — Readable dates everywhere
> As a client admin, I want dates shown like "Jun 30, 2026" instead of raw ISO strings,
> so tables are scannable.

**Acceptance:** worker start dates, payroll periods, and reviewed-at timestamps render
via one shared formatter; no raw `2026-06-30` strings remain in the UI.

**Plan:**
- Web: create `format.ts` exporting `formatDate(iso: string)` (wrap
  `Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })`) and **move** the existing
  `currency` constant from the top of `App.tsx` into it as `formatMoney(amount, currency)`.
- Replace every inline date/currency usage in `App.tsx` with the helpers.
- *Lesson:* utility modules; one source of truth for presentation logic. (The old
  commented-out app had `apps/web/src/utils/formatDate.ts` — same idea.)

### Story 3 — Color-coded status badges
> As any user, I want status badges colored by meaning (green = ACTIVE/APPROVED,
> amber = pending states, red = REJECTED/TERMINATED), so I can read a table at a glance.

**Acceptance:** the `Badge` component picks a tone from the status value; unknown values
fall back to neutral gray.

**Plan:**
- Web: in `App.tsx`, extend `Badge` with a lookup —
  `const tones: Record<string, 'good' | 'warn' | 'bad' | 'neutral'>` mapping each enum
  value; render `className={'badge badge-' + tone}`.
- Add the four `.badge-*` color classes to `styles.css`.
- *Lesson:* mapping domain enums to presentation without `if` chains; safe fallbacks.

### Story 4 — Richer demo data
> As a demo presenter, I want a second organization ("Borealis Media") with two workers
> in different countries and one EOR_SPECIALIST user, so multi-tenant behavior is visible.

**Acceptance:** logging in as the new org's client admin shows only Borealis workers;
`admin@globalhire.test` sees both orgs; a Mexico country rule exists.

**Plan:**
- API: in `Infrastructure/InMemoryGlobalHireStore.cs`, first extract the constructor body
  into a private `SeedDemoData()` method (the constructor is getting long — this is a
  free refactor). Add the `MX` `CountryRule`, the second `Organization`, its
  `CLIENT_ADMIN` user, two `Worker`s + `Employment`s (one `ONBOARDING`, one `ACTIVE` with
  a `SIGNED` contract), and an `eor@globalhire.test` user with `Role.EOR_SPECIALIST`.
- Update `README.md`'s demo accounts table.
- *Lesson:* seed data is a feature — good demos and good tests both depend on it; and you
  just learned every entity's required fields.

### Story 5 — Loading and empty states
> As any user, I want tables to show "Loading…" while fetching and a helpful message when
> empty, so a blank screen never looks broken.

**Acceptance:** every table distinguishes loading / empty / error; empty messages are
specific ("No payroll runs yet — create one above"), not generic.

**Plan:**
- Web: extend `useLoad` in `App.tsx` to return a `loading` boolean (set true when the
  effect starts, false in `.finally`). Give `DataTable` an optional
  `emptyMessage?: string` prop used in the existing zero-rows branch.
- Thread `loading` through each page (`WorkersPage`, `PayrollPage`, `DashboardPage`,
  `ResourcesPage`).
- *Lesson:* the three states every data view has; designing them is the job, not polish.

---

## Tier B — Easy features (stories 6–11): one endpoint or one page

### Story 6 — Worker search and status filter
> As a client admin, I want to search workers by name/email and filter by status, so I
> can find people in a long directory.

**Acceptance:** typing in a search box and picking a status narrows the table (server-side
— check the network tab); clearing filters restores the full list.

**Plan:**
- API: nothing — `GET /api/workers` already accepts `search`, `status`, `country`,
  `department` (`Program.cs:79`, `WorkerService.List`). Read that code first.
- Web: change `api.ts` `workers()` to `workers(params?: { search?: string; status?: string })`
  building a `URLSearchParams` query string. In `WorkersPage`, add a text input +
  `<select>` above the table held in local `useState`, and pass them into `useLoad`'s
  loader **with the filters in the deps array** so changing them refetches.
- *Lesson:* wiring UI state → query params → existing API; why deps arrays matter (and
  why your Story-5 `loading` flag now flickers correctly per search).

### Story 7 — Organization detail endpoint
> As an EOR specialist, I want to fetch one organization with its worker headcount, so
> the worker detail page can show which client a worker belongs to.

**Acceptance:** `GET /api/organizations/{id}` returns the org plus
`{ workerCount, activeWorkerCount }`; a client admin requesting *another* org gets 403;
worker detail page shows the organization name as a subtitle.

**Plan:**
- API: add `MapGet("/api/organizations/{id}", ...)` in `Program.cs` next to the existing
  organizations endpoint. Resolve the org, check
  `authorization.CanAccessOrganization(actor, id)` (use the **service**, not the local
  static — remember 03/B4), and return a small response record. Define
  `OrganizationDetailResponse` in `Contracts/` (start the habit of typed responses —
  create a `Responses.cs`).
- Web: `api.ts` gets `organization(id)`; `WorkerDetailPage` calls it with the worker's
  `organizationId` (a second `useLoad`) and renders the name.
- *Lesson:* your first complete new endpoint: route → authz → shape → typed client.

### Story 8 — Leave page (read-only)
> As a worker, I want to see my leave requests with status and dates; as a manager, I
> want to see my org's requests — so everyone knows where requests stand.

**Acceptance:** a `/leave` route in the sidebar lists leave requests (type, dates, reason,
status badge, reviewed-by); workers see only their own (the API already scopes this).

**Plan:**
- API: nothing — `GET /api/leave-requests` exists and is tenant-scoped via
  `FilterByActorWorkers` (`Program.cs:191`). Read that helper until you can explain it.
- Web: add a `LeavePage` component in `App.tsx` (or start a new `pages/LeavePage.tsx`
  file and import it — `App.tsx` is getting big; this is the moment to begin splitting
  pages into files). Add the route in `App` and the sidebar link in `Shell`.
- *Lesson:* pure consumption of an existing scoped API; starting the `pages/` split that
  stories 9–16 will continue.

### Story 9 — Request leave form
> As a worker, I want to submit a leave request (type, start/end date, reason), so I
> don't have to email my manager.

**Acceptance:** form validates end ≥ start client-side; server errors (e.g. its own
end<start check) display next to the form; the list refreshes after submit; the submit
button disables while in flight.

**Plan:**
- API: nothing new — `POST /api/leave-requests` exists (`Program.cs:198`). Note how it
  resolves `workerId` from the actor for WORKER role.
- Web: in `pages/LeavePage.tsx`, add a form panel: `<select>` over the four `LeaveType`
  values, two `<input type="date">`, a reason `<textarea>`. Add
  `createLeave(body: CreateLeaveBody)` to `api.ts` (typed body). On success call the
  list's `reload()`; on failure `setError(err.message)` — **no swallowed catches**.
- *Lesson:* the canonical create-form loop: local form state → POST → refetch list →
  error surfacing → disabled-while-pending.

### Story 10 — Timesheets page with submit action
> As a worker, I want to log a weekly timesheet and submit it for approval; as a manager,
> I want to see submitted sheets — so hours reach payroll.

**Acceptance:** `/timesheets` route lists sheets (week, regular, overtime, status); a
creation form posts a DRAFT; each DRAFT row has a "Submit" button that moves it to
SUBMITTED; hours outside 0–80 show the server's message.

**Plan:**
- Web: `pages/TimesheetsPage.tsx`, modeled directly on your Story 8/9 work. `api.ts` gets
  `timesheets()`, `createTimesheet(body)`, `submitTimesheet(id)` (the API routes exist:
  `Program.cs:217-241`).
- *Lesson:* row-level actions + refetch; you've now built the same page shape twice —
  notice what you'd extract (a `useSubmitAction` helper or shared form components) but
  **don't extract yet**; two instances is not a pattern (rule of three).

### Story 11 — Country rule card on worker detail
> As an EOR specialist, I want a worker's country rules (probation days, notice period,
> tax %) on their detail page, so I can answer compliance questions in context.

**Acceptance:** worker detail shows a "Country rules — {countryName}" panel; percentages
render as `22%`, day counts as `90 days`.

**Plan:**
- API: nothing — `WorkerService.WithDetails` already embeds `countryRule`
  (`WorkerService.cs:129`).
- Web: in `WorkerDetailPage`, render a `Panel` from `data.countryRule`; use a small
  `formatPercent` added to `format.ts` (Story 2).
- *Lesson:* read the API response you already have before building a new endpoint —
  juniors often add duplicate endpoints because they never inspected the payload.

---

## Tier C — Medium (stories 12–19): business rules, multiple layers, tests required

### Story 12 — Onboarding review actions with mandatory rejection reason
> As an EOR specialist, I want Approve/Reject buttons on a worker's onboarding tasks,
> with rejection requiring a reason, so workers know what to fix.

**Acceptance:** non-WORKER roles see Approve/Reject on SUBMITTED tasks; Reject opens a
prompt and refuses an empty reason **server-side** (400 "rejectionReason is required");
the reason displays on REJECTED rows; workers see no buttons.

**Plan:**
- API: in `Program.cs`, the approve/reject endpoints exist (`:141`, `:155`) — add the
  non-empty-reason check to reject (`string.IsNullOrWhiteSpace(input.RejectionReason)`).
  While you're in there, notice these endpoints' missing org checks — if you've done
  exercise 2.2 this is already fixed; if not, add `CanAccessWorker` now (resolve the
  task's worker first). Only allow review when `task.Status == SUBMITTED` (a state-machine
  guard the current code lacks).
- Web: in `WorkerDetailPage`'s onboarding table, add an actions column rendered only when
  `user.role !== 'WORKER'` — which means `WorkerDetailPage` needs the current user:
  thread it down as a prop from `App`/`Shell` (or introduce a small
  `UserContext` — cleaner, and you'll reuse it in stories 13–16). `api.ts`:
  `approveTask(id)`, `rejectTask(id, reason)`.
- Tests: unit tests for the reject-reason rule and the SUBMITTED-only guard.
- *Lesson:* role-conditional UI backed by server enforcement; your first
  React context; state guards on review actions.

### Story 13 — Onboarding progress everywhere
> As a client admin, I want an onboarding completion percentage on the workers list and a
> progress bar on the detail page, so I can spot stuck hires.

**Acceptance:** list shows "3/5 required · 60%"; detail shows a bar; only `Required`
tasks count; a worker with zero required tasks shows "N/A", not `NaN`.

**Plan:**
- API: compute it server-side — add
  `OnboardingProgress(string workerId) => (approved, required)` to `WorkerService` and
  include an `onboardingProgress` object in `WithDetails`. (Client-side math would also
  work, but the list endpoint should eventually stop shipping full task arrays — see
  Story 22 — so put the derivation where the data is.)
- Web: render in both pages; a progress bar is a `div` with `width: X%` + a CSS class.
- Tests: `WorkerServiceTests` — zero-required case, partial case, all-approved case.
- *Lesson:* derived data belongs near the source; guarding division by zero is a test
  case, not an afterthought.

### Story 14 — Documents on the worker detail page
> As a worker, I want to record document metadata (file name, type) and see review
> status, so my onboarding evidence is tracked.

**Acceptance:** worker detail gets a Documents panel (name, type, status, uploaded date);
an "Add document" form posts metadata; empty file name rejected server-side; EOR
specialists get Approve/Reject buttons (statuses `UPLOADED → APPROVED/REJECTED`).

**Plan:**
- API: list/create exist (`Program.cs:169-189`). Add
  `MapPatch("/api/documents/{id}/approve")` and `/reject` — resolve the document, then
  its worker, then `CanAccessWorker` + non-WORKER role, then set status. Three endpoints
  on one entity is the signal to group them: create `Endpoints/DocumentEndpoints.cs` with
  a `MapDocumentEndpoints(this IEndpointRouteBuilder app)` extension and call it from
  `Program.cs` — your first step in breaking up the 460-line file.
- Web: Documents panel + form in `WorkerDetailPage`; reuse the role-conditional pattern
  from Story 12.
- *Lesson:* endpoint grouping via extension methods; the review-workflow pattern
  (resolve → authorize → guard state → mutate) is now muscle memory.

### Story 15 — Audit log page
> As a platform admin, I want a readable audit trail (when, who, action, message), so I
> can answer "who approved this?"

**Acceptance:** `/audit` route (sidebar link visible only to PLATFORM_ADMIN /
EOR_SPECIALIST via the Story-12 context — but the server stays the real guard); newest
first; action shown as a badge; actor shown by name, not ID.

**Plan:**
- API: `GET /api/audit-log` exists but returns `ActorUserId`. Map to a response record
  including `actorName` (join `store.Users` by ID; "System" when null). Put
  `AuditLogEntryResponse` in `Contracts/Responses.cs`.
- Web: `pages/AuditLogPage.tsx`; conditional sidebar link in `Shell`.
- *Lesson:* IDs are for machines; endpoints that feed screens should resolve names
  server-side (one place) rather than making every client stitch users together.

### Story 16 — "Needs my attention" dashboard panel
> As a client manager, I want the dashboard to list items awaiting my action (submitted
> timesheets, pending leave, submitted onboarding tasks), each linking to the right page,
> so I don't hunt through tabs.

**Acceptance:** dashboard shows a panel of up to 10 actionable items with type, worker
name, age ("3 days"), and a link; empty state says "You're all caught up"; workers see
their own pending items instead (their submitted-but-unreviewed things).

**Plan:**
- API: extend `Services/DashboardService.cs` with
  `PendingActions(User actor) => List<PendingActionResponse>` — union three queries
  (leave `PENDING`, timesheets `SUBMITTED`, tasks `SUBMITTED`), each filtered through the
  same visibility rules the list endpoints use, sorted by `CreatedAt`, capped at 10.
  Include it in the existing `Snapshot` payload or as `GET /api/dashboard/pending`.
- Web: panel in `DashboardPage` with `Link`s to `/leave`, `/timesheets`, `/workers/{id}`;
  add `formatAge(date)` to `format.ts`.
- Tests: role matrix — manager sees org items only; worker sees own only.
- *Lesson:* aggregation endpoints that serve a screen; reusing (not re-inventing)
  visibility rules is a security property.

### Story 17 — Validated worker creation form
> As a client admin, I want to create a worker from a form with clear field-level errors,
> so bad data never reaches the directory.

**Acceptance:** a "New worker" page (link on Workers page, hidden for WORKER role)
collects name/email/country/title/department/type/start date/salary/currency; server
rejects empty names, invalid email, salary ≤ 0, unknown country — each as
`{ errors: { fieldName: "message" } }` with 400 — and the form shows messages under the
offending fields; success navigates to the new worker's detail page.

**Plan:**
- API: add a `Validate(CreateWorkerRequest input, InMemoryGlobalHireStore store)` step at
  the top of `WorkerService.Create` returning `Dictionary<string, string>` of field
  errors; introduce a `ValidationError` result path (if you did exercise 2.4, this slots
  into `ErrorKind.Validation`; if not, return the dictionary through a new tuple member).
  The endpoint serializes `{ errors }` with 400.
- Web: `pages/NewWorkerPage.tsx`; hold form state in one `useState<FormState>`; on 400,
  parse `errors` and render per-field. Country `<select>` options come from
  `api.countryRules()` — don't hardcode.
- Tests: one per rule, plus "valid input creates worker + employment + onboarding tasks"
  (assert all three collections — `WorkerService.Create` writes to all of them).
- *Lesson:* field-errors-as-data is the contract that makes good forms possible; this is
  the single most common feature shape in CRUD work. Do it once properly and you'll reuse
  the pattern forever.

### Story 18 — No overlapping approved leave
> As a client manager, I want the system to reject leave that overlaps an existing
> APPROVED or PENDING request for the same worker, so schedules stay coherent.

**Acceptance:** creating an overlapping request returns 409 with the conflicting range in
the message; adjacent ranges (end = day before next start) are allowed; CANCELLED and
REJECTED requests don't block; approving a request that *now* overlaps another approved
one is also rejected.

**Plan:**
- API: this rule is too big for a route lambda — create `Services/LeaveService.cs`
  (constructor-inject store + authorization, mirroring `WorkerService`) and move the
  create + review logic out of `Program.cs` into it; register in DI. Core helper:
  `static bool Overlaps(DateOnly aStart, DateOnly aEnd, DateOnly bStart, DateOnly bEnd)
  => aStart <= bEnd && bStart <= aEnd;` — write the tests for this *first* (classic
  boundary-condition breeding ground).
- Check the rule in both `Create` and `Approve`.
- Tests: overlap cases (contained, straddling start, straddling end, identical,
  adjacent-allowed), status exclusions, and the approve-time recheck.
- *Lesson:* interval overlap is a perennial interview question and production bug;
  extracting your first service from inline lambdas; business rules get pure-function
  cores so they're trivially testable.

### Story 19 — One timesheet per worker per week
> As a payroll operator, I want duplicate timesheets for the same worker-week rejected,
> so overtime is never double-counted in payroll.

**Acceptance:** second create for the same `(workerId, weekStartDate)` returns 409
mentioning the week; `weekStartDate` must be a Monday (400 otherwise); the payroll
calculation tests still pass.

**Plan:**
- API: as with Story 18, extract `Services/TimesheetService.cs` from the `Program.cs`
  lambdas (`:217-241`) and put both rules in `Create`. Monday check:
  `input.WeekStartDate.DayOfWeek == DayOfWeek.Monday`. This is a *natural-key uniqueness*
  rule — note in a comment that in a real DB it would also be a unique index
  `(workerId, weekStartDate)` (the Prisma schema shows how the original modeled it).
- While extracting, fix what you find: the reviewer-authorization hole from 03/A4 (a
  worker must not approve their own sheet) — story and security fix in one PR is normal
  professional work.
- Tests: duplicate rejected, different-week allowed, non-Monday rejected, worker
  self-approval forbidden.
- *Lesson:* uniqueness enforced at the service *and* (in a real system) the schema;
  "leave the campsite cleaner" refactoring during feature work.

---

## Tier D — Mid-level (stories 20–25): cross-cutting, design decisions, test suites

### Story 20 — Consistent error contract
> As a frontend developer, I want every API error to be
> `{ message, code, errors? }` with the correct HTTP status, so the UI can handle
> failures uniformly instead of parsing prose.

**Acceptance:** Forbidden results return 403 (several currently return 400), not-found
404, validation 400 with `errors`, conflicts (stories 18/19) 409; `code` is a stable
machine string (`"WORKER_NOT_FOUND"`, `"LEAVE_OVERLAP"`); no endpoint compares error
message strings to pick a status; the web app shows `message` and uses `errors` for forms.

**Plan:**
- API: introduce `Domain/ServiceError.cs`: `record ServiceError(ErrorKind Kind, string
  Code, string Message, IDictionary<string,string>? Errors = null)` with
  `enum ErrorKind { Validation, Forbidden, NotFound, Conflict }`. Change every service
  tuple from `string? Error` to `ServiceError? Error` (compiler drives the migration —
  follow the red). One extension, `Results/ServiceErrorExtensions.ToResult(this
  ServiceError)`, owns the kind→status mapping; every endpoint ends with
  `error is not null ? error.ToResult() : Results.Ok(...)`.
- Web: `api.ts`'s `request<T>` throws a typed `ApiError` carrying `code`/`errors`;
  Story 17's form switches to it.
- Tests: a status-code matrix test per kind.
- *Lesson:* this is exercise 2.4 arriving as a *product requirement* — cross-cutting
  refactors are usually justified to stakeholders exactly this way ("the app can't show
  proper errors until…").

### Story 21 — Real login sessions
> As a security-conscious operator, I want hashed passwords and unforgeable session
> tokens, so knowing someone's user ID doesn't grant their access.

**Acceptance:** `Authorization: Bearer user-admin` returns 401; passwords are bcrypt
hashes (no plaintext field, no default); login/logout/me still work from the web app;
sessions expire after 7 days; wrong password and unknown email return the *same* 401
message (no account enumeration).

**Plan:**
- API: add BCrypt.Net-Next to the csproj. Entity change in `Domain/Entities.cs`: replace
  `Password` with `PasswordHash` (no default!); seed hashes in
  `InMemoryGlobalHireStore.SeedDemoData` via a `DemoUser(email, name, role, ...)` helper
  that hashes once. Create `Services/SessionService.cs`: `Create(userId) → token`
  (`RandomNumberGenerator.GetBytes(32)` → Base64Url) storing
  `token → (userId, expiresUtc)` in a `ConcurrentDictionary`; `Resolve(token) → userId?`
  checking expiry; `Revoke(token)`. Register as singleton (justified: it's designed for
  concurrency — contrast with 03/B1). Rewrite `CurrentUser` in `Program.cs` to resolve
  cookie-or-bearer through `SessionService`; login sets the cookie to the session token;
  logout revokes.
- Web: no changes needed if the cookie name stays — verify, don't assume.
- Tests: raw-user-id token rejected; expired session rejected; login→me→logout→me flow.
- *Lesson:* the difference between an identifier and a credential (03/A1 fixed for
  real); deliberate uniform error messages; a singleton that *earns* its lifetime.

### Story 22 — Paginated, summary-shaped workers list
> As a client admin with hundreds of workers, I want the directory paged 25 at a time
> with a total count, so it loads fast at any scale.

**Acceptance:** `GET /api/workers?page=2&pageSize=25` returns
`{ items, total, page, pageSize }`; `items` are thin summaries (id, name, email, title,
country, status, startDate, onboarding progress from Story 13) — **no** embedded
timesheets/documents/payroll arrays; detail endpoint unchanged (still rich); web table
gets Prev/Next controls and "Showing 26–50 of 137"; filters from Story 6 compose with
paging (changing a filter resets to page 1).

**Plan:**
- API: in `Contracts/Responses.cs` add `WorkerSummaryResponse` and a reusable
  `PagedResponse<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize)`.
  In `WorkerService.List`: apply actor scoping + filters, `Count()` for total, then
  `.Skip((page-1)*pageSize).Take(pageSize)` mapping to summaries. Clamp
  `pageSize` to 100 and `page` to ≥1. To make scale visible, add a dev-only seed of ~200
  generated workers behind an env flag (`GLOBALHIRE_SEED_BULK=1`) in the store.
- Web: `api.ts` `workers` returns `Paged<WorkerSummary>`; `WorkersPage` holds `page`
  state (in the `useLoad` deps), resets it when filters change, renders pager buttons
  disabled at the boundaries.
- Tests: paging math (last partial page, out-of-range page → empty items but correct
  total), filters + paging composed, summary shape contains no heavy fields.
- *Lesson:* thin-list/rich-detail (04 §4) and pagination as a *contract* — every list
  endpoint you ever build should look like this.

### Story 23 — Enforced offboarding pipeline
> As an EOR specialist, I want offboarding to move only through
> REQUESTED → IN_REVIEW → APPROVED → COMPLETED (CANCELLED allowed from any non-final
> state), with the worker terminated exactly on completion, so offboarding is a process,
> not a status dropdown.

**Acceptance:** illegal jumps (e.g. REQUESTED→COMPLETED) return 400 naming the allowed
next states; nothing leaves COMPLETED or CANCELLED; CANCELLED restores the worker from
OFFBOARDING back to ACTIVE; only non-WORKER roles with org access may transition; UI on
worker detail shows the case with only-legal-action buttons.

**Plan:**
- API: create `Services/OffboardingService.cs`; move the create + transition logic out of
  `Program.cs:339-363`. Encode the machine as data:
  `static readonly Dictionary<OffboardingStatus, OffboardingStatus[]> Transitions` and a
  `CanTransition(from, to)` helper — data-driven beats a switch because the error message
  ("allowed: IN_REVIEW, CANCELLED") and future audit both read from the same table.
  Replace the wildcard route `PATCH /{id}/{status}` with explicit
  `/review`, `/approve`, `/complete`, `/cancel` endpoints (mass-assignment defense,
  03/A5 — the URL was client-controlled state). Write an `AuditLog` row per transition.
  Side effects: COMPLETED ⇒ worker `TERMINATED` + set `Employment.EndDate`;
  CANCELLED ⇒ worker back to `ACTIVE`.
- Web: offboarding panel on `WorkerDetailPage` — render action buttons from the case's
  current status (mirror the transition table client-side for UX; server remains the
  guard).
- Tests: full legal path, every illegal jump, cancel-restores-worker, worker-role 403.
- *Lesson:* the payroll state machine pattern (02 §1) applied by *you* to a new entity —
  transition tables, dedicated transition endpoints, and effects-on-transition.

### Story 24 — Invoices page with idempotent generation
> As a client admin, I want to generate and view the invoice for an approved payroll run,
> with line items and platform fee, so I can reconcile billing.

**Acceptance:** an "Invoices" page lists invoices (number, period, subtotal, fee, total,
status, due date); an invoice detail view shows the payroll items behind it (worker name,
gross, tax, net); "Generate invoice" on an APPROVED/LOCKED run navigates to the invoice —
and clicking it twice never creates a second invoice (prove it with a test); generating
from a DRAFT run explains why it can't.

**Plan:**
- API: add `MapGet("/api/invoices/{id}")` returning `InvoiceDetailResponse` — invoice +
  its run's period + the run's `PayrollItem`s joined with worker names (follow
  `PayrollService.WithItems` but as a typed record; consider creating
  `Services/InvoiceService.cs` and moving the existing inline generation from
  `Program.cs:305-330` into it — that keeps the fee math (`0.05m`) in one named place:
  `const decimal PlatformFeeRate`). Keep and *test* the existing idempotency check.
- Web: `pages/InvoicesPage.tsx` (list + detail via a `/invoices/:id` route), "Generate
  invoice" button on `PayrollPage` rows shown only for APPROVED/LOCKED runs.
- Tests: idempotent double-generate (same invoice ID both times), fee math with an exact
  hand-computed value, DRAFT-run rejection, cross-org 403.
- *Lesson:* idempotency as a tested guarantee (02 §3), money math with named constants,
  and a read model (invoice detail) composed from three entities.

### Story 25 — Permission-matrix integration test suite + CI
> As the team, we want an automated test run on every push that exercises real HTTP
> requests per role, so authorization can never silently regress again (the way it did in
> the TS→.NET migration).

**Acceptance:** `dotnet test` includes an integration suite using
`WebApplicationFactory<Program>` that logs in as each seeded role and asserts the
permission matrix; a CI workflow runs API tests + web `tsc`/build on push; a failing
authorization test blocks merge (red status).

**Plan:**
- API: add `public partial class Program {}` at the bottom of `Program.cs` (required for
  `WebApplicationFactory`). New test files in **Tests**:
  `IntegrationFixture.cs` — wraps the factory, exposes
  `LoginAs(string email) → HttpClient` (posts to `/api/auth/login`, captures the cookie);
  `PermissionMatrixTests.cs` — a `[Theory]` with `[InlineData]` rows of
  `(role, method, path, expectedStatus)` covering: anonymous → 401 everywhere;
  worker approving own leave → 403 (Story 19's fix); client admin cross-org worker →
  403/404; EOR specialist cross-org → 200; the payroll lifecycle happy path end-to-end
  (create→calculate→approve→lock→invoice) as one sequential test.
- CI: `.github/workflows/ci.yml` — two jobs: `dotnet build && dotnet test` in
  `migrated-dotnet/`, and `npm ci && npx tsc --noEmit && npm run build` in the web app.
  Cache NuGet/npm. Badge in README.
- *Lesson:* the matrix-as-data test style scales to hundreds of assertions for the cost
  of one loop; integration tests are what pin *behavior* across refactors — after this
  story, every earlier story is protected, which is the real definition of "done" for
  the whole sequence.

---

## Suggested pacing

| Stories | Target | You know you're ready to move on when… |
|---|---|---|
| 1–5 | 1 week | you can add an endpoint + typed client call without looking anything up |
| 6–11 | 1–2 weeks | new pages take an hour, not a day; you read existing API code before writing new |
| 12–19 | 3–4 weeks | you write the test list *before* the code; you extract services on instinct |
| 20–25 | 3–4 weeks | you can defend the design decisions (paging contract, session storage, transition tables) out loud |

Finish all 25 and you'll have touched every competency in
[05-junior-to-senior-playbook.md](05-junior-to-senior-playbook.md) at least twice — and
the repo itself becomes the portfolio piece: real auth, real validation, pagination,
state machines, an error contract, a permission-matrix test suite, and CI.
