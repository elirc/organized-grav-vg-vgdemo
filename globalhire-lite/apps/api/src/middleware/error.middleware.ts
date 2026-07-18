// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { ErrorRequestHandler } from 'express';
// import { ZodError } from 'zod';
// import { ApiError } from '../utils/ApiError.js';
//
// export const notFoundHandler = () => {
//   throw new ApiError(404, 'Route not found');
// };
//
// export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
//   if (err instanceof ZodError) {
//     return res.status(400).json({ message: 'Validation failed', issues: err.flatten() });
//   }
//
//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({ message: err.message });
//   }
//
//   // eslint-disable-next-line no-console
//   console.error(err);
//   return res.status(500).json({ message: 'Unexpected server error' });
// };
//