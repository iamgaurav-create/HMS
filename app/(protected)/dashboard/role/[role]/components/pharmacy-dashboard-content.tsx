import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { PharmacyDashboard } from "@/components/dashboard/pharmacy-dashboard";

export function PharmacyDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <PharmacyDashboardLoader />
    </Suspense>
  );
}

async function PharmacyDashboardLoader() {
  const { getPharmacyMetrics } = await import("@/lib/db/dashboard-data");

  const metrics = await getPharmacyMetrics();

  return <PharmacyDashboard metrics={metrics} />;
}
