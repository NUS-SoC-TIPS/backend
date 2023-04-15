/*
  Warnings:

  - The values [SUBLIME] on the enum `key_binding` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "key_binding_new" AS ENUM ('STANDARD', 'VIM', 'EMACS', 'VS_CODE');
ALTER TABLE "Settings" ALTER COLUMN "preferredKeyBinding" DROP DEFAULT;
ALTER TABLE "Settings" ALTER COLUMN "preferredKeyBinding" TYPE "key_binding_new" USING ("preferredKeyBinding"::text::"key_binding_new");
ALTER TYPE "key_binding" RENAME TO "key_binding_old";
ALTER TYPE "key_binding_new" RENAME TO "key_binding";
DROP TYPE "key_binding_old";
ALTER TABLE "Settings" ALTER COLUMN "preferredKeyBinding" SET DEFAULT 'STANDARD';
COMMIT;
