/*

  NOTE: This migration script is manually written to avoid dropping all the below columns.

*/
-- AlterTable
BEGIN;
ALTER TABLE "room_record_users" RENAME "createdAt" TO "created_at";
ALTER TABLE "room_record_users" RENAME "updatedAt" TO "updated_at";
ALTER TABLE "room_record_users" RENAME "isInterviewer" TO "is_interviewer";
ALTER TABLE "room_record_users" RENAME "userId" TO "user_id";
ALTER TABLE "room_record_users" RENAME "roomRecordId" TO "room_record_id";
ALTER TABLE "room_record_users" RENAME CONSTRAINT "room_record_users_roomRecordId_fkey" TO "room_record_users_room_record_id_fkey";
ALTER TABLE "room_record_users" RENAME CONSTRAINT "room_record_users_userId_fkey" TO "room_record_users_user_id_fkey";
ALTER INDEX "room_record_users_roomRecordId_userId_key" RENAME TO "room_record_users_room_record_id_user_id_key";
COMMIT;
