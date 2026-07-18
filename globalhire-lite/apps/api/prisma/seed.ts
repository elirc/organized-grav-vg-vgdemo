// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import bcrypt from 'bcryptjs';
// import { PrismaClient } from '@prisma/client';
// import { onboardingTemplates } from '../src/modules/workers/workers.service.js';
//
// const prisma = new PrismaClient();
// const password = 'Password123!';
//
// async function main() {
//   await prisma.auditLog.deleteMany();
//   await prisma.invoice.deleteMany();
//   await prisma.payrollItem.deleteMany();
//   await prisma.payrollRun.deleteMany();
//   await prisma.offboardingCase.deleteMany();
//   await prisma.timesheet.deleteMany();
//   await prisma.leaveRequest.deleteMany();
//   await prisma.workerDocument.deleteMany();
//   await prisma.onboardingTask.deleteMany();
//   await prisma.employment.deleteMany();
//   await prisma.worker.deleteMany();
//   await prisma.user.deleteMany();
//   await prisma.organization.deleteMany();
//   await prisma.countryRule.deleteMany();
//
//   const countries = await Promise.all(
//     [
//       ['US', 'United States', 'USD', 90, 15, 14, true, true, true, 0.12, 0.22],
//       ['GB', 'United Kingdom', 'GBP', 180, 28, 30, true, true, true, 0.14, 0.2],
//       ['DE', 'Germany', 'EUR', 180, 20, 30, true, true, true, 0.18, 0.24],
//       ['PH', 'Philippines', 'PHP', 180, 15, 30, true, true, true, 0.1, 0.16],
//       ['CA', 'Canada', 'CAD', 90, 20, 14, true, true, true, 0.13, 0.21],
//       ['MX', 'Mexico', 'MXN', 90, 12, 15, true, true, true, 0.11, 0.18],
//     ].map(([countryCode, countryName, currency, probationPeriodDays, statutoryVacationDays, noticePeriodDays, requiresTaxId, requiresBankDetails, requiresSignedContract, employerCostPercent, employeeTaxPercent]) =>
//       prisma.countryRule.create({
//         data: {
//           countryCode: String(countryCode),
//           countryName: String(countryName),
//           currency: String(currency),
//           probationPeriodDays: Number(probationPeriodDays),
//           statutoryVacationDays: Number(statutoryVacationDays),
//           noticePeriodDays: Number(noticePeriodDays),
//           requiresTaxId: Boolean(requiresTaxId),
//           requiresBankDetails: Boolean(requiresBankDetails),
//           requiresSignedContract: Boolean(requiresSignedContract),
//           employerCostPercent: Number(employerCostPercent),
//           employeeTaxPercent: Number(employeeTaxPercent),
//         },
//       }),
//     ),
//   );
//   const rules = new Map(countries.map((country) => [country.countryCode, country]));
//
//   const [acme, northstar, brightpath] = await Promise.all([
//     prisma.organization.create({ data: { name: 'Acme Robotics', industry: 'Manufacturing', headquartersCountry: 'United States' } }),
//     prisma.organization.create({ data: { name: 'Northstar Design Co.', industry: 'Design', headquartersCountry: 'United Kingdom' } }),
//     prisma.organization.create({ data: { name: 'BrightPath Health', industry: 'Healthcare', headquartersCountry: 'Canada' } }),
//   ]);
//
//   const passwordHash = await bcrypt.hash(password, 10);
//   const platformAdmin = await prisma.user.create({
//     data: { email: 'platform.admin@globalhire.test', passwordHash, firstName: 'Priya', lastName: 'Platform', role: 'PLATFORM_ADMIN' },
//   });
//   const eorSpecialist = await prisma.user.create({
//     data: { email: 'eor.specialist@globalhire.test', passwordHash, firstName: 'Eli', lastName: 'Ops', role: 'EOR_SPECIALIST' },
//   });
//   const clientAdmin = await prisma.user.create({
//     data: { email: 'client.admin@acme.test', passwordHash, firstName: 'Avery', lastName: 'Admin', role: 'CLIENT_ADMIN', organizationId: acme.id },
//   });
//   const manager = await prisma.user.create({
//     data: { email: 'manager@acme.test', passwordHash, firstName: 'Mina', lastName: 'Manager', role: 'CLIENT_MANAGER', organizationId: acme.id },
//   });
//   const workerUser = await prisma.user.create({
//     data: { email: 'worker@acme.test', passwordHash, firstName: 'Wes', lastName: 'Worker', role: 'WORKER', organizationId: acme.id },
//   });
//
//   const createWorker = async (data: {
//     organizationId: string;
//     userId?: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     countryCode: string;
//     jobTitle: string;
//     department: string;
//     status: any;
//     salaryAmount: number;
//     salaryCurrency: string;
//     contractStatus: any;
//   }) => {
//     const rule = rules.get(data.countryCode)!;
//     const tasks = onboardingTemplates(rule).map((task) => ({
//       ...task,
//       status:
//         data.status === 'ACTIVE' || data.status === 'ON_LEAVE' || data.status === 'OFFBOARDING'
//           ? 'APPROVED'
//           : data.status === 'DRAFT'
//             ? 'NOT_STARTED'
//             : task.category === 'COMPLIANCE'
//               ? 'SUBMITTED'
//               : 'APPROVED',
//       submittedAt: new Date('2026-03-15'),
//       reviewedAt: task.category === 'COMPLIANCE' && data.status === 'ONBOARDING' ? null : new Date('2026-03-16'),
//       reviewedById: task.category === 'COMPLIANCE' && data.status === 'ONBOARDING' ? null : eorSpecialist.id,
//     }));
//     return prisma.worker.create({
//       data: {
//         organizationId: data.organizationId,
//         userId: data.userId,
//         managerId: data.organizationId === acme.id ? manager.id : null,
//         firstName: data.firstName,
//         lastName: data.lastName,
//         email: data.email,
//         countryCode: data.countryCode,
//         jobTitle: data.jobTitle,
//         department: data.department,
//         employmentType: 'FULL_TIME',
//         status: data.status,
//         startDate: new Date('2026-04-01'),
//         employment: {
//           create: {
//             salaryAmount: data.salaryAmount,
//             salaryCurrency: data.salaryCurrency,
//             employmentType: 'FULL_TIME',
//             startDate: new Date('2026-04-01'),
//             endDate: data.status === 'TERMINATED' ? new Date('2026-04-15') : null,
//             contractStatus: data.contractStatus,
//           },
//         },
//         onboardingTasks: { create: tasks as any },
//       },
//       include: { employment: true },
//     });
//   };
//
//   const workers = await Promise.all([
//     createWorker({ organizationId: acme.id, userId: workerUser.id, firstName: 'Wes', lastName: 'Worker', email: 'worker@acme.test', countryCode: 'US', jobTitle: 'Frontend Engineer', department: 'Engineering', status: 'ACTIVE', salaryAmount: 9200, salaryCurrency: 'USD', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: acme.id, firstName: 'Greta', lastName: 'Klein', email: 'greta.klein@acme.test', countryCode: 'DE', jobTitle: 'Product Manager', department: 'Product', status: 'ACTIVE', salaryAmount: 7800, salaryCurrency: 'EUR', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: acme.id, firstName: 'Lena', lastName: 'Santos', email: 'lena.santos@acme.test', countryCode: 'PH', jobTitle: 'QA Analyst', department: 'Quality', status: 'ACTIVE', salaryAmount: 180000, salaryCurrency: 'PHP', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: acme.id, firstName: 'Noah', lastName: 'Rivera', email: 'noah.rivera@acme.test', countryCode: 'MX', jobTitle: 'Support Lead', department: 'Support', status: 'ONBOARDING', salaryAmount: 82000, salaryCurrency: 'MXN', contractStatus: 'SENT' }),
//     createWorker({ organizationId: acme.id, firstName: 'Amelia', lastName: 'Clarke', email: 'amelia.clarke@acme.test', countryCode: 'GB', jobTitle: 'UX Researcher', department: 'Design', status: 'ONBOARDING', salaryAmount: 6100, salaryCurrency: 'GBP', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: northstar.id, firstName: 'Kai', lastName: 'Nguyen', email: 'kai.nguyen@northstar.test', countryCode: 'CA', jobTitle: 'Designer', department: 'Creative', status: 'ONBOARDING', salaryAmount: 6900, salaryCurrency: 'CAD', contractStatus: 'SENT' }),
//     createWorker({ organizationId: acme.id, firstName: 'Sofia', lastName: 'Bennett', email: 'sofia.bennett@acme.test', countryCode: 'CA', jobTitle: 'Data Analyst', department: 'Analytics', status: 'ON_LEAVE', salaryAmount: 7200, salaryCurrency: 'CAD', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: acme.id, firstName: 'Mateo', lastName: 'Diaz', email: 'mateo.diaz@acme.test', countryCode: 'MX', jobTitle: 'Operations Specialist', department: 'Operations', status: 'OFFBOARDING', salaryAmount: 76000, salaryCurrency: 'MXN', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: brightpath.id, firstName: 'Harper', lastName: 'Cole', email: 'harper.cole@brightpath.test', countryCode: 'US', jobTitle: 'Clinical Coordinator', department: 'Care', status: 'TERMINATED', salaryAmount: 6500, salaryCurrency: 'USD', contractStatus: 'SIGNED' }),
//     createWorker({ organizationId: acme.id, firstName: 'Iris', lastName: 'Stone', email: 'iris.stone@acme.test', countryCode: 'GB', jobTitle: 'Finance Analyst', department: 'Finance', status: 'DRAFT', salaryAmount: 5400, salaryCurrency: 'GBP', contractStatus: 'DRAFT' }),
//   ]);
//
//   await prisma.workerDocument.createMany({
//     data: workers.slice(0, 5).map((worker) => ({
//       workerId: worker.id,
//       uploadedById: worker.userId ?? clientAdmin.id,
//       fileName: `${worker.firstName.toLowerCase()}-${worker.countryCode.toLowerCase()}-id.pdf`,
//       documentType: 'IDENTITY',
//       status: worker.status === 'ONBOARDING' ? 'UPLOADED' : 'APPROVED',
//     })),
//   });
//
//   await prisma.leaveRequest.createMany({
//     data: [
//       { workerId: workers[0].id, leaveType: 'VACATION', startDate: new Date('2026-04-10'), endDate: new Date('2026-04-11'), reason: 'Family trip', status: 'APPROVED', reviewedById: manager.id, reviewedAt: new Date('2026-04-01') },
//       { workerId: workers[1].id, leaveType: 'SICK', startDate: new Date('2026-04-12'), endDate: new Date('2026-04-12'), reason: 'Medical appointment', status: 'APPROVED', reviewedById: manager.id, reviewedAt: new Date('2026-04-05') },
//       { workerId: workers[6].id, leaveType: 'PARENTAL', startDate: new Date('2026-04-01'), endDate: new Date('2026-04-20'), reason: 'Parental leave', status: 'APPROVED', reviewedById: clientAdmin.id, reviewedAt: new Date('2026-03-25') },
//       { workerId: workers[0].id, leaveType: 'PERSONAL', startDate: new Date('2026-05-02'), endDate: new Date('2026-05-02'), reason: 'Personal day', status: 'PENDING' },
//       { workerId: workers[2].id, leaveType: 'VACATION', startDate: new Date('2026-05-06'), endDate: new Date('2026-05-09'), reason: 'Vacation', status: 'PENDING' },
//       { workerId: workers[3].id, leaveType: 'SICK', startDate: new Date('2026-05-03'), endDate: new Date('2026-05-03'), reason: 'Sick day', status: 'PENDING' },
//     ],
//   });
//
//   await prisma.timesheet.createMany({
//     data: [
//       { workerId: workers[0].id, weekStartDate: new Date('2026-04-06'), regularHours: 40, overtimeHours: 4, notes: 'Release week', status: 'APPROVED', reviewedById: manager.id, reviewedAt: new Date('2026-04-13') },
//       { workerId: workers[1].id, weekStartDate: new Date('2026-04-06'), regularHours: 40, overtimeHours: 2, notes: 'Planning', status: 'APPROVED', reviewedById: manager.id, reviewedAt: new Date('2026-04-13') },
//       { workerId: workers[2].id, weekStartDate: new Date('2026-04-06'), regularHours: 40, overtimeHours: 8, notes: 'Regression pass', status: 'APPROVED', reviewedById: manager.id, reviewedAt: new Date('2026-04-13') },
//       { workerId: workers[0].id, weekStartDate: new Date('2026-04-13'), regularHours: 40, overtimeHours: 1, notes: 'Submitted for review', status: 'SUBMITTED' },
//       { workerId: workers[1].id, weekStartDate: new Date('2026-04-13'), regularHours: 38, overtimeHours: 0, notes: 'Holiday', status: 'SUBMITTED' },
//       { workerId: workers[2].id, weekStartDate: new Date('2026-04-13'), regularHours: 40, overtimeHours: 3, notes: 'Hotfix support', status: 'SUBMITTED' },
//     ],
//   });
//
//   const calculated = await prisma.payrollRun.create({
//     data: { organizationId: acme.id, periodStart: new Date('2026-04-01'), periodEnd: new Date('2026-04-30'), status: 'CALCULATED', currency: 'USD', grossTotal: 20500, employeeTaxTotal: 4500, employerCostTotal: 2800, netTotal: 16000, createdById: clientAdmin.id },
//   });
//   const approved = await prisma.payrollRun.create({
//     data: { organizationId: acme.id, periodStart: new Date('2026-03-01'), periodEnd: new Date('2026-03-31'), status: 'APPROVED', currency: 'USD', grossTotal: 19800, employeeTaxTotal: 4200, employerCostTotal: 2600, netTotal: 15600, createdById: clientAdmin.id, approvedById: eorSpecialist.id, approvedAt: new Date('2026-04-02') },
//   });
//   const locked = await prisma.payrollRun.create({
//     data: { organizationId: acme.id, periodStart: new Date('2026-02-01'), periodEnd: new Date('2026-02-28'), status: 'LOCKED', currency: 'USD', grossTotal: 19300, employeeTaxTotal: 4100, employerCostTotal: 2500, netTotal: 15200, createdById: clientAdmin.id, approvedById: eorSpecialist.id, approvedAt: new Date('2026-03-02'), lockedAt: new Date('2026-03-03') },
//   });
//   await prisma.payrollItem.createMany({
//     data: [calculated, approved, locked].flatMap((run) =>
//       workers.slice(0, 3).map((worker) => ({
//         payrollRunId: run.id,
//         workerId: worker.id,
//         grossPay: Math.round((worker as any).employment.salaryAmount * 100) / 100,
//         overtimePay: run.id === calculated.id ? 300 : 0,
//         employeeTax: Math.round((worker as any).employment.salaryAmount * 0.2 * 100) / 100,
//         employerCost: Math.round((worker as any).employment.salaryAmount * 0.12 * 100) / 100,
//         netPay: Math.round((worker as any).employment.salaryAmount * 0.8 * 100) / 100,
//         currency: run.currency,
//       })),
//     ),
//   });
//   await prisma.invoice.create({
//     data: { organizationId: acme.id, payrollRunId: locked.id, invoiceNumber: 'INV-2026-0001', subtotal: 21800, platformFee: 1744, total: 23544, currency: 'USD', status: 'ISSUED', dueDate: new Date('2026-04-15') },
//   });
//
//   await prisma.offboardingCase.create({
//     data: { workerId: workers[7].id, requestedById: clientAdmin.id, reason: 'Role eliminated in demo scenario', lastWorkingDay: new Date('2026-05-15'), status: 'IN_REVIEW', notes: 'Prepare final payroll checklist.' },
//   });
//
//   await prisma.auditLog.createMany({
//     data: [
//       { organizationId: acme.id, actorUserId: clientAdmin.id, entityType: 'Worker', entityId: workers[3].id, action: 'WORKER_CREATED', message: 'Worker Noah Rivera was created' },
//       { organizationId: acme.id, actorUserId: eorSpecialist.id, entityType: 'PayrollRun', entityId: calculated.id, action: 'PAYROLL_CALCULATED', message: 'Payroll run calculated' },
//       { organizationId: acme.id, actorUserId: eorSpecialist.id, entityType: 'Invoice', entityId: locked.id, action: 'INVOICE_ISSUED', message: 'Invoice issued' },
//     ],
//   });
//
//   console.log('Seeded GlobalHire Lite demo data');
//   console.log('Demo password:', password);
//   console.log('Primary login:', platformAdmin.email, eorSpecialist.email, clientAdmin.email, manager.email, workerUser.email);
// }
//
// main()
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
//