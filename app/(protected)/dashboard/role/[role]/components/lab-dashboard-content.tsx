import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { LabDashboard } from "@/components/dashboard/lab-dashboard";

export function LabDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <LabDashboardLoader />
    </Suspense>
  );
}

async function LabDashboardLoader() {
  const { getPendingLabTests, getLabMetrics } = await import("@/lib/db/dashboard-data");

  const [pendingTests, metrics] = await Promise.all([
    getPendingLabTests(),
    getLabMetrics(),
  ]);

  return <LabDashboard pendingTests={pendingTests} metrics={metrics} />;
}
