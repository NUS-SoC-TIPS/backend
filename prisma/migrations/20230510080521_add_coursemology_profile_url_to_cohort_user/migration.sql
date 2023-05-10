/*
  Warnings:

  - Added the required column `coursemology_profile_url` to the `CohortUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CohortUser" ADD COLUMN     "coursemology_profile_url" TEXT NOT NULL;
