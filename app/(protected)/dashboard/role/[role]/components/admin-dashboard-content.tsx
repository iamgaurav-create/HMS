import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export function AdminDashboardContent() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AdminDashboardLoader />
    </Suspense>
  );
}

async function AdminDashboardLoader() {
  const { getDashboardMetrics, getRecentActivities, getUpcomingAppointments } = await import(
    "@/lib/db/dashboard-data"
  );

  const [metrics, activities, appointments] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivities(),
    getUpcomingAppointments(),
  ]);

  return (
    <AdminDashboard
      metrics={metrics}
      activities={activities}
      appointments={appointments}
    />
  );
}
