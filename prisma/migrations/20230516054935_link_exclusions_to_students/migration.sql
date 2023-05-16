/*
  Warnings:

  - You are about to drop the column `user_id` on the `exclusions` table. All the data in the column will be lost.
  - You are about to drop the column `window_id` on the `exclusions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id]` on the table `exclusions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `student_id` to the `exclusions` table without a default value. This is not possible if the table is not empty.

*/
BEGIN;
-- AlterTable
ALTER TABLE "exclusions" ADD COLUMN "student_id" INTEGER;

-- Migrate data, works only for the first cohort
UPDATE "exclusions" SET "student_id" = "students"."id"
FROM "students"
WHERE "exclusions"."user_id" = "students"."user_id";

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- DropForeignKey
ALTER TABLE "exclusions" DROP CONSTRAINT "exclusions_user_id_fkey";
-- DropIndex
DROP INDEX "exclusions_user_id_window_id_key";
-- AlterTable
ALTER TABLE "exclusions" DROP COLUMN "user_id";
-- AlterTable
ALTER TABLE "exclusions" ALTER COLUMN "student_id" SET NOT NULL;
-- CreateIndex
CREATE UNIQUE INDEX "exclusions_student_id_key" ON "exclusions"("student_id");
COMMIT;
