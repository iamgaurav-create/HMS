-- Baseline migration.
--
-- The pharmacy/inventory work, the appointment-status enum renames and the
-- supporting indexes were originally applied to the database with
-- `prisma db push` (or hand-written SQL) instead of `prisma migrate dev`, so
-- migration history did not describe them and Prisma reported drift.
--
-- This migration records that already-existing database state. It is marked as
-- applied against existing databases, and only runs on a database created from
-- scratch.

-- AlterEnum
-- New variants first so the data backfill below can reference them.
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'Scheduled';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'Confirmed';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CheckedIn';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'InProgress';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'Completed';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'Cancelled';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NoShow';

-- Preserve the meaning of the old lower-case variants before the type is recreated.
UPDATE "Appointment" SET "status" = 'Scheduled' WHERE "status" = 'scheduled'::"AppointmentStatus";
UPDATE "Appointment" SET "status" = 'Cancelled' WHERE "status" = 'cancelled'::"AppointmentStatus";
UPDATE "Appointment" SET "status" = 'Completed' WHERE "status" = 'completed'::"AppointmentStatus";

-- AlterEnum
-- Recreate the type so the lower-case variants disappear, re-pointing the
-- dependent column before the old type is dropped.
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('Pending', 'Scheduled', 'Confirmed', 'CheckedIn', 'InProgress', 'Completed', 'Cancelled', 'NoShow');
ALTER TABLE "Appointment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Appointment" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "AppointmentStatus_old";
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'Pending';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HR';

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('PURCHASE', 'DISPENSE', 'RETURN', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "status" "Status" NOT NULL DEFAULT 'Active';

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "unit" TEXT NOT NULL,
    "reorder_level" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineBatch" (
    "id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "batch_number" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "selling_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "medical_id" INTEGER,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionMedicine" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensed_qty" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_appointment_date_idx" ON "Appointment"("appointment_date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_doctor_id_appointment_date_time_key" ON "Appointment"("doctor_id" ASC, "appointment_date" ASC, "time" ASC);

-- CreateIndex
CREATE INDEX "Appointment_doctor_id_idx" ON "Appointment"("doctor_id" ASC);

-- CreateIndex
CREATE INDEX "Appointment_patient_id_idx" ON "Appointment"("patient_id" ASC);

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status" ASC);

-- CreateIndex
CREATE INDEX "Auditlog_created_at_idx" ON "Auditlog"("created_at" ASC);

-- CreateIndex
CREATE INDEX "Auditlog_model_idx" ON "Auditlog"("model" ASC);

-- CreateIndex
CREATE INDEX "LabTest_status_idx" ON "LabTest"("status" ASC);

-- CreateIndex
CREATE INDEX "LabTest_test_date_idx" ON "LabTest"("test_date" ASC);

-- CreateIndex
CREATE INDEX "MedicalRecords_appointment_id_idx" ON "MedicalRecords"("appointment_id" ASC);

-- CreateIndex
CREATE INDEX "MedicalRecords_doctor_id_idx" ON "MedicalRecords"("doctor_id" ASC);

-- CreateIndex
CREATE INDEX "MedicalRecords_patient_id_idx" ON "MedicalRecords"("patient_id" ASC);

-- CreateIndex
CREATE INDEX "Patient_created_at_idx" ON "Patient"("created_at" ASC);

-- CreateIndex
CREATE INDEX "Payment_payment_date_idx" ON "Payment"("payment_date" ASC);

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status" ASC);

-- CreateIndex
CREATE INDEX "Payment_patient_id_idx" ON "Payment"("patient_id" ASC);

-- CreateIndex
CREATE INDEX "VitalSigns_medical_id_idx" ON "VitalSigns"("medical_id" ASC);

-- CreateIndex
CREATE INDEX "Medicine_category_idx" ON "Medicine"("category" ASC);

-- CreateIndex
CREATE INDEX "Medicine_is_active_idx" ON "Medicine"("is_active" ASC);

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name" ASC);

-- CreateIndex
CREATE INDEX "Supplier_is_active_idx" ON "Supplier"("is_active" ASC);

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name" ASC);

-- CreateIndex
CREATE INDEX "MedicineBatch_batch_number_idx" ON "MedicineBatch"("batch_number" ASC);

-- CreateIndex
CREATE INDEX "MedicineBatch_expiry_date_idx" ON "MedicineBatch"("expiry_date" ASC);

-- CreateIndex
CREATE INDEX "MedicineBatch_medicine_id_idx" ON "MedicineBatch"("medicine_id" ASC);

-- CreateIndex
CREATE INDEX "MedicineBatch_supplier_id_idx" ON "MedicineBatch"("supplier_id" ASC);

-- CreateIndex
CREATE INDEX "Prescription_created_at_idx" ON "Prescription"("created_at" ASC);

-- CreateIndex
CREATE INDEX "Prescription_doctor_id_idx" ON "Prescription"("doctor_id" ASC);

-- CreateIndex
CREATE INDEX "Prescription_medical_id_idx" ON "Prescription"("medical_id" ASC);

-- CreateIndex
CREATE INDEX "Prescription_patient_id_idx" ON "Prescription"("patient_id" ASC);

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status" ASC);

-- CreateIndex
CREATE INDEX "PrescriptionMedicine_medicine_id_idx" ON "PrescriptionMedicine"("medicine_id" ASC);

-- CreateIndex
CREATE INDEX "PrescriptionMedicine_prescription_id_idx" ON "PrescriptionMedicine"("prescription_id" ASC);

-- CreateIndex
CREATE INDEX "StockTransaction_batch_id_idx" ON "StockTransaction"("batch_id" ASC);

-- CreateIndex
CREATE INDEX "StockTransaction_created_at_idx" ON "StockTransaction"("created_at" ASC);

-- CreateIndex
CREATE INDEX "StockTransaction_created_by_idx" ON "StockTransaction"("created_by" ASC);

-- CreateIndex
CREATE INDEX "StockTransaction_medicine_id_idx" ON "StockTransaction"("medicine_id" ASC);

-- CreateIndex
CREATE INDEX "StockTransaction_type_idx" ON "StockTransaction"("type" ASC);

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at" ASC);

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read" ASC);

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id" ASC);

-- DropIndex
DROP INDEX IF EXISTS "Staff_onboardingStatus_idx";

-- AddForeignKey
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineBatch" ADD CONSTRAINT "MedicineBatch_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionMedicine" ADD CONSTRAINT "PrescriptionMedicine_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionMedicine" ADD CONSTRAINT "PrescriptionMedicine_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "MedicineBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
