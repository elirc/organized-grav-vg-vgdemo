// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// import dotenv from 'dotenv';
// import { z } from 'zod';
//
// dotenv.config();
//
// const envSchema = z.object({
//   DATABASE_URL: z.string().min(1),
//   JWT_SECRET: z.string().min(16).default('dev-secret-change-me-now'),
//   JWT_EXPIRES_IN: z.string().default('7d'),
//   WEB_ORIGIN: z.string().default('http://localhost:5173'),
//   PORT: z.coerce.number().default(4000),
//   NODE_ENV: z.string().default('development'),
// });
//
// export const env = envSchema.parse(process.env);
//