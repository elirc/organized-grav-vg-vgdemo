# Production Improvements

GlobalHire Lite is intentionally a demo app. It has realistic workflows, but it is not a real EOR, payroll, tax, legal, compliance, or finance system. This file explains what would need to change for production and how the current architecture could evolve.

## Real Compliance And Legal Rules

Why it matters:
An EOR platform must handle country-specific labor law, contracts, notice periods, benefits, tax forms, probation periods, and termination rules. Incorrect rules can create legal and financial risk.

What the current app does:
The app uses simplified `CountryRule` records in `apps/api/prisma/schema.prisma`. These fields include `probationPeriodDays`, `statutoryVacationDays`, `noticePeriodDays`, `requiresTaxId`, `requiresBankDetails`, `requiresSignedContract`, `employerCostPercent`, and `employeeTaxPercent`.

Relevant files:
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/payroll/payroll.service.ts`

How I would extend it:
I would move from one lightweight table to a versioned compliance rules engine. Rules would be effective-dated, country-specific, possibly region-specific, and reviewed by legal/compliance specialists. I would also store which rule version was applied to each worker or payroll run for auditability.

## Payroll Providers

Why it matters:
Real payroll requires tax withholding, statutory deductions, benefits deductions, local payslip rules, filings, and provider-specific settlement processes.

What the current app does:
`calculatePayrollRun()` in `apps/api/src/modules/payroll/payroll.service.ts` calculates a simplified estimate:
- monthly salary
- approved overtime
- employee tax percent
- employer cost percent
- net pay

It explicitly does not implement real payroll.

How I would extend it:
I would keep `PayrollRun` as the internal orchestration model but add provider integrations behind a service boundary. For example, `PayrollProviderClient` could send worker and pay-period data to a provider, receive calculated results, and store provider references on `PayrollRun` and `PayrollItem`.

## Payment Processing

Why it matters:
Invoices in a real platform need payment collection, reconciliation, failed payment handling, accounting exports, credits, refunds, and tax treatment.

What the current app does:
Invoices are previews. `generateInvoice()` in `apps/api/src/modules/invoices/invoices.service.ts` creates totals from payroll run data and applies an 8% platform fee. `mark-paid` updates status only.

How I would extend it:
I would integrate a payment processor or accounting system, store payment attempts and settlement records, and separate invoice issuance from payment status. I would also add webhooks for payment events.

## Document Storage

Why it matters:
Identity documents, contracts, tax forms, and bank proofs are sensitive personal data. Production storage needs encryption, access controls, virus scanning, retention policies, and audit trails.

What the current app does:
Documents are metadata-only. `apps/api/src/modules/documents/documents.routes.ts` accepts fields like `fileName` and `documentType`, but does not upload or store actual files.

How I would extend it:
I would store files in S3 or an equivalent object store, keep metadata in Postgres, generate signed upload/download URLs, scan files, restrict access by role and tenant, and add retention/deletion policies.

## E-Signatures

Why it matters:
Employment agreements need legally valid signatures, signing status, signer identity, timestamps, and provider audit certificates.

What the current app does:
The `Employment.contractStatus` enum tracks `DRAFT`, `SENT`, `SIGNED`, and `CANCELLED`. Worker activation checks for `SIGNED` in `apps/api/src/modules/workers/workers.service.ts`, but there is no signing provider.

How I would extend it:
I would integrate a provider such as DocuSign or Dropbox Sign. The app would create signing envelopes, listen for webhook updates, store provider envelope IDs, and update `contractStatus` from verified provider events.

## Background Jobs

Why it matters:
Payroll calculation, provider sync, email notifications, document processing, invoice generation, and audit exports should not all run inside request/response cycles.

What the current app does:
All operations run synchronously in Express route handlers and service functions.

Relevant files:
- `apps/api/src/modules/payroll/payroll.service.ts`
- `apps/api/src/modules/invoices/invoices.service.ts`
- `apps/api/src/modules/offboarding/offboarding.routes.ts`

How I would extend it:
I would add a queue system such as BullMQ, Cloud Tasks, or a managed queue. The API would enqueue long-running work and return job status. Payroll and invoice generation could become asynchronous workflows.

## Notifications

Why it matters:
HR workflows need reminders and status notifications: onboarding task submitted, document rejected, leave approved, payroll approved, invoice issued, offboarding completed.

What the current app does:
The app records audit logs for many events, but it does not send emails or in-app notifications.

How I would extend it:
I would add a notification service with templates, delivery preferences, and event triggers. Audit logs could remain the compliance trail, while notifications would be user-facing.

## Stronger Audit Logging

Why it matters:
HR, payroll, compliance, and finance systems need detailed non-repudiation: who changed what, before/after values, IP/device data, and immutable records.

What the current app does:
`AuditLog` stores actor, organization, entity type, entity id, action, message, metadata JSON, and timestamp. `audit.service.ts` helps create logs. Some actions are audited, but not all mutations are covered.

Relevant files:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/audit/audit.service.ts`
- `apps/api/src/modules/audit/audit.routes.ts`

How I would extend it:
I would standardize audit logging for every sensitive mutation, store before/after snapshots, include request metadata, prevent edits/deletes, and possibly stream audit events to immutable storage.

## Row-Level Security

Why it matters:
Multi-tenant systems need defense in depth. Application-level checks are necessary but can be bypassed by bugs.

What the current app does:
Tenant scoping is enforced in backend code using `organizationId`, `requireOrgAccess()`, and scoped Prisma queries.

Relevant files:
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/modules/workers/workers.service.ts`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`

How I would extend it:
I would add Postgres row-level security for tenant-owned tables, plus tenant-aware database sessions or query helpers. I would also add integration tests proving cross-tenant access is blocked.

## Test Coverage

Why it matters:
Workflow apps fail in edge cases: wrong role, wrong tenant, invalid state, missing data, duplicate operations, or race conditions.

What the current app does:
Backend tests cover several important business rules in `apps/api/src/tests/business-rules.test.ts`. Frontend tests cover a few smoke paths.

How I would extend it:
I would add:
- API integration tests with Supertest for auth, RBAC, and tenant isolation
- More service tests for invoices, documents, offboarding, and dashboard
- Frontend mutation tests for error and success states
- End-to-end tests for demo-critical flows
- Regression tests for known bugs like CORS/login failures

## Observability And Logging

Why it matters:
Production teams need to know when APIs fail, jobs lag, payroll totals look unusual, or users hit repeated authorization failures.

What the current app does:
The app uses basic server logs and centralized error handling. It does not have structured logging, metrics, tracing, alerting, or request IDs.

Relevant files:
- `apps/api/src/server.ts`
- `apps/api/src/middleware/error.middleware.ts`

How I would extend it:
I would add structured logs, request IDs, error reporting, metrics, tracing, and dashboards. Sensitive data would need redaction.

## Deployment And CI/CD

Why it matters:
Production needs repeatable builds, migrations, tests, deploy previews, and rollback plans.

What the current app does:
The repo has local scripts and Docker Compose for Postgres. A known limitation is that the TypeScript API build succeeds, but the compiled Node runtime has a shared-package path alias issue in local setup, so development currently runs the API through `tsx`.

Relevant files:
- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/api/tsconfig.json`

How I would extend it:
I would fix the production build pathing by packaging `packages/shared` properly or using a bundler such as tsup. Then I would add CI steps for install, lint, typecheck, test, build, Prisma migration validation, and deployment.

## Security Hardening

Why it matters:
This app handles HR and payroll-like data, so security requirements would be high.

What the current app does:
The app uses JWT auth, HTTP-only cookies, bcrypt password hashes, Helmet, CORS, and route guards. It does not include a complete production auth/security setup.

Relevant files:
- `apps/api/src/app.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/middleware/auth.middleware.ts`

How I would extend it:
I would add CSRF protection, stricter cookie settings, rate limiting, account lockout, MFA, password reset, secret rotation, session revocation, permission audit tests, dependency scanning, and security headers tuned for deployment.

## Performance

Why it matters:
Tenant dashboards, payroll runs, and audit logs can become large. Without indexing and pagination, performance will degrade.

What the current app does:
The app uses Prisma includes and simple list endpoints. Some list endpoints are not paginated. The schema has relationships but not a full index strategy.

Relevant files:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`
- `apps/api/src/modules/workers/workers.routes.ts`

How I would extend it:
I would add pagination, filtering at the database level, proper indexes, query profiling, cursor-based pagination for audit logs, and possibly reporting tables or read models for dashboards.

## Accessibility

Why it matters:
HR tools are used by many different people and should work with keyboard navigation, screen readers, and accessible color contrast.

What the current app does:
The UI uses many native controls and reusable components, but it has not had a formal accessibility review.

Relevant files:
- `apps/web/src/components/ui/FormField.tsx`
- `apps/web/src/components/ui/Modal.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`

How I would extend it:
I would test keyboard navigation, focus management, modal behavior, color contrast, visible focus states, table semantics, and screen-reader labels. I would add accessibility checks to CI.

## Data Privacy

Why it matters:
Worker information can include personal, financial, tax, identity, and employment data. Regulations may include GDPR, local labor privacy laws, and data retention requirements.

What the current app does:
The app stores simplified worker data and document metadata. It does not implement retention, deletion, encryption-at-rest policies, data export, or consent flows.

Relevant files:
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/documents/documents.routes.ts`

How I would extend it:
I would classify sensitive fields, encrypt where appropriate, add role-specific access logging, implement data retention policies, provide export/delete workflows, and limit data exposure in API responses.

## Summary Talking Point

If asked how production-ready this is, a strong honest answer is:

"This is not a production EOR platform, and I would not present it that way. I built it as a realistic workflow demo. The production path would be strengthening auth and tenant isolation, replacing simplified payroll and compliance with provider-backed services, adding file storage and e-signature integrations, improving auditability and observability, and expanding tests around permissions and state transitions. The useful part is that the current architecture already has places for those concerns to grow: service-layer business rules, Prisma models, role guards, audit logs, and a clear API boundary."
