// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { LogOut } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '../ui/Button';
// import { useAuth } from '../../hooks/useAuth';
//
// export function Topbar() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   return (
//     <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-mist/95 px-4 backdrop-blur md:px-8">
//       <div>
//         <p className="text-sm font-semibold text-ink">{user?.firstName} {user?.lastName}</p>
//         <p className="text-xs text-slate-500">{user?.role.replaceAll('_', ' ')}</p>
//       </div>
//       <Button
//         variant="secondary"
//         icon={<LogOut size={16} />}
//         onClick={async () => {
//           await logout();
//           navigate('/login');
//         }}
//       >
//         Sign out
//       </Button>
//     </header>
//   );
// }
//