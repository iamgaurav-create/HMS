import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AccountDashboard } from "@/components/dashboard/account-dashboard";

export function AccountDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <AccountDashboardLoader />
    </Suspense>
  );
}

async function AccountDashboardLoader() {
  const { getAccountMetrics, getInvoices } = await import("@/lib/db/dashboard-data");

  const [metrics, invoices] = await Promise.all([
    getAccountMetrics(),
    getInvoices(),
  ]);

  return <AccountDashboard metrics={metrics} invoices={invoices} />;
}
