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
// export const approveLeaveRequest = async (actor: Actor, id: string, db: Db = prisma) => {
//   if (!canReviewPeopleWorkflows(actor.role)) throw new ApiError(403, 'Reviewer role required');
//   const leave = await db.leaveRequest.findUnique({ where: { id }, include: { worker: true } });
//   if (!leave) throw new ApiError(404, 'Leave request not found');
//   requireOrgAccess(leave.worker.organizationId, { user: actor } as any);
//   if (leave.status !== 'PENDING') throw new ApiError(400, 'Only PENDING leave requests can be approved');
//   const updated = await db.leaveRequest.update({
//     where: { id },
//     data: { status: 'APPROVED', reviewedById: actor.id, reviewedAt: new Date() },
//   });
//   if (db === prisma) {
//     await audit({
//       organizationId: leave.worker.organizationId,
//       actorUserId: actor.id,
//       entityType: 'LeaveRequest',
//       entityId: id,
//       action: 'LEAVE_APPROVED',
//       message: 'Leave request approved',
//     });
//   }
//   return updated;
// };
//
// export const rejectLeaveRequest = async (actor: Actor, id: string, db: Db = prisma) => {
//   if (!canReviewPeopleWorkflows(actor.role)) throw new ApiError(403, 'Reviewer role required');
//   const leave = await db.leaveRequest.findUnique({ where: { id }, include: { worker: true } });
//   if (!leave) throw new ApiError(404, 'Leave request not found');
//   requireOrgAccess(leave.worker.organizationId, { user: actor } as any);
//   if (leave.status !== 'PENDING') throw new ApiError(400, 'Only PENDING leave requests can be rejected');
//   const updated = await db.leaveRequest.update({
//     where: { id },
//     data: { status: 'REJECTED', reviewedById: actor.id, reviewedAt: new Date() },
//   });
//   if (db === prisma) {
//     await audit({
//       organizationId: leave.worker.organizationId,
//       actorUserId: actor.id,
//       entityType: 'LeaveRequest',
//       entityId: id,
//       action: 'LEAVE_REJECTED',
//       message: 'Leave request rejected',
//     });
//   }
//   return updated;
// };
//
// export const createLeaveRequest = async (actor: Actor, input: any, db: Db = prisma) => {
//   const workerId = actor.role === 'WORKER' ? actor.workerId : input.workerId;
//   if (!workerId) throw new ApiError(400, 'workerId is required');
//   const worker = await db.worker.findUnique({ where: { id: workerId } });
//   if (!worker) throw new ApiError(404, 'Worker not found');
//   if (worker.status === 'TERMINATED') throw new ApiError(400, 'Terminated workers cannot request leave');
//   requireOrgAccess(worker.organizationId, { user: actor } as any);
//   return db.leaveRequest.create({
//     data: {
//       workerId,
//       leaveType: input.leaveType,
//       startDate: toDate(input.startDate),
//       endDate: toDate(input.endDate),
//       reason: input.reason,
//       status: 'PENDING',
//     },
//   });
// };
//