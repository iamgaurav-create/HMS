-- The pharmacy bill item and the laboratory result columns below were applied
-- directly to the database, so they never made it into the migration history.
-- Without this migration a reset would rebuild the tables without them.

-- AlterTable
ALTER TABLE "PharmacyBillItem"
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs',
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LabTest"
ADD COLUMN     "performed_by" TEXT,
ADD COLUMN     "performed_by_name" TEXT,
ADD COLUMN     "reference_range" TEXT,
ADD COLUMN     "result_data" JSONB,
ADD COLUMN     "result_flag" TEXT,
ADD COLUMN     "result_unit" TEXT,
ADD COLUMN     "sample_collected_at" TIMESTAMP(3),
ADD COLUMN     "sample_id" TEXT,
ADD COLUMN     "sample_type" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT,
ADD COLUMN     "verified_by_name" TEXT;
