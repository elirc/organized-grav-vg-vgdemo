# Fable — A Guided Review of GlobalHire Lite

This folder is a structured code review of the `globalhire-lite` codebase, written with a
specific goal: **take a junior software engineer and pull them toward mid/senior level for
CRUD web-app development jobs.** Every observation about this codebase is paired with the
general principle behind it, so you can carry the lesson to any Express/ASP.NET/Rails/Django
job you land.

## What you're looking at

GlobalHire Lite is an Employer-of-Record (EOR) demo app: hire international workers, run
onboarding, approve leave/timesheets, calculate payroll, generate invoices, offboard.
It's a genuinely good domain for learning because it has everything a real CRUD job has:
multi-tenancy, role-based access, workflow state machines, money math, and audit trails.

The repo contains **two complete implementations** of the same product:

| | Original | Migration |
|---|---|---|
| Location | `apps/api` + `apps/web` | `migrated-dotnet/` |
| Backend | Node, Express, TypeScript, Prisma, PostgreSQL, Zod | C#, ASP.NET Core Minimal API, in-memory store |
| Frontend | React, TanStack Query, React Hook Form, Tailwind | React, hand-rolled `useLoad` hook, plain CSS |
| Status | **Entirely commented out** (every line prefixed with `//`) | **The live code** |

That migration decision — commenting out 87 files (81 `.ts`/`.tsx` plus the Prisma schema, HTML, CSS, one `.js` and two `.cjs` configs) instead of using version control — is
itself one of the biggest lessons in this repo. See `04-overengineering-and-complexity.md`.

## Reading order

1. **[01-codebase-overview.md](01-codebase-overview.md)** — the domain, the architecture of both implementations, and how a request flows through each. Read this first.
2. **[02-what-is-done-well.md](02-what-is-done-well.md)** — the patterns worth stealing: state machines, tenant scoping, idempotency, business-rule tests, batched queries.
3. **[03-what-needs-improvement.md](03-what-needs-improvement.md)** — real bugs and gaps: broken auth, missing authorization checks, mass assignment, float money, thread safety, validation. Each one is a category of bug you WILL meet on the job.
4. **[04-overengineering-and-complexity.md](04-overengineering-and-complexity.md)** — where the code is more complicated than the problem: the comment-out migration, stringly-typed errors, anonymous response shapes, over-fetching list endpoints.
5. **[05-junior-to-senior-playbook.md](05-junior-to-senior-playbook.md)** — the general skills this codebase illustrates, organized as "what a junior does / what a senior does" for each CRUD competency.
6. **[06-exercises.md](06-exercises.md)** — concrete refactoring and feature exercises against this codebase, ordered by difficulty, with acceptance criteria — the fastest way to internalize everything above.
7. **[07-user-stories.md](07-user-stories.md)** — 25 feature-shaped user stories, from very easy to mid-level, each with acceptance criteria and a high-level implementation plan (which files, which functions). Where file 06 fixes what's broken, this file builds what's missing — the way work actually arrives on a team.

## The one-paragraph verdict

The original TypeScript app is a well-organized, realistic mid-level codebase with clean
layering, real security (bcrypt, JWT, httpOnly cookies, helmet), validation, transactions,
and business-rule tests — held back by `any`-typed service boundaries, floats for money,
and an awkward test seam. The .NET rewrite is admirably small and readable, keeps the good
state-machine rules, and *fixes* the money type (decimal), but it dropped most of the
security and authorization along the way: plaintext passwords, a session token that is
just the user's ID, missing per-resource access checks, and no input validation. The most
instructive thing in the repo is comparing the two side by side — the same feature done
with and without production discipline — and the migration process itself, which shows
exactly why "keep the old code in comments" is never the answer.
