-- CreateTable
CREATE TABLE "pairings" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "window_id" INTEGER NOT NULL,

    CONSTRAINT "pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pairing_users" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pairing_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,

    CONSTRAINT "pairing_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pairing_users_pairing_id_student_id_key" ON "pairing_users"("pairing_id", "student_id");

-- AddForeignKey
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_window_id_fkey" FOREIGN KEY ("window_id") REFERENCES "windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_users" ADD CONSTRAINT "pairing_users_pairing_id_fkey" FOREIGN KEY ("pairing_id") REFERENCES "pairings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pairing_users" ADD CONSTRAINT "pairing_users_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
