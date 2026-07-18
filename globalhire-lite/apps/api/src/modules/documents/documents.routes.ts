// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { documentSchema } from '@globalhire/shared';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
//
// export const documentRouter = Router();
//
// const getDocument = async (id: string) => {
//   const document = await prisma.workerDocument.findUnique({ where: { id }, include: { worker: true } });
//   if (!document) throw new ApiError(404, 'Document not found');
//   return document;
// };
//
// documentRouter.get(
//   '/workers/:workerId/documents',
//   asyncHandler(async (req, res) => {
//     const worker = await prisma.worker.findUnique({ where: { id: req.params.workerId } });
//     if (!worker) throw new ApiError(404, 'Worker not found');
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== worker.id) {
//       throw new ApiError(403, 'Workers can only view their own documents');
//     }
//     requireOrgAccess(worker.organizationId, req);
//     res.json(await prisma.workerDocument.findMany({ where: { workerId: worker.id }, orderBy: { createdAt: 'desc' } }));
//   }),
// );
//
// documentRouter.post(
//   '/workers/:workerId/documents',
//   asyncHandler(async (req, res) => {
//     const input = documentSchema.parse(req.body);
//     const worker = await prisma.worker.findUnique({ where: { id: req.params.workerId } });
//     if (!worker) throw new ApiError(404, 'Worker not found');
//     if (worker.status === 'TERMINATED') throw new ApiError(400, 'Terminated workers cannot upload documents');
//     if (req.user!.role === 'WORKER' && req.user!.workerId !== worker.id) {
//       throw new ApiError(403, 'Workers can only upload their own documents');
//     }
//     requireOrgAccess(worker.organizationId, req);
//     res.status(201).json(
//       await prisma.workerDocument.create({
//         data: { workerId: worker.id, uploadedById: req.user!.id, ...input },
//       }),
//     );
//   }),
// );
//
// documentRouter.post(
//   '/documents/:documentId/approve',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const document = await getDocument(req.params.documentId);
//     res.json(await prisma.workerDocument.update({ where: { id: document.id }, data: { status: 'APPROVED' } }));
//   }),
// );
//
// documentRouter.post(
//   '/documents/:documentId/reject',
//   requireRole(['EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const document = await getDocument(req.params.documentId);
//     res.json(await prisma.workerDocument.update({ where: { id: document.id }, data: { status: 'REJECTED' } }));
//   }),
// );
//