// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useQuery } from '@tanstack/react-query';
// import { Link } from 'react-router-dom';
// import { resourcesApi } from '../../api/resources.api';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { useRole } from '../../hooks/useRole';
// import { formatCurrency } from '../../utils/formatCurrency';
// import { formatDate } from '../../utils/formatDate';
//
// function Stat({ label, value }: { label: string; value: string | number }) {
//   return (
//     <Card>
//       <CardBody>
//         <p className="text-sm text-slate-500">{label}</p>
//         <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
//       </CardBody>
//     </Card>
//   );
// }
//
// export function DashboardPage() {
//   const { isWorker } = useRole();
//   const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: resourcesApi.dashboard });
//   if (isLoading) return <p>Loading dashboard...</p>;
//   if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
//
//   if (isWorker) {
//     return (
//       <div className="grid gap-6">
//         <div>
//           <h1 className="text-2xl font-bold text-ink">My dashboard</h1>
//           <p className="text-sm text-slate-500">Your onboarding, leave, timesheet, and payslip snapshot.</p>
//         </div>
//         <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
//           <Stat label="Onboarding progress" value={`${data.onboardingProgress}%`} />
//           <Stat label="Pending tasks" value={data.pendingTasks} />
//           <Stat label="Approved leave days" value={data.approvedLeaveDays} />
//           <Stat label="Latest timesheet" value={data.timesheetStatus} />
//           <Stat label="Latest net pay" value={formatCurrency(data.latestPayslipNetPay)} />
//         </div>
//       </div>
//     );
//   }
//
//   return (
//     <div className="grid gap-6">
//       <div>
//         <h1 className="text-2xl font-bold text-ink">Operations dashboard</h1>
//         <p className="text-sm text-slate-500">A role-aware snapshot of workforce, approvals, payroll, and offboarding.</p>
//       </div>
//       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
//         <Stat label="Active workers" value={data.activeWorkers} />
//         <Stat label="Onboarding" value={data.onboardingWorkers} />
//         <Stat label="Pending leave" value={data.pendingLeaveRequests} />
//         <Stat label="Pending timesheets" value={data.pendingTimesheets} />
//         <Stat label="Payroll estimate" value={formatCurrency(data.currentPayrollTotal)} />
//         <Stat label="Open offboarding" value={data.openOffboardingCases} />
//       </div>
//       <div className="grid gap-6 xl:grid-cols-2">
//         <Card>
//           <CardHeader title="Recent workers" />
//           <Table>
//             <thead><tr><Th>Name</Th><Th>Status</Th><Th>Start</Th></tr></thead>
//             <tbody>
//               {data.recentWorkers?.map((worker: any) => (
//                 <tr key={worker.id}>
//                   <Td><Link className="font-semibold text-teal" to={`/workers/${worker.id}`}>{worker.firstName} {worker.lastName}</Link></Td>
//                   <Td><Badge>{worker.status}</Badge></Td>
//                   <Td>{formatDate(worker.startDate)}</Td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </Card>
//         <Card>
//           <CardHeader title="Recent payroll runs" />
//           <Table>
//             <thead><tr><Th>Period</Th><Th>Status</Th><Th>Gross</Th></tr></thead>
//             <tbody>
//               {data.recentPayrollRuns?.map((run: any) => (
//                 <tr key={run.id}>
//                   <Td><Link className="font-semibold text-teal" to={`/payroll/${run.id}`}>{formatDate(run.periodStart)} - {formatDate(run.periodEnd)}</Link></Td>
//                   <Td><Badge>{run.status}</Badge></Td>
//                   <Td>{formatCurrency(run.grossTotal, run.currency)}</Td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </Card>
//       </div>
//     </div>
//   );
// }
//