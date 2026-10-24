-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "email_sent_at" TIMESTAMP(3),
ADD COLUMN     "pdf_url" TEXT,
ADD COLUMN     "whatsapp_sent_at" TIMESTAMP(3);
