-- CreateTable
CREATE TABLE "cohort_user_windows" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "cohort_user_id" INTEGER NOT NULL,
    "window_id" INTEGER NOT NULL,

    CONSTRAINT "cohort_user_windows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cohort_user_windows_cohort_user_id_window_id_key" ON "cohort_user_windows"("cohort_user_id", "window_id");

-- AddForeignKey
ALTER TABLE "cohort_user_windows" ADD CONSTRAINT "cohort_user_windows_cohort_user_id_fkey" FOREIGN KEY ("cohort_user_id") REFERENCES "CohortUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cohort_user_windows" ADD CONSTRAINT "cohort_user_windows_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
