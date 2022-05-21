/*
  Warnings:

  - You are about to drop the column `recordId` on the `room_record_users` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `room_records` table. All the data in the column will be lost.
  - Added the required column `source` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomRecordId` to the `room_record_users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('ALGORITHMS', 'DATABASE', 'SHELL', 'CONCURRENCY');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('LEETCODE', 'HACKERRANK', 'KATTIS', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Language" ADD VALUE 'C_PLUS_PLUS';
ALTER TYPE "Language" ADD VALUE 'PYTHON_THREE';
ALTER TYPE "Language" ADD VALUE 'C';
ALTER TYPE "Language" ADD VALUE 'C_SHARP';
ALTER TYPE "Language" ADD VALUE 'RUBY';
ALTER TYPE "Language" ADD VALUE 'SWIFT';
ALTER TYPE "Language" ADD VALUE 'GO';
ALTER TYPE "Language" ADD VALUE 'SCALA';
ALTER TYPE "Language" ADD VALUE 'KOTLIN';
ALTER TYPE "Language" ADD VALUE 'RUST';
ALTER TYPE "Language" ADD VALUE 'PHP';
ALTER TYPE "Language" ADD VALUE 'TYPESCRIPT';
ALTER TYPE "Language" ADD VALUE 'RACKET';
ALTER TYPE "Language" ADD VALUE 'ERLANG';
ALTER TYPE "Language" ADD VALUE 'ELIXIR';
ALTER TYPE "Language" ADD VALUE 'MY_SQL';
ALTER TYPE "Language" ADD VALUE 'MS_SQL_SERVER';
ALTER TYPE "Language" ADD VALUE 'ORACLE';

-- DropForeignKey
ALTER TABLE "room_record_users" DROP CONSTRAINT "room_record_users_recordId_fkey";

-- DropForeignKey
ALTER TABLE "room_records" DROP CONSTRAINT "room_records_questionId_fkey";

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "source" "QuestionSource" NOT NULL,
ADD COLUMN     "type" "QuestionType" NOT NULL;

-- AlterTable
ALTER TABLE "room_record_users" DROP COLUMN "recordId",
ADD COLUMN     "roomRecordId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "room_records" DROP COLUMN "questionId",
ADD COLUMN     "questionSlug" TEXT;

-- CreateTable
CREATE TABLE "question_submissions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageUsed" "Language" NOT NULL,
    "codeWritten" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionSlug" TEXT NOT NULL,

    CONSTRAINT "question_submissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "room_records" ADD CONSTRAINT "room_records_questionSlug_fkey" FOREIGN KEY ("questionSlug") REFERENCES "questions"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_roomRecordId_fkey" FOREIGN KEY ("roomRecordId") REFERENCES "room_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_questionSlug_fkey" FOREIGN KEY ("questionSlug") REFERENCES "questions"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
