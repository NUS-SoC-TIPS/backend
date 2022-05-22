/*
  Warnings:

  - The primary key for the `questions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `questionSource` to the `question_submissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "question_submissions" DROP CONSTRAINT "question_submissions_questionSlug_fkey";

-- DropForeignKey
ALTER TABLE "room_records" DROP CONSTRAINT "room_records_questionSlug_fkey";

-- AlterTable
ALTER TABLE "question_submissions" ADD COLUMN     "questionSource" "question_source" NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP CONSTRAINT "questions_pkey",
ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("slug", "source");

-- AlterTable
ALTER TABLE "room_records" ADD COLUMN     "questionSource" "question_source";

-- AddForeignKey
ALTER TABLE "room_records" ADD CONSTRAINT "room_records_questionSlug_questionSource_fkey" FOREIGN KEY ("questionSlug", "questionSource") REFERENCES "questions"("slug", "source") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_questionSlug_questionSource_fkey" FOREIGN KEY ("questionSlug", "questionSource") REFERENCES "questions"("slug", "source") ON DELETE RESTRICT ON UPDATE CASCADE;
