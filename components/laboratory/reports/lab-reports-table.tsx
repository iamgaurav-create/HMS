"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  Download,
  FileText,
  Filter,
  FilterX,
  LoaderCircle,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabSearch } from "@/components/laboratory/shared/lab-search";
import { LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import { releaseLabReport } from "@/lib/actions/laboratory/reports.action";
import type { LaboratoryReportSummary } from "@/lib/db/laboratory-reports";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const STATUS_OPTIONS = [
  "Pending",
  "Sample Collected",
  "In Progress",
  "Under Review",
  "Verified",
  "Released",
  "Completed",
  "Cancelled",
];

/**
 * The laboratory reports. One report covers the complete order, so the list
 * shows one row per order.
 */
export function LabReportsTable({
  reports,
  canRelease,
}: {
  reports: LaboratoryReportSummary[];
  canRelease: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        report.orderNumber.toLowerCase().includes(query) ||
        report.patientName.toLowerCase().includes(query) ||
        report.patientNumber.toLowerCase().includes(query) ||
        (report.doctorName ?? "").toLowerCase().includes(query)
      );
    });
  }, [reports, search, statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  function handleRelease(orderId: string) {
    startTransition(async () => {
      const result = await releaseLabReport(orderId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-card glass-card-hover p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabSearch
            value={search}
            onChange={setSearch}
            placeholder="Search report, patient or doctor"
            label="Search reports"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {hasFilters ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Filter size={15} />
            <span>
              {filtered.length} of {reports.length} reports
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="h-7 gap-1 px-2 text-xs"
            >
              <FilterX size={13} />
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-2xl glass-card">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
            <tr>
              <th className="px-5 py-4 font-semibold">Report</th>
              <th className="px-5 py-4 font-semibold">Patient</th>
              <th className="px-5 py-4 font-semibold">Referring doctor</th>
              <th className="px-5 py-4 font-semibold">Tests</th>
              <th className="px-5 py-4 font-semibold">Verified by</th>
              <th className="px-5 py-4 font-semibold">Released by</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-500/10">
                    <FileText size={26} />
                  </div>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">
                    No laboratory reports found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasFilters
                      ? "Try clearing the filters to see every report."
                      : "A report is created for every laboratory order."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((report) => (
                <tr
                  key={report.orderId}
                  className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {report.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(report.testDate)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {report.patientName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {report.patientNumber}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {report.doctorName ? `Dr. ${report.doctorName}` : "—"}
                  </td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {report.testCount}
                  </td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {report.verifiedByName ?? "Not verified"}
                  </td>

                  <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                    {report.releasedByName ?? "Not released"}
                    {report.releasedAt ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(report.releasedAt)}
                      </p>
                    ) : null}
                  </td>

                  <td className="px-5 py-4">
                    <LabStatusBadge status={report.status} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {canRelease && report.status === "Verified" ? (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleRelease(report.orderId)}
                          className="h-8 gap-1.5 bg-emerald-600 text-xs hover:bg-emerald-700"
                        >
                          {isPending ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          Release
                        </Button>
                      ) : null}

                      <a
                        href={`/lab/orders/${report.orderId}/report`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-500/10"
                      >
                        <Download size={13} />
                        PDF
                      </a>

                      <Link
                        href={`/lab/orders/${report.orderId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        Open
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
