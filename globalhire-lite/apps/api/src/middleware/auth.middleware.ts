// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import type { NextFunction, Request, Response } from 'express';
// import jwt from 'jsonwebtoken';
// import { prisma } from '../db/prisma.js';
// import { env } from '../config/env.js';
// import { ApiError } from '../utils/ApiError.js';
//
// type TokenPayload = { sub: string };
//
// const tokenFromRequest = (req: Request) => {
//   const bearer = req.headers.authorization?.startsWith('Bearer ')
//     ? req.headers.authorization.slice(7)
//     : undefined;
//   return req.cookies?.globalhire_token ?? bearer;
// };
//
// export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
//   try {
//     const token = tokenFromRequest(req);
//     if (!token) throw new ApiError(401, 'Authentication required');
//     const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
//     const user = await prisma.user.findUnique({
//       where: { id: payload.sub },
//       include: { workerProfile: { select: { id: true } } },
//     });
//     if (!user) throw new ApiError(401, 'Invalid session');
//     req.user = {
//       id: user.id,
//       email: user.email,
//       role: user.role,
//       organizationId: user.organizationId,
//       workerId: user.workerProfile?.id ?? null,
//     };
//     next();
//   } catch (error) {
//     next(error instanceof ApiError ? error : new ApiError(401, 'Invalid session'));
//   }
// };
//
// export const requireOrgAccess = (organizationId: string | null | undefined, req: Request) => {
//   if (!req.user) throw new ApiError(401, 'Authentication required');
//   if (['PLATFORM_ADMIN', 'EOR_SPECIALIST'].includes(req.user.role)) return;
//   if (!organizationId || req.user.organizationId !== organizationId) {
//     throw new ApiError(403, 'Organization access denied');
//   }
// };
//
// export const canReviewPeopleWorkflows = (role: string) =>
//   ['CLIENT_MANAGER', 'CLIENT_ADMIN', 'EOR_SPECIALIST'].includes(role);
//