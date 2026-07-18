// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { payrollRunSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import {
//   approvePayrollRun,
//   calculatePayrollRun,
//   createPayrollRun,
//   lockPayrollRun,
// } from './payroll.service.js';
//
// export const payrollRouter = Router();
//
// payrollRouter.get(
//   '/',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const where =
//       req.user!.role === 'CLIENT_ADMIN' ? { organizationId: req.user!.organizationId! } : {};
//     res.json(
//       await prisma.payrollRun.findMany({
//         where,
//         include: { organization: true, invoice: true },
//         orderBy: { createdAt: 'desc' },
//       }),
//     );
//   }),
// );
//
// payrollRouter.get(
//   '/:id',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const run = await prisma.payrollRun.findUnique({
//       where: { id: req.params.id },
//       include: { organization: true, invoice: true, items: { include: { worker: true } } },
//     });
//     if (!run) throw new ApiError(404, 'Payroll run not found');
//     requireOrgAccess(run.organizationId, req);
//     res.json(run);
//   }),
// );
//
// payrollRouter.post(
//   '/',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await createPayrollRun(req.user! as any, payrollRunSchema.parse(req.body)));
//   }),
// );
//
// payrollRouter.post('/:id/calculate', requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']), asyncHandler(async (req, res) => res.json(await calculatePayrollRun(req.user! as any, req.params.id))));
// payrollRouter.post('/:id/approve', requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']), asyncHandler(async (req, res) => res.json(await approvePayrollRun(req.user! as any, req.params.id))));
// payrollRouter.post('/:id/lock', requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']), asyncHandler(async (req, res) => res.json(await lockPayrollRun(req.user! as any, req.params.id))));
//