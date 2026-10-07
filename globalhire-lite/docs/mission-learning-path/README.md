# Mission Learning Path

> **Code status (checked against this snapshot).** Every source file of the TypeScript
> implementation described here (`apps/api`, `apps/web`, `packages/shared`, plus the root `.eslintrc.cjs`: 87 files,
> 81 of them `.ts`/`.tsx`) is commented out (line by line; `index.html` and `index.css` as one block) under a
> `// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration` header. Line
> numbers still line up with the original code, so the file:line references in this document remain
> readable, but none of it compiles or runs. The runnable implementation is the in-memory ASP.NET Core
> API and React client in [`migrated-dotnet/`](../../migrated-dotnet/README.md). Treat this document as a guide to
> reading the original design, and check `migrated-dotnet/` before claiming any behavior works today.

This suite is an active training campaign for GlobalHire Lite, an EOR workflow app for onboarding, employment, leave, timesheets, payroll, invoices, and offboarding (`README.md:1-17`). Do one mission at a time. Open the cited files, read the annotated source, answer the checkpoint out loud, then self-grade.

Tier 1 builds basic code-reading skill. Tier 2 connects layers and state. Tier 3 trains senior judgment around architecture, bugs, performance, security, tests, and system history. The goal is not memorization; the goal is learning how to trace unfamiliar software with confidence.

