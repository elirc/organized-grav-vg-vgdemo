// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Navigate, Route, Routes } from 'react-router-dom';
// import { LoginPage } from './features/auth/LoginPage';
// import { ProtectedRoute } from './routes/ProtectedRoute';
// import { DashboardPage } from './features/dashboard/DashboardPage';
// import { WorkersPage } from './features/workers/WorkersPage';
// import { NewWorkerPage } from './features/workers/NewWorkerPage';
// import { WorkerDetailPage } from './features/workers/WorkerDetailPage';
// import { OnboardingPage } from './features/onboarding/OnboardingPage';
// import { LeavePage } from './features/leave/LeavePage';
// import { TimesheetsPage } from './features/timesheets/TimesheetsPage';
// import { PayrollPage } from './features/payroll/PayrollPage';
// import { PayrollDetailPage } from './features/payroll/PayrollDetailPage';
// import { InvoiceDetailPage, InvoicesPage } from './features/invoices/InvoicesPage';
// import { OffboardingPage } from './features/offboarding/OffboardingPage';
// import { CountryRulesPage } from './features/countryRules/CountryRulesPage';
// import { AuditLogPage } from './features/audit/AuditLogPage';
// import { SettingsPage } from './features/dashboard/SettingsPage';
//
// export function App() {
//   return (
//     <Routes>
//       <Route path="/login" element={<LoginPage />} />
//       <Route element={<ProtectedRoute />}>
//         <Route path="/dashboard" element={<DashboardPage />} />
//         <Route path="/workers" element={<WorkersPage />} />
//         <Route path="/workers/new" element={<NewWorkerPage />} />
//         <Route path="/workers/:id" element={<WorkerDetailPage />} />
//         <Route path="/workers/:id/onboarding" element={<OnboardingPage />} />
//         <Route path="/workers/:id/documents" element={<WorkerDetailPage />} />
//         <Route path="/leave" element={<LeavePage />} />
//         <Route path="/timesheets" element={<TimesheetsPage />} />
//         <Route path="/payroll" element={<PayrollPage />} />
//         <Route path="/payroll/:id" element={<PayrollDetailPage />} />
//         <Route path="/invoices" element={<InvoicesPage />} />
//         <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
//         <Route path="/offboarding" element={<OffboardingPage />} />
//         <Route path="/country-rules" element={<CountryRulesPage />} />
//         <Route path="/audit-log" element={<AuditLogPage />} />
//         <Route path="/settings" element={<SettingsPage />} />
//       </Route>
//       <Route path="*" element={<Navigate to="/dashboard" replace />} />
//     </Routes>
//   );
// }
//