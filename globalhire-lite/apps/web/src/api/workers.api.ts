// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { CreateWorkerInput } from '@globalhire/shared';
// import { api, patch, post } from './client';
//
// export const workersApi = {
//   list: (query = '') => api<any[]>(`/workers${query}`),
//   get: (id: string) => api<any>(`/workers/${id}`),
//   create: (input: CreateWorkerInput) => post<any>('/workers', input),
//   update: (id: string, input: any) => patch<any>(`/workers/${id}`, input),
//   activate: (id: string) => post<any>(`/workers/${id}/activate`),
//   onboarding: (id: string) => api<any[]>(`/workers/${id}/onboarding`),
//   documents: (id: string) => api<any[]>(`/workers/${id}/documents`),
// };
//