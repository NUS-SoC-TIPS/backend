-- CreateTable
CREATE TABLE "excuses" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "student_id" INTEGER NOT NULL,
    "window_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "excuses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "excuses" ADD CONSTRAINT "excuses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excuses" ADD CONSTRAINT "excuses_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
