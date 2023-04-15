-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "language" ADD VALUE 'DART';
ALTER TYPE "language" ADD VALUE 'APL';
ALTER TYPE "language" ADD VALUE 'GERBIL';
ALTER TYPE "language" ADD VALUE 'JULIA';

-- AlterEnum
ALTER TYPE "question_type" ADD VALUE 'JAVASCRIPT';
