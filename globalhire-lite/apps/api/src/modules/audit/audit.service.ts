// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { prisma } from '../../db/prisma.js';
//
// export const audit = async (input: {
//   organizationId?: string | null;
//   actorUserId?: string | null;
//   entityType: string;
//   entityId: string;
//   action: string;
//   message: string;
//   metadata?: unknown;
// }) => {
//   await prisma.auditLog.create({
//     data: {
//       organizationId: input.organizationId ?? null,
//       actorUserId: input.actorUserId ?? null,
//       entityType: input.entityType,
//       entityId: input.entityId,
//       action: input.action,
//       message: input.message,
//       metadataJson: input.metadata as object,
//     },
//   });
// };
//