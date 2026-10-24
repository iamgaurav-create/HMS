
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  Package,
} from "lucide-react";
import prisma from "@/lib/db";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function PharmacyInventoryPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/inventory" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

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

  const inventory = medicines.map((medicine) => {
    const usableBatches = medicine.batches.filter(
      (batch) =>
        batch.quantity > 0 && batch.expiry_date >= today
    );

    const usableStock = usableBatches.reduce(
      (sum, batch) => sum + batch.quantity,
      0
    );

    const expiredStock = medicine.batches
      .filter(
        (batch) =>
          batch.quantity > 0 && batch.expiry_date < today
      )
      .reduce((sum, batch) => sum + batch.quantity, 0);

    const expiringStock = medicine.batches
      .filter(
        (batch) =>
          batch.quantity > 0 &&
          batch.expiry_date >= today &&
          batch.expiry_date <= expiryLimit
      )
      .reduce((sum, batch) => sum + batch.quantity, 0);

    return {
      id: medicine.id,
      name: medicine.name,
      unit: medicine.unit,
      reorderLevel: medicine.reorder_level,
      usableStock,
      expiredStock,
      expiringStock,
      lowStock:
        usableStock > 0 && usableStock <= medicine.reorder_level,
      outOfStock: usableStock === 0,
    };
  });

  const lowStockCount = inventory.filter(
    (item) => item.lowStock
  ).length;

  const outOfStockCount = inventory.filter(
    (item) => item.outOfStock
  ).length;

  const expiredBatchCount = medicines.reduce(
    (sum, medicine) =>
      sum +
      medicine.batches.filter(
        (batch) =>
          batch.quantity > 0 && batch.expiry_date < today
      ).length,
    0
  );

  const expiringBatchCount = medicines.reduce(
    (sum, medicine) =>
      sum +
      medicine.batches.filter(
        (batch) =>
          batch.quantity > 0 &&
          batch.expiry_date >= today &&
          batch.expiry_date <= expiryLimit
      ).length,
    0
  );

  const cards = [
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: AlertTriangle,
      href: "/pharmacy/inventory/alerts?type=low",
    },
    {
      title: "Out of Stock",
      value: outOfStockCount,
      icon: Package,
      href: "/pharmacy/inventory/alerts?type=out",
    },
    {
      title: "Expiring in 30 Days",
      value: expiringBatchCount,
      icon: CalendarClock,
      href: "/pharmacy/inventory/alerts?type=expiring",
    },
    {
      title: "Expired Batches",
      value: expiredBatchCount,
      icon: ClipboardList,
      href: "/pharmacy/inventory/alerts?type=expired",
    },
  ];

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pharmacy Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor usable stock, batch expiry, and inventory risks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/pharmacy/inventory/alerts"
            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
          >
            View Alerts
          </Link>
          <Link
            href="/pharmacy/inventory/adjustments"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Stock Adjustments
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border bg-card p-5 shadow-sm transition hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-3xl font-bold">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                View details
              </p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">Medicine Stock Overview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Expired quantities are excluded from usable stock.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Medicine</th>
                <th className="px-5 py-3 font-medium">Usable Stock</th>
                <th className="px-5 py-3 font-medium">Reorder Level</th>
                <th className="px-5 py-3 font-medium">Expiring Stock</th>
                <th className="px-5 py-3 font-medium">Expired Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-muted-foreground"
                  >
                    No active medicines found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-medium">
                      {item.name}
                      <div className="text-xs text-muted-foreground">
                        Unit: {item.unit}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {item.usableStock}
                    </td>
                    <td className="px-5 py-4">
                      {item.reorderLevel}
                    </td>
                    <td className="px-5 py-4">
                      {item.expiringStock}
                    </td>
                    <td className="px-5 py-4">
                      {item.expiredStock}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.outOfStock
                            ? "bg-red-100 text-red-700"
                            : item.lowStock
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.outOfStock
                          ? "Out of stock"
                          : item.lowStock
                            ? "Low stock"
                            : "In stock"}
                      </span>
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
