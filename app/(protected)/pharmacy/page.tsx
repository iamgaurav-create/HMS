import { redirect } from "next/navigation";
import { getPharmacyDashboardData } from "@/lib/actions/pharmacy/dashboard.actions";
import { PharmacyDashboard } from "@/components/dashboard/pharmacy-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { auth } from "@clerk/nextjs/server";

export default async function PharmacyPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const allowedRoles = ["SuperAdmin", "admin", "Pharmacist"];
  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }

  const dashboardData = await getPharmacyDashboardData();

  return (
    <AppShell userRole={userRole}>
      <PharmacyDashboard
        metrics={dashboardData.metrics}
        lowStockMedicines={dashboardData.lowStockMedicines}
        pendingPrescriptions={dashboardData.pendingPrescriptions}
        recentWalkInSales={dashboardData.recentWalkInSales}
        recentPrescriptionBills={dashboardData.recentPrescriptionBills}
      />
    </AppShell>
  );
}
