/*

  NOTE: This migration script is manually written to avoid dropping all the below columns.

*/
-- AlterTable
BEGIN;
ALTER TABLE "rooms" RENAME "createdAt" TO "created_at";
ALTER TABLE "rooms" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "rooms" RENAME "closedAt" TO "closed_at";
COMMIT;
