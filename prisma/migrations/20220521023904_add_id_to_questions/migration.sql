/*
  Warnings:

  - A unique constraint covering the columns `[id,source]` on the table `questions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "questions_id_source_key" ON "questions"("id", "source");
