// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { Request, Response } from 'express';
// import { env } from '../../config/env.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
// import { loginSchema } from './auth.schemas.js';
// import * as authService from './auth.service.js';
//
// export const login = asyncHandler(async (req: Request, res: Response) => {
//   const input = loginSchema.parse(req.body);
//   const result = await authService.login(input.email, input.password);
//   res.cookie('globalhire_token', result.token, {
//     httpOnly: true,
//     sameSite: 'lax',
//     secure: env.NODE_ENV === 'production',
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });
//   res.json(result);
// });
//
// export const logout = asyncHandler(async (_req: Request, res: Response) => {
//   res.clearCookie('globalhire_token');
//   res.status(204).send();
// });
//
// export const me = asyncHandler(async (req: Request, res: Response) => {
//   res.json(await authService.me(req.user!.id));
// });
//