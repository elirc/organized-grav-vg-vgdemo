// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import { Router } from 'express';
// import { z } from 'zod';
// import { prisma } from '../../db/prisma.js';
// import { requireRole } from '../../middleware/requireRole.middleware.js';
// import { asyncHandler } from '../../utils/asyncHandler.js';
//
// export const countryRuleRouter = Router();
//
// const countryRuleSchema = z.object({
//   countryCode: z.string().min(2).max(2),
//   countryName: z.string().min(1),
//   currency: z.string().min(3).max(3),
//   probationPeriodDays: z.coerce.number().int().min(0),
//   statutoryVacationDays: z.coerce.number().int().min(0),
//   noticePeriodDays: z.coerce.number().int().min(0),
//   requiresTaxId: z.boolean(),
//   requiresBankDetails: z.boolean(),
//   requiresSignedContract: z.boolean(),
//   employerCostPercent: z.coerce.number().min(0),
//   employeeTaxPercent: z.coerce.number().min(0),
// });
//
// countryRuleRouter.get(
//   '/',
//   asyncHandler(async (_req, res) => {
//     res.json(await prisma.countryRule.findMany({ orderBy: { countryName: 'asc' } }));
//   }),
// );
//
// countryRuleRouter.post(
//   '/',
//   requireRole(['PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.status(201).json(await prisma.countryRule.create({ data: countryRuleSchema.parse(req.body) }));
//   }),
// );
//
// countryRuleRouter.patch(
//   '/:id',
//   requireRole(['PLATFORM_ADMIN']),
//   asyncHandler(async (req, res) => {
//     res.json(
//       await prisma.countryRule.update({
//         where: { id: req.params.id },
//         data: countryRuleSchema.partial().parse(req.body),
//       }),
//     );
//   }),
// );
//