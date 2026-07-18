// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { FormEvent } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { post } from '../../api/client';
// import { resourcesApi } from '../../api/resources.api';
// import { workersApi } from '../../api/workers.api';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Badge } from '../../components/ui/Badge';
// import { FormField, SelectField, TextAreaField } from '../../components/ui/FormField';
// import { Table, Td, Th } from '../../components/ui/Table';
// import { useRole } from '../../hooks/useRole';
// import { formatDate } from '../../utils/formatDate';
//
// export function TimesheetsPage() {
//   const queryClient = useQueryClient();
//   const role = useRole();
//   const canSelectWorker = !role.isWorker && (role.canReview || role.canManageWorkers || role.isPlatform);
//   const { data = [], isLoading, error: timesheetsError } = useQuery({ queryKey: ['timesheets'], queryFn: resourcesApi.timesheets });
//   const workers = useQuery({ queryKey: ['workers', 'timesheet-form'], queryFn: () => workersApi.list(), enabled: canSelectWorker });
//   const refresh = () => queryClient.invalidateQueries({ queryKey: ['timesheets'] });
//   const create = useMutation({
//     mutationFn: (input: any) => post('/timesheets', input),
//     onSuccess: () => refresh(),
//   });
//   const submit = useMutation({
//     mutationFn: (id: string) => post(`/timesheets/${id}/submit`),
//     onSuccess: () => refresh(),
//   });
//   const action = useMutation({ mutationFn: ({ id, approve }: { id: string; approve: boolean }) => approve ? resourcesApi.approveTimesheet(id) : resourcesApi.rejectTimesheet(id), onSuccess: refresh });
//
//   const createTimesheet = (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     const form = event.currentTarget;
//     const formData = new FormData(form);
//     const input: any = {
//       weekStartDate: formData.get('weekStartDate'),
//       regularHours: formData.get('regularHours'),
//       overtimeHours: formData.get('overtimeHours'),
//       notes: formData.get('notes'),
//     };
//     if (canSelectWorker) input.workerId = formData.get('workerId');
//     create.mutate(input, { onSuccess: () => form.reset() });
//   };
//
//   const createError = create.error ?? workers.error;
//   const tableError = timesheetsError ?? submit.error ?? action.error;
//
//   return (
//     <div className="grid gap-6">
//       <Card>
//         <CardHeader title={role.isWorker ? 'Create timesheet' : 'Create timesheet draft'} />
//         <CardBody>
//           <form className="grid gap-4 md:grid-cols-2" onSubmit={createTimesheet}>
//             {canSelectWorker && (
//               <SelectField label="Worker" name="workerId" required disabled={workers.isLoading || create.isPending}>
//                 <option value="">Select worker</option>
//                 {workers.data?.map((worker: any) => <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName}</option>)}
//               </SelectField>
//             )}
//             <FormField label="Week start date" name="weekStartDate" type="date" required disabled={create.isPending} />
//             <FormField label="Regular hours" name="regularHours" type="number" min="0" max="80" step="0.25" required disabled={create.isPending} />
//             <FormField label="Overtime hours" name="overtimeHours" type="number" min="0" max="80" step="0.25" required disabled={create.isPending} />
//             <div className="md:col-span-2">
//               <TextAreaField label="Notes" name="notes" rows={3} disabled={create.isPending} />
//             </div>
//             {createError && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(createError as Error).message}</p>}
//             <div className="md:col-span-2">
//               <Button type="submit" disabled={create.isPending || workers.isLoading}>{role.isWorker ? 'Submit timesheet' : 'Save draft'}</Button>
//             </div>
//           </form>
//         </CardBody>
//       </Card>
//       <Card>
//         <CardHeader title="Timesheets" />
//         {tableError && <CardBody><p className="text-rose-700">{(tableError as Error).message}</p></CardBody>}
//         {isLoading ? <p className="p-5">Loading timesheets...</p> : !timesheetsError && (
//           <Table>
//             <thead><tr><Th>Worker</Th><Th>Week</Th><Th>Regular</Th><Th>Overtime</Th><Th>Status</Th><Th>Notes</Th><Th>Actions</Th></tr></thead>
//             <tbody>{data.map((sheet: any) => <tr key={sheet.id}><Td>{sheet.worker.firstName} {sheet.worker.lastName}</Td><Td>{formatDate(sheet.weekStartDate)}</Td><Td>{sheet.regularHours}</Td><Td>{sheet.overtimeHours}</Td><Td><Badge>{sheet.status}</Badge></Td><Td>{sheet.notes}</Td><Td><div className="flex gap-2">{sheet.status === 'DRAFT' && <Button variant="secondary" disabled={submit.isPending} onClick={() => submit.mutate(sheet.id)}>Submit</Button>}{role.canReview && sheet.status === 'SUBMITTED' && <><Button variant="secondary" disabled={action.isPending} onClick={() => action.mutate({ id: sheet.id, approve: true })}>Approve</Button><Button variant="ghost" disabled={action.isPending} onClick={() => action.mutate({ id: sheet.id, approve: false })}>Reject</Button></>}</div></Td></tr>)}</tbody>
//           </Table>
//         )}
//       </Card>
//     </div>
//   );
// }
//