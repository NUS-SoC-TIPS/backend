/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "settings" RENAME "createdAt" TO "created_at";
ALTER TABLE "settings" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "settings" RENAME "userId" TO "user_id";
ALTER TABLE "settings" RENAME "hasUpdatedName" TO "has_updated_name";
ALTER TABLE "settings" RENAME "hasUpdatedPhoto" TO "has_updated_photo";
ALTER TABLE "settings" RENAME "preferredInterviewLanguage" TO "preferred_interview_language";
ALTER TABLE "settings" RENAME "preferredKeyBinding" TO "preferred_key_binding";
ALTER TABLE "settings" RENAME CONSTRAINT "settings_userId_fkey" TO "settings_user_id_fkey";
ALTER INDEX "settings_userId_key" RENAME TO "settings_user_id_key";
COMMIT;
