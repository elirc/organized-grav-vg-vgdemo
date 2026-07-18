// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { Link, useParams } from 'react-router-dom';
// import { resourcesApi } from '../../api/resources.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { formatCurrency } from '../../utils/formatCurrency';
// import { formatDate } from '../../utils/formatDate';
//
// export function InvoicesPage() {
//   const { data = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: resourcesApi.invoices });
//   return (
//     <Card>
//       <CardHeader title="Invoices" />
//       {isLoading ? <CardBody>Loading invoices...</CardBody> : (
//         <Table><thead><tr><Th>Invoice</Th><Th>Organization</Th><Th>Total</Th><Th>Status</Th><Th>Due</Th></tr></thead><tbody>{data.map((invoice: any) => <tr key={invoice.id}><Td><Link className="font-semibold text-teal" to={`/invoices/${invoice.id}`}>{invoice.invoiceNumber}</Link></Td><Td>{invoice.organization.name}</Td><Td>{formatCurrency(invoice.total, invoice.currency)}</Td><Td><Badge>{invoice.status}</Badge></Td><Td>{formatDate(invoice.dueDate)}</Td></tr>)}</tbody></Table>
//       )}
//     </Card>
//   );
// }
//
// export function InvoiceDetailPage() {
//   const { id = '' } = useParams();
//   const queryClient = useQueryClient();
//   const { data: invoice, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => resourcesApi.invoice(id) });
//   const action = useMutation({
//     mutationFn: (fn: () => Promise<any>) => fn(),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['invoice', id] });
//       queryClient.invalidateQueries({ queryKey: ['invoices'] });
//     },
//   });
//   if (isLoading) return <p>Loading invoice...</p>;
//   const canVoid = ['DRAFT', 'ISSUED'].includes(invoice.status);
//   return (
//     <div className="grid gap-6">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div><h1 className="text-2xl font-bold text-ink">{invoice.invoiceNumber}</h1><p className="text-sm text-slate-500">Linked payroll run {invoice.payrollRunId}</p></div>
//         <div className="flex gap-2"><Badge>{invoice.status}</Badge>{invoice.status === 'DRAFT' && <Button disabled={action.isPending} onClick={() => action.mutate(() => resourcesApi.issueInvoice(id))}>Issue</Button>}{invoice.status === 'ISSUED' && <Button variant="secondary" disabled={action.isPending} onClick={() => action.mutate(() => resourcesApi.markPaid(id))}>Mark paid</Button>}{canVoid && <Button variant="danger" disabled={action.isPending} onClick={() => action.mutate(() => resourcesApi.voidInvoice(id))}>Void</Button>}</div>
//       </div>
//       <Card><CardHeader title="Invoice preview" /><CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Info label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} /><Info label="Platform fee" value={formatCurrency(invoice.platformFee, invoice.currency)} /><Info label="Total" value={formatCurrency(invoice.total, invoice.currency)} /><Info label="Due date" value={formatDate(invoice.dueDate)} /></CardBody></Card>
//     </div>
//   );
// }
//
// function Info({ label, value }: { label: string; value: string }) {
//   return <div><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-ink">{value}</p></div>;
// }
//