// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { Role } from '@prisma/client';
//
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//         role: Role;
//         organizationId: string | null;
//         workerId?: string | null;
//       };
//     }
//   }
// }
//