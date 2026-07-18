// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useState } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { Plus } from 'lucide-react';
// import { post } from '../../api/client';
// import { resourcesApi } from '../../api/resources.api';
// import { workersApi } from '../../api/workers.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { FormField, SelectField, TextAreaField } from '../../components/ui/FormField';
// import { Modal } from '../../components/ui/Modal';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { useRole } from '../../hooks/useRole';
// import { formatDate } from '../../utils/formatDate';
//
// type LeaveRequestInput = {
//   workerId?: string;
//   leaveType: string;
//   startDate: string;
//   endDate: string;
//   reason: string;
// };
//
// export function LeavePage() {
//   const queryClient = useQueryClient();
//   const role = useRole();
//   const [open, setOpen] = useState(false);
//   const requiresWorkerSelection = !role.isWorker;
//   const { data = [], isLoading } = useQuery({ queryKey: ['leave'], queryFn: resourcesApi.leave });
//   const workers = useQuery({
//     queryKey: ['workers', 'leave-request-form'],
//     queryFn: () => workersApi.list(),
//     enabled: open && requiresWorkerSelection,
//   });
//   const action = useMutation({ mutationFn: ({ id, approve }: { id: string; approve: boolean }) => approve ? resourcesApi.approveLeave(id) : resourcesApi.rejectLeave(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave'] }) });
//   const create = useMutation({
//     mutationFn: (input: LeaveRequestInput) => post('/leave-requests', input),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['leave'] });
//       setOpen(false);
//     },
//   });
//
//   const closeForm = () => {
//     setOpen(false);
//     create.reset();
//   };
//
//   return (
//     <>
//       <Card>
//         <CardHeader title="Leave requests" action={<Button icon={<Plus size={16} />} onClick={() => { create.reset(); setOpen(true); }}>Create request</Button>} />
//         {isLoading ? <p className="p-5">Loading leave requests...</p> : (
//           <Table>
//             <thead><tr><Th>Worker</Th><Th>Type</Th><Th>Dates</Th><Th>Status</Th><Th>Reason</Th><Th>Actions</Th></tr></thead>
//             <tbody>{data.map((leave: any) => <tr key={leave.id}><Td>{leave.worker.firstName} {leave.worker.lastName}</Td><Td>{leave.leaveType}</Td><Td>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</Td><Td><Badge>{leave.status}</Badge></Td><Td>{leave.reason}</Td><Td>{role.canReview && leave.status === 'PENDING' && <div className="flex gap-2"><Button variant="secondary" onClick={() => action.mutate({ id: leave.id, approve: true })}>Approve</Button><Button variant="ghost" onClick={() => action.mutate({ id: leave.id, approve: false })}>Reject</Button></div>}</Td></tr>)}</tbody>
//           </Table>
//         )}
//       </Card>
//       {open && (
//         <Modal title="Create leave request" onClose={closeForm}>
//           <form
//             className="grid gap-4"
//             onSubmit={(event) => {
//               event.preventDefault();
//               const form = new FormData(event.currentTarget);
//               const input: LeaveRequestInput = {
//                 leaveType: String(form.get('leaveType') ?? ''),
//                 startDate: String(form.get('startDate') ?? ''),
//                 endDate: String(form.get('endDate') ?? ''),
//                 reason: String(form.get('reason') ?? ''),
//               };
//               if (requiresWorkerSelection) input.workerId = String(form.get('workerId') ?? '');
//               create.mutate(input);
//             }}
//           >
//             {requiresWorkerSelection && (
//               <SelectField label="Worker" name="workerId" required disabled={workers.isLoading || create.isPending}>
//                 <option value="">{workers.isLoading ? 'Loading workers...' : 'Select worker'}</option>
//                 {workers.data?.map((worker: any) => (
//                   <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName} ({worker.email})</option>
//                 ))}
//               </SelectField>
//             )}
//             <SelectField label="Leave type" name="leaveType" required disabled={create.isPending}>
//               <option value="VACATION">Vacation</option>
//               <option value="SICK">Sick</option>
//               <option value="PERSONAL">Personal</option>
//               <option value="PARENTAL">Parental</option>
//             </SelectField>
//             <div className="grid gap-4 md:grid-cols-2">
//               <FormField label="Start date" name="startDate" type="date" required disabled={create.isPending} />
//               <FormField label="End date" name="endDate" type="date" required disabled={create.isPending} />
//             </div>
//             <TextAreaField label="Reason" name="reason" required rows={4} disabled={create.isPending} />
//             {workers.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(workers.error as Error).message}</p>}
//             {create.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(create.error as Error).message}</p>}
//             <div className="flex justify-end gap-2">
//               <Button type="button" variant="ghost" onClick={closeForm} disabled={create.isPending}>Cancel</Button>
//               <Button type="submit" disabled={create.isPending || (requiresWorkerSelection && (workers.isLoading || !workers.data?.length))}>Submit request</Button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </>
//   );
// }
//