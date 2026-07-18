// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
//
// export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
//   const response = await fetch(`${API_URL}${path}`, {
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
//     ...options,
//   });
//   if (response.status === 204) return undefined as T;
//   const data = await response.json().catch(() => ({}));
//   if (!response.ok) throw new Error(data.message ?? 'Request failed');
//   return data as T;
// }
//
// export const post = <T>(path: string, body?: unknown) =>
//   api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
//
// export const patch = <T>(path: string, body: unknown) =>
//   api<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
//