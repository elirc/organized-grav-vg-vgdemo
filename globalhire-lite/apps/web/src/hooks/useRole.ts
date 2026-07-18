// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { useAuth } from './useAuth';
//
// export const useRole = () => {
//   const { user } = useAuth();
//   const role = user?.role;
//   return {
//     role,
//     isPlatform: role === 'PLATFORM_ADMIN',
//     isInternal: role === 'PLATFORM_ADMIN' || role === 'EOR_SPECIALIST',
//     isClientAdmin: role === 'CLIENT_ADMIN',
//     isManager: role === 'CLIENT_MANAGER',
//     isWorker: role === 'WORKER',
//     canManageWorkers: role === 'CLIENT_ADMIN' || role === 'PLATFORM_ADMIN',
//     canReview: role === 'CLIENT_MANAGER' || role === 'CLIENT_ADMIN' || role === 'EOR_SPECIALIST',
//     canPayroll: role === 'CLIENT_ADMIN' || role === 'EOR_SPECIALIST' || role === 'PLATFORM_ADMIN',
//   };
// };
//