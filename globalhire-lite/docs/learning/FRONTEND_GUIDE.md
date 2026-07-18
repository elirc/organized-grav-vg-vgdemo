# Frontend Guide

## What To Read First

Read these files in order:

1. [apps/web/src/main.tsx](../../apps/web/src/main.tsx)
2. [apps/web/src/App.tsx](../../apps/web/src/App.tsx)
3. [apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx)
4. [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts)
5. [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx)
6. [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)
7. [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx)
8. [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)

That path teaches you app bootstrapping, routing, auth, API calls, forms, and the main workflows.

## App Entry Point

[apps/web/src/main.tsx](../../apps/web/src/main.tsx) creates the React app.

It wraps the app with:

- `QueryClientProvider` for TanStack Query server state.
- `BrowserRouter` for React Router.
- `AuthProvider` for current-user state.

The `QueryClient` disables refetch-on-window-focus and sets a 20-second stale time. That is a reasonable demo default because the app is workflow-oriented and does not require real-time updates.

## Routing

Routes are declared in [apps/web/src/App.tsx](../../apps/web/src/App.tsx).

Public route:

- `/login`

Protected routes:

- `/dashboard`
- `/workers`
- `/workers/new`
- `/workers/:id`
- `/workers/:id/onboarding`
- `/leave`
- `/timesheets`
- `/payroll`
- `/payroll/:id`
- `/invoices`
- `/invoices/:id`
- `/offboarding`
- `/country-rules`
- `/audit-log`
- `/settings`

Important note: frontend route access is not strongly enforced by role at the route level. Navigation is hidden by role in the sidebar, and backend permissions enforce real security.

## Protected Routes

[apps/web/src/routes/ProtectedRoute.tsx](../../apps/web/src/routes/ProtectedRoute.tsx) calls `useAuth()`.

Behavior:

- If auth is loading, show a loading message.
- If no user, redirect to `/login`.
- If authenticated, render `AppShell` and nested route content.

This is simple and easy to explain. A production app might add better loading skeletons and unauthorized screens.

## Layout, Sidebar, And Topbar

Authenticated pages use [apps/web/src/components/layout/AppShell.tsx](../../apps/web/src/components/layout/AppShell.tsx).

- `Sidebar` handles navigation.
- `Topbar` shows current user and sign out.
- Main content is constrained with `max-w-7xl`.

[apps/web/src/components/layout/Sidebar.tsx](../../apps/web/src/components/layout/Sidebar.tsx) uses `useRole()` to hide links:

- Workers hidden for `WORKER`.
- Payroll/invoices visible for payroll-capable roles.
- Country rules visible for internal users.
- Audit log visible for internal/client admin.

This is UI convenience, not backend security.

## Auth State

[apps/web/src/hooks/useAuth.tsx](../../apps/web/src/hooks/useAuth.tsx) owns auth state.

It uses:

- `useQuery({ queryKey: ['me'], queryFn: authApi.me })`
- `useMutation` for login.
- `useMutation` for logout.
- `queryClient.setQueryData(['me'], data.user)` after login.
- `queryClient.clear()` after logout.

Why this makes sense:

- The current user is server state.
- TanStack Query already solves caching/loading/error.

Weak spot:

- If `/auth/me` returns 401, the hook treats it as a failed query and `user` remains undefined. That is fine for routing, but a production app might distinguish unauthenticated from network failure more explicitly.

## API Client

[apps/web/src/api/client.ts](../../apps/web/src/api/client.ts) is the shared fetch wrapper.

Key behavior:

- Base URL defaults to `http://localhost:4000/api`.
- `credentials: 'include'` sends/receives cookies.
- JSON content type is applied.
- Non-OK responses throw `Error(data.message ?? 'Request failed')`.

API-specific wrappers:

- [apps/web/src/api/auth.api.ts](../../apps/web/src/api/auth.api.ts)
- [apps/web/src/api/workers.api.ts](../../apps/web/src/api/workers.api.ts)
- [apps/web/src/api/payroll.api.ts](../../apps/web/src/api/payroll.api.ts)
- [apps/web/src/api/resources.api.ts](../../apps/web/src/api/resources.api.ts)

Weak spot:

- Many responses are typed as `any`. For production, add shared response types or generated API types.

## TanStack Query Usage

Server reads use `useQuery`.

Examples:

- Dashboard: [apps/web/src/features/dashboard/DashboardPage.tsx](../../apps/web/src/features/dashboard/DashboardPage.tsx)
- Workers list: [apps/web/src/features/workers/WorkersPage.tsx](../../apps/web/src/features/workers/WorkersPage.tsx)
- Worker detail: [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx)
- Payroll detail: [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)

Writes use `useMutation`.

After writes, pages usually invalidate/refetch the relevant query:

- Worker detail invalidates `['worker', id]`.
- Payroll detail invalidates `['payroll-run', id]`.
- Leave page invalidates `['leave']`.
- Timesheets page invalidates `['timesheets']`.

Frontend state versus server state:

- Server state: workers, payroll, dashboard, invoices, auth user.
- Local UI state: filter text, modal open/closed, inline error message.

## Forms And Validation

The best form examples:

- Login: [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx)
- Create worker: [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)

They use:

- React Hook Form
- `zodResolver`
- shared schemas from [packages/shared/src/index.ts](../../packages/shared/src/index.ts)

Why this is useful:

- You can explain that the same request schema validates frontend form data and backend request bodies.

Weak spot:

- Some workflow actions are not full forms. For example, onboarding rejection uses a hardcoded reason in [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx). Leave/timesheet/offboarding creation endpoints exist in the backend, but the frontend mostly has approval/list screens.

## Reusable Components

Reusable UI lives in [apps/web/src/components/ui](../../apps/web/src/components/ui).

Important components:

- `Button`
- `Card`
- `Badge`
- `Table`
- `Modal`
- `FormField`

These are intentionally small and local to avoid adding a heavy component library.

## Feature Folders

Feature pages live under [apps/web/src/features](../../apps/web/src/features).

Important pages:

- `auth/LoginPage.tsx`
- `dashboard/DashboardPage.tsx`
- `workers/WorkersPage.tsx`
- `workers/NewWorkerPage.tsx`
- `workers/WorkerDetailPage.tsx`
- `payroll/PayrollPage.tsx`
- `payroll/PayrollDetailPage.tsx`
- `invoices/InvoicesPage.tsx`
- `leave/LeavePage.tsx`
- `timesheets/TimesheetsPage.tsx`

## Loading, Error, And Empty States

Implemented:

- Basic loading messages on many pages.
- Some error messages, especially worker detail and payroll detail.
- Mutation errors in `NewWorkerPage`.

Weak spots:

- Empty states are minimal.
- Errors are plain text, not toast notifications.
- Some pages do not show mutation errors.

Interview framing:

> I added enough loading/error handling to make the demo understandable, but I would improve consistency and accessibility before production.

## Most Important Demo Components

Show these in the editor:

- Login: [apps/web/src/features/auth/LoginPage.tsx](../../apps/web/src/features/auth/LoginPage.tsx)
- Worker create form: [apps/web/src/features/workers/NewWorkerPage.tsx](../../apps/web/src/features/workers/NewWorkerPage.tsx)
- Worker detail/actions: [apps/web/src/features/workers/WorkerDetailPage.tsx](../../apps/web/src/features/workers/WorkerDetailPage.tsx)
- Payroll transitions: [apps/web/src/features/payroll/PayrollDetailPage.tsx](../../apps/web/src/features/payroll/PayrollDetailPage.tsx)
- API client: [apps/web/src/api/client.ts](../../apps/web/src/api/client.ts)
