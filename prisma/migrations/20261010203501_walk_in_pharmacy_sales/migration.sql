-- DropForeignKey
ALTER TABLE "PharmacyBill" DROP CONSTRAINT "PharmacyBill_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "PharmacyBillItem" DROP CONSTRAINT "PharmacyBillItem_medicine_id_fkey";

-- AlterTable
ALTER TABLE "PharmacyBill" ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "customer_phone" TEXT,
ALTER COLUMN "patient_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PharmacyBillItem" ADD COLUMN     "batch_id" TEXT;

-- CreateIndex
CREATE INDEX "PharmacyBillItem_batch_id_idx" ON "PharmacyBillItem"("batch_id");

-- AddForeignKey
ALTER TABLE "PharmacyBill" ADD CONSTRAINT "PharmacyBill_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBillItem" ADD CONSTRAINT "PharmacyBillItem_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBillItem" ADD CONSTRAINT "PharmacyBillItem_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "MedicineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
