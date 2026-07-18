// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import bcrypt from 'bcryptjs';
// import jwt, { type SignOptions } from 'jsonwebtoken';
// import { env } from '../../config/env.js';
// import { prisma } from '../../db/prisma.js';
// import { ApiError } from '../../utils/ApiError.js';
//
// const publicUser = (user: any) => ({
//   id: user.id,
//   email: user.email,
//   firstName: user.firstName,
//   lastName: user.lastName,
//   role: user.role,
//   organizationId: user.organizationId,
//   workerId: user.workerProfile?.id ?? null,
// });
//
// export const login = async (email: string, password: string) => {
//   const user = await prisma.user.findUnique({
//     where: { email },
//     include: { workerProfile: { select: { id: true } } },
//   });
//   if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
//     throw new ApiError(401, 'Invalid email or password');
//   }
//   const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
//   const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, options);
//   return { token, user: publicUser(user) };
// };
//
// export const me = async (id: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id },
//     include: { workerProfile: { select: { id: true } } },
//   });
//   if (!user) throw new ApiError(404, 'User not found');
//   return publicUser(user);
// };
//