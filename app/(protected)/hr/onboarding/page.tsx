import { requireRole } from "@/lib/auth/guards";
import {
  getPendingOnboarding,
  getStaffOnboardingByStatus,
  getRecentlyOnboarded,
  getOffboardedStaff,
} from "@/lib/db/dashboard-data";
import { OnboardingTracker } from "@/components/staff/onboarding-tracker";

export const dynamic = "force-dynamic";

export default async function HROnboardingPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);

  const [pending, underReview, changesRequested, recent, offboarded] = await Promise.all([
    getPendingOnboarding(),
    getStaffOnboardingByStatus("UNDER_REVIEW"),
    getStaffOnboardingByStatus("CHANGES_REQUESTED"),
    getRecentlyOnboarded(30),
    getOffboardedStaff(),
  ]);

  return (
    <div className="space-y-6 pb-12 p-8 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Onboarding & Offboarding
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track staff onboarding progress and manage offboarding
        </p>
      </div>
      <OnboardingTracker
        pendingStaff={pending.staff}
        pendingDoctors={pending.doctors}
        underReviewStaff={underReview}
        changesRequestedStaff={changesRequested}
        recentStaff={recent.staff}
        recentDoctors={recent.doctors}
        offboardedStaff={offboarded.staff}
        offboardedDoctors={offboarded.doctors}
      />
    </div>
  );
}
