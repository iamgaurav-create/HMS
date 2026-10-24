-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'COMPLETED',
  'REJECTED'
);

-- Add columns required by Staff onboarding and role assignment
ALTER TABLE "Staff"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "clerkUserId" TEXT,
ADD COLUMN "hospitalEmail" TEXT,
ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "changeRequest" TEXT,
ADD COLUMN "rejectionReason" TEXT;

-- Add unique indexes required by the Staff schema
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_clerkUserId_key" ON "Staff"("clerkUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_hospitalEmail_key" ON "Staff"("hospitalEmail");

-- Existing completed onboarding records retain their completed state.
UPDATE "Staff"
SET "onboardingStatus" = CASE
  WHEN "onboardingCompleted" = true
    THEN 'COMPLETED'::"OnboardingStatus"
  WHEN "mustChangePassword" = true
    THEN 'PENDING'::"OnboardingStatus"
  ELSE 'UNDER_REVIEW'::"OnboardingStatus"
END;

-- CreateIndex
CREATE INDEX "Staff_onboardingStatus_idx"
ON "Staff"("onboardingStatus");