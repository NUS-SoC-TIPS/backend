/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "question_submissions" RENAME "createdAt" TO "created_at";
ALTER TABLE "question_submissions" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "question_submissions" RENAME "codeWritten" TO "code_written";
ALTER TABLE "question_submissions" RENAME "userId" TO "user_id";
ALTER TABLE "question_submissions" RENAME "questionSlug" TO "question_slug";
ALTER TABLE "question_submissions" RENAME "languageUsed" TO "language_used";
ALTER TABLE "question_submissions" RENAME "questionSource" TO "question_source";
ALTER TABLE "question_submissions" RENAME CONSTRAINT "question_submissions_questionSlug_questionSource_fkey" TO "question_submissions_question_slug_question_source_fkey";
ALTER TABLE "question_submissions" RENAME CONSTRAINT "question_submissions_userId_fkey" TO "question_submissions_user_id_fkey";
COMMIT;
