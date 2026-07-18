# Interview Walkthrough

## 2-Minute Pitch

GlobalHire Lite is a simplified Employer of Record platform for managing international workers. It supports worker creation, onboarding, country-based compliance requirements, leave, timesheets, payroll previews, invoices, and offboarding. I built it to demonstrate full-stack product development with React, Node, TypeScript, SQL, role-based access control, workflow state transitions, and realistic business rules.

## 5-Minute Technical Walkthrough

1. Log in as Client Admin and show the dashboard.
2. Create a worker and point out generated onboarding tasks.
3. Log in as EOR Specialist and approve/reject submitted onboarding tasks.
4. Show leave and timesheet approval as manager-style workflows.
5. Open payroll, calculate a run, approve it, lock it, and generate an invoice.
6. Show audit logs and explain why HR/payroll systems need traceability.

## Deep-Dive Talking Points

- Multi-tenant data scoping: client users only see their organization.
- Explicit route guards: readable `requireRole` and `requireOrgAccess` middleware.
- State transitions: payroll and onboarding enforce service-level workflow rules.
- Mock compliance engine: country rules generate onboarding requirements and payroll assumptions.
- Service-layer payroll: business logic is testable and isolated from controllers/UI.
- Audit logging: key workflow events record actor, entity, and message.

## Hard Questions

**How would you handle real authorization at scale?**  
I would move toward policy-based authorization and possibly Postgres row-level security for tenant isolation. This demo keeps guards explicit for readability.

**Why no state-machine library?**  
The workflows are small enough for clear service checks. If the transitions became more complex, I would formalize them.

**How would real payroll differ?**  
Real payroll would need statutory deductions, benefits, exchange rates, local filings, corrections, and approvals. This project only demonstrates workflow boundaries and calculation placement.

**How would document upload work in production?**  
Metadata would be linked to object storage such as S3, with malware scanning, signed URLs, retention policy, and audit events.

## What I Would Improve Next

- Add background payroll jobs.
- Add email notifications.
- Add object storage for documents.
- Add stronger API integration tests with a test database.
- Add row-level security or a policy authorization layer.
- Add PDF invoice generation.
