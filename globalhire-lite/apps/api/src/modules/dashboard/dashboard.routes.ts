// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { prisma } from '../../db/prisma.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { dayDiffInclusive } from '../../utils/date.js';
//
// export const dashboardRouter = Router();
//
// dashboardRouter.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     const user = req.user!;
//
//     if (user.role === 'WORKER') {
//       const workerId = user.workerId ?? '__none__';
//       const worker = await prisma.worker.findUnique({
//         where: { id: workerId },
//         include: {
//           onboardingTasks: true,
//           leaveRequests: true,
//           timesheets: { orderBy: { weekStartDate: 'desc' }, take: 1 },
//           payrollItems: { orderBy: { createdAt: 'desc' }, take: 1 },
//         },
//       });
//       const totalTasks = worker?.onboardingTasks.length ?? 0;
//       const approvedTasks = worker?.onboardingTasks.filter((task) => task.status === 'APPROVED').length ?? 0;
//       const approvedLeaveDays =
//         worker?.leaveRequests
//           .filter((leave) => leave.status === 'APPROVED')
//           .reduce((sum, leave) => sum + dayDiffInclusive(leave.startDate, leave.endDate), 0) ?? 0;
//       return res.json({
//         onboardingProgress: totalTasks ? Math.round((approvedTasks / totalTasks) * 100) : 0,
//         pendingTasks: worker?.onboardingTasks.filter((task) => task.required && task.status !== 'APPROVED').length ?? 0,
//         approvedLeaveDays,
//         timesheetStatus: worker?.timesheets[0]?.status ?? 'NONE',
//         latestPayslipNetPay: worker?.payrollItems[0]?.netPay ?? 0,
//       });
//     }
//
//     const organizationWhere =
//       user.role === 'CLIENT_ADMIN' || user.role === 'CLIENT_MANAGER'
//         ? { organizationId: user.organizationId! }
//         : {};
//     const [activeWorkers, onboardingWorkers, pendingLeaveRequests, pendingTimesheets, payroll, openOffboardingCases, recentWorkers, recentPayrollRuns] =
//       await Promise.all([
//         prisma.worker.count({ where: { ...organizationWhere, status: 'ACTIVE' } }),
//         prisma.worker.count({ where: { ...organizationWhere, status: 'ONBOARDING' } }),
//         prisma.leaveRequest.count({ where: { status: 'PENDING', worker: organizationWhere } }),
//         prisma.timesheet.count({ where: { status: 'SUBMITTED', worker: organizationWhere } }),
//         prisma.payrollRun.findFirst({
//           where: organizationWhere.organizationId ? { organizationId: organizationWhere.organizationId } : {},
//           orderBy: { createdAt: 'desc' },
//         }),
//         prisma.offboardingCase.count({
//           where: { status: { in: ['REQUESTED', 'IN_REVIEW', 'APPROVED'] }, worker: organizationWhere },
//         }),
//         prisma.worker.findMany({ where: organizationWhere, orderBy: { createdAt: 'desc' }, take: 5 }),
//         prisma.payrollRun.findMany({
//           where: organizationWhere.organizationId ? { organizationId: organizationWhere.organizationId } : {},
//           orderBy: { createdAt: 'desc' },
//           take: 5,
//         }),
//       ]);
//
//     res.json({
//       activeWorkers,
//       onboardingWorkers,
//       pendingLeaveRequests,
//       pendingTimesheets,
//       currentPayrollTotal: payroll?.grossTotal ?? 0,
//       openOffboardingCases,
//       recentWorkers,
//       recentPayrollRuns,
//     });
//   }),
// );
//