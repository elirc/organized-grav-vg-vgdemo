// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { render, screen } from '@testing-library/react';
// import { vi } from 'vitest';
// import { PayrollDetailPage } from './PayrollDetailPage';
// import { renderWithProviders } from '../../test/test-utils';
//
// vi.mock('react-router-dom', async () => {
//   const actual = await vi.importActual<any>('react-router-dom');
//   return { ...actual, useParams: () => ({ id: 'payroll-1' }) };
// });
// vi.mock('../../hooks/useRole', () => ({ useRole: () => ({ canPayroll: true, isInternal: true }) }));
// vi.mock('../../api/payroll.api', () => ({
//   payrollApi: {
//     get: () => Promise.resolve({
//       id: 'payroll-1',
//       periodStart: '2026-04-01',
//       periodEnd: '2026-04-30',
//       status: 'CALCULATED',
//       currency: 'USD',
//       grossTotal: 10000,
//       employeeTaxTotal: 2000,
//       employerCostTotal: 1200,
//       netTotal: 8000,
//       items: [{ id: 'item-1', worker: { firstName: 'Wes', lastName: 'Worker' }, grossPay: 10000, overtimePay: 0, employeeTax: 2000, employerCost: 1200, netPay: 8000, currency: 'USD' }],
//     }),
//     approve: vi.fn(),
//   },
// }));
//
// it('shows payroll totals', async () => {
//   const { ui } = renderWithProviders(<PayrollDetailPage />);
//   render(ui);
//   expect(await screen.findAllByText('$10,000')).toHaveLength(2);
//   expect(screen.getAllByText('$8,000')).toHaveLength(2);
// });
//