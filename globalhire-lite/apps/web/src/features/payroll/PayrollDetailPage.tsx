// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useParams } from 'react-router-dom';
// import { payrollApi } from '../../api/payroll.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { formatCurrency } from '../../utils/formatCurrency';
// import { formatDate } from '../../utils/formatDate';
// import { useRole } from '../../hooks/useRole';
//
// export function PayrollDetailPage() {
//   const { id = '' } = useParams();
//   const queryClient = useQueryClient();
//   const role = useRole();
//   const { data: run, isLoading, error } = useQuery({ queryKey: ['payroll-run', id], queryFn: () => payrollApi.get(id) });
//   const refresh = () => queryClient.invalidateQueries({ queryKey: ['payroll-run', id] });
//   const action = useMutation({ mutationFn: (fn: () => Promise<any>) => fn(), onSuccess: refresh });
//   if (isLoading) return <p>Loading payroll run...</p>;
//   if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
//   return (
//     <div className="grid gap-6">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div><h1 className="text-2xl font-bold text-ink">Payroll detail</h1><p className="text-sm text-slate-500">{formatDate(run.periodStart)} - {formatDate(run.periodEnd)}</p></div>
//         <div className="flex flex-wrap gap-2">
//           <Badge>{run.status}</Badge>
//           {role.canPayroll && run.status === 'DRAFT' && <Button onClick={() => action.mutate(() => payrollApi.calculate(id))}>Calculate</Button>}
//           {role.isInternal && run.status === 'CALCULATED' && <Button onClick={() => action.mutate(() => payrollApi.approve(id))}>Approve</Button>}
//           {role.isInternal && run.status === 'APPROVED' && <Button onClick={() => action.mutate(() => payrollApi.lock(id))}>Lock</Button>}
//           {role.canPayroll && ['APPROVED', 'LOCKED'].includes(run.status) && !run.invoice && <Button variant="secondary" onClick={() => action.mutate(() => payrollApi.generateInvoice(id))}>Generate invoice</Button>}
//         </div>
//       </div>
//       <div className="grid gap-4 md:grid-cols-4">
//         <Metric label="Gross total" value={formatCurrency(run.grossTotal, run.currency)} />
//         <Metric label="Employee tax" value={formatCurrency(run.employeeTaxTotal, run.currency)} />
//         <Metric label="Employer cost" value={formatCurrency(run.employerCostTotal, run.currency)} />
//         <Metric label="Net total" value={formatCurrency(run.netTotal, run.currency)} />
//       </div>
//       <Card>
//         <CardHeader title="Payroll items by worker" />
//         <Table><thead><tr><Th>Worker</Th><Th>Gross</Th><Th>Overtime</Th><Th>Employee tax</Th><Th>Employer cost</Th><Th>Net</Th></tr></thead><tbody>{run.items.map((item: any) => <tr key={item.id}><Td>{item.worker.firstName} {item.worker.lastName}</Td><Td>{formatCurrency(item.grossPay, item.currency)}</Td><Td>{formatCurrency(item.overtimePay, item.currency)}</Td><Td>{formatCurrency(item.employeeTax, item.currency)}</Td><Td>{formatCurrency(item.employerCost, item.currency)}</Td><Td>{formatCurrency(item.netPay, item.currency)}</Td></tr>)}</tbody></Table>
//       </Card>
//     </div>
//   );
// }
//
// function Metric({ label, value }: { label: string; value: string }) {
//   return <Card><CardBody><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-ink">{value}</p></CardBody></Card>;
// }
//