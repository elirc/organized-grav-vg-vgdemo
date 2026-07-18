// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useMutation, useQuery } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { createWorkerSchema, type CreateWorkerInput } from '@globalhire/shared';
// import { workersApi } from '../../api/workers.api';
// import { resourcesApi } from '../../api/resources.api';
// import { Card, CardBody, CardHeader } from '../../components/ui/Card';
// import { Button } from '../../components/ui/Button';
// import { FormField, SelectField } from '../../components/ui/FormField';
//
// export function NewWorkerPage() {
//   const navigate = useNavigate();
//   const countries = useQuery({ queryKey: ['country-rules'], queryFn: resourcesApi.countryRules });
//   const organizations = useQuery({ queryKey: ['organizations'], queryFn: resourcesApi.organizations });
//   const form = useForm<CreateWorkerInput>({
//     resolver: zodResolver(createWorkerSchema),
//     defaultValues: { employmentType: 'FULL_TIME', salaryCurrency: 'USD', countryCode: 'US', startDate: '2026-05-01' },
//   });
//   const mutation = useMutation({
//     mutationFn: workersApi.create,
//     onSuccess: (worker) => navigate(`/workers/${worker.id}`),
//   });
//
//   return (
//     <div className="grid gap-6">
//       <div>
//         <h1 className="text-2xl font-bold text-ink">Create worker</h1>
//         <p className="text-sm text-slate-500">Creates the worker, employment record, onboarding checklist, and audit entry.</p>
//       </div>
//       <Card>
//         <CardHeader title="Hire request" />
//         <CardBody>
//           <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((input) => mutation.mutate(input))}>
//             <FormField label="First name" {...form.register('firstName')} error={form.formState.errors.firstName?.message} />
//             <FormField label="Last name" {...form.register('lastName')} error={form.formState.errors.lastName?.message} />
//             <FormField label="Email" {...form.register('email')} error={form.formState.errors.email?.message} />
//             <SelectField label="Country" {...form.register('countryCode')}>
//               {countries.data?.map((country: any) => <option key={country.countryCode} value={country.countryCode}>{country.countryName}</option>)}
//             </SelectField>
//             <FormField label="Job title" {...form.register('jobTitle')} />
//             <FormField label="Department" {...form.register('department')} />
//             <SelectField label="Employment type" {...form.register('employmentType')}>
//               <option value="FULL_TIME">Full-time</option>
//               <option value="PART_TIME">Part-time</option>
//               <option value="CONTRACTOR">Contractor</option>
//             </SelectField>
//             <FormField label="Start date" type="date" {...form.register('startDate')} />
//             <FormField label="Salary amount" type="number" {...form.register('salaryAmount')} />
//             <FormField label="Salary currency" {...form.register('salaryCurrency')} />
//             {organizations.data && organizations.data.length > 1 && (
//               <SelectField label="Organization" {...form.register('organizationId')}>
//                 {organizations.data.map((org: any) => <option key={org.id} value={org.id}>{org.name}</option>)}
//               </SelectField>
//             )}
//             {mutation.error && <p className="md:col-span-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{(mutation.error as Error).message}</p>}
//             <div className="md:col-span-2"><Button type="submit" disabled={mutation.isPending}>Create worker</Button></div>
//           </form>
//         </CardBody>
//       </Card>
//     </div>
//   );
// }
//