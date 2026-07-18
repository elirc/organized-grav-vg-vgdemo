// MIGRATION_NOTE: Original implementation commented out during C#/.NET migration. New code lives in migrated-dotnet/.
// export const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));
//
// export const dayDiffInclusive = (start: Date, end: Date) => {
//   const ms = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) -
//     Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
//   return Math.max(1, Math.floor(ms / 86_400_000) + 1);
// };
//