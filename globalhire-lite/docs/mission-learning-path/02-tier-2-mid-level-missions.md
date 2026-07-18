# Tier 2 Mid-Level Missions

### Mission 9: State Has a Home and a Reason
**Tier:** Mid-Level
**Time Estimate:** 35 minutes
**Goal:** Separate local UI state from server data state.
**The Concept:** Local state is a temporary desk note; server state is the official worker record.
**Design Intent Before You Read the Code:** Filters should be local; fetched workers should be cached by TanStack Query (`apps/web/src/features/workers/WorkersPage.tsx:13-20`).
**Find It In The Code:** Open `apps/web/src/features/workers/WorkersPage.tsx:13-20`.
```tsx
// apps/web/src/features/workers/WorkersPage.tsx:13-20
const [filters, setFilters] = useState({ search: '', status: '', country: '', department: '' }); // Page-only state.
const { data = [], isLoading, error } = useQuery({
  queryKey: ['workers', query],          // Cache identity includes filters.
  queryFn: () => workersApi.list(query), // API remains source of truth.
});
```
**The Aha Moment:** State location tells you who owns truth.
**Socratic Checkpoint:** 1. What resets on refresh? 2. What is official server truth? 3. Why include query in key? 4. Why default `data=[]`? 5. Where would pagination live?

How to self-grade: strong answers cite `WorkersPage.tsx:13-20`.
**Connects To:** Mission 11 and Mission 14.

### Mission 10: The Custom Hook Ecosystem
**Tier:** Mid-Level
**Time Estimate:** 40 minutes
**Goal:** Understand auth and role hooks.
**The Concept:** Hooks are role badges: once issued, pages can ask what the current user may do.
**Design Intent Before You Read the Code:** `useAuth` should fetch session; `useRole` should derive booleans (`apps/web/src/hooks/useAuth.tsx:14-48`, `apps/web/src/hooks/useRole.ts:3-17`).
**Find It In The Code:** Open `useAuth.tsx:14-48`, `useRole.ts:3-17`, and `Sidebar.tsx:8-20`.
```tsx
// apps/web/src/hooks/useAuth.tsx:16-28
const me = useQuery({ queryKey: ['me'], queryFn: authApi.me, retry: false }); // Session lookup.
const loginMutation = useMutation({ mutationFn: ({ email, password }) => authApi.login(email, password), onSuccess: (data) => queryClient.setQueryData(['me'], data.user) });
const logoutMutation = useMutation({ mutationFn: authApi.logout, onSuccess: () => queryClient.clear() }); // Clear all server data.
```
**The Aha Moment:** `useRole` is cheap because `useAuth` already owns the user.
**Socratic Checkpoint:** 1. Which hook fetches `/auth/me`? 2. Which derives `canPayroll`? 3. Why clear cache on logout? 4. Where used? 5. What protects misuse?

How to self-grade: cite `useAuth.tsx:16-48`, `useRole.ts:3-17`, and `Sidebar.tsx:8-20`.
**Connects To:** Mission 13 and Mission 22.

### Mission 11: Side Effects Are Promises to the System
**Tier:** Mid-Level
**Time Estimate:** 40 minutes
**Goal:** Trace mutation aftermath.
**The Concept:** A mutation is a payroll approval stamp: once applied, all viewers need updated status.
**Design Intent Before You Read the Code:** Mutations should navigate, invalidate, or update cache after success (`NewWorkerPage.tsx:20-23`, `PayrollDetailPage.tsx:14-18`).
**Find It In The Code:** Open those ranges.
```tsx
// apps/web/src/features/payroll/PayrollDetailPage.tsx:14-18
const { data: run } = useQuery({ queryKey: ['payroll-run', id], queryFn: () => payrollApi.get(id) });
const refresh = () => queryClient.invalidateQueries({ queryKey: ['payroll-run', id] }); // Mark stale after mutation.
const action = useMutation({ mutationFn: (fn: () => Promise<any>) => fn(), onSuccess: refresh });
```
**The Aha Moment:** Success handlers keep UI truth aligned with backend truth.
**Socratic Checkpoint:** 1. Which mutation navigates? 2. Which invalidates? 3. Why not only local text? 4. Which query key? 5. What if `onSuccess` is missing?

How to self-grade: cite `NewWorkerPage.tsx:20-23` and `PayrollDetailPage.tsx:14-18`.
**Connects To:** Mission 14 and Mission 23.

### Mission 12: The Full API Contract
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Map frontend wrappers to backend routes.
**The Concept:** API contracts are handoff forms between UI coordinator and backend operations.
**Design Intent Before You Read the Code:** Wrapper names should match route behavior; backend routes enforce roles/state (`workers.api.ts:4-12`, `workers.routes.ts:14-126`).
**Find It In The Code:** Open `workers.api.ts:4-12`, `payroll.api.ts:3-10`, `workers.routes.ts:14-126`, and `payroll.routes.ts:17-57`.
```ts
// apps/web/src/api/payroll.api.ts:3-10
export const payrollApi = {
  list: () => api<any[]>('/payroll-runs'), // GET list.
  calculate: (id: string) => post<any>(`/payroll-runs/${id}/calculate`), // State transition.
  approve: (id: string) => post<any>(`/payroll-runs/${id}/approve`),
  lock: (id: string) => post<any>(`/payroll-runs/${id}/lock`),
};
```
**The Aha Moment:** Wrapper names and route names should tell the same story.
**Socratic Checkpoint:** 1. Which wrapper creates workers? 2. Which route handles it? 3. Which wrapper generates invoices? 4. Which router implements that path? 5. Where is typing weak?

How to self-grade: cite `workers.api.ts:7`, `workers.routes.ts:70-75`, `payroll.api.ts:10`, `invoices.routes.ts:35-40`, and `any` in `payroll.api.ts:3-10`.
**Connects To:** Mission 14 and Mission 15.

### Mission 13: The Middleware Chain
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Understand request flow before routes.
**The Concept:** Middleware is intake: security headers, CORS, JSON, cookies, identity, roles, errors.
**Design Intent Before You Read the Code:** Public auth mounts before global auth; error handling mounts last (`apps/api/src/app.ts:22-59`).
**Find It In The Code:** Open `app.ts:22-59`, `auth.middleware.ts:9-48`, `requireRole.middleware.ts:4-10`, and `error.middleware.ts:9-20`.
```ts
// apps/api/src/app.ts:43-59
app.use('/api/auth', authRouter); // Public login, protected /me internally.
app.use('/api', requireAuth);     // Every later /api route needs session.
app.use('/api/workers', workerRouter);
app.use(notFoundHandler);         // No match.
app.use(errorHandler);            // JSON error response.
```
**The Aha Moment:** Middleware order is architecture.
**Socratic Checkpoint:** 1. Why auth router first? 2. How is token found? 3. What is `req.user`? 4. What does `requireRole` do? 5. How are Zod errors returned?

How to self-grade: cite `app.ts:43-59`, `auth.middleware.ts:9-37`, `requireRole.middleware.ts:4-10`, and `error.middleware.ts:9-20`.
**Connects To:** Mission 14 and Mission 22.

### Mission 14: End-to-End Feature Trace
**Tier:** Mid-Level
**Time Estimate:** 60 minutes
**Goal:** Trace create worker from UI to database and back.
**The Concept:** A full-stack feature is a hire packet moving from form to official record.
**Design Intent Before You Read the Code:** The flow should validate input, post to API, enforce auth/role, write related records, and navigate (`NewWorkerPage.tsx:16-58`, `workers.service.ts:75-130`).
**Find It In The Code:** Open `NewWorkerPage.tsx:16-58`, `workers.api.ts:4-12`, `app.ts:43-47`, `workers.routes.ts:70-75`, and `workers.service.ts:75-130`.
```ts
// apps/api/src/modules/workers/workers.service.ts:86-127
const worker = await db.$transaction(async (tx: Db) => {
  const created = await tx.worker.create({ data: { status: 'ONBOARDING', employment: { create: { ... } }, onboardingTasks: { create: onboardingTemplates(rule).map((task) => ({ ...task, status: 'NOT_STARTED' })) } } });
  await tx.auditLog.create({ data: { action: 'WORKER_CREATED', entityId: created.id } }); // Audit in same transaction.
  return created;
});
```
**The Aha Moment:** The route is thin because the service owns the business transaction.
**Socratic Checkpoint:** 1. What validates the form? 2. What URL is posted? 3. What middleware protects it? 4. What role can create workers? 5. What records are created?

How to self-grade: cite `NewWorkerPage.tsx:16-18`, `workers.api.ts:7`, `app.ts:43-47`, `workers.routes.ts:70-75`, and `workers.service.ts:86-127`.
**Connects To:** Mission 18 and Mission 23.

### Mission 15: Read the Diff Like an Engineer
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Practice reviewing a realistic worker-field change.
**The Concept:** A diff changes the worker file cabinet; review schema, route, UI, persistence, and tests.
**Design Intent Before You Read the Code:** A field change should move through Prisma, shared schema, form/display, backend update, seed, and tests (`schema.prisma:159-188`, `packages/shared/src/index.ts:33-46`).
**Find It In The Code:** Open `schema.prisma:159-188`, `index.ts:33-46`, `NewWorkerPage.tsx:34-58`, and `workers.routes.ts:78-111`.
```ts
// apps/api/src/modules/workers/workers.routes.ts:85-98
const schema = z.object({
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['DRAFT', 'ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'OFFBOARDING', 'TERMINATED']).optional(),
  // New editable worker fields belong here and in update data below.
});
```
**The Aha Moment:** Review follows ownership boundaries, not diff order.
**Socratic Checkpoint:** 1. Where persistence? 2. Where validation? 3. Where UI input? 4. Where update? 5. What test?

How to self-grade: cite worker model, shared schema, form, patch route, seed, and tests.
**Connects To:** Mission 19 and Mission 24.

### Mission 16: Composition Over Inheritance
**Tier:** Mid-Level
**Time Estimate:** 35 minutes
**Goal:** See how pages compose shared layout/UI.
**The Concept:** Composition assembles a workflow from standard pieces instead of reinventing every screen.
**Design Intent Before You Read the Code:** Layout and UI primitives wrap feature content without owning domain logic (`apps/web/src/components/layout/AppShell.tsx:5-15`, `apps/web/src/features/dashboard/DashboardPage.tsx:11-94`).
**Find It In The Code:** Open `apps/web/src/components/layout/AppShell.tsx:5-15`, `apps/web/src/components/ui/Card.tsx:1-18`, and `apps/web/src/features/dashboard/DashboardPage.tsx:11-94`.
```tsx
// apps/web/src/components/layout/AppShell.tsx:5-15
<div className="min-h-screen bg-mist lg:flex">
  <Sidebar />              // Shared navigation.
  <div className="flex-1">
    <Topbar />              // Shared top area.
    <main>{children}</main> // Feature page slot.
  </div>
</div>
```
**The Aha Moment:** Layout owns structure; feature pages own domain content.
**Socratic Checkpoint:** 1. What does shell own? 2. What does it not own? 3. How do cards help? 4. Where is dashboard domain UI? 5. Why easier to change?

How to self-grade: cite `apps/web/src/components/layout/AppShell.tsx:5-15`, `apps/web/src/components/ui/Card.tsx:1-18`, and `apps/web/src/features/dashboard/DashboardPage.tsx:22-94`.
**Connects To:** Mission 18 and Mission 21.

### Mission 17: TypeScript's Hidden Work
**Tier:** Mid-Level
**Time Estimate:** 45 minutes
**Goal:** Find where TypeScript helps and where `any` bypasses it.
**The Concept:** TypeScript is the compliance reviewer unless you mark the packet `any`.
**Design Intent Before You Read the Code:** Inputs should be typed; touched responses should become typed DTOs (`packages/shared/src/index.ts:85-86`, `apps/web/src/api/workers.api.ts:4-12`).
**Find It In The Code:** Open `packages/shared/src/index.ts:33-86`, `workers.api.ts:4-12`, and `PayrollDetailPage.tsx:41-48`.
```ts
// apps/web/src/api/workers.api.ts:4-12
list: (query = '') => api<any[]>(`/workers${query}`), // Response fields are unchecked.
create: (input: CreateWorkerInput) => post<any>('/workers', input), // Input typed; output not typed.
```
**The Aha Moment:** Type safety is only as strong as the weakest `any` in the path.
**Socratic Checkpoint:** 1. Which input is strong? 2. Which responses are weak? 3. What bug could TS miss? 4. Where should DTOs live? 5. Which backend types come from Prisma?

How to self-grade: cite shared inference, wrappers, and Prisma imports such as `workers.service.ts:1-10`.
**Connects To:** Mission 19 and Mission 23.
