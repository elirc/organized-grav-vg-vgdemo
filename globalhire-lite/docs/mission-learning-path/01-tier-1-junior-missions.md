# Tier 1 Junior Missions

### Mission 1: The App's Heartbeat
**Tier:** Junior
**Time Estimate:** 25 minutes
**Goal:** Trace how frontend and backend start.
**The Concept:** Entry points are the app's opening shift: the frontend opens the operations desk and the backend opens the service counter.
**Design Intent Before You Read the Code:** `main.tsx` should install providers, `server.ts` should listen, and `app.ts` should build middleware/routes (`apps/web/src/main.tsx:1-28`, `apps/api/src/server.ts:1-7`, `apps/api/src/app.ts:1-59`).
**Find It In The Code:** Open `apps/web/src/main.tsx:18-28`, `apps/api/src/server.ts:1-7`, and `apps/api/src/app.ts:22-59`.
```tsx
// apps/web/src/main.tsx:18-28
<QueryClientProvider client={queryClient}> // Server-data cache.
  <BrowserRouter>                          // URL navigation.
    <AuthProvider>                         // Current user/session.
      <App />                              // Route tree begins.
    </AuthProvider>
  </BrowserRouter>
</QueryClientProvider>
```
**The Aha Moment:** Providers explain what powers every page.
**Socratic Checkpoint:** 1. Which provider owns server data? 2. Which owns routing? 3. Which owns auth? 4. Which API file calls `listen`? 5. Which API file mounts routers?

How to self-grade: strong answers cite `main.tsx:20-24`, `server.ts:4-7`, and `app.ts:43-56`.
**Connects To:** Mission 2 and Mission 8.

### Mission 2: The Folder Mental Map
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Learn each major folder's responsibility.
**The Concept:** A folder map is like a worker lifecycle checklist: each area owns a step and handoff.
**Design Intent Before You Read the Code:** `apps/web` owns UI, `apps/api` owns HTTP/business/persistence, and `packages/shared` owns shared contracts (`package.json:5-18`).
**Find It In The Code:** Open `package.json:5-18`, `apps/web/src/App.tsx:2-17`, `apps/api/src/app.ts:8-20`, and `packages/shared/src/index.ts:1-86`.
```json
// package.json:5-8
"workspaces": [
  "apps/*",     // Runtime apps: web and api.
  "packages/*"  // Shared libraries.
]
```
**The Aha Moment:** The repo is small but already separated by responsibility.
**Socratic Checkpoint:** 1. Where are React pages? 2. Where are Express routes? 3. Where are schemas? 4. Where is Prisma? 5. Where are tests?

How to self-grade: cite `App.tsx:2-17`, `app.ts:8-20`, `packages/shared/src/index.ts:1-86`, `schema.prisma:1-8`, and `business-rules.test.ts:1-10`.
**Connects To:** Mission 3 and Mission 5.

### Mission 3: TypeScript Is a Contract
**Tier:** Junior
**Time Estimate:** 35 minutes
**Goal:** Understand shared validation and inferred types.
**The Concept:** A schema is the hire request form: required fields must be complete before the system accepts the worker.
**Design Intent Before You Read the Code:** `createWorkerSchema` should validate runtime input and infer `CreateWorkerInput` (`packages/shared/src/index.ts:33-46`, `packages/shared/src/index.ts:85-86`).
**Find It In The Code:** Open `packages/shared/src/index.ts:33-46`, `NewWorkerPage.tsx:5-18`, and `workers.routes.ts:70-75`.
```ts
// packages/shared/src/index.ts:33-46
export const createWorkerSchema = z.object({
  email: z.string().email(),              // Runtime email guard.
  countryCode: z.string().min(2).max(2),  // Country rule lookup key.
  salaryAmount: z.coerce.number().positive(), // Form string becomes number.
});
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>; // TS follows schema.
```
**The Aha Moment:** One schema can protect both form and backend route.
**Socratic Checkpoint:** 1. Which fields are required? 2. Why coerce salary? 3. Where is type used? 4. Where is schema parsed? 5. What if salary is missing?

How to self-grade: cite `packages/shared/src/index.ts:33-46`, `NewWorkerPage.tsx:16-18`, and `workers.routes.ts:70-75`.
**Connects To:** Mission 6 and Mission 14.

### Mission 4: Your First React Component
**Tier:** Junior
**Time Estimate:** 25 minutes
**Goal:** Dissect a reusable UI primitive.
**The Concept:** A UI primitive is a standard onboarding form: reused so every workflow feels consistent.
**Design Intent Before You Read the Code:** `Button` should accept normal button props, variants, and optional icon content (`apps/web/src/components/ui/Button.tsx:1-25`).
**Find It In The Code:** Open `apps/web/src/components/ui/Button.tsx:1-25`.
```tsx
// apps/web/src/components/ui/Button.tsx:3-25
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; // Allowed styles.
  icon?: ReactNode;                                      // Optional leading icon.
};
export function Button({ children, variant = 'primary', icon, ...props }: Props) {
  return <button className={`${variants[variant]}`} {...props}>{icon}{children}</button>;
}
```
**The Aha Moment:** Reusable components hide styling while preserving native behavior.
**Socratic Checkpoint:** 1. Why extend native props? 2. Default variant? 3. Where icon renders? 4. What limits variant strings? 5. Why use this component?

How to self-grade: cite `Button.tsx:1-25` and explain `variants[variant]`.
**Connects To:** Mission 6 and Mission 16.

### Mission 5: Your First Node.js Route
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Read simple Express routes.
**The Concept:** A route is the API service counter: receive input, check rules, return response.
**Design Intent Before You Read the Code:** Health should be public; worker list should read filters and return workers (`apps/api/src/app.ts:39-41`, `apps/api/src/modules/workers/workers.routes.ts:14-40`).
**Find It In The Code:** Open those ranges.
```ts
// apps/api/src/app.ts:39-41
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'globalhire-lite-api' }); // Public liveness check.
});
```
**The Aha Moment:** Route reading is input, guard, database, response.
**Socratic Checkpoint:** 1. Why is health public? 2. Which route reads filters? 3. Which helper limits actor visibility? 4. Which Prisma call lists workers? 5. Where response returns?

How to self-grade: cite `app.ts:39-41` and `workers.routes.ts:17-39`.
**Connects To:** Mission 13 and Mission 14.

### Mission 6: Props Are a Typed Contract
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Understand typed form props.
**The Concept:** Props are task instructions passed from a page to a reusable field.
**Design Intent Before You Read the Code:** Form fields should forward refs so React Hook Form can register inputs (`apps/web/src/components/ui/FormField.tsx:1-46`).
**Find It In The Code:** Open `FormField.tsx:1-46` and `NewWorkerPage.tsx:34-58`.
```tsx
// apps/web/src/components/ui/FormField.tsx:3-15
export const FormField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  function FormField({ label, error, ...props }, ref) {
    return <label>{label}<input ref={ref} {...props} />{error && <span>{error}</span>}</label>;
  },
);
```
**The Aha Moment:** Forwarded refs let reusable inputs still work with form registration.
**Socratic Checkpoint:** 1. Why `forwardRef`? 2. What prop is required? 3. How are errors shown? 4. Where used? 5. Why reuse?

How to self-grade: cite `FormField.tsx:1-46` and `NewWorkerPage.tsx:34-58`.
**Connects To:** Mission 4 and Mission 11.

### Mission 7: Following Data Into the App
**Tier:** Junior
**Time Estimate:** 35 minutes
**Goal:** Trace list data from UI to API wrapper.
**The Concept:** Fetching data is asking the HR file cabinet for a filtered worker directory.
**Design Intent Before You Read the Code:** Page owns filters, wrapper owns path, generic client owns fetch mechanics (`WorkersPage.tsx:13-20`, `workers.api.ts:4-12`, `client.ts:1-19`).
**Find It In The Code:** Open those three ranges.
```tsx
// apps/web/src/features/workers/WorkersPage.tsx:13-20
const [filters, setFilters] = useState({ search: '', status: '', country: '', department: '' }); // Local controls.
const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)), [filters]);
const { data = [] } = useQuery({ queryKey: ['workers', query.toString()], queryFn: () => workersApi.list(`?${query}`) }); // Server cache.
```
**The Aha Moment:** Query keys connect UI filters to cached server results.
**Socratic Checkpoint:** 1. What is local state? 2. What is server state? 3. Where is path built? 4. Why include credentials? 5. What causes refetch?

How to self-grade: cite `WorkersPage.tsx:13-20`, `workers.api.ts:4-12`, and `client.ts:3-12`.
**Connects To:** Mission 9 and Mission 12.

### Mission 8: Navigation Is the App's Skeleton
**Tier:** Junior
**Time Estimate:** 30 minutes
**Goal:** Understand protected routes and role-aware navigation.
**The Concept:** Navigation is the operations floor plan: each role sees the doors relevant to them.
**Design Intent Before You Read the Code:** `App` declares routes, `ProtectedRoute` enforces login, and `Sidebar` hides links by role (`App.tsx:21-42`, `ProtectedRoute.tsx:5-13`, `Sidebar.tsx:8-40`).
**Find It In The Code:** Open those ranges.
```tsx
// apps/web/src/routes/ProtectedRoute.tsx:5-13
const { user, isLoading } = useAuth();
if (isLoading) return <div>Loading session...</div>; // Wait for /auth/me.
if (!user) return <Navigate to="/login" replace />;  // No session.
return <AppShell><Outlet /></AppShell>;              // Protected child route.
```
**The Aha Moment:** Protected routes combine auth, layout, and nested rendering.
**Socratic Checkpoint:** 1. Which route is public? 2. Which are protected? 3. What does `Outlet` render? 4. Who sees Payroll? 5. Why backend auth too?

How to self-grade: cite `App.tsx:21-42`, `ProtectedRoute.tsx:5-13`, `Sidebar.tsx:10-20`, and `app.ts:43-56`.
**Connects To:** Mission 10 and Mission 13.

