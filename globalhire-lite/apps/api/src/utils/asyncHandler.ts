// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { NextFunction, Request, Response } from 'express';
//
// export const asyncHandler =
//   (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     Promise.resolve(handler(req, res, next)).catch(next);
//   };
//