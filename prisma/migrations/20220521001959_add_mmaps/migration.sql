/*
  Warnings:

  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomRecordUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoomRecord" DROP CONSTRAINT "RoomRecord_questionId_fkey";

-- DropForeignKey
ALTER TABLE "RoomRecord" DROP CONSTRAINT "RoomRecord_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomRecordUser" DROP CONSTRAINT "RoomRecordUser_recordId_fkey";

-- DropForeignKey
ALTER TABLE "RoomRecordUser" DROP CONSTRAINT "RoomRecordUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomUser" DROP CONSTRAINT "RoomUser_userId_fkey";

-- DropTable
DROP TABLE "Question";

-- DropTable
DROP TABLE "RoomRecord";

-- DropTable
DROP TABLE "RoomRecordUser";

-- DropTable
DROP TABLE "RoomUser";

-- CreateTable
CREATE TABLE "room_users" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "room_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_records" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRoleplay" BOOLEAN NOT NULL DEFAULT false,
    "duration" DOUBLE PRECISION NOT NULL,
    "language" "Language" NOT NULL,
    "codeWritten" TEXT NOT NULL,
    "isSolved" BOOLEAN NOT NULL DEFAULT false,
    "roomId" INTEGER NOT NULL,
    "questionId" TEXT,

    CONSTRAINT "room_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "isPremium" BOOLEAN NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "room_record_users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isInterviewer" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,

    CONSTRAINT "room_record_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "room_users_roomId_userId_key" ON "room_users"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_users" ADD CONSTRAINT "room_users_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_records" ADD CONSTRAINT "room_records_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_records" ADD CONSTRAINT "room_records_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "room_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
