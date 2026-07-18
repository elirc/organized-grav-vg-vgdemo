# Architecture

## System Overview

GlobalHire Lite is an npm-workspace monorepo:

- `apps/api`: Express API, Prisma, auth, workflow services
- `apps/web`: React dashboard app
- `packages/shared`: shared Zod schemas and TypeScript types

The API follows `routes -> controller/service -> Prisma`. Controllers and route handlers stay thin; business rules live in service files such as `workers.service.ts`, `payroll.service.ts`, and `leave.service.ts`.

## Database Model

Most business entities are scoped to `Organization` either directly or through `Worker`. This supports multi-tenant behavior:

- Organization owns workers, payroll runs, invoices, users, and audit logs.
- Worker owns employment, onboarding tasks, documents, leave, timesheets, payroll items, and offboarding cases.
- CountryRule stores demo compliance/payroll assumptions.

## Auth and RBAC

Auth uses JWTs stored in HTTP-only cookies. Middleware exposes:

- `requireAuth()`
- `requireRole([...])`
- `requireOrgAccess()`

I intentionally kept authorization explicit and readable. In a real EOR product, I would likely move toward policy-based authorization or Postgres row-level security, but for this project I wanted understandable code and testable route guards.

## Multi-Tenant Scoping

Client users are scoped by `organizationId`. Platform admin and EOR specialist can operate across organizations. Workers can only access their own worker record and related data.

The backend is the source of truth for scoping. The UI also hides irrelevant navigation to make demos cleaner.

## Workflow Design

The app uses enum statuses and service-level transition checks:

- Onboarding: `NOT_STARTED -> SUBMITTED -> APPROVED/REJECTED`
- Payroll: `DRAFT -> CALCULATED -> APPROVED -> LOCKED`
- Offboarding: `REQUESTED -> APPROVED -> COMPLETED`

I did not add a state-machine library because the workflows are small. If the product grew, I would introduce a formal state-machine or policy layer.

## Payroll Design

Payroll calculation lives in `payroll.service.ts` because it has important business rules:

- Only `ACTIVE` workers are included.
- Only approved timesheets affect overtime.
- Payroll cannot be approved before calculation.
- Locked payroll cannot be modified.

The calculation is intentionally simple:

```text
hourlyRate = monthlySalary / 160
overtimePay = overtimeHours * hourlyRate * 1.5
grossPay = monthlySalary + overtimePay
employeeTax = grossPay * employeeTaxPercent
employerCost = grossPay * employerCostPercent
netPay = grossPay - employeeTax
```

## Tradeoffs

- Simple explicit RBAC beats an abstract permission framework for this demo.
- Weekly timesheets avoid calendar complexity while preserving the payroll approval workflow.
- Document upload is metadata-only so the project can focus on business logic.
- Country rules are configurable demo templates, not legal automation.
- Tests focus on high-risk business rules instead of broad coverage for every CRUD endpoint.
