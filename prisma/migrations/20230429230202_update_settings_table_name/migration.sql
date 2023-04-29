/*

  NOTE: This migration script is manually written to avoid dropping the "Settings" table.

*/
BEGIN;
ALTER TABLE "Settings" RENAME TO "settings";
ALTER TABLE "settings" RENAME CONSTRAINT "Settings_pkey" TO "settings_pkey";
ALTER TABLE "settings" RENAME CONSTRAINT "Settings_userId_fkey" TO "settings_userId_fkey";
ALTER INDEX "Settings_userId_key" RENAME TO "settings_userId_key";
ALTER SEQUENCE "Settings_id_seq" RENAME TO "settings_id_seq";
COMMIT;
