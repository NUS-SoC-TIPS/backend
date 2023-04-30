/*
 
  NOTE: This migration script is manually written to avoid dropping all the below columns.
 
*/
-- AlterTable
BEGIN;
ALTER TABLE "room_records" RENAME "createdAt" TO "created_at";
ALTER TABLE "room_records" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "room_records" RENAME "isRoleplay" TO "is_roleplay";
ALTER TABLE "room_records" RENAME "codeWritten" TO "code_written";
ALTER TABLE "room_records" RENAME "isSolved" TO "is_solved";
ALTER TABLE "room_records" RENAME "roomId" TO "room_id";
ALTER TABLE "room_records" RENAME "questionSlug" TO "question_slug";
ALTER TABLE "room_records" RENAME "questionSource" TO "question_source";
ALTER TABLE "room_records" RENAME CONSTRAINT "room_records_questionSlug_questionSource_fkey" TO "room_records_question_slug_question_source_fkey";
ALTER TABLE "room_records" RENAME CONSTRAINT "room_records_roomId_fkey" TO "room_records_room_id_fkey";
COMMIT;
