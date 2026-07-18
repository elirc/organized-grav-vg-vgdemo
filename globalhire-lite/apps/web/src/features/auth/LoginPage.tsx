// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { loginSchema } from '@globalhire/shared';
// import type { z } from 'zod';
// import { ArrowRight, KeyRound } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth';
// import { Button } from '../../components/ui/Button';
// import { Card, CardBody } from '../../components/ui/Card';
// import { FormField } from '../../components/ui/FormField';
//
// type LoginInput = z.infer<typeof loginSchema>;
//
// const demos = [
//   ['Login as Platform Admin', 'platform.admin@globalhire.test'],
//   ['Login as EOR Specialist', 'eor.specialist@globalhire.test'],
//   ['Login as Client Admin', 'client.admin@acme.test'],
//   ['Login as Manager', 'manager@acme.test'],
//   ['Login as Worker', 'worker@acme.test'],
// ] as const;
//
// export function LoginPage() {
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const [error, setError] = useState('');
//   const form = useForm<LoginInput>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: { email: 'client.admin@acme.test', password: 'Password123!' },
//   });
//   const submit = async (input: LoginInput) => {
//     setError('');
//     try {
//       await login(input.email, input.password);
//       navigate('/dashboard');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Login failed');
//     }
//   };
//
//   return (
//     <main className="grid min-h-screen bg-mist lg:grid-cols-[1.05fr_0.95fr]">
//       <section className="flex min-h-[42vh] flex-col justify-between bg-ink px-8 py-10 text-white lg:min-h-screen">
//         <div className="flex items-center gap-3 text-lg font-bold"><KeyRound /> GlobalHire Lite</div>
//         <div className="max-w-2xl">
//           <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-teal-200">Employer of Record demo</p>
//           <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">International worker operations, from hire request to invoice.</h1>
//           <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
//             A compact workflow app for onboarding, compliance tasks, leave, timesheets, payroll previews, invoices, and offboarding.
//           </p>
//         </div>
//         <p className="text-sm text-slate-300">Country rules and payroll calculations are simplified demo data, not legal, payroll, or tax advice.</p>
//       </section>
//       <section className="flex items-center justify-center p-6">
//         <Card className="w-full max-w-md">
//           <CardBody>
//             <h2 className="text-2xl font-bold text-ink">Sign in</h2>
//             <p className="mt-1 text-sm text-slate-500">Use a demo account to explore role-based workflows.</p>
//             <form className="mt-6 grid gap-4" onSubmit={form.handleSubmit(submit)}>
//               <FormField label="Email" {...form.register('email')} error={form.formState.errors.email?.message} />
//               <FormField label="Password" type="password" {...form.register('password')} error={form.formState.errors.password?.message} />
//               {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
//               <Button type="submit" icon={<ArrowRight size={16} />}>Sign in</Button>
//             </form>
//             <div className="mt-6 grid gap-2">
//               {demos.map(([label, email]) => (
//                 <Button key={email} variant="secondary" onClick={() => submit({ email, password: 'Password123!' })}>
//                   {label}
//                 </Button>
//               ))}
//             </div>
//           </CardBody>
//         </Card>
//       </section>
//     </main>
//   );
// }
//