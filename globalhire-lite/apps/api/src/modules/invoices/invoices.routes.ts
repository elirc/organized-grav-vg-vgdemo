// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { generateInvoice, issueInvoice, markInvoicePaid, voidInvoice } from './invoices.service.js';
//
// export const invoiceRouter = Router();
//
// invoiceRouter.get(
//   '/invoices',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const where =
//       req.user!.role === 'CLIENT_ADMIN' ? { organizationId: req.user!.organizationId! } : {};
//     res.json(await prisma.invoice.findMany({ where, include: { organization: true, payrollRun: true }, orderBy: { createdAt: 'desc' } }));
//   }),
// );
//
// invoiceRouter.get(
//   '/invoices/:id',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     const invoice = await prisma.invoice.findUnique({
//       where: { id: req.params.id },
//       include: { organization: true, payrollRun: true },
//     });
//     if (!invoice) throw new ApiError(404, 'Invoice not found');
//     requireOrgAccess(invoice.organizationId, req);
//     res.json(invoice);
//   }),
// );
//
// invoiceRouter.post(
//   '/payroll-runs/:id/generate-invoice',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await generateInvoice(req.user! as any, req.params.id));
//   }),
// );
//
// invoiceRouter.post(
//   '/invoices/:id/issue',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.json(await issueInvoice(req.user! as any, req.params.id));
//   }),
// );
//
// invoiceRouter.post(
//   '/invoices/:id/mark-paid',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.json(await markInvoicePaid(req.user! as any, req.params.id));
//   }),
// );
//
// invoiceRouter.post(
//   '/invoices/:id/void',
//   requireRole(['CLIENT_ADMIN', 'EOR_SPECIALIST', 'PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.json(await voidInvoice(req.user! as any, req.params.id));
//   }),
// );
//