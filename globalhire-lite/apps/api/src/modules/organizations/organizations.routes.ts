// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { z } from 'zod';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
//
// export const organizationRouter = Router();
//
// const organizationSchema = z.object({
//   name: z.string().min(1),
//   industry: z.string().min(1),
//   headquartersCountry: z.string().min(1),
//   status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
// });
//
// organizationRouter.get(
//   '/',
//   asyncHandler(async (req, res) => {
//     const where =
//       req.user!.role === 'PLATFORM_ADMIN'
//         ? {}
//         : req.user!.organizationId
//           ? { id: req.user!.organizationId }
//           : { id: '__none__' };
//     res.json(await prisma.organization.findMany({ where, orderBy: { name: 'asc' } }));
//   }),
// );
//
// organizationRouter.get(
//   '/:id',
//   asyncHandler(async (req, res) => {
//     requireOrgAccess(req.params.id, req);
//     const organization = await prisma.organization.findUnique({ where: { id: req.params.id } });
//     if (!organization) throw new ApiError(404, 'Organization not found');
//     res.json(organization);
//   }),
// );
//
// organizationRouter.post(
//   '/',
//   requireRole(['PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await prisma.organization.create({ data: organizationSchema.parse(req.body) }));
//   }),
// );
//
// organizationRouter.patch(
//   '/:id',
//   requireRole(['PLATFORM_ADMIN', 'CLIENT_ADMIN']),
//   asyncHandler(async (req, res) => {
//     requireOrgAccess(req.params.id, req);
//     const input = organizationSchema.partial().parse(req.body);
//     res.json(await prisma.organization.update({ where: { id: req.params.id }, data: input }));
//   }),
// );
//