/*
  Warnings:

  - You are about to drop the column `iteration` on the `windows` table. All the data in the column will be lost.
  - Added the required column `cohort_id` to the `windows` table without a default value. This is not possible if the table is not empty.

  This migration was manually modified to provide a default ID for the existing windows' cohort_id.
*/
-- CreateTable
BEGIN;
CREATE TABLE "cohorts" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

INSERT INTO "cohorts" ("updated_at", "name") VALUES (NOW(), 'AY 21/22 Summer');

-- AlterTable
CREATE FUNCTION "id_in_cohort"()
RETURNS int
AS
$$
  SELECT "id" FROM "cohorts" LIMIT 1;
$$
LANGUAGE SQL;

ALTER TABLE "windows" DROP COLUMN "iteration",
ADD COLUMN     "cohort_id" INTEGER NOT NULL DEFAULT "id_in_cohort"();

ALTER TABLE "windows" ALTER COLUMN "cohort_id" DROP DEFAULT;
DROP FUNCTION "id_in_cohort";

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_name_key" ON "cohorts"("name");

-- AddForeignKey
ALTER TABLE "windows" ADD CONSTRAINT "windows_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;
