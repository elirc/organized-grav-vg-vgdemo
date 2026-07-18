# 01 — Codebase Overview

## The domain in one diagram

```
Organization (client company, e.g. "Acme Robotics")
 ├── Users (PLATFORM_ADMIN, EOR_SPECIALIST, CLIENT_ADMIN, CLIENT_MANAGER, WORKER)
 └── Workers ──── Employment (salary, currency, contract status)
       ├── OnboardingTasks   (generated from CountryRule templates)
       ├── WorkerDocuments
       ├── LeaveRequests     (PENDING → APPROVED/REJECTED/CANCELLED)
       ├── Timesheets        (DRAFT → SUBMITTED → APPROVED/REJECTED)
       └── OffboardingCases  (REQUESTED → ... → COMPLETED ⇒ worker TERMINATED)

PayrollRun (per org, per period)  DRAFT → CALCULATED → APPROVED → LOCKED
 └── PayrollItems (one per ACTIVE worker; salary + approved overtime − tax)
      └── Invoice (subtotal + 5% platform fee, one per payroll run)

AuditLog (who did what, scoped to organization)
CountryRule (per-country tax %, employer cost %, onboarding requirements)
```

Why this domain is great practice: it's not a to-do list. It has **five roles with
different visibility**, **tenant isolation** (client admins must never see another org's
data), **lifecycle state machines** (worker status, payroll status), and **money math**.
These four things are the actual job at most CRUD shops — the forms and tables are the
easy part.

## Two implementations, one product

### Implementation A: the original TypeScript stack (`apps/`, currently commented out)

Even though every line is commented out, read it — it's the more production-shaped of the
two. The layering:

```
apps/api/src/
├── server.ts                    # process entry: starts HTTP listener
├── app.ts                       # Express app: middleware order, route mounting
├── config/env.ts                # env parsing/validation at startup
├── db/prisma.ts                 # single PrismaClient instance
├── middleware/
│   ├── auth.middleware.ts       # requireAuth (JWT verify → req.user), requireOrgAccess
│   ├── requireRole.middleware.ts
│   └── error.middleware.ts      # central error handler + 404 handler
├── modules/<feature>/           # feature folders: auth, workers, payroll, leave, ...
│   ├── <feature>.routes.ts      # HTTP wiring, per-route role guards
│   ├── <feature>.schemas.ts     # Zod input validation (auth module)
│   └── <feature>.service.ts     # business rules, DB access, audit calls
├── utils/                       # ApiError, asyncHandler, date helpers
└── tests/                       # business-rules.test.ts, invoice-rules.test.ts
```

Request flow (worth memorizing — this is the canonical shape of a Node API):

```
HTTP → helmet → cors → json body parser → cookieParser
     → /api/auth (public)
     → requireAuth (everything after this line is authenticated)   [app.ts:45]
     → feature router → role/org guard → service → Prisma → PostgreSQL
     → thrown ApiError bubbles to error.middleware → JSON error response
```

The frontend mirrors it: `api/` (fetch wrappers), `components/ui/` (Button, Card, Table…),
`features/<domain>/` (pages), `hooks/` (useAuth, useRole), TanStack Query for server
state, React Hook Form + Zod for forms.

**This module-per-feature layout is the single most transferable thing in the repo.**
You will see it (or should introduce it) at every Node job. The alternative —
`controllers/`, `models/`, `services/` folders where one feature is smeared across three
directories — scales much worse.

### Implementation B: the .NET migration (`migrated-dotnet/`, the live code)

```
migrated-dotnet/
├── src/GlobalHireLite.Api/
│   ├── Program.cs               # ~460 lines: DI setup, CORS, ALL routes, some inline logic
│   ├── Domain/Entities.cs       # all entities as C# records (decimal money, DateOnly dates)
│   ├── Domain/Enums.cs
│   ├── Contracts/Requests.cs    # request DTOs
│   ├── Infrastructure/InMemoryGlobalHireStore.cs   # List<T> fields + seed data
│   └── Services/                # AuthorizationService, WorkerService, PayrollService, DashboardService
├── src/GlobalHireLite.Web/      # minimal React app, one App.tsx, hand-rolled data loading
└── tests/GlobalHireLite.Api.Tests/  # xUnit business-rule tests
```

Request flow:

```
HTTP → CORS → MapGet/MapPost lambda in Program.cs
     → CurrentUser(context, store)      # cookie or Bearer token = raw user ID (!)
     → inline role/access checks
     → either a Service method (workers, payroll) or inline logic (leave, timesheets,
       documents, invoices, offboarding)  ← note the inconsistency
     → mutate singleton in-memory lists
     → anonymous object serialized to JSON
```

Key differences to notice (all elaborated in later files):

| Concern | TS original | .NET migration |
|---|---|---|
| Persistence | PostgreSQL via Prisma, migrations, seed script | Singleton `List<T>`s, lost on restart |
| Passwords | bcrypt hash | **plaintext, default `"password123"`** |
| Session | signed JWT, httpOnly cookie | **cookie containing the raw user ID** |
| Input validation | Zod schemas (auth), some inline checks | almost none |
| Money type | `Float` in Prisma (a bug!) | `decimal` (correct — the one thing the rewrite improved) |
| Error handling | thrown `ApiError` → central middleware | `(result, errorString)` tuples per call |
| Layering | consistent routes/service split | half in services, half inline in Program.cs |
| Frontend data | TanStack Query (cache, dedup, states) | hand-rolled `useLoad` hook with race conditions |

## The meta-observation: version control

The working directory is inside a git repository **with zero commits** (and the repo root
appears to be the user's home directory, tracking everything from `NTUSER.DAT` to
`Downloads/`). Meanwhile, the "migration" was performed by prefixing every line of 88
files with `//` and a `MIGRATION_NOTE` header.

A senior engineer's first act on any project — before writing a line of code — is:

```bash
git init          # in the PROJECT directory, not your home directory
git add . && git commit -m "Initial state"
```

Then a migration is a branch, deletions are real deletions (recoverable via history), and
"what changed between the TS and .NET versions?" is a `git diff` instead of an
archaeology project. More on this in file 04, because it's the highest-leverage habit
change in this whole review.

## Supporting material in the repo

The repo also carries extensive docs: `ARCHITECTURE.md`, `TESTING.md`,
`INTERVIEW_WALKTHROUGH.md`, `docs/mission-learning-path/` (tiered learning missions),
`docs/user-story-build-path/`, and `prep/` (interview story banks, TS→.NET translation
notes). These are learning artifacts, not product docs — fine for a personal project, but
note the smell: `README.md` says the demo login is `platform.admin@globalhire.test` /
`Password123!`, while the live .NET seed is `admin@globalhire.test` / `password123`
(`InMemoryGlobalHireStore.cs:68`). Docs that describe a previous version of the system
are worse than no docs; keeping them truthful is part of the job.
