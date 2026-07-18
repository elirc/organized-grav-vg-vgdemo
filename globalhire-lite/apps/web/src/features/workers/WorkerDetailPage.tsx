// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useState, type FormEvent } from 'react';
// import { Link, useParams } from 'react-router-dom';
// import { Check, FileCheck, Pencil, Send, X } from 'lucide-react';
// import { workersApi } from '../../api/workers.api';
// import { post } from '../../api/client';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { Button } from '../../components/ui/Button';
// import { FormField, SelectField } from '../../components/ui/FormField';
// import { Modal } from '../../components/ui/Modal';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { useRole } from '../../hooks/useRole';
// import { formatCurrency } from '../../utils/formatCurrency';
// import { formatDate } from '../../utils/formatDate';
//
// type ContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED';
//
// type WorkerEditForm = {
//   jobTitle: string;
//   department: string;
//   salaryAmount: string;
//   salaryCurrency: string;
//   contractStatus: ContractStatus;
// };
//
// type WorkerUpdateInput = {
//   jobTitle: string;
//   department: string;
//   employment: {
//     salaryAmount: number;
//     salaryCurrency: string;
//     contractStatus: ContractStatus;
//   };
// };
//
// const CONTRACT_STATUSES: ContractStatus[] = ['DRAFT', 'SENT', 'SIGNED', 'CANCELLED'];
//
// export function WorkerDetailPage() {
//   const { id = '' } = useParams();
//   const queryClient = useQueryClient();
//   const role = useRole();
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [editForm, setEditForm] = useState<WorkerEditForm>({
//     jobTitle: '',
//     department: '',
//     salaryAmount: '',
//     salaryCurrency: '',
//     contractStatus: 'DRAFT',
//   });
//   const { data: worker, isLoading, error } = useQuery({ queryKey: ['worker', id], queryFn: () => workersApi.get(id), enabled: Boolean(id) });
//   const refresh = () => queryClient.invalidateQueries({ queryKey: ['worker', id] });
//   const action = useMutation({ mutationFn: ({ path, body }: { path: string; body?: unknown }) => post(path, body), onSuccess: refresh });
//   const activate = useMutation({ mutationFn: () => workersApi.activate(id), onSuccess: refresh });
//   const updateWorker = useMutation({
//     mutationFn: (input: WorkerUpdateInput) => workersApi.update(id, input),
//     onSuccess: () => {
//       refresh();
//       setIsEditOpen(false);
//     },
//   });
//
//   if (isLoading) return <p>Loading worker...</p>;
//   if (error) return <p className="text-rose-700">{(error as Error).message}</p>;
//   if (!worker) return null;
//   const employment = worker.employment;
//   const country = worker.countryRule;
//   const totalTasks = worker.onboardingTasks.length;
//   const approvedTasks = worker.onboardingTasks.filter((task: any) => task.status === 'APPROVED').length;
//   const canPatchWorker = role.isClientAdmin || role.isInternal;
//   const openEditModal = () => {
//     setEditForm({
//       jobTitle: worker.jobTitle ?? '',
//       department: worker.department ?? '',
//       salaryAmount: String(employment.salaryAmount ?? ''),
//       salaryCurrency: employment.salaryCurrency ?? '',
//       contractStatus: employment.contractStatus ?? 'DRAFT',
//     });
//     updateWorker.reset();
//     setIsEditOpen(true);
//   };
//   const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     updateWorker.mutate({
//       jobTitle: editForm.jobTitle,
//       department: editForm.department,
//       employment: {
//         salaryAmount: Number(editForm.salaryAmount),
//         salaryCurrency: editForm.salaryCurrency.trim().toUpperCase(),
//         contractStatus: editForm.contractStatus,
//       },
//     });
//   };
//
//   return (
//     <div className="grid gap-6">
//       <div className="flex flex-wrap items-start justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-bold text-ink">{worker.firstName} {worker.lastName}</h1>
//           <p className="text-sm text-slate-500">{worker.jobTitle} · {worker.department} · {worker.countryCode}</p>
//         </div>
//         <div className="flex gap-2">
//           <Badge>{worker.status}</Badge>
//           {role.canReview && worker.status === 'ONBOARDING' && <Button onClick={() => activate.mutate()} icon={<Check size={16} />}>Activate</Button>}
//         </div>
//       </div>
//
//       <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
//         <Card>
//           <CardHeader
//             title="Overview"
//             action={canPatchWorker && <Button variant="secondary" icon={<Pencil size={14} />} onClick={openEditModal}>Edit</Button>}
//           />
//           <CardBody className="grid gap-4 md:grid-cols-2">
//             <Info label="Email" value={worker.email} />
//             <Info label="Organization" value={worker.organization.name} />
//             <Info label="Manager" value={worker.manager ? `${worker.manager.firstName} ${worker.manager.lastName}` : 'Unassigned'} />
//             <Info label="Start date" value={formatDate(worker.startDate)} />
//             <Info label="Salary" value={formatCurrency(employment.salaryAmount, employment.salaryCurrency)} />
//             <Info label="Contract" value={employment.contractStatus} />
//           </CardBody>
//         </Card>
//         <Card>
//           <CardHeader title="Country rule summary" />
//           <CardBody className="grid gap-3 text-sm">
//             <p className="rounded-md bg-amber-50 p-3 text-amber-800">Country rules are simplified demo data and are not legal, payroll, or tax advice.</p>
//             <Info label="Country" value={country?.countryName ?? worker.countryCode} />
//             <Info label="Vacation allowance" value={`${country?.statutoryVacationDays ?? 0} days`} />
//             <Info label="Probation" value={`${country?.probationPeriodDays ?? 0} days`} />
//             <Info label="Notice period" value={`${country?.noticePeriodDays ?? 0} days`} />
//           </CardBody>
//         </Card>
//       </div>
//
//       <Card>
//         <CardHeader title={`Onboarding checklist (${approvedTasks}/${totalTasks} approved)`} action={<Link className="text-sm font-semibold text-teal" to={`/workers/${id}/onboarding`}>Open checklist</Link>} />
//         <Table>
//           <thead><tr><Th>Task</Th><Th>Category</Th><Th>Required</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
//           <tbody>
//             {worker.onboardingTasks.map((task: any) => (
//               <tr key={task.id}>
//                 <Td className="font-medium">{task.title}</Td>
//                 <Td>{task.category}</Td>
//                 <Td>{task.required ? 'Yes' : 'No'}</Td>
//                 <Td><Badge>{task.status}</Badge></Td>
//                 <Td>
//                   <div className="flex gap-2">
//                     {(role.isWorker || role.isClientAdmin) && <Button variant="secondary" icon={<Send size={14} />} onClick={() => action.mutate({ path: `/onboarding-tasks/${task.id}/submit` })}>Submit</Button>}
//                     {role.isInternal && <Button variant="secondary" icon={<Check size={14} />} onClick={() => action.mutate({ path: `/onboarding-tasks/${task.id}/approve` })}>Approve</Button>}
//                     {role.isInternal && <Button variant="ghost" icon={<X size={14} />} onClick={() => action.mutate({ path: `/onboarding-tasks/${task.id}/reject`, body: { rejectionReason: 'Needs clearer demo evidence' } })}>Reject</Button>}
//                   </div>
//                 </Td>
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//       </Card>
//
//       <div className="grid gap-6 xl:grid-cols-2">
//         <Card>
//           <CardHeader title="Documents" action={(role.isWorker || role.isClientAdmin) && <Button variant="secondary" icon={<FileCheck size={14} />} onClick={() => action.mutate({ path: `/workers/${id}/documents`, body: { fileName: 'demo-document.pdf', documentType: 'OTHER' } })}>Add metadata</Button>} />
//           <Table><thead><tr><Th>File</Th><Th>Type</Th><Th>Status</Th></tr></thead><tbody>{worker.documents.map((doc: any) => <tr key={doc.id}><Td>{doc.fileName}</Td><Td>{doc.documentType}</Td><Td><Badge>{doc.status}</Badge></Td></tr>)}</tbody></Table>
//         </Card>
//         <Card>
//           <CardHeader title="Recent payroll items" />
//           <Table><thead><tr><Th>Run</Th><Th>Gross</Th><Th>Net</Th></tr></thead><tbody>{worker.payrollItems.map((item: any) => <tr key={item.id}><Td>{formatDate(item.payrollRun.periodStart)}</Td><Td>{formatCurrency(item.grossPay, item.currency)}</Td><Td>{formatCurrency(item.netPay, item.currency)}</Td></tr>)}</tbody></Table>
//         </Card>
//       </div>
//
//       {isEditOpen && (
//         <Modal title="Edit worker details" onClose={() => setIsEditOpen(false)}>
//           <form className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
//             <FormField
//               label="Job title"
//               value={editForm.jobTitle}
//               onChange={(event) => setEditForm((current) => ({ ...current, jobTitle: event.target.value }))}
//             />
//             <FormField
//               label="Department"
//               value={editForm.department}
//               onChange={(event) => setEditForm((current) => ({ ...current, department: event.target.value }))}
//             />
//             <FormField
//               label="Salary amount"
//               type="number"
//               min="0"
//               step="0.01"
//               required
//               value={editForm.salaryAmount}
//               onChange={(event) => setEditForm((current) => ({ ...current, salaryAmount: event.target.value }))}
//             />
//             <FormField
//               label="Salary currency"
//               maxLength={3}
//               required
//               value={editForm.salaryCurrency}
//               onChange={(event) => setEditForm((current) => ({ ...current, salaryCurrency: event.target.value.toUpperCase() }))}
//             />
//             <SelectField
//               label="Contract status"
//               value={editForm.contractStatus}
//               onChange={(event) => setEditForm((current) => ({ ...current, contractStatus: event.target.value as ContractStatus }))}
//             >
//               {CONTRACT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
//             </SelectField>
//             {updateWorker.error && (
//               <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(updateWorker.error as Error).message}</p>
//             )}
//             <div className="flex justify-end gap-2 md:col-span-2">
//               <Button type="button" variant="secondary" disabled={updateWorker.isPending} onClick={() => setIsEditOpen(false)}>Cancel</Button>
//               <Button type="submit" disabled={updateWorker.isPending}>Save changes</Button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }
//
// function Info({ label, value }: { label: string; value: string }) {
//   return (
//     <div>
//       <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
//       <p className="mt-1 font-medium text-ink">{value}</p>
//     </div>
//   );
// }
//