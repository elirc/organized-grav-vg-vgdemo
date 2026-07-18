# C#/.NET Interview Prep For GlobalHire-Style Work

This folder helps you prepare for a C#/.NET software engineering interview using a Velocity Global-style EOR/HR operations codebase as the backdrop.

Use this material honestly: if your production experience was mainly JavaScript, TypeScript, and related stacks, frame .NET as a technology you are actively ramping on, then connect it to the same architectural problems you already know: workflow state, RBAC, multi-tenant data access, payroll-style calculations, compliance rules, and readable service boundaries.

## Files

- [01-interview-stories-dotnet.md](./01-interview-stories-dotnet.md): STAR-style stories you can adapt for .NET/C# interviews.
- [02-typescript-to-dotnet-translation.md](./02-typescript-to-dotnet-translation.md): How concepts from Express, Prisma, Zod, and TypeScript map to ASP.NET Core and C#.
- [03-architectural-cartography.md](./03-architectural-cartography.md): How to read and explain this codebase like an architect.
- [04-learning-map.md](./04-learning-map.md): A practical learning path for C#/.NET in this domain.
- [05-challenges-and-tradeoffs.md](./05-challenges-and-tradeoffs.md): Challenges that often come up in .NET HR/payroll workflow systems.
- [06-codebase-tour.md](./06-codebase-tour.md): A guided tour through the migrated .NET and React structure.
- [07-mid-senior-dotnet-story-bank.md](./07-mid-senior-dotnet-story-bank.md): More mid/senior SWE story templates involving C#/.NET architectural choices.
- [08-common-interview-story-prompts.md](./08-common-interview-story-prompts.md): Common behavioral and technical story categories to prepare before the interview.
- [09-aws-to-azure-experience-translation.md](./09-aws-to-azure-experience-translation.md): How to translate AWS/serverless, CI/CD, Git, and Agile delivery experience into the Azure language used in the job posting.

## Your Core Interview Angle

Short version:

> My strongest production background is in JavaScript and TypeScript, including full-stack workflow systems with auth, multi-tenant scoping, role-based access, service-layer business rules, and domain-heavy APIs. I have been mapping those same patterns into C# and ASP.NET Core: controllers or minimal APIs, dependency injection, strongly typed domain models, service classes, middleware, and EF-style persistence. The syntax and ecosystem are different, but the engineering problems are familiar.

Longer version:

> In an EOR or global employment product, the hard parts are not just the language. The hard parts are correctly modeling worker lifecycle, organization boundaries, approvals, payroll periods, audit trails, and compliance rules while keeping the code testable. My prior work gives me a strong domain and architecture foundation. For C#/.NET, I focus on how ASP.NET Core expresses those same concerns: middleware for auth, services for business logic, DI for composition, records/classes for contracts and models, async APIs for I/O, and tests around state transitions.

## What To Practice Out Loud

1. Explain a request flow from React to API to service to database.
2. Explain tenant isolation and RBAC.
3. Explain why payroll calculations belong on the backend.
4. Explain a workflow state transition, such as onboarding to active or payroll draft to calculated.
5. Explain how TypeScript validation maps to C# request DTOs and validation.
6. Explain how you would harden the demo for production.

## Good Honest Framing

Use:

> I did similar work in TypeScript, and I have been translating those patterns into ASP.NET Core.

Avoid:

> I spent years building this exact thing in C#.

Use:

> I am comfortable with the domain and architecture, and I can ramp quickly on the .NET idioms because the underlying design problems are familiar.

Avoid:

> The stack difference does not matter.

The stack does matter. The point is that you can learn its idioms while bringing strong judgment about the product domain.
