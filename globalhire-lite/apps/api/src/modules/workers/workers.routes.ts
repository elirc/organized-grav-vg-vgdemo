// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { z } from 'zod';
// import { createWorkerSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { getWorkerWhereForActor, createWorker, activateWorker } from './workers.service.js';
// import { createOffboardingForWorker } from '../offboarding/offboarding.routes.js';
//
// export const workerRouter = Router();
//
// workerRouter.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     const { search, status, country, department } = req.query;
//     const actorWhere = getWorkerWhereForActor(req.user! as any);
//     const filters: any = { ...actorWhere };
//     if (status) filters.status = status;
//     if (country) filters.countryCode = country;
//     if (department) filters.department = department;
//     if (search) {
//       filters.OR = [
//         { firstName: { contains: String(search), mode: 'insensitive' } },
//         { lastName: { contains: String(search), mode: 'insensitive' } },
//         { email: { contains: String(search), mode: 'insensitive' } },
//       ];
//     }
//     const workers = await prisma.worker.findMany({
//       where: filters,
//       include: {
//         employment: true,
//         onboardingTasks: true,
//         manager: { select: { firstName: true, lastName: true, email: true } },
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//     res.json(workers);
//   }),
// );
//
// workerRouter.get(
//   '/:id',
//   asyncHandler(async (req, res) => {
//     const worker = await prisma.worker.findUnique({
//       where: { id: req.params.id },
//       include: {
//         organization: true,
//         employment: true,
//         onboardingTasks: true,
//         documents: true,
//         leaveRequests: { orderBy: { createdAt: 'desc' } },
//         timesheets: { orderBy: { weekStartDate: 'desc' } },
//         payrollItems: { include: { payrollRun: true }, orderBy: { createdAt: 'desc' } },
//         offboardingCases: { orderBy: { createdAt: 'desc' } },
//         manager: { select: { firstName: true, lastName: true, email: true } },
//       },
//     });
//     if (!worker) throw new ApiError(404, 'Worker not found');
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== worker.id) {
//       throw new ApiError(403, 'Workers can only view their own profile');
//     }
//     requireOrgAccess(worker.organizationId, req);
//     const countryRule = await prisma.countryRule.findUnique({ where: { countryCode: worker.countryCode } });
//     res.json({ ...worker, countryRule });
//   }),
// );
//
// workerRouter.post(
//   '/',
//   requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await createWorker(req.user! as any, createWorkerSchema.parse(req.body)));
//   }),
// );
//
// workerRouter.patch(
//   '/:id',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const worker = await prisma.worker.findUnique({ where: { id: req.params.id } });
//     if (!worker) throw new ApiError(404, 'Worker not found');
//     requireOrgAccess(worker.organizationId, req);
//     const schema = z.object({
//       jobTitle: z.string().optional(),
//       department: z.string().optional(),
//       managerId: z.string().nullable().optional(),
//       status: z.enum(['DRAFT', 'ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'OFFBOARDING', 'TERMINATED']).optional(),
//       employment: z
//         .object({
//           salaryAmount: z.coerce.number().positive().optional(),
//           salaryCurrency: z.string().min(3).max(3).optional(),
//           contractStatus: z.enum(['DRAFT', 'SENT', 'SIGNED', 'CANCELLED']).optional(),
//         })
//         .optional(),
//     });
//     const input = schema.parse(req.body);
//     const updated = await prisma.worker.update({
//       where: { id: req.params.id },
//       data: {
//         jobTitle: input.jobTitle,
//         department: input.department,
//         managerId: input.managerId,
//         status: input.status,
//         employment: input.employment ? { update: input.employment } : undefined,
//       },
//       include: { employment: true },
//     });
//     res.json(updated);
//   }),
// );
//
// workerRouter.post(
//   '/:id/activate',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.json(await activateWorker(req.user! as any, req.params.id));
//   }),
// );
//
// workerRouter.post(
//   '/:workerId/offboarding',
//   requireRole(['CLIENT_ADMIN', 'PLATFORM_ADMIN']),
//   createOffboardingForWorker,
// );
//