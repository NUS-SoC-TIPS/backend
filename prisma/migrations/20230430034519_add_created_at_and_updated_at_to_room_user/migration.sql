/*
  Warnings:

  - Added the required column `updated_at` to the `room_users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
BEGIN;
ALTER TABLE "room_users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3); -- Make it nullable for now, we'll make it non-null later.

UPDATE "room_users" SET "created_at" = "rooms"."created_at",
"updated_at" = "rooms"."updated_at" FROM "rooms" WHERE "rooms"."id" = "room_users"."room_id";

ALTER TABLE "room_users" ALTER COLUMN "updated_at" SET NOT NULL;
COMMIT;
