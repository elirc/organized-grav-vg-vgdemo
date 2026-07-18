const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(body.message ?? response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
  workerId?: string;
};

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
  dashboard: () => request<any>('/dashboard'),
  organizations: () => request<any[]>('/organizations'),
  workers: () => request<any[]>('/workers'),
  worker: (id: string) => request<any>(`/workers/${id}`),
  activateWorker: (id: string) => request<any>(`/workers/${id}/activate`, { method: 'POST' }),
  payrollRuns: () => request<any[]>('/payroll-runs'),
  createPayrollRun: (body: any) =>
    request<any>('/payroll-runs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  calculatePayroll: (id: string) => request<any>(`/payroll-runs/${id}/calculate`, { method: 'POST' }),
  approvePayroll: (id: string) => request<any>(`/payroll-runs/${id}/approve`, { method: 'POST' }),
  lockPayroll: (id: string) => request<any>(`/payroll-runs/${id}/lock`, { method: 'POST' }),
  invoices: () => request<any[]>('/invoices'),
  leaveRequests: () => request<any[]>('/leave-requests'),
  timesheets: () => request<any[]>('/timesheets'),
  offboardingCases: () => request<any[]>('/offboarding-cases'),
  countryRules: () => request<any[]>('/country-rules'),
  auditLog: () => request<any[]>('/audit-log'),
};
