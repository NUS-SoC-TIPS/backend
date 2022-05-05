/*
  Warnings:

  - A unique constraint covering the columns `[roomId,userId]` on the table `RoomUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PYTHON', 'JAVA', 'JAVASCRIPT');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "RoomRecord" (
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

    CONSTRAINT "RoomRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomRecordUser" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isInterviewer" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,

    CONSTRAINT "RoomRecordUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomUser_roomId_userId_key" ON "RoomUser"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "RoomRecord" ADD CONSTRAINT "RoomRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRecord" ADD CONSTRAINT "RoomRecord_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRecordUser" ADD CONSTRAINT "RoomRecordUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomRecordUser" ADD CONSTRAINT "RoomRecordUser_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "RoomRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
