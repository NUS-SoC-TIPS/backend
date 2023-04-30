/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "exclusions" RENAME "createdAt" TO "created_at";
ALTER TABLE "exclusions" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "exclusions" RENAME "userId" TO "user_id";
ALTER TABLE "exclusions" RENAME "windowId" TO "window_id";
ALTER TABLE "exclusions" RENAME CONSTRAINT "exclusions_userId_fkey" TO "exclusions_user_id_fkey";
ALTER TABLE "exclusions" RENAME CONSTRAINT "exclusions_windowId_fkey" TO "exclusions_window_id_fkey";
ALTER INDEX "exclusions_userId_windowId_key" RENAME TO "exclusions_user_id_window_id_key";
COMMIT;
