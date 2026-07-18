// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { post, api } from './client';
//
// export type CurrentUser = {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   role: string;
//   organizationId: string | null;
//   workerId: string | null;
// };
//
// export const authApi = {
//   login: (email: string, password: string) => post<{ token: string; user: CurrentUser }>('/auth/login', { email, password }),
//   logout: () => post<void>('/auth/logout'),
//   me: () => api<CurrentUser>('/auth/me'),
// };
//