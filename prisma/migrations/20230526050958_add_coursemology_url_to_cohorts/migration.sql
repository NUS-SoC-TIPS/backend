/*
  Warnings:

  - A unique constraint covering the columns `[coursemology_url]` on the table `cohorts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `coursemology_url` to the `cohorts` table without a default value. This is not possible if the table is not empty.

*/
BEGIN;
-- AlterTable
ALTER TABLE "cohorts" ADD COLUMN "coursemology_url" TEXT;

UPDATE "cohorts" SET "coursemology_url" = 'https://coursemology.org/courses/2272';

-- AlterTable
ALTER TABLE "cohorts" ALTER COLUMN "coursemology_url" SET NOT NULL;
-- CreateIndex
CREATE UNIQUE INDEX "cohorts_coursemology_url_key" ON "cohorts"("coursemology_url");
COMMIT;
