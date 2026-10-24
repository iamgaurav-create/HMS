import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Package,
  CreditCard,
  Users,
} from "lucide-react";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import WalkInSaleForm from "./components/walk-in-sale-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function WalkInSalesPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/walk-in-sales" });
    redirect("/sign-in");
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const staff = await db.staff.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { id: userId }],
      status: "Active",
      role: {
        in: ["Pharmacist", "admin", "SuperAdmin"],
      },
    },
    select: { id: true },
  });

  if (!staff) {
    redirect("/unauthorized");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const medicines = await db.medicine.findMany({
    where: {
      is_active: true,
      batches: {
        some: {
          quantity: { gt: 0 },
          expiry_date: { gte: todayStart },
        },
      },
    },
    select: {
      id: true,
      name: true,
      generic_name: true,
      category: true,
      unit: true,
      is_active: true,
      is_otc: true,
      batches: {
        where: {
          quantity: { gt: 0 },
          expiry_date: { gte: todayStart },
        },
        select: {
          id: true,
          batch_number: true,
          quantity: true,
          selling_price: true,
          expiry_date: true,
        },
        orderBy: {
          expiry_date: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[Walk-in Sales] Query date:", todayStart.toISOString());
    console.log("[Walk-in Sales] Medicines found:", medicines.length);
    medicines.forEach((m) => {
      console.log(
        `  - ${m.name} (OTC: ${m.is_otc}, Active: ${m.is_active}) - ${m.batches.length} batches`,
      );
      m.batches.forEach((b) => {
        console.log(
          `    Batch ${b.batch_number}: qty=${b.quantity}, expiry=${b.expiry_date}, price=${b.selling_price}`,
        );
      });
    });
  }

  const catalog = medicines.map((medicine) => ({
    ...medicine,
    batches: medicine.batches.map((batch) => ({
      ...batch,
      selling_price: Number(batch.selling_price),
      expiry_date: batch.expiry_date.toISOString(),
    })),
  }));

  const totalMedicines = catalog.length;
  const totalBatches = catalog.reduce((sum, m) => sum + m.batches.length, 0);
  const totalStock = catalog.reduce(
    (sum, m) => sum + m.batches.reduce((s, b) => s + b.quantity, 0),
    0,
  );

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                Walk-in Pharmacy Sales
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Process counter sales for OTC medicines with real-time stock
                deduction
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <Link
              href="/pharmacy"
              className="group inline-flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:scale-95"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-100">
                <ArrowLeft
                  size={17}
                  strokeWidth={2.2}
                  className="text-black transition-transform duration-200 group-hover:-translate-x-0.5"
                />
              </span>

              <span>Pharmacy</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Card className="border-sky-200 dark:border-sky-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package size={16} className="text-sky-500" />
                Available Medicines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalMedicines}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                OTC medicines in stock
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package size={16} className="text-emerald-500" />
                Active Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalBatches}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                FIFO-enabled batches
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package size={16} className="text-amber-500" />
                Total Units in Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalStock.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available for immediate sale
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users size={16} className="text-purple-500" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cash, Card, Online
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <WalkInSaleForm catalog={catalog} />
      </main>
    </AppShell>
  );
}
