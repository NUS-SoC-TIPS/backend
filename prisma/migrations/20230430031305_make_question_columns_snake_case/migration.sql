/*

  NOTE: This migration script is manually written to avoid dropping all the below columns.

*/
-- AlterTable
BEGIN;
ALTER TABLE "questions" RENAME "isPremium" TO "is_premium";
ALTER TABLE "questions" RENAME "createdAt" TO "created_at";
ALTER TABLE "questions" RENAME "updatedAt" TO "updated_at";
COMMIT;
