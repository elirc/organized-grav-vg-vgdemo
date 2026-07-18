// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Link, NavLink } from 'react-router-dom';
// import { BarChart3, BriefcaseBusiness, ClipboardCheck, FileText, Globe2, Home, Receipt, Settings, ShieldCheck, Timer, UsersRound } from 'lucide-react';
// import { useRole } from '../../hooks/useRole';
//
// const itemClass = ({ isActive }: { isActive: boolean }) =>
//   `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`;
//
// export function Sidebar() {
//   const role = useRole();
//   const items = [
//     { to: '/dashboard', label: 'Dashboard', icon: Home, show: true },
//     { to: '/workers', label: 'Workers', icon: UsersRound, show: !role.isWorker },
//     { to: '/leave', label: 'Leave', icon: ClipboardCheck, show: true },
//     { to: '/timesheets', label: 'Timesheets', icon: Timer, show: true },
//     { to: '/payroll', label: 'Payroll', icon: BarChart3, show: role.canPayroll },
//     { to: '/invoices', label: 'Invoices', icon: Receipt, show: role.canPayroll },
//     { to: '/offboarding', label: 'Offboarding', icon: BriefcaseBusiness, show: !role.isWorker },
//     { to: '/country-rules', label: 'Country Rules', icon: Globe2, show: role.isInternal },
//     { to: '/audit-log', label: 'Audit Log', icon: ShieldCheck, show: role.isInternal || role.isClientAdmin },
//     { to: '/settings', label: 'Settings', icon: Settings, show: true },
//   ];
//
//   return (
//     <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:block">
//       <Link to="/dashboard" className="mb-7 flex items-center gap-3 px-2">
//         <span className="grid h-10 w-10 place-items-center rounded-md bg-ink text-white"><FileText size={20} /></span>
//         <span>
//           <span className="block text-lg font-bold text-ink">GlobalHire Lite</span>
//           <span className="text-xs font-medium text-slate-500">EOR workflow demo</span>
//         </span>
//       </Link>
//       <nav className="space-y-1">
//         {items.filter((item) => item.show).map((item) => (
//           <NavLink key={item.to} to={item.to} className={itemClass}>
//             <item.icon size={18} />
//             {item.label}
//           </NavLink>
//         ))}
//       </nav>
//     </aside>
//   );
// }
//