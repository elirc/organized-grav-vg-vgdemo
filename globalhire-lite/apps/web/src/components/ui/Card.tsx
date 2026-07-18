// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ReactNode } from 'react';
//
// export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
//   return <section className={`rounded-lg border border-slate-200 bg-white shadow-soft ${className}`}>{children}</section>;
// }
//
// export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
//   return (
//     <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
//       <h2 className="text-base font-semibold text-ink">{title}</h2>
//       {action}
//     </div>
//   );
// }
//
// export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
//   return <div className={`p-5 ${className}`}>{children}</div>;
// }
//