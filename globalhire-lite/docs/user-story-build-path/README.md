# User Story Build Path

This suite is a progressive ticket ladder for GlobalHire Lite, grounded in the app's real EOR domain: workers, onboarding, country rules, leave, timesheets, payroll, invoices, audit logs, roles, and organizations (`README.md:1-17`, `apps/api/prisma/schema.prisma:121-367`).

## How To Use These Stories

Pick one story, read every cited file, write a short implementation note, then build. A story is done when each acceptance criterion is manually verifiable, backend authorization still matches the intended role boundary, request/response shape is validated or typed where the codebase has patterns, and tests cover the riskiest rule touched (`apps/api/src/middleware/requireRole.middleware.ts:4-10`, `packages/shared/src/index.ts:33-86`, `apps/api/src/tests/business-rules.test.ts:14-179`).

## Difficulty Progression

Stories 1-3 are small UI changes. Stories 4-5 add read-only UI features from existing data. Stories 6-7 add API or new state paths. Stories 8-9 are full-stack feature work. Story 10 asks for an architectural performance/cache decision.

## Getting Unstuck

Use this prompt:

```text
I'm working on Story X. I'm stuck on Y. Here is what I've tried: Z.
Don't give me the solution — ask me questions that help me figure it out.
Use these repo files and line ranges as context: [paste citations].
```

