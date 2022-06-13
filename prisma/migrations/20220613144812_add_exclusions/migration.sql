-- CreateTable
CREATE TABLE "exclusions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "windowId" INTEGER NOT NULL,

    CONSTRAINT "exclusions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exclusions" ADD CONSTRAINT "exclusions_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "windows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
