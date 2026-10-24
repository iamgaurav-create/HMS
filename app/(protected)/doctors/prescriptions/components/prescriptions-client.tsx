"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pill,
  CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/cards/stat-card";

type Prescription = {
  id: string;
  status:
    | "PENDING"
    | "PARTIALLY_DISPENSED"
    | "DISPENSED"
    | "CANCELLED";
  created_at: Date | string;
  patient: {
    id: string;
    patientNumber: string;
    first_name: string;
    last_name: string;
  };
  doctor?: {
    id: string;
    name: string;
    specialization?: string | null;
  } | null;
  medicines: {
    id: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    medicine: {
      id: string;
      name: string;
      generic_name: string | null;
      unit: string;
    };
  }[];
};

type Props = {
  prescriptions: Prescription[];
};

export default function PrescriptionsClient({
  prescriptions,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const metrics = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter((p) => p.status === "PENDING").length;
    const dispensed = prescriptions.filter((p) => p.status === "DISPENSED").length;
    const partial = prescriptions.filter((p) => p.status === "PARTIALLY_DISPENSED").length;

    return { total, pending, dispensed, partial };
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((prescription) => {
      const patientName =
        `${prescription.patient.first_name} ${prescription.patient.last_name}`.toLowerCase();
      const patientNumber = prescription.patient.patientNumber.toLowerCase();
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        patientName.includes(searchValue) ||
        patientNumber.includes(searchValue);

      const matchesStatus =
        status === "ALL" || prescription.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, search, status]);

  function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Prescriptions"
          value={metrics.total.toLocaleString()}
          change={`${metrics.total} recorded`}
          trend="up"
          subtitle="All created prescriptions"
          icon={<FileText className="h-5 w-5" />}
          gradient="from-sky-500/20 to-indigo-500/10"
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />

        <StatCard
          title="Pending Dispensing"
          value={metrics.pending.toLocaleString()}
          change={`${metrics.pending} pending`}
          trend="up"
          subtitle="Awaiting pharmacy issue"
          icon={<Clock className="h-5 w-5" />}
          gradient="from-amber-500/20 to-yellow-500/10"
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />

        <StatCard
          title="Dispensed"
          value={metrics.dispensed.toLocaleString()}
          change={`${metrics.dispensed} completed`}
          trend="up"
          subtitle="Fulfilled by pharmacy"
          icon={<CheckCircle2 className="h-5 w-5" />}
          gradient="from-emerald-500/20 to-teal-500/10"
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />

        <StatCard
          title="Partially Dispensed"
          value={metrics.partial.toLocaleString()}
          change={`${metrics.partial} in progress`}
          trend="up"
          subtitle="Partial medicine items fulfilled"
          icon={<AlertCircle className="h-5 w-5" />}
          gradient="from-blue-500/20 to-cyan-500/10"
          iconColor="text-blue-600 bg-blue-500/10 dark:bg-blue-500/20"
        />
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
        {/* Filters Header */}
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    Prescriptions List
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {filteredPrescriptions.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search and filter patient prescription orders
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient name or MRN..."
                  className="h-10 w-full pl-9 text-xs sm:w-64 rounded-xl border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
                <option value="DISPENSED">Dispensed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredPrescriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              No prescriptions found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {search || status !== "ALL"
                ? "Try adjusting your search query or status filter."
                : "No clinical prescriptions have been recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-4 py-4">Prescribed Medicines</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date Issued</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 text-xs font-bold text-sky-700 dark:from-sky-950 dark:to-indigo-950 dark:text-sky-300">
                          {prescription.patient.first_name[0]}
                          {prescription.patient.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {prescription.patient.first_name}{" "}
                            {prescription.patient.last_name}
                          </p>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {prescription.patient.patientNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-1 max-w-md">
                        {prescription.medicines.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                          >
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
                            <span className="font-semibold">{item.medicine.name}</span>
                            <span className="text-slate-400">
                              × {item.quantity} {item.medicine.unit}
                            </span>
                            {item.dosage && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {item.dosage}
                              </span>
                            )}
                          </div>
                        ))}
                        {prescription.medicines.length > 2 && (
                          <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                            +{prescription.medicines.length - 2} more item
                            {prescription.medicines.length - 2 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={prescription.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(prescription.created_at)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/patients/${prescription.patient.id}`}
                        title="View patient records"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        <span>View Records</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Prescription["status"];
}) {
  const styles = {
    PENDING:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800",
    PARTIALLY_DISPENSED:
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800",
    DISPENSED:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
    CANCELLED:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800",
  };

  const labels = {
    PENDING: "Pending",
    PARTIALLY_DISPENSED: "Partially Dispensed",
    DISPENSED: "Dispensed",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "DISPENSED"
            ? "bg-emerald-500"
            : status === "PENDING"
              ? "bg-amber-500"
              : status === "PARTIALLY_DISPENSED"
                ? "bg-blue-500"
                : "bg-rose-500"
        }`}
      />
      {labels[status]}
    </span>
  );
}