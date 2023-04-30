/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "windows" RENAME "createdAt" TO "created_at";
ALTER TABLE "windows" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "windows" RENAME "startAt" TO "start_at";
ALTER TABLE "windows" RENAME "endAt" TO "end_at";
ALTER TABLE "windows" RENAME "requireInterview" TO "require_interview";
ALTER TABLE "windows" RENAME "numQuestions" TO "num_questions";
COMMIT;
