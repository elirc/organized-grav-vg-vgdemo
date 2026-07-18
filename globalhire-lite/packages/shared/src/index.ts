// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { z } from 'zod';
//
// export const roles = [
//   'PLATFORM_ADMIN',
//   'EOR_SPECIALIST',
//   'CLIENT_ADMIN',
//   'CLIENT_MANAGER',
//   'WORKER',
// ] as const;
// export const roleSchema = z.enum(roles);
// export type Role = z.infer<typeof roleSchema>;
//
// export const workerStatuses = [
//   'DRAFT',
//   'ONBOARDING',
//   'ACTIVE',
//   'ON_LEAVE',
//   'OFFBOARDING',
//   'TERMINATED',
// ] as const;
// export const onboardingStatuses = [
//   'NOT_STARTED',
//   'IN_PROGRESS',
//   'SUBMITTED',
//   'APPROVED',
//   'REJECTED',
//   'BLOCKED',
// ] as const;
// export const payrollStatuses = ['DRAFT', 'CALCULATED', 'APPROVED', 'LOCKED'] as const;
// export const leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
// export const timesheetStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;
//
// export const createWorkerSchema = z.object({
//   firstName: z.string().min(1),
//   lastName: z.string().min(1),
//   email: z.string().email(),
//   countryCode: z.string().min(2).max(2),
//   jobTitle: z.string().min(1),
//   department: z.string().min(1),
//   employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR']),
//   startDate: z.string().date(),
//   salaryAmount: z.coerce.number().positive(),
//   salaryCurrency: z.string().min(3).max(3),
//   managerId: z.string().optional().nullable(),
//   organizationId: z.string().optional(),
// });
//
// export const loginSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(1),
// });
//
// export const payrollRunSchema = z.object({
//   organizationId: z.string().min(1),
//   periodStart: z.string().date(),
//   periodEnd: z.string().date(),
//   currency: z.string().min(3).max(3),
// });
//
// export const leaveRequestSchema = z.object({
//   workerId: z.string().optional(),
//   leaveType: z.enum(['VACATION', 'SICK', 'PERSONAL', 'PARENTAL']),
//   startDate: z.string().date(),
//   endDate: z.string().date(),
//   reason: z.string().min(1),
// });
//
// export const timesheetSchema = z.object({
//   workerId: z.string().optional(),
//   weekStartDate: z.string().date(),
//   regularHours: z.coerce.number().min(0).max(80),
//   overtimeHours: z.coerce.number().min(0).max(80),
//   notes: z.string().optional().default(''),
// });
//
// export const documentSchema = z.object({
//   fileName: z.string().min(1),
//   documentType: z.enum(['IDENTITY', 'CONTRACT', 'TAX_FORM', 'BANK_PROOF', 'OTHER']),
// });
//
// export const rejectSchema = z.object({
//   rejectionReason: z.string().min(1),
// });
//
// export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
// export type PayrollRunInput = z.infer<typeof payrollRunSchema>;
//