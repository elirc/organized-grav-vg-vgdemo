// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Navigate, Outlet } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import { AppShell } from '../components/layout/AppShell';
//
// export function ProtectedRoute() {
//   const { user, isLoading } = useAuth();
//   if (isLoading) return <div className="grid min-h-screen place-items-center text-slate-600">Loading session...</div>;
//   if (!user) return <Navigate to="/login" replace />;
//   return (
//     <AppShell>
//       <Outlet />
//     </AppShell>
//   );
// }
//