-- A laboratory result is entered by one professional, reviewed by a second
-- one and released as a report. These columns keep track of who did what and
-- when, so the printed report stays correct even after the people involved
-- changed roles later on.

-- AlterTable
ALTER TABLE "LabTest"
ADD COLUMN     "sample_status" TEXT,
ADD COLUMN     "performed_at" TIMESTAMP(3),
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "released_by" TEXT,
ADD COLUMN     "released_by_name" TEXT,
ADD COLUMN     "released_at" TIMESTAMP(3),
ADD COLUMN     "amended_by" TEXT,
ADD COLUMN     "amended_by_name" TEXT,
ADD COLUMN     "amended_at" TIMESTAMP(3),
ADD COLUMN     "amendment_reason" TEXT;

-- CreateIndex
CREATE INDEX "LabTest_sample_id_idx" ON "LabTest"("sample_id");

-- The result sheet of a laboratory service. The parameters and their
-- reference ranges are configured by the laboratory, so the values always
-- follow the validated policy of the hospital.
-- CreateTable
CREATE TABLE "LabTestTemplate" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "template_key" TEXT NOT NULL,
    "specimen" TEXT,
    "parameters" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LabTestTemplate_service_id_key" ON "LabTestTemplate"("service_id");

-- CreateIndex
CREATE INDEX "LabTestTemplate_template_key_idx" ON "LabTestTemplate"("template_key");

-- AddForeignKey
ALTER TABLE "LabTestTemplate" ADD CONSTRAINT "LabTestTemplate_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
