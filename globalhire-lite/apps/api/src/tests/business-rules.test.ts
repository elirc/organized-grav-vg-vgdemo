// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { describe, expect, it, vi } from 'vitest';
// import { ApiError } from '../utils/ApiError.js';
// import { activateWorker } from '../modules/workers/workers.service.js';
// import { approveLeaveRequest } from '../modules/leave/leave.service.js';
// import {
//   approvePayrollRun,
//   assertPayrollEditable,
//   calculatePayrollRun,
//   createPayrollRun,
// } from '../modules/payroll/payroll.service.js';
//
// const actor = { id: 'reviewer-1', role: 'EOR_SPECIALIST', organizationId: null };
//
// describe('worker activation rules', () => {
//   it('fails if required onboarding tasks are incomplete', async () => {
//     const db = {
//       worker: {
//         findUnique: vi.fn().mockResolvedValue({
//           id: 'worker-1',
//           organizationId: 'org-1',
//           status: 'ONBOARDING',
//           employment: { contractStatus: 'SIGNED' },
//           onboardingTasks: [{ required: true, status: 'SUBMITTED' }],
//         }),
//       },
//     };
//
//     await expect(activateWorker(actor as any, 'worker-1', db)).rejects.toThrow(
//       'All required onboarding tasks must be approved',
//     );
//   });
//
//   it('succeeds when required tasks are approved and contract is signed', async () => {
//     const db = {
//       worker: {
//         findUnique: vi.fn().mockResolvedValue({
//           id: 'worker-1',
//           organizationId: 'org-1',
//           status: 'ONBOARDING',
//           employment: { contractStatus: 'SIGNED' },
//           onboardingTasks: [{ required: true, status: 'APPROVED' }],
//         }),
//         update: vi.fn().mockResolvedValue({ id: 'worker-1', status: 'ACTIVE' }),
//       },
//     };
//
//     await expect(activateWorker(actor as any, 'worker-1', db)).resolves.toMatchObject({
//       status: 'ACTIVE',
//     });
//   });
// });
//
// describe('payroll rules', () => {
//   const run = {
//     id: 'payroll-1',
//     organizationId: 'org-1',
//     status: 'DRAFT',
//     currency: 'USD',
//     periodStart: new Date('2026-04-01'),
//     periodEnd: new Date('2026-04-30'),
//   };
//
//   it('rejects creation when periodEnd is before periodStart', async () => {
//     const db = {
//       payrollRun: {
//         findFirst: vi.fn(),
//         create: vi.fn(),
//       },
//     };
//
//     await expect(
//       createPayrollRun(
//         actor as any,
//         {
//           organizationId: 'org-1',
//           periodStart: '2026-05-01',
//           periodEnd: '2026-04-30',
//           currency: 'USD',
//         },
//         db,
//       ),
//     ).rejects.toThrow('periodEnd must be on or after periodStart');
//     expect(db.payrollRun.findFirst).not.toHaveBeenCalled();
//     expect(db.payrollRun.create).not.toHaveBeenCalled();
//   });
//
//   it('rejects duplicate payroll runs for the same organization, period, and currency', async () => {
//     const db = {
//       payrollRun: {
//         findFirst: vi.fn().mockResolvedValue({ id: 'existing-run' }),
//         create: vi.fn(),
//       },
//     };
//
//     await expect(
//       createPayrollRun(
//         actor as any,
//         {
//           organizationId: 'org-1',
//           periodStart: '2026-04-01',
//           periodEnd: '2026-04-30',
//           currency: 'USD',
//         },
//         db,
//       ),
//     ).rejects.toThrow('Payroll run already exists for this organization, period, and currency');
//     expect(db.payrollRun.findFirst).toHaveBeenCalledWith({
//       where: {
//         organizationId: 'org-1',
//         periodStart: new Date('2026-04-01'),
//         periodEnd: new Date('2026-04-30'),
//         currency: 'USD',
//       },
//     });
//     expect(db.payrollRun.create).not.toHaveBeenCalled();
//   });
//
//   it('calculation queries only ACTIVE workers', async () => {
//     let workerWhere: any;
//     const db = payrollDb({
//       workerFindMany: (args: any) => {
//         workerWhere = args.where;
//         return Promise.resolve([activeWorker('worker-1')]);
//       },
//     });
//
//     await calculatePayrollRun(actor as any, 'payroll-1', db);
//     expect(workerWhere).toMatchObject({ organizationId: 'org-1', status: 'ACTIVE' });
//   });
//
//   it('includes approved overtime only', async () => {
//     let createdItems: any[] = [];
//     const db = payrollDb({
//       timesheetFindMany: (args: any) => {
//         expect(args.where.status).toBe('APPROVED');
//         return Promise.resolve([{ workerId: 'worker-1', overtimeHours: 10 }]);
//       },
//       createMany: (args: any) => {
//         createdItems = args.data;
//         return Promise.resolve({ count: args.data.length });
//       },
//     });
//
//     await calculatePayrollRun(actor as any, 'payroll-1', db);
//     expect(createdItems[0].overtimePay).toBe(937.5);
//     expect(createdItems[0].grossPay).toBe(10937.5);
//   });
//
//   it('cannot be approved before calculation', async () => {
//     const db = { payrollRun: { findUnique: vi.fn().mockResolvedValue(run) } };
//     await expect(approvePayrollRun(actor as any, 'payroll-1', db)).rejects.toThrow(
//       'Payroll must be CALCULATED',
//     );
//   });
//
//   it('cannot be modified after lock', () => {
//     expect(() => assertPayrollEditable({ status: 'LOCKED' })).toThrow(ApiError);
//   });
// });
//
// describe('leave rules', () => {
//   it('approval updates status and reviewer', async () => {
//     const db = {
//       leaveRequest: {
//         findUnique: vi.fn().mockResolvedValue({
//           id: 'leave-1',
//           status: 'PENDING',
//           worker: { organizationId: 'org-1' },
//         }),
//         update: vi.fn().mockResolvedValue({ id: 'leave-1', status: 'APPROVED', reviewedById: actor.id }),
//       },
//     };
//
//     await expect(approveLeaveRequest(actor as any, 'leave-1', db)).resolves.toMatchObject({
//       status: 'APPROVED',
//       reviewedById: actor.id,
//     });
//   });
// });
//
// function activeWorker(id: string) {
//   return {
//     id,
//     email: `${id}@test.local`,
//     countryCode: 'US',
//     employment: { salaryAmount: 10000 },
//   };
// }
//
// function payrollDb(overrides: any = {}) {
//   const run = {
//     id: 'payroll-1',
//     organizationId: 'org-1',
//     status: 'DRAFT',
//     currency: 'USD',
//     periodStart: new Date('2026-04-01'),
//     periodEnd: new Date('2026-04-30'),
//   };
//   return {
//     payrollRun: {
//       findUnique: vi.fn().mockResolvedValue(run),
//       update: vi.fn().mockResolvedValue({ ...run, status: 'CALCULATED' }),
//     },
//     worker: {
//       findMany: vi.fn(overrides.workerFindMany ?? (() => Promise.resolve([activeWorker('worker-1')]))),
//     },
//     countryRule: {
//       findMany: vi.fn().mockResolvedValue([{ countryCode: 'US', employeeTaxPercent: 0.2, employerCostPercent: 0.12 }]),
//     },
//     timesheet: {
//       findMany: vi.fn(overrides.timesheetFindMany ?? (() => Promise.resolve([]))),
//     },
//     payrollItem: {
//       deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
//       createMany: vi.fn(overrides.createMany ?? (() => Promise.resolve({ count: 1 }))),
//     },
//     $transaction: async (callback: any) => callback({
//       payrollItem: {
//         deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
//         createMany: vi.fn(overrides.createMany ?? (() => Promise.resolve({ count: 1 }))),
//       },
//       payrollRun: {
//         update: vi.fn().mockImplementation((args) => Promise.resolve({ ...run, ...args.data, items: [] })),
//       },
//     }),
//   };
// }
//