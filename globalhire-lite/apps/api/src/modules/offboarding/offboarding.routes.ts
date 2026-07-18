// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { z } from 'zod';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { toDate } from '../../utils/date.js';
// import { audit } from '../audit/audit.service.js';
//
// export const offboardingRouter = Router();
//
// const offboardingSchema = z.object({
//   reason: z.string().min(1),
//   lastWorkingDay: z.string().date(),
//   notes: z.string().optional(),
// });
//
// offboardingRouter.get(
//   '/',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const where =
//       req.user!.role === 'CLIENT_ADMIN' ? { worker: { organizationId: req.user!.organizationId! } } : {};
//     res.json(await prisma.offboardingCase.findMany({ where, include: { worker: true, requestedBy: true }, orderBy: { createdAt: 'desc' } }));
//   }),
// );
//
// offboardingRouter.post(
//   '/:id/approve',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const c = await prisma.offboardingCase.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
//     res.json(c);
//   }),
// );
//
// offboardingRouter.post(
//   '/:id/complete',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const c = await prisma.offboardingCase.findUnique({ where: { id: req.params.id }, include: { worker: true } });
//     if (!c) throw new ApiError(404, 'Offboarding case not found');
//     const updated = await prisma.$transaction(async (tx) => {
//       const done = await tx.offboardingCase.update({ where: { id: c.id }, data: { status: 'COMPLETED' } });
//       await tx.worker.update({ where: { id: c.workerId }, data: { status: 'TERMINATED' } });
//       await tx.employment.update({ where: { workerId: c.workerId }, data: { endDate: c.lastWorkingDay } });
//       return done;
//     });
//     await audit({ organizationId: c.worker.organizationId, actorUserId: req.user!.id, entityType: 'OffboardingCase', entityId: c.id, action: 'OFFBOARDING_COMPLETED', message: 'Offboarding completed; worker terminated' });
//     res.json(updated);
//   }),
// );
//
// offboardingRouter.post(
//   '/:id/cancel',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const c = await prisma.offboardingCase.findUnique({ where: { id: req.params.id }, include: { worker: true } });
//     if (!c) throw new ApiError(404, 'Offboarding case not found');
//     requireOrgAccess(c.worker.organizationId, req);
//     res.json(await prisma.offboardingCase.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } }));
//   }),
// );
//
// export const createOffboardingForWorker = asyncHandler(async (req, res) => {
//   const input = offboardingSchema.parse(req.body);
//   const worker = await prisma.worker.findUnique({ where: { id: req.params.workerId } });
//   if (!worker) throw new ApiError(404, 'Worker not found');
//   requireOrgAccess(worker.organizationId, req);
//   const created = await prisma.$transaction(async (tx) => {
//     const c = await tx.offboardingCase.create({
//       data: {
//         workerId: worker.id,
//         requestedById: req.user!.id,
//         reason: input.reason,
//         lastWorkingDay: toDate(input.lastWorkingDay),
//         notes: input.notes,
//       },
//     });
//     await tx.worker.update({ where: { id: worker.id }, data: { status: 'OFFBOARDING' } });
//     return c;
//   });
//   await audit({ organizationId: worker.organizationId, actorUserId: req.user!.id, entityType: 'OffboardingCase', entityId: created.id, action: 'OFFBOARDING_REQUESTED', message: 'Offboarding requested' });
//   res.status(201).json(created);
// });
//