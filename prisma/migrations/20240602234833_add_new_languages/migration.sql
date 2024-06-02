-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "language" ADD VALUE 'PANDAS';
ALTER TYPE "language" ADD VALUE 'POSTGRESQL';
ALTER TYPE "language" ADD VALUE 'ADA';
ALTER TYPE "language" ADD VALUE 'ALGOL_68';
ALTER TYPE "language" ADD VALUE 'CRYSTAL';
ALTER TYPE "language" ADD VALUE 'D';
ALTER TYPE "language" ADD VALUE 'LUA';
ALTER TYPE "language" ADD VALUE 'MODULA_2';
ALTER TYPE "language" ADD VALUE 'NIM';
ALTER TYPE "language" ADD VALUE 'OCTAVE';
ALTER TYPE "language" ADD VALUE 'ODIN';
ALTER TYPE "language" ADD VALUE 'PERL';
ALTER TYPE "language" ADD VALUE 'SIMULA_67';
ALTER TYPE "language" ADD VALUE 'SMALLTALK';
ALTER TYPE "language" ADD VALUE 'SNOBOL';
ALTER TYPE "language" ADD VALUE 'VISUAL_BASIC';
ALTER TYPE "language" ADD VALUE 'ZIG';

-- AlterEnum
ALTER TYPE "question_type" ADD VALUE 'PANDAS';
