-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'COMPLETED', 'REJECTED');

-- AlterTable
ALTER TABLE "Staff"
ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvedBy" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "changeRequest" TEXT,
ADD COLUMN "rejectionReason" TEXT;

-- Existing completed onboarding records retain their completed state.
UPDATE "Staff"
SET "onboardingStatus" = CASE
  WHEN "onboardingCompleted" THEN 'COMPLETED'::"OnboardingStatus"
  WHEN "mustChangePassword" THEN 'PENDING'::"OnboardingStatus"
  ELSE 'UNDER_REVIEW'::"OnboardingStatus"
END;

-- CreateIndex
CREATE INDEX "Staff_onboardingStatus_idx" ON "Staff"("onboardingStatus");
