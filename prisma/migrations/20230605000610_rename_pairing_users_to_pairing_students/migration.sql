/*
  Warnings:

  - You are about to drop the `pairing_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "pairing_users" DROP CONSTRAINT "pairing_users_pairing_id_fkey";

-- DropForeignKey
ALTER TABLE "pairing_users" DROP CONSTRAINT "pairing_users_student_id_fkey";

-- DropTable
DROP TABLE "pairing_users";

-- CreateTable
CREATE TABLE "pairing_students" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pairing_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "pairing_students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pairing_students_pairing_id_student_id_key" ON "pairing_students"("pairing_id", "student_id");

-- AddForeignKey
ALTER TABLE "pairing_students" ADD CONSTRAINT "pairing_students_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "pairings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_students" ADD CONSTRAINT "pairing_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
