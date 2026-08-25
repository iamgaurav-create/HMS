import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ReceptionistDashboard } from "@/components/dashboard/receptionist-dashboard";

export function ReceptionistDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <ReceptionistDashboardLoader />
    </Suspense>
  );
}

async function ReceptionistDashboardLoader() {
  const { getPatientQueue, getDoctorAvailability, getReceptionistMetrics } = await import(
    "@/lib/db/dashboard-data"
  );

  const [queue, availability, metrics] = await Promise.all([
    getPatientQueue(),
    getDoctorAvailability(),
    getReceptionistMetrics(),
  ]);

  return (
    <ReceptionistDashboard queue={queue} availability={availability} metrics={metrics} />
  );
}
