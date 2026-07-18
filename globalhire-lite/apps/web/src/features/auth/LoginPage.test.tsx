// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { render, screen } from '@testing-library/react';
// import { vi } from 'vitest';
// import { LoginPage } from './LoginPage';
// import { renderWithProviders } from '../../test/test-utils';
//
// vi.mock('../../hooks/useAuth', () => ({
//   useAuth: () => ({ login: vi.fn() }),
// }));
//
// it('renders demo login buttons', () => {
//   const { ui } = renderWithProviders(<LoginPage />);
//   render(ui);
//   expect(screen.getByRole('button', { name: /Login as Platform Admin/i })).toBeInTheDocument();
//   expect(screen.getByRole('button', { name: /Login as EOR Specialist/i })).toBeInTheDocument();
//   expect(screen.getByRole('button', { name: /Login as Client Admin/i })).toBeInTheDocument();
//   expect(screen.getByRole('button', { name: /Login as Manager/i })).toBeInTheDocument();
//   expect(screen.getByRole('button', { name: /Login as Worker/i })).toBeInTheDocument();
// });
//