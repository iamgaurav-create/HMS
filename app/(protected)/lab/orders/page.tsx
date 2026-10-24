
import { redirect } from "next/navigation";
import { Activity, CheckCircle2, Clock3, FlaskConical, ListChecks, ShieldCheck } from "lucide-react";
import { LabOrdersTable } from "@/components/laboratory/orders/lab-orders-table";
import { getLaboratoryOrders } from "@/lib/db/laboratory-orders";
import { resolveOrderStage } from "@/lib/lab/order-status";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export default async function LaboratoryOrdersPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/orders" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

    const orders = await getLaboratoryOrders();

    const stageOf = (order: (typeof orders)[number]) =>
        resolveOrderStage(order.tests.map((test) => test.status));

    const pendingCount = orders.filter(
        (order) => stageOf(order) === "Pending"
    ).length;

    const collectedCount = orders.filter(
        (order) => stageOf(order) === "Sample Collected"
    ).length;

    const inProgressCount = orders.filter(
        (order) => stageOf(order) === "In Progress"
    ).length;

    const awaitingReviewCount = orders.filter(
        (order) => stageOf(order) === "Under Review"
    ).length;

    const releasedCount = orders.filter(
        (order) => stageOf(order) === "Released"
    ).length;

    const stats = [
        {
            label: "Total Orders",
            value: orders.length,
            icon: ListChecks,
            color: "text-indigo-500",
            background: "bg-indigo-500/10",
        },
        {
            label: "Pending Orders",
            value: pendingCount,
            icon: Clock3,
            color: "text-amber-500",
            background: "bg-amber-500/10",
        },
        {
            label: "Samples Collected",
            value: collectedCount,
            icon: FlaskConical,
            color: "text-sky-500",
            background: "bg-sky-500/10",
        },
        {
            label: "In Progress",
            value: inProgressCount,
            icon: Activity,
            color: "text-blue-500",
            background: "bg-blue-500/10",
        },
        {
            label: "Awaiting Review",
            value: awaitingReviewCount,
            icon: ShieldCheck,
            color: "text-violet-500",
            background: "bg-violet-500/10",
        },
        {
            label: "Released Reports",
            value: releasedCount,
            icon: CheckCircle2,
            color: "text-emerald-500",
            background: "bg-emerald-500/10",
        },
    ];

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-4 p-4 sm:p-6 lg:p-8">
        <section>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                Laboratory Orders
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Track test requests, patient details, and laboratory order status.
              </p>
            </div>

            <div className="text-xs text-slate-400">
              Live database records
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl glass-card glass-card-hover p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                      {stat.value.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${stat.background} ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <LabOrdersTable orders={orders} />
      </main>
    </AppShell>
  );
}




