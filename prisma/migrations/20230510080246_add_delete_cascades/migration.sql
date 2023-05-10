-- DropForeignKey
ALTER TABLE "exclusions" DROP CONSTRAINT "exclusions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "exclusions" DROP CONSTRAINT "exclusions_window_id_fkey";

-- DropForeignKey
ALTER TABLE "question_submissions" DROP CONSTRAINT "question_submissions_question_slug_question_source_fkey";

-- DropForeignKey
ALTER TABLE "question_submissions" DROP CONSTRAINT "question_submissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "room_record_users" DROP CONSTRAINT "room_record_users_room_record_id_fkey";

-- DropForeignKey
ALTER TABLE "room_record_users" DROP CONSTRAINT "room_record_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_user_id_fkey";

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_room_record_id_fkey" FOREIGN KEY ("room_record_id") REFERENCES "room_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_record_users" ADD CONSTRAINT "room_record_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_question_slug_question_source_fkey" FOREIGN KEY ("question_slug", "question_source") REFERENCES "questions"("slug", "source") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_submissions" ADD CONSTRAINT "question_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
