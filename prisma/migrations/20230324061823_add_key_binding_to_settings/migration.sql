-- CreateEnum
CREATE TYPE "key_binding" AS ENUM ('STANDARD', 'VIM', 'EMACS', 'SUBLIME');

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "preferredKeyBinding" "key_binding" NOT NULL DEFAULT 'STANDARD';
