import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { HRManagementHub } from "@/components/dashboard/hr-management-hub";

export function HRDashboardContent() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HRDashboardLoader />
    </Suspense>
  );
}

async function HRDashboardLoader() {
  const { getHRMetrics, getStaffCountsByRole, getRecentStaffActivities } = await import(
    "@/lib/db/dashboard-data"
  );

  const [metrics, roleCounts, activities] = await Promise.all([
    getHRMetrics(),
    getStaffCountsByRole(),
    getRecentStaffActivities(),
  ]);

  return <HRManagementHub roleCounts={roleCounts} doctorCount={{ total: metrics.totalDoctors, active: metrics.totalDoctors - metrics.inactiveDoctors, inactive: metrics.inactiveDoctors }} pendingOnboarding={metrics.pendingOnboarding} recentActivities={activities.map((activity) => ({ id: activity.id, action: activity.action, time: activity.time }))} />;
}
