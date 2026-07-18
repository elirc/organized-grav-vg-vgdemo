# Junior Engineer Guide

## Setup And Run

The README documents setup: install dependencies, copy `apps/api/.env.example` to `apps/api/.env`, start Docker Postgres, generate Prisma client, migrate, seed, and run dev (`README.md:19-31`). The env example contains `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `WEB_ORIGIN`, and `PORT` (`apps/api/.env.example:1-5`). Docker Compose runs Postgres 16 on port 5432 with database `globalhire_lite` (`docker-compose.yml:1-14`). Root scripts expose dev/build/test/lint and Prisma operations (`package.json:10-18`).

```bash
cd globalhire-lite
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Folder Orientation

Frontend top-level: `apps/web` owns React routes, features, API wrappers, hooks, layout, UI primitives, and tests (`apps/web/package.json:1-36`, `apps/web/src/App.tsx:1-44`). Backend top-level: `apps/api` owns Express, middleware, modules, Prisma, env, db client, and tests (`apps/api/package.json:1-35`, `apps/api/src/app.ts:1-59`). Shared top-level: `packages/shared` owns Zod contracts consumed by both apps (`packages/shared/package.json:1-14`, `packages/shared/src/index.ts:1-86`).

One level deeper: frontend `features` maps to route pages, `api` maps feature calls to HTTP, and `hooks` exposes auth/role helpers (`apps/web/src/App.tsx:2-17`, `apps/web/src/api/client.ts:1-19`, `apps/web/src/hooks/useAuth.tsx:1-48`). Backend `modules` maps domains to routers/services, `middleware` handles auth/roles/errors, and `prisma` defines schema/seed (`apps/api/src/app.ts:8-20`, `apps/api/src/middleware/auth.middleware.ts:16-48`, `apps/api/prisma/schema.prisma:1-367`).

## Entry Point Walkthroughs

```tsx
// apps/web/src/main.tsx:18-28
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}> // Server-data cache for all pages.
      <BrowserRouter>                          // Enables App.tsx routes.
        <AuthProvider>                         // Loads current user with /auth/me.
          <App />                              // Route tree starts here.
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

```ts
// apps/api/src/app.ts:22-59
export const app = express();
app.use(helmet());       // Security headers.
app.use(cors({ credentials: true })); // Browser cookies allowed for approved origins.
app.use(express.json()); // JSON body parsing.
app.use(cookieParser()); // Reads globalhire_token cookie.
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'globalhire-lite-api' }));
app.use('/api/auth', authRouter); // Login lives before global auth.
app.use('/api', requireAuth);     // Business API below requires a session.
app.use('/api/workers', workerRouter);
app.use(errorHandler);            // Converts thrown errors into JSON.
```

## TypeScript Orientation

Literal role/status arrays become Zod enums and TypeScript unions (`packages/shared/src/index.ts:3-31`). `CreateWorkerInput` is inferred from `createWorkerSchema`, so runtime validation and compile-time input shape come from one source (`packages/shared/src/index.ts:33-46`, `packages/shared/src/index.ts:85-86`). UI props extend native HTML attributes in `Button` and form fields (`apps/web/src/components/ui/Button.tsx:1-6`, `apps/web/src/components/ui/FormField.tsx:1-46`).

## Three React Component Anatomies

```tsx
// apps/web/src/components/ui/Button.tsx:3-25
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; // Only approved visual variants.
  icon?: ReactNode;                                      // Optional lucide icon slot.
};
export function Button({ children, variant = 'primary', icon, ...props }: Props) {
  return <button className={`${variants[variant]}`} {...props}>{icon}{children}</button>;
}
```

```tsx
// apps/web/src/features/workers/WorkersPage.tsx:13-20
const [filters, setFilters] = useState({ search: '', status: '', country: '', department: '' }); // Local UI state.
const query = useMemo(() => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  return params.toString() ? `?${params.toString()}` : ''; // Converts filters into query string.
}, [filters]);
const { data = [] } = useQuery({ queryKey: ['workers', query], queryFn: () => workersApi.list(query) }); // Server state.
```

```tsx
// apps/web/src/features/payroll/PayrollDetailPage.tsx:14-30
const queryClient = useQueryClient();
const { data: run } = useQuery({ queryKey: ['payroll-run', id], queryFn: () => payrollApi.get(id) });
const refresh = () => queryClient.invalidateQueries({ queryKey: ['payroll-run', id] }); // Refresh after mutation.
const action = useMutation({ mutationFn: (fn: () => Promise<any>) => fn(), onSuccess: refresh });
{role.canPayroll && run.status === 'DRAFT' && <Button onClick={() => action.mutate(() => payrollApi.calculate(id))}>Calculate</Button>}
```

## Three Backend Route Anatomies

```ts
// apps/api/src/app.ts:39-41
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'globalhire-lite-api' }); // Public, no database dependency.
});
```

```ts
// apps/api/src/modules/workers/workers.routes.ts:14-40
workerRouter.get('/', asyncHandler(async (req, res) => {
  const actorWhere = getWorkerWhereForActor(req.user! as any); // Role/org visibility.
  const filters: any = { ...actorWhere };
  if (req.query.search) filters.OR = [/* firstName, lastName, email contains */]; // Search expands filters.
  const workers = await prisma.worker.findMany({ where: filters, include: { employment: true, onboardingTasks: true } });
  res.json(workers);
}));
```

```ts
// apps/api/src/modules/workers/workers.routes.ts:70-75
workerRouter.post(
  '/',
  requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN']), // Permission gate.
  asyncHandler(async (req, res) => {
    res.status(201).json(await createWorker(req.user! as any, createWorkerSchema.parse(req.body))); // Validate then create.
  }),
);
```

## Domain Glossary

Organization is a client company with users, workers, payroll runs, invoices, and audit logs (`apps/api/prisma/schema.prisma:144-157`). Worker is the central person record (`apps/api/prisma/schema.prisma:159-188`). Employment is salary and contract terms for a worker (`apps/api/prisma/schema.prisma:190-202`). Country rule controls demo compliance/payroll requirements (`apps/api/prisma/schema.prisma:204-219`). Onboarding task is generated from country rules during worker creation (`apps/api/src/modules/workers/workers.service.ts:12-67`, `apps/api/src/modules/workers/workers.service.ts:109-111`). Timesheet contributes approved overtime to payroll (`apps/api/prisma/schema.prisma:268-282`, `apps/api/src/modules/payroll/payroll.service.ts:59-70`). Payroll run is a period calculation with totals and items (`apps/api/prisma/schema.prisma:284-322`). Invoice is generated from approved/locked payroll (`apps/api/src/modules/invoices/invoices.service.ts:56-92`). Audit log records important actions (`apps/api/prisma/schema.prisma:355-367`).

## Junior Socratic Checkpoint

1. Why can `ProtectedRoute` read the current user?
2. Which file decides whether Payroll appears in nav?
3. Which route handles `POST /api/workers`?
4. What records are created with a worker?
5. Why does the form import from `@globalhire/shared`?
6. How are Zod errors returned?
7. Which state in worker list is local versus server?

How to self-grade: cite providers in `main.tsx:18-28`, protected route in `ProtectedRoute.tsx:5-13`, sidebar in `Sidebar.tsx:10-20`, create route in `workers.routes.ts:70-75`, transaction in `workers.service.ts:86-127`, schema in `packages/shared/src/index.ts:33-46`, error handler in `error.middleware.ts:9-20`, and filters/query in `WorkersPage.tsx:13-20`.

