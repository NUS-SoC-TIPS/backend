/*

  NOTE: This migration script is manually written to avoid dropping the "CohortUser" table.

*/
-- AlterTable
BEGIN;
ALTER TABLE "CohortUser" RENAME TO "cohort_users";
ALTER TABLE "cohort_users" RENAME CONSTRAINT "CohortUser_cohort_id_fkey" TO "cohort_users_cohort_id_fkey";
ALTER TABLE "cohort_users" RENAME CONSTRAINT "CohortUser_user_id_fkey" TO "cohort_users_user_id_fkey";
ALTER INDEX "CohortUser_pkey" RENAME TO "cohort_users_pkey";
ALTER SEQUENCE "CohortUser_id_seq" RENAME TO "cohort_users_id_seq";
CREATE UNIQUE INDEX "cohort_users_user_id_cohort_id_key" ON "cohort_users"("user_id", "cohort_id");
COMMIT;
