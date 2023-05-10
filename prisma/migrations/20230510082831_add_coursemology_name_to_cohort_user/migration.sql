/*
  Warnings:

  - Added the required column `coursemology_name` to the `CohortUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CohortUser" ADD COLUMN     "coursemology_name" TEXT NOT NULL;
