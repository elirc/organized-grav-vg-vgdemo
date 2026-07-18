# Common Interview Story Prompts — Enhanced Edition

This file has two purposes:
1. A reference for every category of behavioral interview question you're likely to get
2. A worked example for each category showing what a strong answer sounds like — with coaching notes on what interviewers actually listen for

Use the worked examples as a model for the shape and pacing of your real answers. Do not use them verbatim — adapt the content to your actual experience.

---

## How To Structure Any Story

Every story follows this shape. Vary the length — a 90-second version and a four-minute version of the same story, so you can adjust in real time.

| Step | What it is | Pitfall to avoid |
|---|---|---|
| Situation | The context — product, team, what was happening | Too long; the interviewer needs context, not history |
| Task | Your specific responsibility | Vague ("I was involved") instead of specific ("I owned") |
| Action | What you did — first-person, specific verbs | Saying "we" instead of "I" for your own contributions |
| Result | What changed because of your action | No result at all, or just "it worked" |
| Reflection | What you'd do differently now | Skipping this — it shows maturity and self-awareness |

---

## 1. Challenging Technical Problem

**Common prompts:**
- "Tell me about the hardest bug you solved."
- "Tell me about a technically complex project."
- "Tell me about a time you had to learn a new system quickly."

**What interviewers listen for:**
- Do you isolate causes systematically instead of guessing?
- Do you trace data flow rather than jumping to code changes?
- Do you add tests after fixing, so it doesn't come back?
- Did you communicate during the investigation, or disappear?

---

**Worked Example:**

> "A payroll total looked wrong — about 15% lower than expected for one worker. The number wasn't obviously broken, which made it harder.
>
> I started at the UI: what was displayed matched exactly what the API returned, so it wasn't a formatting issue. I checked the API response for that worker's payroll item — hours were correct, salary was correct, but the overtime multiplier was 1.0 instead of 1.5. I traced it to the calculation service: the employment record was marked 'full-time exempt,' and the country rule for that country had `overtimeEligible: false` for exempt workers. The worker had been reclassified from exempt to non-exempt last month, but the country rule snapshot on the payroll draft was cached from when the draft was first created — before the reclassification.
>
> The fix was to read country rules fresh at calculation time, not snapshot them on draft creation. I added a failing unit test first, then fixed the service. I also added a test for the exempt/non-exempt boundary specifically.
>
> In hindsight, the caching decision had been made for performance, but it traded accuracy for speed in a place where accuracy is non-negotiable. If I were designing it today, I'd refresh country rules at calculation time and cache only if the calculation service became a bottleneck — measure first."

**Coaching note:** Notice the path: UI → API → service → data state → root cause. That's the debugging method, and naming it shows discipline. The reflection (caching tradeoff) shows senior thinking.

---

**Good GlobalHire-style topics for this category:**
- Payroll total was wrong
- Worker activation allowed an invalid state
- Cross-tenant query risk discovered
- Date boundary bug in payroll or leave
- A double-submit created duplicate payroll items

---

## 2. Architectural Decision

**Common prompts:**
- "Tell me about an architecture you designed or influenced."
- "How do you decide between two technical approaches?"
- "Tell me about a tradeoff you made."

**What interviewers listen for:**
- Do you understand tradeoffs — not just "X is better" but "X costs this and buys that"?
- Do you match architecture to project risk and team size?
- Can you avoid over-engineering?
- Did you consider the failure mode of each option?

---

**Worked Example:**

> "We needed to decide whether to introduce a service layer before the first release or keep business logic close to the endpoints. There was a real cost to adding layers early — slower initial development, more ceremony.
>
> I separated the question by risk. For simple lookup endpoints — list countries, get org settings — I agreed that route-level logic was acceptable temporarily. For worker activation and payroll calculation, I argued for services and tests. My framing was: what is the blast radius if this code is wrong? A wrong country list is a cosmetic bug. Wrong activation logic could allow a worker into payroll before their contract is signed. Those aren't equivalent risks, so they shouldn't get the same architecture.
>
> We shipped the high-risk workflows with services and tests. Six months later, those service classes had been modified four times with new business rules. The simple endpoints were untouched. The tradeoff held: we spent abstraction effort where it paid off.
>
> The thing I'd do differently is document the decision explicitly — why these got services and those didn't — so future engineers don't add a service to every new endpoint by default, or avoid them everywhere."

**Coaching note:** The strongest architectural decision stories name both sides of the tradeoff, show that you shipped something rather than just designed, and include a real result that validated the decision.

---

**Good topics for this category:**
- Service layer vs endpoint-level business logic
- Minimal APIs vs controllers
- EF Core with projections vs raw SQL for a reporting query
- Build vs buy for payroll/compliance
- Idempotency design for background jobs

---

## 3. Security Or Authorization

**Common prompts:**
- "Tell me about protecting sensitive data."
- "How have you handled permissions in a multi-tenant system?"
- "What security concern would you look for in this kind of app?"

**What interviewers listen for:**
- Backend enforcement — not "the UI hides the button"
- Tests for unauthorized access, not just happy-path access
- Awareness of what can go wrong after initial implementation (later features missing checks)
- Defense in depth

---

**Worked Example:**

> "The highest-risk security issue in an HR platform is cross-tenant data exposure — a client admin from one company seeing data from another. The original implementation protected list endpoints correctly, but detail endpoints had only role checks: 'is this a client admin?' without 'is this worker in the client admin's org?'
>
> I added a tenant scoping pattern to service methods. Every method that fetched a specific record took an actor context and applied an ownership check after loading the record. A client admin's request for worker ID 123 would fail if worker 123 belonged to a different org, regardless of their role.
>
> I backed this with integration tests: seed two organizations, authenticate as an admin of org A, try to access org B's worker, confirm 403. I ran those tests against every endpoint that accepted a worker ID. The first run found three endpoints with missing tenant checks — all added after the original security review, by people who didn't know the convention.
>
> The lesson I took: security tests need to be systematic, not just cover what you remember to write. Testing every ID-accepting endpoint as a baseline is the convention, not a special effort."

**Coaching note:** Concrete finding (three missed endpoints) makes this story credible. The "found by test not by incident" framing is better than having a data breach story.

---

**Good topics for this category:**
- Tenant isolation for worker and payroll data
- Role-based access with authorization policies
- Worker self-service scoping (a worker can only see their own profile)
- Audit logs as part of the trust model
- HTTP-only cookies vs bearer tokens

---

## 4. Performance

**Common prompts:**
- "Tell me about a performance issue you found and fixed."
- "How would you optimize a slow endpoint?"
- "What would you do if the dashboard became slow under load?"

**What interviewers listen for:**
- Measure before guessing — did you look at actual data?
- Understanding of database query shape, not just application code
- Ability to fix root causes, not just add caching as a band-aid
- Knowing what "good enough" looks like

---

**Worked Example:**

> "The dashboard was loading organization data with full entity graphs — workers with all their timesheets, payroll runs, onboarding tasks. At a handful of records it was fine. Under load test with realistic data it was taking three to five seconds.
>
> I looked at the generated SQL first. The `Include()` chains were producing enormous queries with many joins. The data being sent across the wire was ten times what the dashboard displayed.
>
> I replaced the single graph-loading query with focused aggregate queries: a COUNT for active workers, a SELECT of the five most recent payroll runs projecting only summary fields, a COUNT for pending approvals. Each query was small and targeted.
>
> During the fix I also found a missing index — the onboarding task filter by status was doing a full table scan. Adding the index dropped that specific query from 800ms to 12ms.
>
> Response time went from three seconds to under 200ms. The key insight was that the performance problem wasn't caching or application logic — it was data shape. Fetch what the page needs, nothing more."

**Coaching note:** Naming the SQL inspection step shows you know where to look. The index finding is a bonus detail that adds credibility. The "data shape, not caching" conclusion shows mature performance reasoning.

---

**Good topics for this category:**
- Dashboard aggregate query optimization
- N+1 queries in worker list with employment details
- Projection DTOs to avoid loading full entity graphs
- Missing indexes on OrganizationId, status, date range columns
- Payroll calculation performance at scale

---

## 5. Production Incident Or Failure

**Common prompts:**
- "Tell me about a time production broke."
- "Tell me about a mistake you made."
- "How do you respond under pressure?"

**What interviewers listen for:**
- Ownership without panic — "I" statements, not blame
- Systematic triage, not random code changes
- Clear communication with stakeholders during the incident
- Regression prevention afterward

---

**Worked Example:**

> "We shipped a migration that renamed a JSON field in the worker API response — `status` became `workerStatus`. The backend change was intentional and correct. But the React app read `worker.status` everywhere, and nobody had run a comparison of the API responses before and after.
>
> Discovery was a Slack message from a client admin during a board demo: 'all our workers show as blank status.' Every status badge in the app was showing '—' because `worker.workerStatus` was populated but `worker.status` was undefined.
>
> I confirmed the symptom in the staging environment in two minutes. The fix was a one-line change to restore the original field name in the response DTO mapping, deployed in 15 minutes. I also sent a note to the team explaining what happened.
>
> The change that came out of it: before any API response shape change, we run a comparison test — seed data, call old and new versions, diff the response fields. That test would have caught this in minutes during development.
>
> If I'm honest, the mistake was treating an API contract change as an internal refactor. An API response is a published interface. I learned to flag those changes explicitly and test them explicitly."

**Coaching note:** The self-aware ending ("the mistake was treating it as internal") is what makes this a senior answer. Interviewers want to see that you extracted a principle, not just fixed the bug.

---

**Good topics for this category:**
- JSON field name change broke the frontend
- Payroll calculation bug found after approval
- Auth cookie misconfiguration after a deployment
- Duplicate records from a double-submit
- Background job failures with no retry

---

## 6. Refactoring

**Common prompts:**
- "Tell me about a refactor you led."
- "How do you improve legacy code safely?"
- "How do you refactor without breaking behavior?"

**What interviewers listen for:**
- Tests before high-risk changes, not after
- Stable external contracts during internal change
- Incremental steps, not big-bang rewrites
- Clear outcome — is the code actually better after?

---

**Worked Example:**

> "The API had worker activation logic scattered across three places: a validation step in the middleware, a business rule check in the route handler, and a database write in a utility function. The logic was duplicated, slightly inconsistent, and untestable without spinning up the full server.
>
> Before changing anything, I added characterization tests — integration tests that documented what the current behavior was, including edge cases I didn't want to accidentally change. Then I moved the logic into a single WorkerService.ActivateAsync method, with all the checks consolidated there.
>
> I ran the characterization tests after each move. Every test had to stay green. No behavior change, just structure change.
>
> Once the logic was consolidated, I added unit tests for the preconditions — ones that ran without a server. That gave us a test surface we didn't have before.
>
> The concrete outcome: the next business rule change (adding a bank details check to activation) took 20 minutes. Before the refactor, it would have required finding and updating three places, with no test safety net."

**Coaching note:** Characterization tests are a senior technique. Naming them shows you understand the difference between "tests that verify ideal behavior" and "tests that prevent accidental behavior changes."

---

**Good topics for this category:**
- Moving route logic into services
- Consolidating scattered role checks into policies
- Introducing DTOs to replace raw entity responses
- Standardizing error response shapes
- Moving validation from UI to service layer

---

## 7. Working With Product Or Ambiguity

**Common prompts:**
- "Tell me about working with ambiguous requirements."
- "How do you handle unclear scope?"
- "Tell me about working with product or design on a hard tradeoff."

**What interviewers listen for:**
- You ask clarifying questions, you don't just build what you assume
- You name assumptions explicitly rather than hiding them
- You can scope down to something valuable and shippable
- You communicate tradeoffs in business terms, not just technical terms

---

**Worked Example:**

> "Payroll preview was requested as a feature — 'show clients what their payroll will look like before they approve it.' The ambiguity was: does 'payroll preview' mean we compute real legal payroll, or does it mean we estimate the costs so clients can review and approve?
>
> I raised the distinction explicitly. Computing legal payroll for all supported countries would require compliance rules for each country, tax table lookups, and statutory benefit calculations — weeks of work per country. An estimate using our existing country rule model (salary + employer cost percentage) could ship in a sprint and still give clients a meaningful number to review.
>
> I named the assumption: 'payroll preview shows estimated costs, not legally calculated payroll, and the app makes that clear with a label.' The product owner agreed. We shipped it with a visible disclaimer, and clients used it as intended — a sanity check, not a legal calculation.
>
> The longer-term version would integrate a payroll provider for real calculations, but we validated the workflow with an estimate first. That's the faster and safer sequencing."

**Coaching note:** This story shows technical judgment in service of product thinking. The "name the assumption explicitly" step is what interviewers are listening for.

---

**Good topics for this category:**
- Payroll preview vs real legal payroll
- Document metadata only vs actual file storage
- Country rules as demo config vs full compliance automation
- Which roles can approve which workflow steps
- When to use an in-memory store vs a real database

---

## 8. Disagreement Or Conflict

**Common prompts:**
- "Tell me about a disagreement with a teammate."
- "Tell me about receiving pushback on a technical decision."
- "Tell me about a time you changed your mind."

**What interviewers listen for:**
- You disagree respectfully and with evidence
- You separate "I think this is better" from "this is provably wrong"
- You're open to being wrong, and have been
- You understand the difference between technical disagreement and personal conflict

---

**Worked Example:**

> "I had a disagreement about whether to add integration tests for the tenant isolation checks before shipping. My teammate's position was that we were moving fast and the tests could come after we had more users and knew what to test. My position was that tenant isolation was exactly the kind of thing you can't test reactively — if you discover the bug via a data breach, the test is too late.
>
> I didn't frame it as 'you're wrong.' I asked: what's our plan for discovering a cross-tenant access bug before a client does? If we don't have an answer, that's the gap. The framing shifted the conversation from 'tests slow us down' to 'how do we have confidence in this specific claim.'
>
> We agreed to write a focused integration test suite — just tenant isolation, not full coverage — before shipping the feature to external users. It took four hours. It caught three missed endpoint checks.
>
> I was right about the risk. But I also acknowledge I could have framed the argument better from the start — 'here's the specific risk and here's the test that closes it' is more convincing than 'we need tests.'"

**Coaching note:** The self-aware ending ("I could have framed it better") is important. It shows you've reflected on the interpersonal dynamic, not just the technical outcome.

---

**Good topics for this category:**
- Whether to add a service layer before shipping
- Whether integration tests are worth the time
- Whether to build payroll logic internally or buy it
- Whether a quick endpoint can ship without tests
- Whether to use a framework feature or write explicit code

---

## 9. Leadership And Mentoring

**Common prompts:**
- "Tell me about mentoring someone."
- "How do you help a new teammate ramp up?"
- "How do you influence without authority?"

**What interviewers listen for:**
- You make others more effective, not just yourself
- You explain systems in terms of structure and flow, not just facts
- You set standards through example and review, not just by telling people
- You understand that good onboarding is an engineering investment, not just a nicety

---

**Worked Example:**

> "A new engineer joined mid-sprint with no documentation and a large codebase to get up to speed on. Instead of asking them to read the code top-to-bottom, I gave them a reading path: start at Program.cs and service registrations, then trace one worker activation request from the route through the service, to the database query, to the test file.
>
> That single path exposed every important convention in the codebase: how dependency injection worked, how the actor context was passed, how EF Core queries were structured, how tests were set up. Everything else was a variation on that pattern.
>
> For their first task, I gave them something calibrated to build confidence and teach the codebase: add a new validation check to the offboarding workflow that verifies all outstanding timesheets are approved. It required reading an existing service, adding a guard condition, and writing a unit test. Medium complexity, clear success criteria, no guesswork.
>
> They shipped it in a day. The PR was clean. The test was well-structured. After that they were self-sufficient on new features.
>
> The investment was maybe three hours of my time. The return was a teammate who didn't need hand-holding through every subsequent task."

**Coaching note:** Good mentoring stories show a specific technique (reading path), a specific task (the offboarding validation), and a measurable outcome (they were self-sufficient). Vague "I helped them ramp up" answers don't land.

---

**Good topics for this category:**
- Creating a reading path through a domain codebase
- Pairing on a first PR with high-risk business rules
- Reviewing PRs for tenant isolation and workflow correctness
- Setting a convention and explaining the reason, not just the rule

---

## 10. Testing Strategy

**Common prompts:**
- "What do you test and what don't you test?"
- "Tell me about improving test coverage."
- "How do you test business logic?"

**What interviewers listen for:**
- Risk-based prioritization, not coverage-percentage chasing
- Correct judgment about unit vs integration tests
- Testing invalid paths and edge cases, not just happy paths
- Tests as documentation of business rules

---

**Worked Example:**

> "I approach testing by risk, not coverage. The highest-risk areas in an HR/payroll system are tenant isolation, payroll calculation, and worker lifecycle transitions. Those get both unit tests and integration tests. Simple static lookups — list countries, get org config — get nothing or a single smoke test.
>
> For payroll calculation specifically, I write unit tests that read like requirements: `CalculatePayroll_ExcludesInactiveWorkers`, `CalculatePayroll_UsesOnlyApprovedTimesheets`, `CalculatePayroll_RejectsDraftRunCalledTwice`. Each test case is a named business rule. If the test fails, you know exactly which rule broke.
>
> For tenant isolation, I write integration tests using WebApplicationFactory with two seeded organizations. Test: authenticate as org A admin, try to access org B worker, expect 403. That's the test that actually catches the bug — the unit test can't, because it doesn't go through the auth middleware.
>
> The result is a test suite that's smaller than 100% coverage would imply, faster to run, and more directly tied to the things that matter."

**Coaching note:** Naming specific test cases (`CalculatePayroll_ExcludesInactiveWorkers`) shows you actually write tests, not just talk about testing. The unit-vs-integration judgment shows maturity.

---

**Good topics for this category:**
- Payroll service unit tests
- Worker activation precondition tests
- Tenant isolation integration tests
- API contract parity tests during migration
- Characterization tests before a refactor

---

## 11. Learning A New Stack

**Common prompts:**
- "How do you ramp up in a new technology?"
- "You have less .NET experience — how would you succeed here?"
- "Tell me about learning something quickly."

**What interviewers listen for:**
- Humility — no pretending to know more than you do
- Transferable architecture thinking — you understand the shape of the problem
- Concrete learning plan — not "I'll figure it out" but a specific sequence
- Evidence of having done the translation work

---

**Worked Example:**

> "My production experience is TypeScript — Express, Prisma, Zod, React. For .NET I understand the shape of the architecture better than the idioms. My approach is to map responsibilities explicitly rather than learn the whole ecosystem at once.
>
> Express route handler → ASP.NET Core endpoint. Prisma model → EF Core entity and DbContext. Zod schema → request DTO with validation. Service function → injected service class. Vitest → xUnit. Supertest integration test → WebApplicationFactory. I already know what each of those layers needs to do — I'm learning the .NET way to express it.
>
> I built a small proof-of-concept: a worker activation endpoint with a service layer, EF Core queries, and an xUnit test. The friction point I hit was EF Core's change tracking — entities you load are tracked by default, so `SaveChangesAsync` saves changes you didn't intend if you're not careful with `AsNoTracking`. That's the kind of thing you only learn by building.
>
> I'd ramp fully in two to four weeks of real work. I can contribute on architecture, test strategy, and domain logic from day one while getting sharper on idiomatic C# on the job."

**Coaching note:** The friction point (change tracking) makes this answer credible. Anyone can say "I'll learn fast." Someone who can name a specific friction point they already encountered has actually done the work.

---

## 12. Ownership

**Common prompts:**
- "Tell me about a project you owned end to end."
- "Tell me about driving something across the finish line."
- "Tell me about balancing quality and deadlines."

**What interviewers listen for:**
- You define done — you don't wait to be told the task is complete
- You communicate risk proactively, not after things break
- You verify results, not just "I shipped it"
- You leave the system better than you found it

---

**Worked Example:**

> "I owned the payroll preview feature end to end — from the initial design conversation to the API, the service layer, the frontend integration, and the follow-up fixes.
>
> The design decision I had to make early was scope: should this be real legal payroll or an estimate? I proposed an estimate approach using the country rule model we already had, shipped with a clear label. That let us validate the workflow without building compliance infrastructure we weren't ready for.
>
> During development I caught a calculation edge case — workers reclassified between exempt and non-exempt had the wrong overtime multiplier because country rules were cached on draft creation. I flagged it before shipping, fixed it, and added a test.
>
> After shipping, I monitored the first few payroll runs by EOR specialists, checked the audit logs, and ran a comparison on the totals to make sure nothing was systematically off. That's the verification step that a lot of engineers skip.
>
> The feature shipped on time, no post-launch issues. The EOR specialists trusted the numbers enough to use it in client demos the first week."

**Coaching note:** Ownership stories need a "you verified it worked" moment. Engineers who just "ship and move on" aren't showing ownership — they're showing task completion. Verifying the real outcome is what ownership looks like.

---

## 13. Customer Or User Impact

**Common prompts:**
- "Tell me about a feature that helped users."
- "How do you think about user impact in your work?"
- "Tell me about making a workflow meaningfully easier."

**What interviewers listen for:**
- You connect code decisions to user outcomes
- You understand the workflow pain, not just the technical requirements
- You can prioritize improvements that matter to users, not just to code quality

---

**Worked Example:**

> "The onboarding workflow had no visibility. An EOR specialist would create a worker, the worker would get tasks assigned, and then nothing happened unless the specialist remembered to check manually. Workers would sometimes go silent on tasks — not complete them, not ask questions — and the specialist wouldn't know for days.
>
> I added an onboarding progress view to the client admin dashboard. It showed each worker in onboarding, which tasks were done, which were pending, and how long the worker had been in onboarding overall. The view was just a dashboard query — five fields, a status badge, a count.
>
> Within two weeks, client admins reported that their average time-to-active for new workers dropped because they could see which workers were stuck and follow up proactively. The feature itself was straightforward. The value came from making a previously invisible workflow visible."

**Coaching note:** You don't need a massive feature to have a good customer impact story. A dashboard view that surfaces the right information at the right time can have outsized impact with minimal code.

---

## 14. Data Modeling

**Common prompts:**
- "Tell me about a schema you designed."
- "How do you model complex relationships?"
- "How would you model this domain?"

**What interviewers listen for:**
- Clear entity boundaries — what belongs in one table vs multiple
- Understanding of relationships and foreign keys
- Awareness of constraints, indexes, and data integrity
- Separation of concerns at the data layer

---

**Worked Example:**

> "The most interesting modeling decision in the HR platform was separating Worker from Employment. The naive model puts everything on one table. But a worker can have multiple employments over time — an initial contract, then a renewal with different terms, then a different role. If employment terms are columns on the worker record, you can only represent the current state.
>
> I modeled them as separate entities: Worker holds personal identity (name, contact, country), Employment holds contractual terms (salary, employment type, start date, end date, status). A worker can have multiple employment records, and the active one is the one with status ACTIVE and no end date.
>
> Payroll refers to Employment, not Worker, because payroll is based on the terms in effect during the period — not the worker's current terms. That distinction matters for retroactive corrections and for historical payroll reconciliation.
>
> The schema also had explicit indexes on the fields used in queries: OrganizationId on Worker and Employment, WorkerId on Timesheet and PayrollItem, period start and end on PayrollRun. Those indexes were designed as part of the schema, not added later when the queries were slow."

**Coaching note:** The "payroll refers to Employment not Worker" distinction is a senior insight. It shows you've thought about historical accuracy, not just current state. That kind of nuance signals domain expertise.

---

## 15. Communication

**Common prompts:**
- "Tell me about explaining a technical topic to non-engineers."
- "Tell me about communicating a tradeoff to stakeholders."
- "How do you adjust technical depth to your audience?"

**What interviewers listen for:**
- You can remove jargon without removing substance
- You understand what the audience needs to decide, and you give them that
- You adjust depth in real time based on feedback
- You can write as well as you can speak

---

**Worked Example:**

> "I had to explain to a client success manager why we couldn't generate a legally compliant payroll run for a new country in two weeks. The technical reality was that the country required statutory benefit calculations that we didn't have compliance rules for. Saying 'we don't have the compliance rules' was accurate but meant nothing to her.
>
> I reframed it: 'Think of our payroll system like a calculator app. We've built the calculator, but we haven't loaded the tax tables for this country yet. Without accurate tax tables, the numbers we'd give you could be wrong in ways that create legal liability. The two-week timeline doesn't give us enough time to research and validate those tables accurately.'
>
> She immediately understood — and more importantly, she understood the risk in business terms, not technical terms. She agreed to push the timeline and communicate to the client that we'd have it right in six weeks rather than quickly and wrong in two.
>
> The lesson I took: when explaining a constraint, the most useful thing you can explain is the consequence of ignoring it. 'We can't do it' doesn't land. 'Here's what breaks if we rush it' does."

**Coaching note:** The "tax tables for a calculator" analogy is good because it maps to something concrete the non-engineer already understands. Good technical communication is mostly analogy selection.

---

## Your First Five Stories To Rehearse

Start here — these cover the widest interview surface:

1. A challenging bug (category 1) — debugging discipline and data tracing
2. An architectural decision (category 2) — risk-based reasoning
3. A security or tenant-isolation moment (category 3) — backend enforcement
4. A disagreement (category 8) — respectful technical influence
5. A learning-new-stack answer (category 11) — humility and transferable thinking

Then add:

6. A mentoring story (category 9)
7. A production incident (category 5)
8. A testing strategy answer (category 10)
9. A product ambiguity story (category 7)
10. A customer impact story (category 13)
