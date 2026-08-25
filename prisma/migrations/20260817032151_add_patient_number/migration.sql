/*
  Warnings:

  - A unique constraint covering the columns `[patientNumber]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `patientNumber` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SuperAdmin';
ALTER TYPE "Role" ADD VALUE 'Receptionist';
ALTER TYPE "Role" ADD VALUE 'Pharmacist';
ALTER TYPE "Role" ADD VALUE 'Accountant';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "patientNumber" TEXT;

-- Backfill existing records before enforcing the required, unique column.
WITH numbered_patients AS (
  SELECT
    "id",
    'P-' || (1000 + ROW_NUMBER() OVER (ORDER BY "created_at", "id"))::TEXT AS "patientNumber"
  FROM "Patient"
)
UPDATE "Patient"
SET "patientNumber" = numbered_patients."patientNumber"
FROM numbered_patients
WHERE "Patient"."id" = numbered_patients."id";

ALTER TABLE "Patient" ALTER COLUMN "patientNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientNumber_key" ON "Patient"("patientNumber");
