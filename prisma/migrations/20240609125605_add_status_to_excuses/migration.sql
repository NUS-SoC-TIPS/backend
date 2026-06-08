/*
  Warnings:

  - Added the required column `excuse_status` to the `excuses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "excuses" ADD COLUMN     "excuse_status" "excuse_status" NOT NULL;
