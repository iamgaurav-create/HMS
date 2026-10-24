"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  AlertTriangle,
  IndianRupee,
  Package,
  ArrowUpRight,
  CalendarClock,
  ShoppingBag,
  Clock,
  AlertOctagon,
} from "lucide-react";

export interface PharmacyDashboardProps {
  metrics?: {
    pendingRx?: number;
    lowStock?: number;
    outOfStock?: number;
    expiredBatches?: number;
    expiringBatches?: number;
    salesToday?: number;
    billsToday?: number;
    activeMedicines?: number;
    totalBatches?: number;
    otcMedicines?: number;
    inventoryItems?: number;
  };
  lowStockMedicines?: {
    id: string;
    name: string;
    stock: number;
    reorderLevel: number;
    isOut?: boolean;
  }[];
  pendingPrescriptions?: {
    id: string;
    patient: string;
    doctor: string;
    status: string;
    createdAt: string;
  }[];
  recentWalkInSales?: Array<{
    id: string;
    bill_number: string;
    customer_name: string | null;
    total_amount: number;
    created_at: Date;
    status: string;
  }>;
  recentPrescriptionBills?: Array<{
    id: string;
    bill_number: string;
    patient: { first_name: string; last_name: string } | null;
    total_amount: number;
    created_at: Date;
    status: string;
  }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PharmacyDashboard({
  metrics = {},
  lowStockMedicines = [],
  pendingPrescriptions = [],
  recentWalkInSales = [],
  recentPrescriptionBills = [],
}: PharmacyDashboardProps) {
  const router = useRouter();

  const pendingRxCount = metrics.pendingRx ?? 0;
  const lowStockCount = metrics.lowStock ?? 0;
  const outOfStockCount = metrics.outOfStock ?? 0;
  const expiredBatches = metrics.expiredBatches ?? 0;
  const expiringBatches = metrics.expiringBatches ?? 0;
  const salesToday = metrics.salesToday ?? 0;
  const billsToday = metrics.billsToday ?? 0;
  const inventoryItems = metrics.activeMedicines ?? metrics.inventoryItems ?? 0;
  const totalBatches = metrics.totalBatches ?? 0;
  const otcMedicines = metrics.otcMedicines ?? 0;

  const stats = [
    {
      title: "Pending Prescriptions",
      value: pendingRxCount.toLocaleString("en-IN"),
      change: "Awaiting dispensing",
      trend: "neutral" as const,
      subtitle: "Pending and partially dispensed",
      icon: <Pill className="h-5 w-5" />,
      iconColor:
        "text-rose-600 bg-rose-500/10 dark:bg-rose-500/20",
    },
    {
      title: "Low Stock Medicines",
      value: lowStockCount.toLocaleString("en-IN"),
      change: outOfStockCount > 0 ? `${outOfStockCount} out of stock` : "Reorder required",
      trend: lowStockCount > 0 ? ("down" as const) : ("neutral" as const),
      subtitle: "At or below reorder level",
      icon: <AlertTriangle className="h-5 w-5" />,
      iconColor:
        "text-amber-600 bg-amber-500/10 dark:bg-amber-500/20",
    },
    {
      title: "Sales Today",
      value: formatCurrency(salesToday),
      change: `${billsToday} ${billsToday === 1 ? "bill" : "bills"}`,
      trend: "neutral" as const,
      subtitle: "Non-cancelled bills created today",
      icon: <IndianRupee className="h-5 w-5" />,
      iconColor:
        "text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Active Medicines",
      value: inventoryItems.toLocaleString("en-IN"),
      change: `${totalBatches} active batches`,
      trend: "neutral" as const,
      subtitle: `${otcMedicines} OTC medicines`,
      icon: <Package className="h-5 w-5" />,
      iconColor:
        "text-sky-600 bg-sky-500/10 dark:bg-sky-500/20",
    },
  ];

  return (
    <div className="animate-in fade-in-50 space-y-6 pb-12 duration-300">
      <WelcomeCard
        userName="Hospital Pharmacy"
        roleName="Pharmacy Dashboard"
        subtitle={`${pendingRxCount} prescriptions awaiting dispensing. ${lowStockCount} medicines need stock review.${
          expiredBatches > 0
            ? ` ${expiredBatches} expired batch${expiredBatches === 1 ? "" : "es"}.`
            : ""
        }${expiringBatches > 0 && expiredBatches === 0 ? ` ${expiringBatches} expiring soon.` : ""}`}
        onQuickAction={() => router.push("/pharmacy/prescriptions")}
        actionText="Dispense Medicine"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Expired Batches"
          value={expiredBatches.toLocaleString("en-IN")}
          change={expiredBatches > 0 ? "Immediate action needed" : "All batches valid"}
          trend={expiredBatches > 0 ? ("down" as const) : ("neutral" as const)}
          subtitle="With usable quantity > 0"
          icon={<AlertOctagon className="h-5 w-5" />}
          iconColor="text-red-600 bg-red-500/10 dark:bg-red-500/20"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringBatches.toLocaleString("en-IN")}
          change="Next 30 days"
          trend={expiringBatches > 0 ? ("down" as const) : ("neutral" as const)}
          subtitle="Batches expiring within 30 days"
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-orange-600 bg-orange-500/10 dark:bg-orange-500/20"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount.toLocaleString("en-IN")}
          change="Completely unavailable"
          trend={outOfStockCount > 0 ? ("down" as const) : ("neutral" as const)}
          subtitle="Medicines with zero usable stock"
          icon={<Package className="h-5 w-5" />}
          iconColor="text-red-600 bg-red-500/10 dark:bg-red-500/20"
        />
        <StatCard
          title="OTC Medicines"
          value={otcMedicines.toLocaleString("en-IN")}
          change="Walk-in sales ready"
          trend="neutral"
          subtitle="Over-the-counter medicines"
          icon={<ShoppingBag className="h-5 w-5" />}
          iconColor="text-purple-600 bg-purple-500/10 dark:bg-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="glass-card glass-card-hover rounded-2xl p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">
                Low Stock & Out of Stock Medicines
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Available stock compared with reorder levels
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          </div>

          {lowStockMedicines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <Package className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">
                No low-stock medicines
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No active medicine is currently at or below its reorder level.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-3 font-semibold">Medicine</th>
                    <th className="px-3 py-3 font-semibold">Available</th>
                    <th className="px-3 py-3 font-semibold">Reorder Level</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockMedicines.map((medicine) => (
                    <tr
                      key={medicine.id}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-3 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {medicine.name}
                      </td>
                      <td className="px-3 py-4">{medicine.stock}</td>
                      <td className="px-3 py-4">{medicine.reorderLevel}</td>
                      <td className="px-3 py-4">
                        <Badge variant={medicine.isOut ? "destructive" : "warning"}>
                          {medicine.isOut ? "Out of stock" : "Low stock"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link
            href="/pharmacy/inventory"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400"
          >
            View inventory <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="glass-card glass-card-hover flex flex-col rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Pill className="h-4 w-4 text-rose-500" />
                Doctor E-Prescriptions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Prescriptions awaiting dispensing
              </p>
            </div>
            <Badge variant="secondary">{pendingRxCount}</Badge>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {pendingPrescriptions.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center dark:bg-slate-800/50">
                <CalendarClock className="mx-auto h-7 w-7 text-emerald-500" />
                <p className="mt-3 text-sm font-semibold">Queue is clear</p>
                <p className="mt-1 text-xs text-slate-500">
                  No pending prescriptions were found.
                </p>
              </div>
            ) : (
              pendingPrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="break-all font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      RX-{rx.id.slice(-8).toUpperCase()}
                    </span>
                    <Badge variant="warning">
                      {rx.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {rx.patient}
                  </p>
                  <p className="text-xs text-slate-500">
                    Doctor: {rx.doctor}
                  </p>
                  <p className="text-xs text-slate-500">
                    Created: {rx.createdAt}
                  </p>
                </div>
              ))
            )}
          </div>

          <Button
            onClick={() => router.push("/pharmacy/prescriptions")}
            className="mt-5 w-full rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
          >
            Dispense Medicine
          </Button>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="glass-card glass-card-hover rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                Recent Walk-in Sales
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest non-cancelled walk-in bills
              </p>
            </div>
            <Link
              href="/pharmacy/walk-in-sales"
              className="text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {recentWalkInSales.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <ShoppingBag className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">
                No walk-in sales recorded recently.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWalkInSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {sale.bill_number}
                      </span>
                      <Badge variant={sale.status === "PAID" ? "success" : "warning"} className="shrink-0">
                        {sale.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {sale.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(sale.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card glass-card-hover rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                <Pill className="h-5 w-5 text-rose-500" />
                Recent Prescription Bills
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest non-cancelled prescription bills
              </p>
            </div>
            <Link
              href="/pharmacy/billing"
              className="text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {recentPrescriptionBills.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
              <Pill className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">
                No prescription bills recorded recently.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPrescriptionBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {bill.bill_number}
                      </span>
                      <Badge variant={bill.status === "PAID" ? "success" : "warning"} className="shrink-0">
                        {bill.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {bill.patient
                        ? `${bill.patient.first_name} ${bill.patient.last_name}`
                        : "Patient"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(bill.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(bill.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
