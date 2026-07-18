// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useState } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { Link } from 'react-router-dom';
// import { Plus } from 'lucide-react';
// import { payrollApi } from '../../api/payroll.api';
// import { resourcesApi } from '../../api/resources.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { Modal } from '../../components/ui/Modal';
// import { formatCurrency } from '../../utils/formatCurrency';
// import { formatDate } from '../../utils/formatDate';
//
// export function PayrollPage() {
//   const queryClient = useQueryClient();
//   const [open, setOpen] = useState(false);
//   const { data = [], isLoading } = useQuery({ queryKey: ['payroll-runs'], queryFn: payrollApi.list });
//   const orgs = useQuery({ queryKey: ['organizations'], queryFn: resourcesApi.organizations });
//   const create = useMutation({ mutationFn: payrollApi.create, onSuccess: () => { setOpen(false); queryClient.invalidateQueries({ queryKey: ['payroll-runs'] }); } });
//   return (
//     <div className="grid gap-6">
//       <div className="flex items-center justify-between gap-3">
//         <div><h1 className="text-2xl font-bold text-ink">Payroll</h1><p className="text-sm text-slate-500">Simplified estimates for approved demos only.</p></div>
//         <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>Create run</Button>
//       </div>
//       <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">Payroll calculations are simplified estimates for demonstration only.</p>
//       <Card>
//         <CardHeader title="Payroll runs" />
//         {isLoading ? <CardBody>Loading payroll...</CardBody> : (
//           <Table>
//             <thead><tr><Th>Period</Th><Th>Status</Th><Th>Gross</Th><Th>Employer cost</Th><Th>Net</Th><Th>Invoice</Th></tr></thead>
//             <tbody>{data.map((run: any) => <tr key={run.id}><Td><Link className="font-semibold text-teal" to={`/payroll/${run.id}`}>{formatDate(run.periodStart)} - {formatDate(run.periodEnd)}</Link></Td><Td><Badge>{run.status}</Badge></Td><Td>{formatCurrency(run.grossTotal, run.currency)}</Td><Td>{formatCurrency(run.employerCostTotal, run.currency)}</Td><Td>{formatCurrency(run.netTotal, run.currency)}</Td><Td>{run.invoice ? <Badge>{run.invoice.status}</Badge> : 'None'}</Td></tr>)}</tbody>
//           </Table>
//         )}
//       </Card>
//       {open && <Modal title="Create payroll run" onClose={() => setOpen(false)}><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); const form = new FormData(e.currentTarget); create.mutate(Object.fromEntries(form)); }}><select className="rounded-md border border-slate-200 px-3 py-2" name="organizationId">{orgs.data?.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}</select><input className="rounded-md border border-slate-200 px-3 py-2" name="periodStart" type="date" defaultValue="2026-04-01" /><input className="rounded-md border border-slate-200 px-3 py-2" name="periodEnd" type="date" defaultValue="2026-04-30" /><input className="rounded-md border border-slate-200 px-3 py-2" name="currency" defaultValue="USD" />{create.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(create.error as Error).message}</p>}<Button type="submit" disabled={create.isPending}>Create</Button></form></Modal>}
//     </div>
//   );
// }
//