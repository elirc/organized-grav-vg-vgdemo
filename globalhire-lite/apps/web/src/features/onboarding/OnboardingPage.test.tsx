// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { render, screen } from '@testing-library/react';
// import { vi } from 'vitest';
// import { OnboardingPage } from './OnboardingPage';
// import { renderWithProviders } from '../../test/test-utils';
//
// vi.mock('react-router-dom', async () => {
//   const actual = await vi.importActual<any>('react-router-dom');
//   return { ...actual, useParams: () => ({ id: 'worker-1' }) };
// });
// vi.mock('../../api/workers.api', () => ({
//   workersApi: {
//     onboarding: () => Promise.resolve([{ id: 'task-1', title: 'Tax information submitted', description: 'Tax metadata', required: true, status: 'APPROVED' }]),
//   },
// }));
//
// it('shows task status badges', async () => {
//   const { ui } = renderWithProviders(<OnboardingPage />);
//   render(ui);
//   expect(await screen.findByText(/Tax information submitted/i)).toBeInTheDocument();
//   expect(screen.getByText('APPROVED')).toBeInTheDocument();
// });
//