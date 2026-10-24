-- Allow the same laboratory test to be ordered for multiple patients.
-- `LabTest.service_id` was unique, which meant a service could only ever be
-- ordered once in the whole system (Prisma error P2002 on the second order).
DROP INDEX IF EXISTS "LabTest_service_id_key";

CREATE INDEX IF NOT EXISTS "LabTest_service_id_idx" ON "LabTest"("service_id");

-- One medical record per appointment, so the doctor lab order action can
-- resolve (and create) the record for an appointment without duplicating it.
CREATE UNIQUE INDEX IF NOT EXISTS "MedicalRecords_appointment_id_key" ON "MedicalRecords"("appointment_id");
