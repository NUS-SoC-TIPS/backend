/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "users" RENAME "createdAt" TO "created_at";
ALTER TABLE "users" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "users" RENAME "githubUsername" TO "github_username";
ALTER TABLE "users" RENAME "photoUrl" TO "photo_url";
ALTER TABLE "users" RENAME "profileUrl" TO "profile_url";
COMMIT;
