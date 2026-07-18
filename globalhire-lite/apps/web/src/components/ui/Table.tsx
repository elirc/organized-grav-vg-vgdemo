// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ReactNode } from 'react';
//
// export function Table({ children }: { children: ReactNode }) {
//   return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-sm">{children}</table></div>;
// }
//
// export function Th({ children }: { children: ReactNode }) {
//   return <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
// }
//
// export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
//   return <td className={`whitespace-nowrap px-4 py-3 text-slate-700 ${className}`}>{children}</td>;
// }
//