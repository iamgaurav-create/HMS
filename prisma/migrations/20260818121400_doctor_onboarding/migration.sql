-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'PartTime';
ALTER TYPE "JobType" ADD VALUE 'Consultant';
ALTER TYPE "JobType" ADD VALUE 'Visiting';

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "clerkUserId" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "hospitalEmail" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Doctor" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_clerkUserId_key" ON "Doctor"("clerkUserId");
CREATE UNIQUE INDEX "Doctor_hospitalEmail_key" ON "Doctor"("hospitalEmail");
