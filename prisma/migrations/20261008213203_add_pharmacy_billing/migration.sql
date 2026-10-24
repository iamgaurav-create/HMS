-- CreateEnum
CREATE TYPE "PharmacyBillStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PharmacyPaymentMethod" AS ENUM ('CASH', 'CARD', 'ONLINE');

-- AlterTable
ALTER TABLE "StockTransaction" ADD COLUMN     "unit_price" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PharmacyBill" (
    "id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "prescription_id" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PharmacyBillStatus" NOT NULL DEFAULT 'UNPAID',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyBillItem" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "medicine_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyPayment" (
    "id" TEXT NOT NULL,
    "bill_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PharmacyPaymentMethod" NOT NULL,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PharmacyBill_bill_number_key" ON "PharmacyBill"("bill_number");

-- CreateIndex
CREATE INDEX "PharmacyBill_patient_id_idx" ON "PharmacyBill"("patient_id");

-- CreateIndex
CREATE INDEX "PharmacyBill_prescription_id_idx" ON "PharmacyBill"("prescription_id");

-- CreateIndex
CREATE INDEX "PharmacyBill_status_idx" ON "PharmacyBill"("status");

-- CreateIndex
CREATE INDEX "PharmacyBill_created_at_idx" ON "PharmacyBill"("created_at");

-- CreateIndex
CREATE INDEX "PharmacyBillItem_bill_id_idx" ON "PharmacyBillItem"("bill_id");

-- CreateIndex
CREATE INDEX "PharmacyBillItem_medicine_id_idx" ON "PharmacyBillItem"("medicine_id");

-- CreateIndex
CREATE INDEX "PharmacyPayment_bill_id_idx" ON "PharmacyPayment"("bill_id");

-- CreateIndex
CREATE INDEX "PharmacyPayment_created_at_idx" ON "PharmacyPayment"("created_at");

-- AddForeignKey
ALTER TABLE "PharmacyBill" ADD CONSTRAINT "PharmacyBill_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBill" ADD CONSTRAINT "PharmacyBill_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBillItem" ADD CONSTRAINT "PharmacyBillItem_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "PharmacyBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyBillItem" ADD CONSTRAINT "PharmacyBillItem_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyPayment" ADD CONSTRAINT "PharmacyPayment_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "PharmacyBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
