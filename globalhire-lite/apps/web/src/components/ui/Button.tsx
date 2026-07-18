// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ButtonHTMLAttributes, ReactNode } from 'react';
//
// type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
//   variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
//   icon?: ReactNode;
// };
//
// const variants = {
//   primary: 'bg-teal text-white hover:bg-teal/90',
//   secondary: 'bg-white text-ink border border-slate-200 hover:bg-slate-50',
//   ghost: 'text-slate-700 hover:bg-slate-100',
//   danger: 'bg-coral text-white hover:bg-coral/90',
// };
//
// export function Button({ children, className = '', variant = 'primary', icon, ...props }: Props) {
//   return (
//     <button
//       className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
//       {...props}
//     >
//       {icon}
//       {children}
//     </button>
//   );
// }
//