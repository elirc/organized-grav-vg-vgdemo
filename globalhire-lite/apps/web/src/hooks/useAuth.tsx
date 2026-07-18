// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { createContext, useContext, type ReactNode } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { authApi, type CurrentUser } from '../api/auth.api';
//
// type AuthContextValue = {
//   user?: CurrentUser;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => Promise<void>;
// };
//
// const AuthContext = createContext<AuthContextValue | null>(null);
//
// export function AuthProvider({ children }: { children: ReactNode }) {
//   const queryClient = useQueryClient();
//   const me = useQuery({
//     queryKey: ['me'],
//     queryFn: authApi.me,
//     retry: false,
//   });
//   const loginMutation = useMutation({
//     mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
//     onSuccess: (data) => queryClient.setQueryData(['me'], data.user),
//   });
//   const logoutMutation = useMutation({
//     mutationFn: authApi.logout,
//     onSuccess: () => queryClient.clear(),
//   });
//
//   return (
//     <AuthContext.Provider
//       value={{
//         user: me.data,
//         isLoading: me.isLoading,
//         login: async (email, password) => void (await loginMutation.mutateAsync({ email, password })),
//         logout: async () => void (await logoutMutation.mutateAsync()),
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }
//
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used inside AuthProvider');
//   return context;
// };
//