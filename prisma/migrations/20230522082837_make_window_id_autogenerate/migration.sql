-- AlterTable
CREATE SEQUENCE windows_id_seq;
ALTER TABLE "windows" ALTER COLUMN "id" SET DEFAULT nextval('windows_id_seq');
ALTER SEQUENCE windows_id_seq OWNED BY "windows"."id";
