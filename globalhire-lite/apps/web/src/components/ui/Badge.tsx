// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// const colors: Record<string, string> = {
//   ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//   APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//   PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//   ONBOARDING: 'bg-sky-50 text-sky-700 border-sky-200',
//   SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200',
//   PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
//   CALCULATED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
//   LOCKED: 'bg-slate-100 text-slate-700 border-slate-200',
//   TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200',
//   REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
//   OFFBOARDING: 'bg-orange-50 text-orange-700 border-orange-200',
//   DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
// };
//
// export function Badge({ children }: { children: string }) {
//   return (
//     <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${colors[children] ?? colors.DRAFT}`}>
//       {children.replaceAll('_', ' ')}
//     </span>
//   );
// }
//