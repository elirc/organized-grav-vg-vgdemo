// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { describe, expect, it, vi } from 'vitest';
// import { issueInvoice, markInvoicePaid, voidInvoice } from '../modules/invoices/invoices.service.js';
//
// const actor = { id: 'billing-user-1', role: 'EOR_SPECIALIST', organizationId: null };
//
// describe('invoice lifecycle rules', () => {
//   it('issues DRAFT invoices and writes an audit event', async () => {
//     const db = invoiceDb('DRAFT');
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(issueInvoice(actor as any, 'invoice-1', db, audit as any)).resolves.toMatchObject({
//       status: 'ISSUED',
//     });
//     expect(db.invoice.update).toHaveBeenCalledWith({
//       where: { id: 'invoice-1' },
//       data: { status: 'ISSUED' },
//     });
//     expect(audit).toHaveBeenCalledWith(
//       expect.objectContaining({
//         organizationId: 'org-1',
//         actorUserId: actor.id,
//         entityType: 'Invoice',
//         entityId: 'invoice-1',
//         action: 'INVOICE_ISSUED',
//         message: 'Invoice issued',
//         metadata: { fromStatus: 'DRAFT', toStatus: 'ISSUED' },
//       }),
//     );
//   });
//
//   it('rejects issuing non-DRAFT invoices', async () => {
//     const db = invoiceDb('ISSUED');
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(issueInvoice(actor as any, 'invoice-1', db, audit as any)).rejects.toThrow(
//       'Only DRAFT invoices can be issued',
//     );
//     expect(db.invoice.update).not.toHaveBeenCalled();
//     expect(audit).not.toHaveBeenCalled();
//   });
//
//   it('marks ISSUED invoices paid and writes an audit event', async () => {
//     const db = invoiceDb('ISSUED');
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(markInvoicePaid(actor as any, 'invoice-1', db, audit as any)).resolves.toMatchObject({
//       status: 'PAID',
//     });
//     expect(db.invoice.update).toHaveBeenCalledWith({
//       where: { id: 'invoice-1' },
//       data: { status: 'PAID' },
//     });
//     expect(audit).toHaveBeenCalledWith(
//       expect.objectContaining({
//         action: 'INVOICE_PAID',
//         message: 'Invoice marked paid',
//         metadata: { fromStatus: 'ISSUED', toStatus: 'PAID' },
//       }),
//     );
//   });
//
//   it('rejects marking non-ISSUED invoices paid', async () => {
//     const db = invoiceDb('DRAFT');
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(markInvoicePaid(actor as any, 'invoice-1', db, audit as any)).rejects.toThrow(
//       'Only ISSUED invoices can be marked paid',
//     );
//     expect(db.invoice.update).not.toHaveBeenCalled();
//     expect(audit).not.toHaveBeenCalled();
//   });
//
//   it.each(['DRAFT', 'ISSUED'])('voids %s invoices and writes an audit event', async (status) => {
//     const db = invoiceDb(status);
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(voidInvoice(actor as any, 'invoice-1', db, audit as any)).resolves.toMatchObject({
//       status: 'VOID',
//     });
//     expect(db.invoice.update).toHaveBeenCalledWith({
//       where: { id: 'invoice-1' },
//       data: { status: 'VOID' },
//     });
//     expect(audit).toHaveBeenCalledWith(
//       expect.objectContaining({
//         action: 'INVOICE_VOIDED',
//         message: 'Invoice voided',
//         metadata: { fromStatus: status, toStatus: 'VOID' },
//       }),
//     );
//   });
//
//   it('rejects voiding PAID invoices', async () => {
//     const db = invoiceDb('PAID');
//     const audit = vi.fn().mockResolvedValue(undefined);
//
//     await expect(voidInvoice(actor as any, 'invoice-1', db, audit as any)).rejects.toThrow(
//       'Only DRAFT or ISSUED invoices can be voided',
//     );
//     expect(db.invoice.update).not.toHaveBeenCalled();
//     expect(audit).not.toHaveBeenCalled();
//   });
// });
//
// function invoiceDb(status: string) {
//   const invoice = {
//     id: 'invoice-1',
//     organizationId: 'org-1',
//     status,
//   };
//   return {
//     invoice: {
//       findUnique: vi.fn().mockResolvedValue(invoice),
//       update: vi.fn().mockImplementation((args: any) => Promise.resolve({ ...invoice, ...args.data })),
//     },
//   };
// }
//