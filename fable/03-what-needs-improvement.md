# 03 — What Needs Improvement

These are real defects, ordered roughly by severity. For a junior aiming at mid/senior:
each of these is a *category* of bug that appears in production codebases constantly.
Learn to spot the category, not just the instance. Unless noted, file references are to
the live code in `migrated-dotnet/src/GlobalHireLite.Api/`.

---

## A. Security — where the .NET rewrite regressed hardest

### A1. The session token is just the user's ID

`Program.cs:34-49` and `Program.cs:420-428`:

```csharp
context.Response.Cookies.Append("globalhire_user_id", user.Id, ...);
return Results.Ok(new { token = user.Id, user = PublicUser(user) });
...
// CurrentUser(): cookie value OR "Bearer <id>" header is looked up directly:
return id is null ? null : store.Users.FirstOrDefault(user => user.Id == id);
```

Whoever presents a user ID **is** that user. IDs are not secrets — they appear in URLs,
logs, audit entries, and API responses (`PublicUser` returns `Id`). Any authenticated
user can read another user's ID from an audit log entry (`ActorUserId`) or a worker's
`ManagerId`, put it in a `Bearer` header, and become a platform admin. Worse, two of the
seed IDs are the literal strings `"user-admin"` and `"user-client"` — guessable without
any recon.

**The rule:** authentication tokens must be *unforgeable* — either signed (JWT, like the
TS original at `auth.service.ts:27`: `jwt.sign({ sub: user.id }, env.JWT_SECRET)`) or
random-and-server-stored (opaque session IDs, ≥128 bits of entropy). "Possession of a
public identifier" is never authentication. When you review code, trace every
`CurrentUser`-style function back to what actually proves identity.

Also note `Secure = false` on the cookie and the token duplicated into the JSON body
(making it available to XSS, which the httpOnly cookie was supposed to prevent).

### A2. Plaintext passwords with a shared default

`Domain/Entities.cs:7`:

```csharp
public string Password { get; init; } = "password123";
```

Login compares plaintext (`Program.cs:38`). The TS original did this correctly with
bcrypt (`auth.service.ts:23`). Beyond the obvious, there are two subtler lessons:

1. **A default value for a credential is a bug by itself.** Any code path that creates a
   `User` and forgets to set a password silently produces an account with a known
   password. Sensitive fields should have *no* default and fail loudly when missing.
2. **The plaintext password lives on the entity that gets serialized.** Today `PublicUser`
   filters it, but `store.Users` is one careless `Results.Ok(...)` away from leaking every
   credential. Keep secrets off the objects that flow toward serializers — a separate
   credentials table/record, or at minimum `[JsonIgnore]`.

**The rule:** passwords are hashed with bcrypt/argon2 (slow, salted), never encrypted,
never compared with `==` (also a timing-leak). This is table stakes for any web job.

### A3. Missing per-resource authorization (IDOR)

Compare three endpoints that mutate onboarding tasks:

```csharp
// Program.cs:130 — submit: NO ownership check at all.
// Any authenticated user can submit any worker's task in any organization.
app.MapPatch("/api/onboarding-tasks/{taskId}/submit", (string taskId, ...) => {
    var task = store.OnboardingTasks.FirstOrDefault(item => item.Id == taskId);
    task.Status = OnboardingTaskStatus.SUBMITTED; ...

// Program.cs:141 — approve: role check only ("not a WORKER"), no org check.
// A CLIENT_ADMIN of org B can approve org A's tasks.
if (actor.Role is Role.WORKER) return Error("Forbidden", ...);
```

Meanwhile `GET /api/workers/{workerId}/onboarding` (`Program.cs:120`) *does* check
`CanAccessWorker`. So reads are guarded, writes are not — exactly backwards.

**The rule:** every endpoint that takes an entity ID must answer two separate questions:
*is this actor allowed to perform this action type* (role), and *on this specific record*
(ownership/tenancy). Checking only the first is the classic IDOR
(Insecure Direct Object Reference) — the most common vulnerability class in CRUD apps and
a staple of security-review checklists. A good habit: write the check as one reusable
guard per entity (`CanAccessWorker`) and call it in **every** handler that resolves an ID,
reads *and* writes.

### A4. Workers can approve their own leave and timesheets

`Program.cs:379-408` (`ReviewLeave` / `ReviewTimesheet`) authorize with `CanAccessWorker`,
and `CanAccessWorker` (`Program.cs:430`) returns true when
`actor.Role == Role.WORKER && actor.WorkerId == worker.Id`. Net effect: a worker can call
`PATCH /api/leave-requests/{id}/approve` on their own request and approve it.

The TS original got this right with an explicit reviewer-role predicate
(`auth.middleware.ts:48`):

```ts
export const canReviewPeopleWorkflows = (role) =>
  ['CLIENT_MANAGER', 'CLIENT_ADMIN', 'EOR_SPECIALIST'].includes(role);
```

**The rule:** "can see" and "can approve" are different permissions. Approval flows also
usually need *separation of duties* (you can't approve your own request — even a manager).
When migrating, authorization rules are the easiest thing to silently drop because the
happy path still works; they need their own parity checklist (see file 05).

### A5. Mass assignment: `PATCH /workers/{id}` bypasses the activation state machine

`Contracts/Requests.cs` exposes `Status` on `UpdateWorkerRequest`, and
`WorkerService.Update` (`WorkerService.cs:80`) applies it blindly:

```csharp
if (input.Status is not null) worker.Status = input.Status.Value;
```

So all the careful gating in `Activate` (all required tasks approved + contract signed)
is bypassable by `PATCH {"status": "ACTIVE"}`. Same disease on offboarding
(`Program.cs:352`): the route `PATCH /api/offboarding-cases/{id}/{status}` accepts *any*
enum value straight from the URL with no transition rules — you can jump
`REQUESTED → COMPLETED` (instantly terminating the worker), or move a `COMPLETED` case
back to `REQUESTED` while the worker stays `TERMINATED`.

**The rule:** this is *mass assignment* — binding client input directly onto privileged
fields. Update DTOs should contain only the fields users may edit; state changes go
through dedicated transition endpoints (`/activate`, `/approve`) that enforce the machine.
If a field appears in both a transition endpoint and a generic PATCH, the PATCH wins for
attackers. (Rails' `strong_parameters`, .NET's `[Bind]`, and "never `Object.assign(entity,
req.body)`" in Node are all responses to this same bug class.)

### A6. No input validation at the boundary

The .NET API deserializes request records and uses them as-is. Nothing rejects:

- negative or absurd `SalaryAmount` on worker create/update
- empty `FirstName`/`Email`, malformed emails, unknown `Currency` strings
- `LastWorkingDay` in the past on offboarding
- a leave request spanning years (only `EndDate >= StartDate` is checked, `Program.cs:207`)

The TS original had Zod schemas (`auth.schemas.ts`) — that pattern should have carried
over (FluentValidation, or DataAnnotations + `MiniValidation` for minimal APIs).

**The rule:** validate at the boundary, once, declaratively — then the rest of the code
can trust its inputs. Two layers: *shape* validation (types, required, ranges, formats)
at the edge, *business* validation (duplicate run, state transitions) in the service.
This codebase has decent business validation and almost no shape validation.

---

## B. Correctness and robustness

### B1. A mutable singleton store shared across concurrent requests

`Program.cs:23`: `builder.Services.AddSingleton<InMemoryGlobalHireStore>()`, and the
store is plain `List<T>`s. ASP.NET serves requests concurrently; two simultaneous
`POST /workers` calls can interleave inside `List<T>.Add` and corrupt the list (this
throws, or worse, silently loses items). There's also no atomicity:
`PayrollService.Calculate` does `RemoveAll` then `AddRange` (`PayrollService.cs:71-72`) —
a reader in between sees a calculated run with zero items, and an exception in between
loses the old items entirely.

For a demo, in-memory is a legitimate choice — but a senior making that choice writes
down its limits and puts a `lock` (or `ConcurrentDictionary`, or single-threaded
constraint) around it. **The interview-relevant lesson:** know your object lifetimes.
`Singleton` = one instance forever, shared by all requests, must be thread-safe.
`Scoped` = one per request (the default for DbContext). `Transient` = new every time.
Misregistered lifetimes (a scoped DbContext captured by a singleton) are a classic .NET
production bug.

And the deeper point: databases give you transactions, constraints, and concurrent access
for free. The TS version wrapped its multi-write in `db.$transaction`
(`payroll.service.ts:104`); the rewrite silently lost that guarantee.

### B2. `Float` for money (TS schema)

`apps/api/prisma/schema.prisma:194`: `salaryAmount Float`, and all payroll totals are
`Float`. Binary floats cannot represent 0.1; sums of many items drift by cents, and
accountants notice. The .NET rewrite fixed this with `decimal` — genuinely the best
change the migration made.

**The rule:** money is `decimal`/`numeric` in the DB, `decimal` in C#, and in JS — which
has no decimal type — either integer minor units (cents) or a decimal library. Also
decide your rounding policy explicitly: this code rounds each payroll item to 2 dp, then
sums the rounded items into totals (`PayrollService.cs:62-76`) — that's a defensible
policy ("totals equal the sum of the lines the worker sees"), but it should be a comment
or a test, not an accident. Rounding *totals independently* of items is how you get
invoices that are one cent off from their line items.

### B3. Frontend `useLoad` hook: races, leaks, and stuck errors

`migrated-dotnet/src/GlobalHireLite.Web/src/App.tsx:285`:

```tsx
function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    loader().then(setData).catch((err) => setError((err as Error).message));
  }, [tick, ...deps]);
  return { data, error, reload: () => setTick((v) => v + 1) };
}
```

Four problems, all standard senior-interview material:

1. **Race condition:** navigate from worker A to worker B quickly — if A's fetch resolves
   after B's, the page shows A's data under B's URL. Fix: a cancelled flag or
   `AbortController` in the effect cleanup.
2. **State update after unmount** (same missing cleanup).
3. **`error` is never reset** on reload — once a request fails, the page shows the error
   forever even after a successful retry, and `data` from a failed dep-change lingers.
4. **No loading state**, so callers use `data === null`, which conflates "loading" and
   "legitimately empty."

The original app used TanStack Query, which solves all four plus caching and
deduplication. Rebuilding server-state management by hand is the single most common
self-inflicted wound in React codebases. **The rule:** `useEffect`+`fetch` is fine for a
one-off; the moment you have lists that reload after mutations, reach for
TanStack Query/SWR — and if an interviewer asks "what's wrong with fetching in
useEffect," this list of four is the expected answer.

Related frontend issues worth fixing as exercises:

- **Swallowed errors:** `api.activateWorker(worker.id).catch(() => undefined)`
  (`App.tsx:173`) — activation failures (which carry useful messages like "contract must
  be SIGNED") vanish. Never `.catch(() => undefined)` on user actions; surface the message.
- **Response shape sniffing:** `const worker = entry.worker ?? entry;`
  (`App.tsx:167,233`) — the client guesses which shape the server sent. That's a symptom
  of the API's inconsistent envelopes (file 04, anonymous objects).
- **Hardcoded values:** `currency` formatter is fixed to USD (`App.tsx:5`) while runs
  carry a `Currency` field; PayrollPage hardcodes `org-acme` and June 2026 dates
  (`App.tsx:210-219`).
- **`any` throughout `api.ts`** — every endpoint returns `Promise<any>`, so the compiler
  can't catch `worker.fistName`. Define response types (or generate them — file 05).

### B4. Duplicated authorization logic drifting apart

`AuthorizationService.CanAccessOrganization` exists (`Services/AuthorizationService.cs:7`)
— and `Program.cs:437` defines a *second, local* `CanAccessOrganization` plus
`CanAccessWorker` as static functions. Two copies of security logic means a future fix
lands in one and not the other. Pick one home (the service), delete the other.
**The rule:** duplication in *security* code is worse than ordinary duplication, because
the copies fail independently and silently.

### B5. TypeScript that opts out of TypeScript (original stack)

`payroll.service.ts:9`:

```ts
type Db = PrismaClient | any;          // "| any" makes the whole type any
export const createPayrollRun = async (actor: Actor, input: any, db: Db = prisma) => ...
```

And the test seam: `if (db === prisma) { await audit(...) }` — audit only fires when the
*real* database is used, meaning tests exercise a different code path than production
(the audit call is literally untested), and the service knows it's being tested. Also
`requireOrgAccess(input.organizationId, { user: actor } as any)` — fabricating a fake
Request object to reuse HTTP middleware as a domain check.

**The fixes teach three good habits:**
- Type service inputs with the Zod-inferred types you already have
  (`z.infer<typeof createPayrollRunSchema>`), not `any`.
- Inject dependencies (an `audit` function parameter with a no-op default in tests)
  instead of sniffing which dependency you got.
- If a rule (org access) is needed in both middleware and services, extract the *pure
  function* `(actor, orgId) => boolean` and let both call it — don't smuggle HTTP types
  into the domain layer.

### B6. Process hygiene

- **Zero git commits** (see file 04 — it compounds every other problem here).
- **Docs drift:** README credentials don't match the live seed (file 01).
- **Logs committed to the repo:** `api.dev.log`, `api.runtime.log`, `web.dev.log`,
  `tsconfig.tsbuildinfo` sit in the tree. Build artifacts and logs belong in `.gitignore`.
- **`.env` checked in** (`apps/api/.env`) alongside `.env.example`. The example file is
  the pattern; the real one must be ignored. Even in a demo with fake secrets, the habit
  matters because the first real secret follows the existing pattern.

---

## Severity-ordered fix list (if this shipped tomorrow)

1. Replace ID-as-token auth with signed JWT or server-side sessions (A1).
2. Hash passwords; remove the default (A2).
3. Add `CanAccessWorker` + reviewer-role checks to every task/leave/timesheet mutation (A3, A4).
4. Remove `Status` from `UpdateWorkerRequest`; add transition validation to offboarding (A5).
5. Add boundary validation (A6).
6. Guard the singleton store or move to a real DB / EF Core InMemory with scoped context (B1).
7. Fix `useLoad` or adopt TanStack Query; stop swallowing action errors (B3).
8. Consolidate authorization into one service (B4).
9. `.gitignore` logs/env/build artifacts; make an initial commit (B6).
