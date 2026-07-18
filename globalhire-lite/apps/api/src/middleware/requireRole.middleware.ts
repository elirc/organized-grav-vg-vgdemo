// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { NextFunction, Request, Response } from 'express';
// import { ApiError } from '../utils/ApiError.js';
//
// export const requireRole =
//   (roles: string[]) => (req: Request, _res: Response, next: NextFunction) => {
//     if (!req.user) throw new ApiError(401, 'Authentication required');
//     if (!roles.includes(req.user.role)) {
//       throw new ApiError(403, 'You do not have permission to perform this action');
//     }
//     next();
//   };
//