# User Stories

## Story 1: Show Worker Email More Clearly
**Difficulty:** Easy
**Estimated Time:** 1 hour
**Skills You'll Practice:** JSX reading, table rendering, Tailwind classes
**The Story:** As a client admin, I want worker emails to be easier to scan so that I can quickly verify I am opening the right profile.
**Acceptance Criteria:**
- [ ] Worker name remains linked to `/workers/:id`.
- [ ] Email remains visible in the worker row.
- [ ] Email has a distinct visual treatment from the name.
- [ ] Empty worker list behavior is not changed.
**Files You'll Likely Touch:** `apps/web/src/features/workers/WorkersPage.tsx` renders worker name and email in the directory table (`apps/web/src/features/workers/WorkersPage.tsx:47-66`).
**High-Level Implementation Plan:**
1. In `WorkersPage`, find the `<Td>` that renders name and email.
2. Adjust only the email display markup/classes.
3. Verify the row still maps over `data` and links with `worker.id`.
**Tips:**
- Keep the existing `Link` target from `WorkersPage.tsx:55`.
- Do not change `workersApi.list`; the list route already returns worker email (`apps/api/src/modules/workers/workers.routes.ts:30-39`).
- Keep `Table`, `Td`, and `Th` primitives (`apps/web/src/components/ui/Table.tsx:1-13`).
**What Could Go Wrong:**
- The link target changes and detail navigation breaks.
- The email becomes too faint on small screens.
**Stretch Goal:** Add a `mailto:` link without changing the worker name link.
**Connects To:** Story 2, because both are safe display-only changes.

## Story 2: Add Payroll Status Help Text
**Difficulty:** Easy
**Estimated Time:** 1 hour
**Skills You'll Practice:** Conditional rendering, domain vocabulary, status reading
**The Story:** As an EOR specialist, I want payroll detail to explain the next action for the current status so that I know whether to calculate, approve, lock, or invoice.
**Acceptance Criteria:**
- [ ] `DRAFT` runs show a message about calculating.
- [ ] `CALCULATED` runs show a message about approval.
- [ ] `APPROVED` runs show a message about locking or invoice generation.
- [ ] `LOCKED` runs show a message that the run is final.
**Files You'll Likely Touch:** `apps/web/src/features/payroll/PayrollDetailPage.tsx` renders status and action buttons (`apps/web/src/features/payroll/PayrollDetailPage.tsx:21-31`).
**High-Level Implementation Plan:**
1. Add a small status-to-message helper in `PayrollDetailPage.tsx`.
2. Render the message near the status badge/action area.
3. Keep existing button conditions unchanged.
**Tips:**
- Match statuses enforced by payroll service transitions (`apps/api/src/modules/payroll/payroll.service.ts:45-158`).
- Keep `Badge` rendering untouched (`apps/web/src/features/payroll/PayrollDetailPage.tsx:26`).
- Avoid coupling text helper to click handlers.
**What Could Go Wrong:**
- Text promises an action the current role cannot perform.
- The helper misses a status.
**Stretch Goal:** Add a frontend test for the status message.
**Connects To:** Story 3, because both improve domain clarity without backend changes.

## Story 3: Surface Country Rule Requirements On Worker Detail
**Difficulty:** Easy
**Estimated Time:** 1.5 hours
**Skills You'll Practice:** Existing response reading, conditional JSX, domain modeling
**The Story:** As a client admin, I want to see whether a worker's country requires tax ID, bank details, and signed contract so that onboarding expectations are obvious.
**Acceptance Criteria:**
- [ ] Worker detail shows tax ID requirement.
- [ ] Worker detail shows bank details requirement.
- [ ] Worker detail shows signed contract requirement.
- [ ] Missing `countryRule` data is handled gracefully.
**Files You'll Likely Touch:** `apps/web/src/features/workers/WorkerDetailPage.tsx` displays worker detail; `apps/api/src/modules/workers/workers.routes.ts` returns `countryRule` in detail (`apps/api/src/modules/workers/workers.routes.ts:43-67`).
**High-Level Implementation Plan:**
1. Inspect `WorkerDetailPage` sections and data use.
2. Use `worker.countryRule` from the backend detail response.
3. Add a compact read-only requirements display.
**Tips:**
- Backend detail already finds and returns `countryRule` (`apps/api/src/modules/workers/workers.routes.ts:65-66`).
- Country rule fields are in Prisma (`apps/api/prisma/schema.prisma:204-219`).
- Do not make this an edit form.
**What Could Go Wrong:**
- Rendering assumes `countryRule` always exists.
- Labels confuse country requirements with task completion.
**Stretch Goal:** Link the country code to Country Rules for internal users.
**Connects To:** Story 4, because country rules become richer UI data.

## Story 4: Add A Country Filter To Payroll Runs
**Difficulty:** Medium
**Estimated Time:** 2.5 hours
**Skills You'll Practice:** UI state, derived data, existing API data, filtering
**The Story:** As an EOR specialist, I want to filter payroll runs by worker country involvement so that I can focus on runs affected by a region.
**Acceptance Criteria:**
- [ ] Payroll page provides a country-code filter.
- [ ] Filtering uses data already available or fetched through existing endpoints.
- [ ] Clearing the filter restores all visible payroll runs.
- [ ] Loading and error states still work.
**Files You'll Likely Touch:** `apps/web/src/features/payroll/PayrollPage.tsx` for list UI; `apps/web/src/api/payroll.api.ts` for list behavior; `apps/api/src/modules/payroll/payroll.routes.ts` for current response (`apps/web/src/api/payroll.api.ts:3-10`, `apps/api/src/modules/payroll/payroll.routes.ts:17-30`).
**High-Level Implementation Plan:**
1. Inspect `PayrollPage` query and table.
2. Add local country filter state.
3. Use existing data if sufficient; otherwise document the limitation and avoid excessive detail fetches.
4. Filter rendered rows without backend changes.
**Tips:**
- Use worker filter local-state pattern (`apps/web/src/features/workers/WorkersPage.tsx:13-20`).
- Payroll runs are organization-period records, not country records (`apps/api/prisma/schema.prisma:284-306`).
- Keep `payrollApi.list` path unless adding query support intentionally.
**What Could Go Wrong:**
- UI implies payroll is country-scoped when it is organization-scoped.
- Fetching every run detail causes too many requests.
**Stretch Goal:** Add backend-supported country filtering later.
**Connects To:** Story 6, because backend-supported dashboard/API state is next.

## Story 5: Add Recent Audit Events To Dashboard
**Difficulty:** Medium
**Estimated Time:** 3 hours
**Skills You'll Practice:** Reading endpoints, composing dashboard UI, role awareness
**The Story:** As a platform admin, I want recent audit events on the dashboard so that I can see important activity without opening the audit page.
**Acceptance Criteria:**
- [ ] Internal users see recent audit events on dashboard.
- [ ] Client admins see only organization-appropriate audit events.
- [ ] Workers do not see global audit events.
- [ ] Empty audit state is handled.
**Files You'll Likely Touch:** `apps/web/src/features/dashboard/DashboardPage.tsx`; `apps/web/src/api/resources.api.ts`; `apps/api/src/modules/audit/audit.routes.ts`; `apps/web/src/hooks/useRole.ts` (`apps/web/src/features/dashboard/DashboardPage.tsx:22-94`, `apps/web/src/hooks/useRole.ts:3-17`).
**High-Level Implementation Plan:**
1. Inspect audit route and existing audit page.
2. Add or reuse an API wrapper method.
3. Add a dashboard query or extend dashboard response.
4. Render compact recent-events list for non-worker roles.
**Tips:**
- Match sidebar audit visibility (`apps/web/src/components/layout/Sidebar.tsx:18-20`).
- Audit model includes entity, action, message, metadata, and time (`apps/api/prisma/schema.prisma:355-367`).
- Use `formatDate` for timestamps (`apps/web/src/utils/formatDate.ts:1-10`).
**What Could Go Wrong:**
- Workers see organization-wide activity.
- Dashboard makes duplicate requests that `/api/dashboard` could own.
**Stretch Goal:** Add a link to the full audit page for allowed users.
**Connects To:** Story 6, because dashboard data becomes backend-supported summary data.

## Story 6: Add A Dashboard Endpoint Field For Pending Onboarding Reviews
**Difficulty:** Medium
**Estimated Time:** 4 hours
**Skills You'll Practice:** API endpoint changes, Prisma counts, frontend dashboard updates, tests
**The Story:** As an EOR specialist, I want the dashboard to show submitted onboarding tasks awaiting review so that I can prioritize compliance work.
**Acceptance Criteria:**
- [ ] `/api/dashboard` includes pending onboarding review count for non-worker users.
- [ ] Count respects organization scope for client roles.
- [ ] Dashboard displays the count.
- [ ] Backend test covers the count logic or extracted service.
**Files You'll Likely Touch:** `apps/api/src/modules/dashboard/dashboard.routes.ts`; `apps/web/src/features/dashboard/DashboardPage.tsx`; `apps/web/src/api/resources.api.ts`; `apps/api/prisma/schema.prisma`; `apps/api/src/tests/business-rules.test.ts` (`apps/api/src/modules/dashboard/dashboard.routes.ts:39-75`, `apps/api/prisma/schema.prisma:221-237`).
**High-Level Implementation Plan:**
1. Add a Prisma count for `onboardingTask` records with `status: 'SUBMITTED'`.
2. Scope through `worker.organizationId` for client roles.
3. Include the field in dashboard response.
4. Render a new stat in `DashboardPage`.
5. Add backend coverage if logic is extracted.
**Tips:**
- Follow dashboard `Promise.all` aggregation (`apps/api/src/modules/dashboard/dashboard.routes.ts:43-62`).
- `OnboardingTask` belongs to `Worker`, so org scoping goes through worker (`apps/api/prisma/schema.prisma:221-237`).
- Keep worker-dashboard response separate (`apps/api/src/modules/dashboard/dashboard.routes.ts:13-37`).
**What Could Go Wrong:**
- Client users see other organizations' tasks.
- Worker dashboard assumes the new field exists.
**Stretch Goal:** Link the count to a filtered onboarding review view.
**Connects To:** Story 7, because both add backend-supported state.

## Story 7: Add Submit And Review Actions To Onboarding Tasks
**Difficulty:** Medium
**Estimated Time:** 5 hours
**Skills You'll Practice:** Mutations, role-gated UI, existing backend routes, query invalidation
**The Story:** As a worker or EOR specialist, I want to submit, approve, and reject onboarding tasks from the UI so that onboarding can progress without API tools.
**Acceptance Criteria:**
- [ ] Workers can submit their own eligible tasks.
- [ ] EOR specialists/platform admins can approve submitted tasks.
- [ ] EOR specialists/platform admins can reject with a reason.
- [ ] Task list refreshes after each action.
- [ ] Unauthorized roles do not see inappropriate actions.
**Files You'll Likely Touch:** `apps/web/src/features/onboarding/OnboardingPage.tsx`; `apps/web/src/api/workers.api.ts`; `apps/api/src/modules/onboarding/onboarding.routes.ts`; `apps/web/src/hooks/useRole.ts`; `apps/web/src/hooks/useAuth.tsx` (`apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`).
**High-Level Implementation Plan:**
1. Add API wrapper methods for submit/approve/reject paths.
2. Add mutations in `OnboardingPage`.
3. Use role and current-user data to show actions.
4. Invalidate `['worker-onboarding', id]` after success.
5. Add rejection reason input.
**Tips:**
- Backend already enforces worker self-submit and reviewer roles (`apps/api/src/modules/onboarding/onboarding.routes.ts:31-103`).
- Follow payroll detail invalidation (`apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18`).
- Reject requires `rejectionReason` (`packages/shared/src/index.ts:81-83`).
**What Could Go Wrong:**
- UI checks role but not worker ownership.
- Reject sends an empty reason and fails validation.
**Stretch Goal:** Show reviewed timestamp and reviewer name.
**Connects To:** Story 8, because onboarding state feeds activation.

## Story 8: Add Worker Activation Readiness Panel
**Difficulty:** Hard
**Estimated Time:** 7 hours
**Skills You'll Practice:** Full-stack state, business rules, UI actions, backend service tests
**The Story:** As an EOR specialist, I want a readiness panel on worker detail so that I know whether a worker can be activated.
**Acceptance Criteria:**
- [ ] Panel shows required onboarding tasks approved count.
- [ ] Panel shows employment contract status.
- [ ] Activate button appears only for allowed roles.
- [ ] Activation failure messages explain missing requirements.
- [ ] Backend tests still cover activation rules.
**Files You'll Likely Touch:** `apps/web/src/features/workers/WorkerDetailPage.tsx`; `apps/web/src/api/workers.api.ts`; `apps/api/src/modules/workers/workers.routes.ts`; `apps/api/src/modules/workers/workers.service.ts`; `apps/api/src/tests/business-rules.test.ts`; `apps/api/prisma/schema.prisma` (`apps/api/src/modules/workers/workers.service.ts:132-165`, `apps/api/src/tests/business-rules.test.ts:14-51`).
**High-Level Implementation Plan:**
1. Inspect worker detail response for onboarding tasks and employment.
2. Add readiness calculations in the page.
3. Use `workersApi.activate`.
4. Add mutation state and refresh after activation.
5. Confirm or expand service tests.
6. Add frontend test if practical.
**Tips:**
- Activation requires `ONBOARDING`, all required tasks approved, and signed contract (`apps/api/src/modules/workers/workers.service.ts:141-152`).
- `workersApi.activate` already exists (`apps/web/src/api/workers.api.ts:9`).
- Route enforces activation roles (`apps/api/src/modules/workers/workers.routes.ts:114-119`).
**What Could Go Wrong:**
- UI says ready but backend rejects contract status.
- Activation succeeds but UI shows stale status.
**Stretch Goal:** Add readiness badge to worker list.
**Connects To:** Story 9, because activation affects payroll eligibility.

## Story 9: Add Payroll Exclusion Reasons
**Difficulty:** Hard
**Estimated Time:** 8 hours
**Skills You'll Practice:** Backend calculation design, response DTOs, UI diagnostics, tests
**The Story:** As a client admin, I want to know why a worker was excluded from payroll so that I can fix onboarding or status issues.
**Acceptance Criteria:**
- [ ] Payroll detail still shows included payroll items.
- [ ] Payroll detail shows excluded workers with reasons.
- [ ] Reasons include non-active status and missing employment terms.
- [ ] Calculation logic is tested.
- [ ] Touched response shape is typed more explicitly than `any`.
**Files You'll Likely Touch:** `apps/api/src/modules/payroll/payroll.service.ts`; `apps/api/src/modules/payroll/payroll.routes.ts`; `apps/web/src/features/payroll/PayrollDetailPage.tsx`; `apps/web/src/api/payroll.api.ts`; `packages/shared/src/index.ts`; `apps/api/src/tests/business-rules.test.ts`; `apps/api/prisma/schema.prisma` (`apps/api/src/modules/payroll/payroll.service.ts:51-91`).
**High-Level Implementation Plan:**
1. Decide whether exclusions are persisted or returned as metadata.
2. Extend calculation to inspect relevant workers and collect reasons.
3. Update detail response.
4. Add UI table for exclusions.
5. Add tests for non-active workers and missing employment.
6. Add shared or local DTO types.
**Tips:**
- Current calculation filters only `ACTIVE` workers (`apps/api/src/modules/payroll/payroll.service.ts:51-55`).
- Missing employment currently throws for included active workers (`apps/api/src/modules/payroll/payroll.service.ts:72-75`).
- Payroll items are persisted; exclusions may not need persistence (`apps/api/prisma/schema.prisma:308-322`).
**What Could Go Wrong:**
- Exclusions accidentally affect totals.
- Exclusions disappear after reload if not persisted or recomputed.
- Types drift from backend response.
**Stretch Goal:** Persist exclusions as a new Prisma model.
**Connects To:** Story 10, because diagnostics and summaries can become expensive.

## Story 10: Add Cached Operations Dashboard Summary
**Difficulty:** Expert
**Estimated Time:** 12 hours
**Skills You'll Practice:** Architecture design, performance, caching, invalidation, backend tests, frontend integration
**The Story:** As a platform admin, I want a fast operations dashboard summary so that high-level workforce, approval, payroll, and offboarding metrics load quickly as data grows.
**Acceptance Criteria:**
- [ ] Dashboard summary endpoint has a clear cache strategy.
- [ ] Cache does not leak organization-scoped data between roles.
- [ ] Mutations that affect summary metrics have an invalidation or freshness strategy.
- [ ] Frontend uses the summary without breaking worker dashboard behavior.
- [ ] Tests cover role/org scoping and cache freshness assumptions.
- [ ] Documentation comment explains the cache tradeoff.
**Files You'll Likely Touch:** `apps/api/src/modules/dashboard/dashboard.routes.ts`; `apps/api/src/modules/workers/workers.service.ts`; `apps/api/src/modules/leave/leave.service.ts`; `apps/api/src/modules/timesheets/timesheets.service.ts`; `apps/api/src/modules/payroll/payroll.service.ts`; `apps/api/src/modules/offboarding/offboarding.routes.ts`; `apps/web/src/features/dashboard/DashboardPage.tsx`; `apps/web/src/api/resources.api.ts`; `apps/api/src/tests/business-rules.test.ts`; `apps/api/prisma/schema.prisma` (`apps/api/src/modules/dashboard/dashboard.routes.ts:39-75`).
**High-Level Implementation Plan:**
1. Profile current dashboard counts/recent lists mentally.
2. Design a cache key including role and organization scope.
3. Implement a small in-memory cache or summary service with TTL.
4. Invalidate or bypass after worker, leave, timesheet, payroll, and offboarding mutations.
5. Keep worker dashboard path separate.
6. Update frontend only if response shape changes.
7. Add tests for org-scoped cache separation and stale assumptions.
**Tips:**
- Dashboard already branches worker versus non-worker responses (`apps/api/src/modules/dashboard/dashboard.routes.ts:13-75`).
- Metrics depend on worker, leave, timesheet, payroll, and offboarding status (`apps/api/src/modules/dashboard/dashboard.routes.ts:43-72`).
- Tenant isolation must follow `requireOrgAccess` patterns (`apps/api/src/middleware/auth.middleware.ts:39-45`).
- Keep the cache small unless you intentionally introduce infrastructure.
**What Could Go Wrong:**
- Platform cache response is served to a client admin.
- Payroll totals stay stale after calculation.
- Invalidation becomes scattered without an owner.
**Stretch Goal:** Add platform-only cache freshness inspection.
**Connects To:** This is the capstone because it combines architecture, performance, auth boundaries, and full-stack integration.
