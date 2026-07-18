// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { timesheetSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { getWorkerWhereForActor } from '../workers/workers.service.js';
// import { approveTimesheet, createTimesheet, rejectTimesheet } from './timesheets.service.js';
//
// export const timesheetRouter = Router();
//
// timesheetRouter.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     res.json(
//       await prisma.timesheet.findMany({
//         where: { worker: getWorkerWhereForActor(req.user! as any) },
//         include: { worker: true, reviewedBy: { select: { firstName: true, lastName: true } } },
//         orderBy: { weekStartDate: 'desc' },
//       }),
//     );
//   }),
// );
//
// timesheetRouter.post(
//   '/',
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await createTimesheet(req.user! as any, timesheetSchema.parse(req.body)));
//   }),
// );
//
// timesheetRouter.post(
//   '/:id/submit',
//   asyncHandler(async (req, res) => {
//     const current = await prisma.timesheet.findUnique({ where: { id: req.params.id }, include: { worker: true } });
//     if (!current) throw new ApiError(404, 'Timesheet not found');
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== current.workerId) {
//       throw new ApiError(403, 'Workers can only submit their own timesheets');
//     }
//     requireOrgAccess(current.worker.organizationId, req);
//     const timesheet = await prisma.timesheet.update({
//       where: { id: req.params.id },
//       data: { status: 'SUBMITTED' },
//     });
//     res.json(timesheet);
//   }),
// );
// timesheetRouter.post('/:id/approve', asyncHandler(async (req, res) => res.json(await approveTimesheet(req.user! as any, req.params.id))));
// timesheetRouter.post('/:id/reject', asyncHandler(async (req, res) => res.json(await rejectTimesheet(req.user! as any, req.params.id))));
//