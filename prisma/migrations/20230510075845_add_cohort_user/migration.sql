-- CreateTable
CREATE TABLE "CohortUser" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "cohort_id" INTEGER NOT NULL,

    CONSTRAINT "CohortUser_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CohortUser" ADD CONSTRAINT "CohortUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortUser" ADD CONSTRAINT "CohortUser_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
