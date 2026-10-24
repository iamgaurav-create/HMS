
import { Suspense } from "react";
import { RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { LabDashboard } from "@/components/laboratory/dashboard/lab-dashboard";

export function LabDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <LabDashboardLoader />
    </Suspense>
  );
}

async function LabDashboardLoader() {
  const { getLabDashboardData } = await import("@/lib/db/laboratory-data");

    const { metrics, recentOrders } = await getLabDashboardData();

    return (
        <LabDashboard
            metrics={metrics}
            recentOrders={recentOrders}
        />
    );
}
