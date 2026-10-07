# Architectural Cartographer

> **Code status (checked against this snapshot).** Every source file of the TypeScript
> implementation described here (`apps/api`, `apps/web`, `packages/shared`, plus the root `.eslintrc.cjs`: 87 files,
> 81 of them `.ts`/`.tsx`) is commented out (line by line; `index.html` and `index.css` as one block) under a
> `// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration` header. Line
> numbers still line up with the original code, so the file:line references in this document remain
> readable, but none of it compiles or runs. The runnable implementation is the in-memory ASP.NET Core
> API and React client in [`migrated-dotnet/`](../../migrated-dotnet/README.md). Treat this document as a guide to
> reading the original design, and check `migrated-dotnet/` before claiming any behavior works today.

This suite is a top-down architecture guide for GlobalHire Lite, an Employer of Record demo app for worker onboarding, employment records, leave, timesheets, payroll, invoicing, and offboarding (`README.md:1-17`). Use it to build a mental model before changing code.

Recommended order:

1. `00-reading-map.md`: first-pass map, top files, flows, and review red flags.
2. `01-junior-engineer.md`: setup, folders, entry points, components, routes, TypeScript, and glossary.
3. `02-mid-level-engineer.md`: architecture diagram, contracts, state, API map, and full-stack trace.
4. `03-senior-engineer.md`: critique, performance, security, testing, bugs, and ownership.
5. `04-reference-suite.md`: reusable onboarding, review, debugging, change, and interview references.

Every implementation claim includes a file and line range. Treat the citations as coordinates: open the source, verify the claim, then answer the checkpoints out loud.

