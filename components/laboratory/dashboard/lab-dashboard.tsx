import { StatCard } from "@/components/cards/stat-card";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FlaskConical,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

import { LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";

type LabDashboardProps = {
  metrics: {
    totalOrders: number;
    totalTests: number;
    totalPending: number;
    pendingTests: number;
    inProgressTests: number;
    awaitingReviewTests: number;
    awaitingReviewOrders: number;
    verifiedTests: number;
    releasedTests: number;
    samplesCollected: number;
    completedToday: number;
    urgentTests: number;
  };
  recentOrders: {
    orderId: string;
    orderNumber: string;
    testNames: string;
    testCount: number;
    patientName: string;
    patientNumber: string;
    status: string;
    testDate: string;
  }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function LabDashboard({ metrics, recentOrders }: LabDashboardProps) {
  const stats = [
    {
      title: "Pending Tests",
      value: metrics.pendingTests,
      subtitle: "Tests without a result",
      icon: <Clock3 size={22} />,
      iconColor: "text-amber-600 bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      title: "In Progress",
      value: metrics.inProgressTests,
      subtitle: "Tests with a result in progress",
      icon: <FlaskConical size={22} />,
      iconColor: "text-violet-600 bg-violet-500/10 dark:bg-violet-500/20",
    },
    {
      title: "Awaiting Review",
      value: metrics.awaitingReviewTests,
      subtitle: "Tests that wait for a verification",
      icon: <ShieldCheck size={22} />,
      iconColor: "text-sky-600 bg-sky-500/10 dark:bg-sky-500/20",
    },
    {
      title: "Orders",
      value: metrics.totalOrders,
      subtitle: `${metrics.totalTests} tests in total`,
      icon: <ClipboardList size={22} />,
      iconColor: "text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20",
    },
  ];

  const secondaryStats = [
    {
      title: "Verified",
      value: metrics.verifiedTests,
      icon: <FileCheck2 size={18} />,
      iconColor: "text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Released",
      value: metrics.releasedTests,
      icon: <CheckCircle2 size={18} />,
      iconColor: "text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20",
    },
    {
      title: "Samples Collected",
      value: metrics.samplesCollected,
      icon: <PackageCheck size={18} />,
      iconColor: "text-sky-600 bg-sky-500/10 dark:bg-sky-500/20",
    },
    {
      title: "Completed Today",
      value: metrics.completedToday,
      icon: <CheckCircle2 size={18} />,
      iconColor: "text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Urgent",
      value: metrics.urgentTests,
      icon: <AlertTriangle size={18} />,
      iconColor: "text-red-600 bg-red-500/10 dark:bg-red-500/20",
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
            <FlaskConical size={17} />
            Laboratory Management
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Laboratory Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Monitor laboratory orders, samples, and test completion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/lab/results"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-500/10"
          >
            Result Queue
          </Link>
          <Link
            href="/lab/orders"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            View Lab Orders
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {secondaryStats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {stat.title}
              </p>
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${stat.iconColor}`}
              >
                {stat.icon}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl glass-card glass-card-hover">
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recent Laboratory Orders
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest orders from the database
            </p>
          </div>
          <Link
            href="/lab/orders"
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View all
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-500">
              <FlaskConical size={24} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
              No laboratory orders found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Laboratory orders will appear here when a doctor requests tests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Order</th>
                  <th className="px-5 py-4 font-semibold">Tests</th>
                  <th className="px-5 py-4 font-semibold">Patient</th>
                  <th className="px-5 py-4 font-semibold">Patient ID</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.map((order) => (
                  <tr
                    key={order.orderId}
                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                      <Link
                        href={`/lab/orders/${order.orderId}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {order.testCount}{" "}
                        {order.testCount === 1 ? "test" : "tests"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {order.testNames}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {order.patientName}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {order.patientNumber}
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                      {formatDate(order.testDate)}
                    </td>
                    <td className="px-5 py-4">
                      <LabStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
