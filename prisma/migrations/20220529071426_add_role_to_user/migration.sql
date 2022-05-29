-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('NORMAL', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT E'NORMAL';
