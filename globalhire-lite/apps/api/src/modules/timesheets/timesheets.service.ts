// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { PrismaClient } from '@prisma/client';
// import { prisma } from '../../db/prisma.js';
// import { canReviewPeopleWorkflows, requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { toDate } from '../../utils/date.js';
// import { audit } from '../audit/audit.service.js';
//
// type Db = PrismaClient | any;
// type Actor = { id: string; role: string; organizationId: string | null; workerId?: string | null };
//
// export const createTimesheet = async (actor: Actor, input: any, db: Db = prisma) => {
//   const workerId = actor.role === 'WORKER' ? actor.workerId : input.workerId;
//   if (!workerId) throw new ApiError(400, 'workerId is required');
//   const worker = await db.worker.findUnique({ where: { id: workerId } });
//   if (!worker) throw new ApiError(404, 'Worker not found');
//   if (worker.status === 'TERMINATED') throw new ApiError(400, 'Terminated workers cannot submit timesheets');
//   requireOrgAccess(worker.organizationId, { user: actor } as any);
//   return db.timesheet.create({
//     data: {
//       workerId,
//       weekStartDate: toDate(input.weekStartDate),
//       regularHours: input.regularHours,
//       overtimeHours: input.overtimeHours,
//       notes: input.notes ?? '',
//       status: actor.role === 'WORKER' ? 'SUBMITTED' : 'DRAFT',
//     },
//   });
// };
//
// export const approveTimesheet = async (actor: Actor, id: string, db: Db = prisma) => {
//   if (!canReviewPeopleWorkflows(actor.role)) throw new ApiError(403, 'Reviewer role required');
//   const timesheet = await db.timesheet.findUnique({ where: { id }, include: { worker: true } });
//   if (!timesheet) throw new ApiError(404, 'Timesheet not found');
//   requireOrgAccess(timesheet.worker.organizationId, { user: actor } as any);
//   if (timesheet.status !== 'SUBMITTED') throw new ApiError(400, 'Only SUBMITTED timesheets can be approved');
//   const updated = await db.timesheet.update({
//     where: { id },
//     data: { status: 'APPROVED', reviewedById: actor.id, reviewedAt: new Date() },
//   });
//   if (db === prisma) {
//     await audit({
//       organizationId: timesheet.worker.organizationId,
//       actorUserId: actor.id,
//       entityType: 'Timesheet',
//       entityId: id,
//       action: 'TIMESHEET_APPROVED',
//       message: 'Timesheet approved',
//     });
//   }
//   return updated;
// };
//
// export const rejectTimesheet = async (actor: Actor, id: string, db: Db = prisma) => {
//   if (!canReviewPeopleWorkflows(actor.role)) throw new ApiError(403, 'Reviewer role required');
//   const timesheet = await db.timesheet.findUnique({ where: { id }, include: { worker: true } });
//   if (!timesheet) throw new ApiError(404, 'Timesheet not found');
//   requireOrgAccess(timesheet.worker.organizationId, { user: actor } as any);
//   if (timesheet.status !== 'SUBMITTED') throw new ApiError(400, 'Only SUBMITTED timesheets can be rejected');
//   return db.timesheet.update({
//     where: { id },
//     data: { status: 'REJECTED', reviewedById: actor.id, reviewedAt: new Date() },
//   });
// };
//