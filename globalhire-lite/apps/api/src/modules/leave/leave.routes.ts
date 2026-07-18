// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { leaveRequestSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { getWorkerWhereForActor } from '../workers/workers.service.js';
// import { approveLeaveRequest, createLeaveRequest, rejectLeaveRequest } from './leave.service.js';
//
// export const leaveRouter = Router();
//
// leaveRouter.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     res.json(
//       await prisma.leaveRequest.findMany({
//         where: { worker: getWorkerWhereForActor(req.user! as any) },
//         include: { worker: true, reviewedBy: { select: { firstName: true, lastName: true } } },
//         orderBy: { createdAt: 'desc' },
//       }),
//     );
//   }),
// );
//
// leaveRouter.post(
//   '/',
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await createLeaveRequest(req.user! as any, leaveRequestSchema.parse(req.body)));
//   }),
// );
//
// leaveRouter.post('/:id/approve', asyncHandler(async (req, res) => res.json(await approveLeaveRequest(req.user! as any, req.params.id))));
// leaveRouter.post('/:id/reject', asyncHandler(async (req, res) => res.json(await rejectLeaveRequest(req.user! as any, req.params.id))));
//