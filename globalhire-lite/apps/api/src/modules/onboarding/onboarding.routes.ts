// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { rejectSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { audit } from '../audit/audit.service.js';
//
// export const onboardingRouter = Router();
//
// const getTask = async (id: string) => {
//   const task = await prisma.onboardingTask.findUnique({ where: { id }, include: { worker: true } });
//   if (!task) throw new ApiError(404, 'Onboarding task not found');
//   return task;
// };
//
// onboardingRouter.get(
//   '/workers/:workerId/onboarding',
//   asyncHandler(async (req, res) => {
//     const worker = await prisma.worker.findUnique({ where: { id: req.params.workerId } });
//     if (!worker) throw new ApiError(404, 'Worker not found');
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== worker.id) {
//       throw new ApiError(403, 'Workers can only view their own onboarding');
//     }
//     requireOrgAccess(worker.organizationId, req);
//     res.json(await prisma.onboardingTask.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: 'asc' } }));
//   }),
// );
//
// onboardingRouter.post(
//   '/onboarding-tasks/:taskId/submit',
//   asyncHandler(async (req, res) => {
//     const task = await getTask(req.params.taskId);
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== task.workerId) {
//       throw new ApiError(403, 'Workers can only submit their own tasks');
//     }
//     requireOrgAccess(task.worker.organizationId, req);
//     if (task.worker.status === 'TERMINATED') throw new ApiError(400, 'Terminated workers cannot submit onboarding tasks');
//     const updated = await prisma.onboardingTask.update({
//       where: { id: task.id },
//       data: { status: 'SUBMITTED', submittedAt: new Date(), rejectionReason: null },
//     });
//     await audit({
//       organizationId: task.worker.organizationId,
//       actorUserId: req.user!.id,
//       entityType: 'OnboardingTask',
//       entityId: task.id,
//       action: 'ONBOARDING_TASK_SUBMITTED',
//       message: `${task.title} submitted`,
//     });
//     res.json(updated);
//   }),
// );
//
// onboardingRouter.post(
//   '/onboarding-tasks/:taskId/approve',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const task = await getTask(req.params.taskId);
//     const updated = await prisma.onboardingTask.update({
//       where: { id: task.id },
//       data: { status: 'APPROVED', reviewedAt: new Date(), reviewedById: req.user!.id, rejectionReason: null },
//     });
//     await audit({
//       organizationId: task.worker.organizationId,
//       actorUserId: req.user!.id,
//       entityType: 'OnboardingTask',
//       entityId: task.id,
//       action: 'ONBOARDING_TASK_APPROVED',
//       message: `${task.title} approved`,
//     });
//     res.json(updated);
//   }),
// );
//
// onboardingRouter.post(
//   '/onboarding-tasks/:taskId/reject',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const input = rejectSchema.parse(req.body);
//     const task = await getTask(req.params.taskId);
//     const updated = await prisma.onboardingTask.update({
//       where: { id: task.id },
//       data: {
//         status: 'REJECTED',
//         reviewedAt: new Date(),
//         reviewedById: req.user!.id,
//         rejectionReason: input.rejectionReason,
//       },
//     });
//     await audit({
//       organizationId: task.worker.organizationId,
//       actorUserId: req.user!.id,
//       entityType: 'OnboardingTask',
//       entityId: task.id,
//       action: 'ONBOARDING_TASK_REJECTED',
//       message: `${task.title} rejected`,
//       metadata: { rejectionReason: input.rejectionReason },
//     });
//     res.json(updated);
//   }),
// );
//