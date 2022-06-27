-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "language" ADD VALUE 'COBOL';
ALTER TYPE "language" ADD VALUE 'LISP';
ALTER TYPE "language" ADD VALUE 'F_SHARP';
ALTER TYPE "language" ADD VALUE 'FORTRAN';
ALTER TYPE "language" ADD VALUE 'HASKELL';
ALTER TYPE "language" ADD VALUE 'OBJECTIVE_C';
ALTER TYPE "language" ADD VALUE 'OCAML';
ALTER TYPE "language" ADD VALUE 'PASCAL';
ALTER TYPE "language" ADD VALUE 'PROLOG';
