import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ClipboardList, Download, FlaskConical, Plus } from "lucide-react";
import { getDoctorLabOrders } from "@/lib/db/doctor-lab-orders";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { LabOrderCancelButton } from "@/components/doctor/lab-order-cancel-button";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "cancelled":
      return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300";
    case "in progress":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    case "sample collected":
      return "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300";
    case "under review":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
    case "verified":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "released":
      return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300";
  }
}

export default async function DoctorLabOrdersPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole || !["Doctor", "SuperAdmin", "admin"].includes(userRole)) {
    redirect("/unauthorized?reason=missing_role");
  }

  const orders = await getDoctorLabOrders(userId);

  return (
    <AppShell userRole={userRole}>
      <div className="space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <FlaskConical size={17} />
              Doctor Workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Laboratory Orders
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Request tests and track their progress.
            </p>
          </div>

          <Link
            href="/doctors/lab-orders/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Request Lab Test
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Orders",
              value: orders.length,
              icon: ClipboardList,
            },
            {
              label: "Pending",
              value: orders.filter((o) => o.status === "Pending").length,
              icon: FlaskConical,
            },
            {
              label: "In Progress",
              value: orders.filter((o) => o.status === "In Progress").length,
              icon: FlaskConical,
            },
            {
              label: "Completed",
              value: orders.filter((o) => o.status === "Completed").length,
              icon: ClipboardList,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-card rounded-2xl border border-slate-200/70 p-5 shadow-sm dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{item.label}</p>
                <item.icon size={19} className="text-indigo-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="glass-card overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-800">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Recent laboratory orders
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tests requested together are shown as a single order.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-500/10">
                <FlaskConical size={28} />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                No laboratory orders yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Select a patient and request a laboratory test to get started.
              </p>
              <Link
                href="/doctors/lab-orders/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Create first order
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Order</th>
                    <th className="px-5 py-4 font-semibold">Patient</th>
                    <th className="px-5 py-4 font-semibold">Tests</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Document
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.testCount}{" "}
                          {order.testCount === 1 ? "test" : "tests"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {order.patientName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.patientNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <ul className="flex flex-col gap-1">
                          {order.tests.map((test) => (
                            <li
                              key={test.id}
                              className="text-slate-700 dark:text-slate-300"
                            >
                              {test.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {order.testDate.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 2,
                        }).format(order.total)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <LabOrderCancelButton
                            orderId={order.orderId}
                            orderNumber={order.orderNumber}
                            disabled={
                              order.status === "Completed" ||
                              order.status === "Cancelled"
                            }
                          />
                          <a
                            href={`/doctors/lab-orders/${order.orderId}/pdf`}
                            download
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-500/10"
                          >
                            <Download size={14} />
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
