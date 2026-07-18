// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { PrismaClient, User } from '@prisma/client';
// import { prisma } from '../../db/prisma.js';
// import { requireOrgAccess } from '../../middleware/auth.middleware.js';
// import { ApiError } from '../../utils/ApiError.js';
// import { toDate } from '../../utils/date.js';
// import { audit } from '../audit/audit.service.js';
// import type { CreateWorkerInput } from '@globalhire/shared';
//
// type Db = PrismaClient | any;
// type Actor = Pick<User, 'id' | 'role' | 'organizationId'> & { workerId?: string | null };
//
// export const onboardingTemplates = (rule: any) => [
//   {
//     title: 'Personal information submitted',
//     description: 'Confirm address, emergency contact, and personal details.',
//     category: 'PERSONAL_INFO',
//     required: true,
//   },
//   {
//     title: 'Identity document uploaded',
//     description: 'Upload passport, national ID, or other proof of identity metadata.',
//     category: 'DOCUMENT',
//     required: true,
//   },
//   ...(rule?.requiresSignedContract
//     ? [
//         {
//           title: 'Employment agreement signed',
//           description: 'Confirm that the employment agreement has been signed.',
//           category: 'CONTRACT',
//           required: true,
//         },
//       ]
//     : []),
//   ...(rule?.requiresTaxId
//     ? [
//         {
//           title: 'Tax information submitted',
//           description: 'Provide local tax information needed for payroll setup.',
//           category: 'TAX',
//           required: true,
//         },
//       ]
//     : []),
//   {
//     title: 'Benefits selection completed',
//     description: 'Select applicable demo benefits.',
//     category: 'BENEFITS',
//     required: false,
//   },
//   ...(rule?.requiresBankDetails
//     ? [
//         {
//           title: 'Bank details submitted',
//           description: 'Provide bank metadata for payroll setup.',
//           category: 'BANK',
//           required: true,
//         },
//       ]
//     : []),
//   {
//     title: 'Compliance review completed',
//     description: 'EOR specialist review of onboarding readiness.',
//     category: 'COMPLIANCE',
//     required: true,
//   },
// ];
//
// export const getWorkerWhereForActor = (actor: Actor) => {
//   if (['PLATFORM_ADMIN', 'EOR_SPECIALIST'].includes(actor.role)) return {};
//   if (actor.role === 'WORKER') return { id: actor.workerId ?? '__none__' };
//   return { organizationId: actor.organizationId ?? '__none__' };
// };
//
// export const createWorker = async (actor: Actor, input: CreateWorkerInput, db: Db = prisma) => {
//   const organizationId =
//     actor.role === 'CLIENT_ADMIN' ? actor.organizationId : input.organizationId ?? actor.organizationId;
//   if (!organizationId) throw new ApiError(400, 'organizationId is required');
//   if (actor.role === 'CLIENT_ADMIN' && organizationId !== actor.organizationId) {
//     throw new ApiError(403, 'Client admins can only create workers in their organization');
//   }
//
//   const rule = await db.countryRule.findUnique({ where: { countryCode: input.countryCode } });
//   if (!rule) throw new ApiError(400, 'Country rule not found for worker country');
//
//   const worker = await db.$transaction(async (tx: Db) => {
//     const created = await tx.worker.create({
//       data: {
//         organizationId,
//         managerId: input.managerId ?? null,
//         firstName: input.firstName,
//         lastName: input.lastName,
//         email: input.email,
//         countryCode: input.countryCode,
//         jobTitle: input.jobTitle,
//         department: input.department,
//         employmentType: input.employmentType,
//         status: 'ONBOARDING',
//         startDate: toDate(input.startDate),
//         employment: {
//           create: {
//             salaryAmount: input.salaryAmount,
//             salaryCurrency: input.salaryCurrency,
//             employmentType: input.employmentType,
//             startDate: toDate(input.startDate),
//             contractStatus: 'DRAFT',
//           },
//         },
//         onboardingTasks: {
//           create: onboardingTemplates(rule).map((task) => ({ ...task, status: 'NOT_STARTED' })),
//         },
//       },
//       include: { employment: true, onboardingTasks: true },
//     });
//
//     await tx.auditLog.create({
//       data: {
//         organizationId,
//         actorUserId: actor.id,
//         entityType: 'Worker',
//         entityId: created.id,
//         action: 'WORKER_CREATED',
//         message: `Worker ${created.firstName} ${created.lastName} was created`,
//       },
//     });
//     return created;
//   });
//
//   return worker;
// };
//
// export const activateWorker = async (actor: Actor, workerId: string, db: Db = prisma) => {
//   const worker = await db.worker.findUnique({
//     where: { id: workerId },
//     include: { onboardingTasks: true, employment: true },
//   });
//   if (!worker) throw new ApiError(404, 'Worker not found');
//   if (actor.role !== 'PLATFORM_ADMIN' && actor.role !== 'EOR_SPECIALIST') {
//     requireOrgAccess(worker.organizationId, { user: actor } as any);
//   }
//   if (worker.status !== 'ONBOARDING') {
//     throw new ApiError(400, 'Only workers in ONBOARDING status can be activated');
//   }
//   const incomplete = worker.onboardingTasks.filter(
//     (task: any) => task.required && task.status !== 'APPROVED',
//   );
//   if (incomplete.length > 0) {
//     throw new ApiError(400, 'All required onboarding tasks must be approved before activation');
//   }
//   if (worker.employment?.contractStatus !== 'SIGNED') {
//     throw new ApiError(400, 'Employment contract must be SIGNED before activation');
//   }
//   const updated = await db.worker.update({ where: { id: workerId }, data: { status: 'ACTIVE' } });
//   if (db === prisma) {
//     await audit({
//       organizationId: worker.organizationId,
//       actorUserId: actor.id,
//       entityType: 'Worker',
//       entityId: workerId,
//       action: 'WORKER_ACTIVATED',
//       message: 'Worker activated after onboarding completion',
//     });
//   }
//   return updated;
// };
//