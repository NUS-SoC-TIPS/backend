-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exclusion_notifications" (
    "notification_id" INTEGER NOT NULL,
    "exclusion_id" INTEGER NOT NULL,

    CONSTRAINT "exclusion_notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exclusion_notifications_exclusion_id_key" ON "exclusion_notifications"("exclusion_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_notifications" ADD CONSTRAINT "exclusion_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusion_notifications" ADD CONSTRAINT "exclusion_notifications_exclusion_id_fkey" FOREIGN KEY ("exclusion_id") REFERENCES "exclusions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
