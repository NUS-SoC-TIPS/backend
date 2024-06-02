/*
  Warnings:

  - Added the required column `email` to the `cohorts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
BEGIN;
ALTER TABLE "cohorts" ADD COLUMN "email" TEXT NOT NULL DEFAULT 'soc-tips@googlegroups.com';
ALTER TABLE "cohorts" ALTER COLUMN "email" DROP DEFAULT;
COMMIT;
