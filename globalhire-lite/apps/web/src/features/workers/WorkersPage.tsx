// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useMemo, useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { Link } from 'react-router-dom';
// import { Plus } from 'lucide-react';
// import { workersApi } from '../../api/workers.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { useRole } from '../../hooks/useRole';
// import { formatDate } from '../../utils/formatDate';
//
// export function WorkersPage() {
//   const [filters, setFilters] = useState({ search: '', status: '', country: '', department: '' });
//   const query = useMemo(() => {
//     const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
//     return params.toString() ? `?${params.toString()}` : '';
//   }, [filters]);
//   const { data = [], isLoading, error } = useQuery({ queryKey: ['workers', query], queryFn: () => workersApi.list(query) });
//   const role = useRole();
//
//   return (
//     <div className="grid gap-6">
//       <div className="flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-bold text-ink">Workers</h1>
//           <p className="text-sm text-slate-500">Search and filter international workers by lifecycle status.</p>
//         </div>
//         {role.canManageWorkers && <Link to="/workers/new"><Button icon={<Plus size={16} />}>Create worker</Button></Link>}
//       </div>
//       <Card>
//         <CardBody className="grid gap-3 md:grid-cols-4">
//           <input className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Search name or email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
//           <select className="focus-ring rounded-md border border-slate-200 px-3 py-2" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
//             <option value="">All statuses</option>
//             {['DRAFT', 'ONBOARDING', 'ACTIVE', 'ON_LEAVE', 'OFFBOARDING', 'TERMINATED'].map((status) => <option key={status}>{status}</option>)}
//           </select>
//           <input className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Country code" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value.toUpperCase() })} />
//           <input className="focus-ring rounded-md border border-slate-200 px-3 py-2" placeholder="Department" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} />
//         </CardBody>
//       </Card>
//       <Card>
//         <CardHeader title="Worker directory" />
//         {isLoading && <CardBody>Loading workers...</CardBody>}
//         {error && <CardBody><p className="text-rose-700">{(error as Error).message}</p></CardBody>}
//         {!isLoading && !error && (
//           <Table>
//             <thead><tr><Th>Name</Th><Th>Country</Th><Th>Job title</Th><Th>Department</Th><Th>Status</Th><Th>Start date</Th><Th>Onboarding</Th></tr></thead>
//             <tbody>
//               {data.map((worker: any) => {
//                 const total = worker.onboardingTasks?.length ?? 0;
//                 const approved = worker.onboardingTasks?.filter((task: any) => task.status === 'APPROVED').length ?? 0;
//                 return (
//                   <tr key={worker.id}>
//                     <Td><Link className="font-semibold text-teal" to={`/workers/${worker.id}`}>{worker.firstName} {worker.lastName}</Link><span className="block text-xs text-slate-500">{worker.email}</span></Td>
//                     <Td>{worker.countryCode}</Td>
//                     <Td>{worker.jobTitle}</Td>
//                     <Td>{worker.department}</Td>
//                     <Td><Badge>{worker.status}</Badge></Td>
//                     <Td>{formatDate(worker.startDate)}</Td>
//                     <Td>{total ? `${Math.round((approved / total) * 100)}%` : 'N/A'}</Td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </Table>
//         )}
//       </Card>
//     </div>
//   );
// }
//