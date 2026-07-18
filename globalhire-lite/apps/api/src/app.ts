// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import cookieParser from 'cookie-parser';
// import cors from 'cors';
// import express from 'express';
// import helmet from 'helmet';
// import { env } from './config/env.js';
// import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
// import { requireAuth } from './middleware/auth.middleware.js';
// import { authRouter } from './modules/auth/auth.routes.js';
// import { organizationRouter } from './modules/organizations/organizations.routes.js';
// import { workerRouter } from './modules/workers/workers.routes.js';
// import { onboardingRouter } from './modules/onboarding/onboarding.routes.js';
// import { documentRouter } from './modules/documents/documents.routes.js';
// import { leaveRouter } from './modules/leave/leave.routes.js';
// import { timesheetRouter } from './modules/timesheets/timesheets.routes.js';
// import { payrollRouter } from './modules/payroll/payroll.routes.js';
// import { invoiceRouter } from './modules/invoices/invoices.routes.js';
// import { offboardingRouter } from './modules/offboarding/offboarding.routes.js';
// import { countryRuleRouter } from './modules/countryRules/countryRules.routes.js';
// import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
// import { auditRouter } from './modules/audit/audit.routes.js';
//
// export const app = express();
//
// app.use(helmet());
// const devOrigins = new Set([env.WEB_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173']);
//
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || devOrigins.has(origin)) return callback(null, true);
//       return callback(null, false);
//     },
//     credentials: true,
//   }),
// );
// app.use(express.json());
// app.use(cookieParser());
//
// app.get('/api/health', (_req, res) => {
//   res.json({ ok: true, service: 'globalhire-lite-api' });
// });
//
// app.use('/api/auth', authRouter);
// app.use('/api', requireAuth);
// app.use('/api/organizations', organizationRouter);
// app.use('/api/workers', workerRouter);
// app.use('/api', onboardingRouter);
// app.use('/api', documentRouter);
// app.use('/api/leave-requests', leaveRouter);
// app.use('/api/timesheets', timesheetRouter);
// app.use('/api/payroll-runs', payrollRouter);
// app.use('/api', invoiceRouter);
// app.use('/api/offboarding-cases', offboardingRouter);
// app.use('/api/country-rules', countryRuleRouter);
// app.use('/api/dashboard', dashboardRouter);
// app.use('/api/audit-log', auditRouter);
//
// app.use(notFoundHandler);
// app.use(errorHandler);
//