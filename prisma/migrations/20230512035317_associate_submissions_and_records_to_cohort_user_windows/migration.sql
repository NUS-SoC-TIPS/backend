-- AlterTable
ALTER TABLE "question_submissions" ADD COLUMN     "cohort_user_window_id" INTEGER;

-- AlterTable
ALTER TABLE "room_record_users" ADD COLUMN     "cohort_user_window_id" INTEGER;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_cohort_user_window_id_fkey" FOREIGN KEY ("cohort_user_window_id") REFERENCES "cohort_user_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_cohort_user_window_id_fkey" FOREIGN KEY ("cohort_user_window_id") REFERENCES "cohort_user_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
