-- A doctor can request several laboratory tests in a single order. `order_id`
-- links every test of one order together so the order can be listed, and
-- printed, as a single document instead of one row per test.
ALTER TABLE "LabTest" ADD COLUMN IF NOT EXISTS "order_id" TEXT;

CREATE INDEX IF NOT EXISTS "LabTest_order_id_idx" ON "LabTest"("order_id");

-- Legacy rows were created before the column existed. They are grouped by the
-- medical record they belong to, which is the clinical encounter the tests
-- were requested in.
UPDATE "LabTest" AS lt
SET "order_id" = 'legacy-' || lt."record_id"::TEXT
WHERE lt."order_id" IS NULL;
