// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { api, post } from './client';
//
// export const resourcesApi = {
//   dashboard: () => api<any>('/dashboard'),
//   organizations: () => api<any[]>('/organizations'),
//   countryRules: () => api<any[]>('/country-rules'),
//   leave: () => api<any[]>('/leave-requests'),
//   timesheets: () => api<any[]>('/timesheets'),
//   invoices: () => api<any[]>('/invoices'),
//   invoice: (id: string) => api<any>(`/invoices/${id}`),
//   offboarding: () => api<any[]>('/offboarding-cases'),
//   audit: () => api<any[]>('/audit-log'),
//   approveLeave: (id: string) => post(`/leave-requests/${id}/approve`),
//   rejectLeave: (id: string) => post(`/leave-requests/${id}/reject`),
//   approveTimesheet: (id: string) => post(`/timesheets/${id}/approve`),
//   rejectTimesheet: (id: string) => post(`/timesheets/${id}/reject`),
//   issueInvoice: (id: string) => post(`/invoices/${id}/issue`),
//   markPaid: (id: string) => post(`/invoices/${id}/mark-paid`),
//   voidInvoice: (id: string) => post(`/invoices/${id}/void`),
// };
//