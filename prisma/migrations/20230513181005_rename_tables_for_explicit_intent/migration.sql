/*
  
  Manually written migration to avoid unnecessary dropping of data.

*/
-- AlterTable
BEGIN;
ALTER TABLE "cohort_users" RENAME TO "students";
ALTER TABLE "students" RENAME CONSTRAINT "cohort_users_cohort_id_fkey" TO "students_cohort_id_fkey";
ALTER TABLE "students" RENAME CONSTRAINT "cohort_users_user_id_fkey" TO "students_user_id_fkey";
ALTER INDEX "cohort_users_pkey" RENAME TO "students_pkey";
ALTER INDEX "cohort_users_user_id_cohort_id_key" RENAME TO "students_user_id_cohort_id_key";
ALTER SEQUENCE "cohort_users_id_seq" RENAME TO "students_id_seq";

ALTER TABLE "cohort_user_windows" RENAME TO "student_results";
ALTER TABLE "student_results" RENAME COLUMN "cohort_user_id" TO "student_id";
ALTER TABLE "student_results" RENAME CONSTRAINT "cohort_user_windows_cohort_user_id_fkey" TO "student_results_student_id_fkey";
ALTER TABLE "student_results" RENAME CONSTRAINT "cohort_user_windows_window_id_fkey" TO "student_results_window_id_fkey";
ALTER INDEX "cohort_user_windows_pkey" RENAME TO "student_results_pkey";
ALTER INDEX "cohort_user_windows_cohort_user_id_window_id_key" RENAME TO "student_results_student_id_window_id_key";
ALTER SEQUENCE "cohort_user_windows_id_seq" RENAME TO "student_results_id_seq";

ALTER TABLE "question_submissions" RENAME COLUMN "cohort_user_window_id" TO "student_result_id";
ALTER TABLE "question_submissions" RENAME CONSTRAINT "question_submissions_cohort_user_window_id_fkey" TO "question_submissions_student_result_id_fkey";

ALTER TABLE "room_record_users" RENAME COLUMN "cohort_user_window_id" TO "student_result_id";
ALTER TABLE "room_record_users" RENAME CONSTRAINT "room_record_users_cohort_user_window_id_fkey" TO "room_record_users_student_result_id_fkey";
COMMIT;
