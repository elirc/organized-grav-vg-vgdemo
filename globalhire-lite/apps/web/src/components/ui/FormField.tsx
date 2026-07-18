// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
//
// export const FormField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(function FormField({
//   label,
//   error,
//   ...props
// }, ref) {
//   return (
//     <label className="grid gap-1.5 text-sm font-medium text-slate-700">
//       {label}
//       <input ref={ref} className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2" {...props} />
//       {error && <span className="text-xs text-rose-600">{error}</span>}
//     </label>
//   );
// });
//
// export const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }>(function SelectField({
//   label,
//   error,
//   children,
//   ...props
// }, ref) {
//   return (
//     <label className="grid gap-1.5 text-sm font-medium text-slate-700">
//       {label}
//       <select ref={ref} className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2" {...props}>
//         {children}
//       </select>
//       {error && <span className="text-xs text-rose-600">{error}</span>}
//     </label>
//   );
// });
//
// export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(function TextAreaField({
//   label,
//   error,
//   ...props
// }, ref) {
//   return (
//     <label className="grid gap-1.5 text-sm font-medium text-slate-700">
//       {label}
//       <textarea ref={ref} className="focus-ring rounded-md border border-slate-200 bg-white px-3 py-2" {...props} />
//       {error && <span className="text-xs text-rose-600">{error}</span>}
//     </label>
//   );
// });
//