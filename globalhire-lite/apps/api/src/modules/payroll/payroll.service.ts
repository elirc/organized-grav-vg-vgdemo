// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { PrismaClient } from '@prisma/client';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { toDate } from '../../utils/date.js';
// import { audit } from '../audit/audit.service.js';
//
// type Db = PrismaClient | any;
// type Actor = { id: string; role: string; organizationId: string | null };
//
// export const assertPayrollEditable = (payrollRun: { status: string }) => {
//   if (payrollRun.status === 'LOCKED') throw new ApiError(400, 'Locked payroll cannot be modified');
// };
//
// export const createPayrollRun = async (actor: Actor, input: any, db: Db = prisma) => {
//   requireOrgAccess(input.organizationId, { user: actor } as any);
//   const periodStart = toDate(input.periodStart);
//   const periodEnd = toDate(input.periodEnd);
//   if (periodEnd < periodStart) throw new ApiError(400, 'periodEnd must be on or after periodStart');
//
//   const duplicateRun = await db.payrollRun.findFirst({
//     where: {
//       organizationId: input.organizationId,
//       periodStart,
//       periodEnd,
//       currency: input.currency,
//     },
//   });
//   if (duplicateRun) {
//     throw new ApiError(400, 'Payroll run already exists for this organization, period, and currency');
//   }
//
//   return db.payrollRun.create({
//     data: {
//       organizationId: input.organizationId,
//       periodStart,
//       periodEnd,
//       currency: input.currency,
//       createdById: actor.id,
//       status: 'DRAFT',
//     },
//   });
// };
//
// export const calculatePayrollRun = async (actor: Actor, id: string, db: Db = prisma) => {
//   const run = await db.payrollRun.findUnique({ where: { id } });
//   if (!run) throw new ApiError(404, 'Payroll run not found');
//   requireOrgAccess(run.organizationId, { user: actor } as any);
//   if (run.status !== 'DRAFT') throw new ApiError(400, 'Payroll can only be calculated from DRAFT');
//
//   const workers = await db.worker.findMany({
//     where: { organizationId: run.organizationId, status: 'ACTIVE' },
//     include: { employment: true },
//   });
//   if (workers.length === 0) throw new ApiError(400, 'Payroll requires at least one ACTIVE worker');
//
//   const countryRules = await db.countryRule.findMany();
//   const rulesByCountry = new Map<string, any>(countryRules.map((rule: any) => [rule.countryCode, rule]));
//   const approvedTimesheets = await db.timesheet.findMany({
//     where: {
//       status: 'APPROVED',
//       worker: { organizationId: run.organizationId },
//       weekStartDate: { gte: run.periodStart, lte: run.periodEnd },
//     },
//   });
//
//   const overtimeByWorker = new Map<string, number>();
//   for (const sheet of approvedTimesheets) {
//     overtimeByWorker.set(sheet.workerId, (overtimeByWorker.get(sheet.workerId) ?? 0) + sheet.overtimeHours);
//   }
//
//   const items = workers.map((worker: any) => {
//     if (!worker.employment) throw new ApiError(400, `Worker ${worker.email} is missing employment terms`);
//     const rule = rulesByCountry.get(worker.countryCode);
//     if (!rule) throw new ApiError(400, `Missing country rule for ${worker.countryCode}`);
//     const monthlySalary = worker.employment.salaryAmount;
//     const hourlyRate = monthlySalary / 160;
//     const overtimePay = (overtimeByWorker.get(worker.id) ?? 0) * hourlyRate * 1.5;
//     const grossPay = monthlySalary + overtimePay;
//     const employeeTax = grossPay * rule.employeeTaxPercent;
//     const employerCost = grossPay * rule.employerCostPercent;
//     return {
//       workerId: worker.id,
//       grossPay,
//       overtimePay,
//       employeeTax,
//       employerCost,
//       netPay: grossPay - employeeTax,
//       currency: run.currency,
//     };
//   });
//
//   const totals = items.reduce(
//     (sum: any, item: any) => ({
//       grossTotal: sum.grossTotal + item.grossPay,
//       employeeTaxTotal: sum.employeeTaxTotal + item.employeeTax,
//       employerCostTotal: sum.employerCostTotal + item.employerCost,
//       netTotal: sum.netTotal + item.netPay,
//     }),
//     { grossTotal: 0, employeeTaxTotal: 0, employerCostTotal: 0, netTotal: 0 },
//   );
//
//   const updated = await db.$transaction(async (tx: Db) => {
//     await tx.payrollItem.deleteMany({ where: { payrollRunId: id } });
//     await tx.payrollItem.createMany({ data: items.map((item: any) => ({ ...item, payrollRunId: id })) });
//     return tx.payrollRun.update({
//       where: { id },
//       data: { status: 'CALCULATED', ...totals },
//       include: { items: { include: { worker: true } } },
//     });
//   });
//
//   if (db === prisma) {
//     await audit({
//       organizationId: run.organizationId,
//       actorUserId: actor.id,
//       entityType: 'PayrollRun',
//       entityId: id,
//       action: 'PAYROLL_CALCULATED',
//       message: 'Payroll run calculated',
//       metadata: totals,
//     });
//   }
//   return updated;
// };
//
// export const approvePayrollRun = async (actor: Actor, id: string, db: Db = prisma) => {
//   const run = await db.payrollRun.findUnique({ where: { id } });
//   if (!run) throw new ApiError(404, 'Payroll run not found');
//   requireOrgAccess(run.organizationId, { user: actor } as any);
//   if (run.status !== 'CALCULATED') throw new ApiError(400, 'Payroll must be CALCULATED before approval');
//   if (run.grossTotal <= 0) throw new ApiError(400, 'Payroll cannot be approved with zero gross total');
//   const updated = await db.payrollRun.update({
//     where: { id },
//     data: { status: 'APPROVED', approvedById: actor.id, approvedAt: new Date() },
//   });
//   if (db === prisma) {
//     await audit({
//       organizationId: run.organizationId,
//       actorUserId: actor.id,
//       entityType: 'PayrollRun',
//       entityId: id,
//       action: 'PAYROLL_APPROVED',
//       message: 'Payroll run approved',
//     });
//   }
//   return updated;
// };
//
// export const lockPayrollRun = async (actor: Actor, id: string, db: Db = prisma) => {
//   const run = await db.payrollRun.findUnique({ where: { id } });
//   if (!run) throw new ApiError(404, 'Payroll run not found');
//   requireOrgAccess(run.organizationId, { user: actor } as any);
//   if (run.status !== 'APPROVED') throw new ApiError(400, 'Payroll must be APPROVED before lock');
//   return db.payrollRun.update({
//     where: { id },
//     data: { status: 'LOCKED', lockedAt: new Date() },
//   });
// };
//