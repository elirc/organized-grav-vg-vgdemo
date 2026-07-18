// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.rejectSchema = exports.documentSchema = exports.timesheetSchema = exports.leaveRequestSchema = exports.payrollRunSchema = exports.loginSchema = exports.createWorkerSchema = exports.timesheetStatuses = exports.leaveStatuses = exports.payrollStatuses = exports.onboardingStatuses = exports.workerStatuses = exports.roleSchema = exports.roles = void 0;
// const zod_1 = require("zod");
// exports.roles = [
//     'PLATFORM_ADMIN',
//     'EOR_SPECIALIST',
//     'CLIENT_ADMIN',
//     'CLIENT_MANAGER',
//     'WORKER',
// ];
// exports.roleSchema = zod_1.z.enum(exports.roles);
// exports.workerStatuses = [
//     'DRAFT',
//     'ONBOARDING',
//     'ACTIVE',
//     'ON_LEAVE',
//     'OFFBOARDING',
//     'TERMINATED',
// ];
// exports.onboardingStatuses = [
//     'NOT_STARTED',
//     'IN_PROGRESS',
//     'SUBMITTED',
//     'APPROVED',
//     'REJECTED',
//     'BLOCKED',
// ];
// exports.payrollStatuses = ['DRAFT', 'CALCULATED', 'APPROVED', 'LOCKED'];
// exports.leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
// exports.timesheetStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
// exports.createWorkerSchema = zod_1.z.object({
//     firstName: zod_1.z.string().min(1),
//     lastName: zod_1.z.string().min(1),
//     email: zod_1.z.string().email(),
//     countryCode: zod_1.z.string().min(2).max(2),
//     jobTitle: zod_1.z.string().min(1),
//     department: zod_1.z.string().min(1),
//     employmentType: zod_1.z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
//     startDate: zod_1.z.string().date(),
//     salaryAmount: zod_1.z.coerce.number().positive(),
//     salaryCurrency: zod_1.z.string().min(3).max(3),
//     managerId: zod_1.z.string().optional().nullable(),
//     organizationId: zod_1.z.string().optional(),
// });
// exports.loginSchema = zod_1.z.object({
//     email: zod_1.z.string().email(),
//     password: zod_1.z.string().min(1),
// });
// exports.payrollRunSchema = zod_1.z.object({
//     organizationId: zod_1.z.string().min(1),
//     periodStart: zod_1.z.string().date(),
//     periodEnd: zod_1.z.string().date(),
//     currency: zod_1.z.string().min(3).max(3),
// });
// exports.leaveRequestSchema = zod_1.z.object({
//     workerId: zod_1.z.string().optional(),
//     leaveType: zod_1.z.enum(['VACATION', 'SICK', 'PERSONAL', 'PARENTAL']),
//     startDate: zod_1.z.string().date(),
//     endDate: zod_1.z.string().date(),
//     reason: zod_1.z.string().min(1),
// });
// exports.timesheetSchema = zod_1.z.object({
//     workerId: zod_1.z.string().optional(),
//     weekStartDate: zod_1.z.string().date(),
//     regularHours: zod_1.z.coerce.number().min(0).max(80),
//     overtimeHours: zod_1.z.coerce.number().min(0).max(80),
//     notes: zod_1.z.string().optional().default(''),
// });
// exports.documentSchema = zod_1.z.object({
//     fileName: zod_1.z.string().min(1),
//     documentType: zod_1.z.enum(['IDENTITY', 'CONTRACT', 'TAX_FORM', 'BANK_PROOF', 'OTHER']),
// });
// exports.rejectSchema = zod_1.z.object({
//     rejectionReason: zod_1.z.string().min(1),
// });
//