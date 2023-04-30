/*

  NOTE: This migration script is manually written to avoid dropping all the below columns.

*/
-- AlterTable
BEGIN;
ALTER TABLE "room_users" RENAME "roomId" TO "room_id";
ALTER TABLE "room_users" RENAME "userId" TO "user_id";
ALTER TABLE "room_users" RENAME CONSTRAINT "room_users_roomId_fkey" TO "room_users_room_id_fkey";
ALTER TABLE "room_users" RENAME CONSTRAINT "room_users_userId_fkey" TO "room_users_user_id_fkey";
ALTER INDEX "room_users_roomId_userId_key" RENAME TO "room_users_room_id_user_id_key";
COMMIT;
