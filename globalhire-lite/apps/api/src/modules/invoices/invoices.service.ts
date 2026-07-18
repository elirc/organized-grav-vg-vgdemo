// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { PrismaClient } from '@prisma/client';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { audit } from '../audit/audit.service.js';
//
// type Db = PrismaClient | any;
// type Actor = { id: string; role: string; organizationId: string | null };
// type AuditWriter = typeof audit;
//
// const writeInvoiceAudit = async (
//   db: Db,
//   auditWriter: AuditWriter | undefined,
//   input: Parameters<AuditWriter>[0],
// ) => {
//   const writer = auditWriter ?? (db === prisma ? audit : undefined);
//   if (writer) await writer(input);
// };
//
// const transitionInvoice = async (
//   actor: Actor,
//   id: string,
//   transition: {
//     allowedStatuses: string[];
//     status: string;
//     errorMessage: string;
//     auditAction: string;
//     auditMessage: string;
//   },
//   db: Db = prisma,
//   auditWriter?: AuditWriter,
// ) => {
//   const invoice = await db.invoice.findUnique({ where: { id } });
//   if (!invoice) throw new ApiError(404, 'Invoice not found');
//   requireOrgAccess(invoice.organizationId, { user: actor } as any);
//   if (!transition.allowedStatuses.includes(invoice.status)) {
//     throw new ApiError(400, transition.errorMessage);
//   }
//
//   const updated = await db.invoice.update({
//     where: { id: invoice.id },
//     data: { status: transition.status },
//   });
//   await writeInvoiceAudit(db, auditWriter, {
//     organizationId: invoice.organizationId,
//     actorUserId: actor.id,
//     entityType: 'Invoice',
//     entityId: invoice.id,
//     action: transition.auditAction,
//     message: transition.auditMessage,
//     metadata: { fromStatus: invoice.status, toStatus: transition.status },
//   });
//   return updated;
// };
//
// export const generateInvoice = async (
//   actor: Actor,
//   payrollRunId: string,
//   db: Db = prisma,
//   auditWriter?: AuditWriter,
// ) => {
//   const run = await db.payrollRun.findUnique({ where: { id: payrollRunId }, include: { invoice: true } });
//   if (!run) throw new ApiError(404, 'Payroll run not found');
//   requireOrgAccess(run.organizationId, { user: actor } as any);
//   if (!['APPROVED', 'LOCKED'].includes(run.status)) {
//     throw new ApiError(400, 'Invoice can only be generated after payroll approval');
//   }
//   if (run.invoice) return run.invoice;
//   const subtotal = run.grossTotal + run.employerCostTotal;
//   const platformFee = subtotal * 0.08;
//   const invoice = await db.invoice.create({
//     data: {
//       organizationId: run.organizationId,
//       payrollRunId: run.id,
//       invoiceNumber: `INV-${new Date().getFullYear()}-${run.id.slice(-6).toUpperCase()}`,
//       subtotal,
//       platformFee,
//       total: subtotal + platformFee,
//       currency: run.currency,
//       dueDate: new Date(Date.now() + 30 * 86_400_000),
//     },
//   });
//   await writeInvoiceAudit(db, auditWriter, {
//     organizationId: run.organizationId,
//     actorUserId: actor.id,
//     entityType: 'Invoice',
//     entityId: invoice.id,
//     action: 'INVOICE_GENERATED',
//     message: 'Invoice preview generated from payroll',
//   });
//   return invoice;
// };
//
// export const issueInvoice = (actor: Actor, id: string, db: Db = prisma, auditWriter?: AuditWriter) =>
//   transitionInvoice(
//     actor,
//     id,
//     {
//       allowedStatuses: ['DRAFT'],
//       status: 'ISSUED',
//       errorMessage: 'Only DRAFT invoices can be issued',
//       auditAction: 'INVOICE_ISSUED',
//       auditMessage: 'Invoice issued',
//     },
//     db,
//     auditWriter,
//   );
//
// export const markInvoicePaid = (actor: Actor, id: string, db: Db = prisma, auditWriter?: AuditWriter) =>
//   transitionInvoice(
//     actor,
//     id,
//     {
//       allowedStatuses: ['ISSUED'],
//       status: 'PAID',
//       errorMessage: 'Only ISSUED invoices can be marked paid',
//       auditAction: 'INVOICE_PAID',
//       auditMessage: 'Invoice marked paid',
//     },
//     db,
//     auditWriter,
//   );
//
// export const voidInvoice = (actor: Actor, id: string, db: Db = prisma, auditWriter?: AuditWriter) =>
//   transitionInvoice(
//     actor,
//     id,
//     {
//       allowedStatuses: ['DRAFT', 'ISSUED'],
//       status: 'VOID',
//       errorMessage: 'Only DRAFT or ISSUED invoices can be voided',
//       auditAction: 'INVOICE_VOIDED',
//       auditMessage: 'Invoice voided',
//     },
//     db,
//     auditWriter,
//   );
//