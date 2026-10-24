import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import prisma from "@/lib/db";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

type Props = {
  searchParams: Promise<{ type?: string }>;
};

type AlertRow = {
  key: string;
  medicine: string;
  batch: string;
  quantity: number;
  expiry: Date | null;
  category: string;
  details: string;
};

export default async function InventoryAlertsPage({ searchParams }: Props) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/inventory/alerts" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const selectedType = [
    "all",
    "low",
    "out",
    "expiring",
    "expired",
  ].includes(params.type ?? "")
    ? params.type ?? "all"
    : "all";

  const medicines = await prisma.medicine.findMany({
    where: { is_active: true },
    include: { batches: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const expiryLimit = new Date(today);
  expiryLimit.setDate(expiryLimit.getDate() + 30);

  const alerts: AlertRow[] = [];

  for (const medicine of medicines) {
    const usableBatches = medicine.batches.filter(
      (batch) =>
        batch.quantity > 0 && batch.expiry_date >= today
    );

    const usableStock = usableBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    if (usableStock === 0) {
      alerts.push({
        key: `${medicine.id}-out`,
        medicine: medicine.name,
        batch: "All batches",
        quantity: 0,
        expiry: null,
        category: "Out of stock",
        details: "No usable stock available",
      });
    } else if (usableStock <= medicine.reorder_level) {
      alerts.push({
        key: `${medicine.id}-low`,
        medicine: medicine.name,
        batch: "All batches",
        quantity: usableStock,
        expiry: null,
        category: "Low stock",
        details: `Reorder level: ${medicine.reorder_level}`,
      });
    }

    for (const batch of medicine.batches) {
      if (batch.quantity <= 0) continue;

      if (batch.expiry_date < today) {
        alerts.push({
          key: `${batch.id}-expired`,
          medicine: medicine.name,
          batch: batch.batch_number,
          quantity: batch.quantity,
          expiry: batch.expiry_date,
          category: "Expired",
          details: "Remove from usable inventory immediately",
        });
      } else if (batch.expiry_date <= expiryLimit) {
        alerts.push({
          key: `${batch.id}-expiring`,
          medicine: medicine.name,
          batch: batch.batch_number,
          quantity: batch.quantity,
          expiry: batch.expiry_date,
          category: "Expiring soon",
          details: "Review this batch before expiry",
        });
      }
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedType === "low") return alert.category === "Low stock";
    if (selectedType === "out") return alert.category === "Out of stock";
    if (selectedType === "expiring") return alert.category === "Expiring soon";
    if (selectedType === "expired") return alert.category === "Expired";
    return true;
  });

  const filters = [
    { label: "All alerts", value: "all" },
    { label: "Low stock", value: "low" },
    { label: "Out of stock", value: "out" },
    { label: "Expiring soon", value: "expiring" },
    { label: "Expired", value: "expired" },
  ];

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/pharmacy/inventory"
          className="text-sm text-primary hover:underline"
        >
          ← Back to inventory
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Inventory Alerts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review stock shortages and expiry risks.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === "all"
                ? "/pharmacy/inventory/alerts"
                : `/pharmacy/inventory/alerts?type=${filter.value}`
            }
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              selectedType === filter.value
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="font-semibold">Alerts</h2>
          <span className="rounded-full bg-muted px-3 py-1 text-xs">
            {filteredAlerts.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Medicine</th>
                <th className="px-5 py-3 font-medium">Batch</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Expiry Date</th>
                <th className="px-5 py-3 font-medium">Alert</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No alerts found for this filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.key}>
                    <td className="px-5 py-4 font-medium">
                      {alert.medicine}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {alert.details}
                      </div>
                    </td>
                    <td className="px-5 py-4">{alert.batch}</td>
                    <td className="px-5 py-4">{alert.quantity}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {alert.expiry
                        ? alert.expiry.toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          alert.category === "Expired" ||
                          alert.category === "Out of stock"
                            ? "bg-red-100 text-red-700"
                            : alert.category === "Low stock"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {alert.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href="/pharmacy/inventory/adjustments"
                        className="font-medium text-primary hover:underline"
                      >
                        Manage stock
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
