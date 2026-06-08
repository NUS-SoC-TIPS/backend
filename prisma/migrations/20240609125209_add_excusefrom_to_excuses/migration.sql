/*
  Warnings:

  - Added the required column `excuse_from` to the `excuses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "excuse_from" AS ENUM ('INTERVIEW', 'QUESTION', 'INTERVIEW_AND_QUESTION');

-- CreateEnum
CREATE TYPE "excuse_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "excuses" ADD COLUMN     "excuse_from" "excuse_from" NOT NULL;
