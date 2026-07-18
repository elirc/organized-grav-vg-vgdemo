# GlobalHire Lite

GlobalHire Lite is a simplified Employer of Record demo app for managing international workers from hire request through onboarding, employment records, leave, timesheets, payroll preview, invoicing, and offboarding.

It is built for a mid-level SWE interview walkthrough. The goal is clean architecture, readable TypeScript, realistic workflows, and explainable tradeoffs over exhaustive product scope.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod
- Auth: JWT in secure HTTP-only cookies in production-compatible shape
- Testing: Vitest, React Testing Library
- Tooling: npm workspaces, ESLint, Prettier, dotenv, Prisma seed script

## Run Locally

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

- Web: http://localhost:5173
- API health: http://localhost:4000/api/health

## Demo Accounts

All demo users use password `Password123!`.

- `platform.admin@globalhire.test`
- `eor.specialist@globalhire.test`
- `client.admin@acme.test`
- `manager@acme.test`
- `worker@acme.test`

## Main Workflows

- Client admin creates a worker, which creates an employment record, generated onboarding tasks, and an audit log.
- Worker submits onboarding tasks and document metadata.
- EOR specialist approves or rejects onboarding tasks and documents.
- Client manager/admin approves leave and timesheets.
- Payroll preview includes only active workers and approved overtime.
- Approved or locked payroll can generate an invoice preview.
- Offboarding completion terminates the worker and ends employment.

## Demo Disclaimers

Country rules are simplified demo data and are not legal, payroll, or tax advice.

Payroll calculations are simplified estimates for demonstration only.

## Screenshots

Placeholder: add dashboard, worker detail, onboarding, payroll, and invoice screenshots after running the app locally.

## Known Limitations

- No real payroll, tax, legal, payment, e-signature, or document storage integrations.
- No real notification system.
- Authorization is explicit route/service logic instead of a policy engine.
- Currency conversion is intentionally out of scope.
- Frontend route hiding is implemented for demo clarity; backend route guards remain the source of truth.

## Future Extensions

- Background jobs for payroll processing
- Email notifications
- S3 document storage
- DocuSign integration
- Country-specific compliance rule engine
- Real exchange-rate integration
- HRIS integrations with Workday or BambooHR
- Webhook/event system
- Postgres row-level security
- Advanced audit reporting
- PDF invoice generation
