// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ReactNode } from 'react';
// import { X } from 'lucide-react';
// import { Button } from './Button';
//
// export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
//   return (
//     <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
//       <div className="w-full max-w-xl rounded-lg bg-white shadow-soft">
//         <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
//           <h2 className="font-semibold">{title}</h2>
//           <Button aria-label="Close" variant="ghost" className="px-2" onClick={onClose} icon={<X size={18} />} />
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// }
//