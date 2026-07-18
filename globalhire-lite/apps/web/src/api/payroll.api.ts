// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { api, post } from './client';
//
// export const payrollApi = {
//   list: () => api<any[]>('/payroll-runs'),
//   get: (id: string) => api<any>(`/payroll-runs/${id}`),
//   create: (input: any) => post<any>('/payroll-runs', input),
//   calculate: (id: string) => post<any>(`/payroll-runs/${id}/calculate`),
//   approve: (id: string) => post<any>(`/payroll-runs/${id}/approve`),
//   lock: (id: string) => post<any>(`/payroll-runs/${id}/lock`),
//   generateInvoice: (id: string) => post<any>(`/payroll-runs/${id}/generate-invoice`),
// };
//