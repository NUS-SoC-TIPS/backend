/*
  Warnings:

  - A unique constraint covering the columns `[userId,windowId]` on the table `exclusions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roomRecordId,userId]` on the table `room_record_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exclusions_userId_windowId_key" ON "exclusions"("userId", "windowId");

-- CreateIndex
CREATE UNIQUE INDEX "room_record_users_roomRecordId_userId_key" ON "room_record_users"("roomRecordId", "userId");
