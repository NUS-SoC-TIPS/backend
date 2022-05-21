/*
  Warnings:

  - The `status` column on the `rooms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `languageUsed` on the `question_submissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `difficulty` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `source` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `language` on the `room_records` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "room_status" AS ENUM ('OPEN', 'CLOSED_MANUALLY', 'CLOSED_AUTOMATICALLY');

-- CreateEnum
CREATE TYPE "language" AS ENUM ('C_PLUS_PLUS', 'JAVA', 'PYTHON', 'PYTHON_THREE', 'C', 'C_SHARP', 'JAVASCRIPT', 'RUBY', 'SWIFT', 'GO', 'SCALA', 'KOTLIN', 'RUST', 'PHP', 'TYPESCRIPT', 'RACKET', 'ERLANG', 'ELIXIR', 'MY_SQL', 'MS_SQL_SERVER', 'ORACLE');

-- CreateEnum
CREATE TYPE "question_difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "question_type" AS ENUM ('ALGORITHMS', 'DATABASE', 'SHELL', 'CONCURRENCY');

-- CreateEnum
CREATE TYPE "question_source" AS ENUM ('LEETCODE', 'HACKERRANK', 'KATTIS', 'CUSTOM');

-- AlterTable
ALTER TABLE "question_submissions" DROP COLUMN "languageUsed",
ADD COLUMN     "languageUsed" "language" NOT NULL;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "difficulty",
ADD COLUMN     "difficulty" "question_difficulty" NOT NULL,
DROP COLUMN "source",
ADD COLUMN     "source" "question_source" NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "question_type" NOT NULL;

-- AlterTable
ALTER TABLE "room_records" DROP COLUMN "language",
ADD COLUMN     "language" "language" NOT NULL;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "status",
ADD COLUMN     "status" "room_status" NOT NULL DEFAULT E'OPEN';

-- DropEnum
DROP TYPE "Difficulty";

-- DropEnum
DROP TYPE "Language";

-- DropEnum
DROP TYPE "QuestionSource";

-- DropEnum
DROP TYPE "QuestionType";

-- DropEnum
DROP TYPE "RoomStatus";
