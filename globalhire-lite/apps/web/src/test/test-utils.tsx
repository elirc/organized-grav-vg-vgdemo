// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ReactNode } from 'react';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { MemoryRouter } from 'react-router-dom';
//
// export function renderWithProviders(children: ReactNode, route = '/') {
//   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
//   return {
//     queryClient,
//     ui: (
//       <QueryClientProvider client={queryClient}>
//         <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
//       </QueryClientProvider>
//     ),
//   };
// }
//