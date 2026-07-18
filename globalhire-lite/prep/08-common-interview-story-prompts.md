# Common Interview Story Prompts To Prepare

This file lists story types that come up often in mid/senior software engineering interviews. Add your real examples under each category before practicing.

## How To Fill These In

For each story, write five bullets:

1. Situation: what was happening?
2. Task: what were you responsible for?
3. Action: what did you personally do?
4. Result: what changed because of it?
5. Reflection: what would you do differently now?

Keep the story honest. It is fine to say the original stack was TypeScript and then explain the .NET equivalent.

## 1. Challenging Technical Problem

Common prompts:

- "Tell me about the hardest bug you solved."
- "Tell me about a technically complex project."
- "Tell me about a time you had to learn a new system quickly."

Good GlobalHire-style topics:

- Payroll total was wrong.
- Worker activation allowed an invalid state.
- A cross-tenant query risk was discovered.
- Date boundary bug in leave or payroll period.

What interviewers listen for:

- Can you isolate causes?
- Can you reason through data flow?
- Do you add tests after fixing it?

## 2. Architectural Decision

Common prompts:

- "Tell me about an architecture you designed."
- "How do you decide between two technical approaches?"
- "Tell me about a tradeoff you made."

Good topics:

- Minimal APIs vs controllers.
- Service layer vs endpoint-level business logic.
- EF Core vs raw SQL for a reporting query.
- In-memory demo store vs database-backed persistence.
- Build vs buy for payroll/compliance providers.

What interviewers listen for:

- Do you understand tradeoffs?
- Do you match architecture to risk and project size?
- Can you avoid over-engineering?

## 3. Security Or Authorization

Common prompts:

- "Tell me about protecting sensitive data."
- "How have you handled permissions?"
- "What security concern would you look for in this system?"

Good topics:

- Tenant isolation.
- Role-based access.
- Worker self-service access.
- HTTP-only cookie auth.
- Audit logs for sensitive actions.

What interviewers listen for:

- Backend enforcement, not UI-only security.
- Tests for unauthorized access.
- Awareness of production hardening.

## 4. Performance

Common prompts:

- "Tell me about a performance issue you improved."
- "How would you optimize a slow endpoint?"
- "What would you do if the dashboard became slow?"

Good topics:

- Dashboard aggregate queries.
- Avoiding N+1 queries.
- Projecting DTOs instead of loading full entities.
- Adding indexes on `OrganizationId`, `WorkerId`, and date ranges.

What interviewers listen for:

- Measure before guessing.
- Understand database query shape.
- Avoid unnecessary data loading.

## 5. Production Incident Or Failure

Common prompts:

- "Tell me about a time production broke."
- "Tell me about a mistake you made."
- "How do you respond under pressure?"

Good topics:

- Bad release changed a workflow status.
- API contract broke a frontend page.
- Auth/cookie configuration failed.
- Payroll or invoice data needed correction.

What interviewers listen for:

- Ownership without panic.
- Clear triage.
- Communication.
- Regression prevention.

## 6. Refactoring

Common prompts:

- "Tell me about a refactor you led."
- "How do you improve legacy code?"
- "How do you refactor without breaking behavior?"

Good topics:

- Moving route logic into services.
- Introducing DTOs.
- Standardizing error responses.
- Replacing duplicated role checks with policies.

What interviewers listen for:

- Tests before high-risk changes.
- Stable external contracts.
- Incremental migration.

## 7. Working With Product Or Ambiguity

Common prompts:

- "Tell me about ambiguous requirements."
- "Tell me about working with product/design."
- "How do you decide scope?"

Good topics:

- Payroll preview vs real payroll.
- Document metadata-only upload vs full file storage.
- Country rules as demo assumptions rather than legal automation.
- Which roles can approve which workflow steps.

What interviewers listen for:

- Clarifying questions.
- Naming assumptions.
- Reducing scope without losing the core user value.

## 8. Disagreement Or Conflict

Common prompts:

- "Tell me about a disagreement with a teammate."
- "Tell me about receiving pushback."
- "Tell me about changing your mind."

Good topics:

- Whether to add a service layer.
- Whether to ship a quick endpoint without tests.
- Whether to use a framework abstraction or explicit code.
- Whether to build payroll logic internally.

What interviewers listen for:

- Respectful disagreement.
- Evidence-based reasoning.
- Willingness to compromise.

## 9. Leadership And Mentoring

Common prompts:

- "Tell me about mentoring someone."
- "How do you help others ramp up?"
- "How do you influence without authority?"

Good topics:

- Creating a reading map.
- Pairing through a request flow.
- Reviewing PRs for tenant isolation and business rules.
- Helping a teammate write their first service test.

What interviewers listen for:

- You make others more effective.
- You explain systems clearly.
- You set standards without being rigid.

## 10. Testing Strategy

Common prompts:

- "What do you test?"
- "Tell me about improving test coverage."
- "How do you test business logic?"

Good topics:

- Payroll service tests.
- Worker activation tests.
- Tenant isolation integration tests.
- API contract tests during migration.

What interviewers listen for:

- Risk-based prioritization.
- Unit vs integration test judgment.
- Testing invalid paths.

## 11. Learning A New Stack

Common prompts:

- "How do you ramp up in a new technology?"
- "You have less .NET experience; how would you succeed here?"
- "Tell me about learning something quickly."

Good answer shape:

> I map known responsibilities to the new ecosystem. Express routes become ASP.NET Core endpoints, Prisma maps to EF Core, Zod maps to DTO validation, service functions map to injected service classes, and Vitest maps to xUnit or NUnit. Then I build small examples and read production code with a request-flow mindset.

What interviewers listen for:

- Humility.
- Transferable architecture skill.
- Concrete learning plan.
- No pretending.

## 12. Ownership

Common prompts:

- "Tell me about a project you owned end to end."
- "Tell me about driving something across the finish line."
- "Tell me about balancing quality and deadlines."

Good topics:

- Owning worker lifecycle workflow.
- Owning payroll preview.
- Owning migration plan.
- Owning docs and onboarding material.

What interviewers listen for:

- You define done.
- You communicate risk.
- You verify results.
- You leave the system better documented.

## 13. Customer Impact

Common prompts:

- "Tell me about a feature that helped users."
- "How do you think about user impact?"
- "Tell me about making a workflow easier."

Good topics:

- Clear dashboard for operations.
- Role-aware navigation.
- Worker onboarding progress.
- Payroll approval workflow.

What interviewers listen for:

- You connect code to user outcomes.
- You understand workflow pain.
- You can prioritize practical improvements.

## 14. Data Modeling

Common prompts:

- "Tell me about a schema you designed."
- "How do you model relationships?"
- "How would you model this domain?"

Good topics:

- Organization as tenant boundary.
- Worker vs User separation.
- Employment as separate from Worker.
- PayrollRun vs PayrollItem.
- AuditLog as append-only history.

What interviewers listen for:

- Clear entity boundaries.
- Understanding of relationships.
- Awareness of constraints and indexes.

## 15. Communication

Common prompts:

- "Tell me about explaining a technical topic to non-engineers."
- "Tell me about writing documentation."
- "How do you communicate tradeoffs?"

Good topics:

- Explaining payroll preview is not legal payroll.
- Explaining why tenant isolation tests matter.
- Explaining why a migration should preserve contracts first.
- Creating architecture docs or reading maps.

What interviewers listen for:

- Clear language.
- No unnecessary jargon.
- You can adjust detail to audience.

## Your First Stories To Add

Start with these five because they cover the widest interview surface:

1. A challenging bug or production issue.
2. An architectural decision with tradeoffs.
3. A security/RBAC/tenant-isolation story.
4. A conflict or disagreement story.
5. A mentoring or leadership story.

Then add:

6. A performance story.
7. A testing strategy story.
8. A learning-new-stack story.
9. A product ambiguity story.
10. A customer-impact story.
