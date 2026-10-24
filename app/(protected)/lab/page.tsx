import { LabDashboard } from "@/components/laboratory/dashboard/lab-dashboard";
import { getLabDashboardData } from "@/lib/db/laboratory-data";

export const dynamic = "force-dynamic";

export default async function LabPage() {
    const { metrics, recentOrders } = await getLabDashboardData();

    return (
        <LabDashboard metrics={metrics} recentOrders={recentOrders} />
    );
}