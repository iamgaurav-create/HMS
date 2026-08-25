import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { NurseDashboard } from "@/components/dashboard/nurse-dashboard";

export function NurseDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <NurseDashboardLoader />
    </Suspense>
  );
}

async function NurseDashboardLoader() {
  const { getWardPatients, getNurseMetrics } = await import("@/lib/db/dashboard-data");

  const [wardPatients, metrics] = await Promise.all([
    getWardPatients(),
    getNurseMetrics(),
  ]);

  return <NurseDashboard wardPatients={wardPatients} metrics={metrics} />;
}
