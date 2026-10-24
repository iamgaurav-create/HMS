"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Filter, FilterX, FlaskConical, ShieldCheck, TestTube2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabSearch } from "@/components/laboratory/shared/lab-search";
import { LabFlagBadge, LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import type { LaboratoryResultRow } from "@/lib/db/laboratory-results";

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
 * The list of the tests that need a result, a review or a verification.
 */
export function LabResultsTable({ rows }: { rows: LaboratoryResultRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        row.orderNumber.toLowerCase().includes(query) ||
        row.testName.toLowerCase().includes(query) ||
        row.patientName.toLowerCase().includes(query) ||
        row.patientNumber.toLowerCase().includes(query) ||
        (row.doctorName ?? "").toLowerCase().includes(query) ||
        (row.sampleId ?? "").toLowerCase().includes(query) ||
        (row.performedByName ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, search, statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-card glass-card-hover p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabSearch
            value={search}
            onChange={setSearch}
            placeholder="Search order, patient, test or sample"
            label="Search results"
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
              {filtered.length} of {rows.length} tests
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
              <th className="px-5 py-4 font-semibold">Order</th>
              <th className="px-5 py-4 font-semibold">Test</th>
              <th className="px-5 py-4 font-semibold">Patient</th>
              <th className="px-5 py-4 font-semibold">Sample</th>
              <th className="px-5 py-4 font-semibold">Performed by</th>
              <th className="px-5 py-4 font-semibold">Verified by</th>
              <th className="px-5 py-4 font-semibold">Flag</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-16 text-center">
                  <div className="mx-auto w-fit rounded-2xl bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-500/10">
                    <FlaskConical size={26} />
                  </div>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">
                    No laboratory results found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasFilters
                      ? "Try clearing the filters to see every test."
                      : "Results appear here as soon as a doctor requests a test."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="align-top transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/lab/orders/${row.orderId}`}
                      className="font-medium text-slate-900 hover:text-indigo-600 dark:text-white"
                    >
                      {row.orderNumber}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(row.testDate)}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <TestTube2 size={14} className="text-indigo-500" />
                      {row.testName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.doctorName ? `Dr. ${row.doctorName}` : "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {row.patientName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.patientNumber}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-slate-700 dark:text-slate-300">
                      {row.sampleId || "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.sampleType || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-slate-700 dark:text-slate-300">
                      {row.performedByName || "Not recorded"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.performedAt ? formatDateTime(row.performedAt) : "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <ShieldCheck size={13} className="text-slate-400" />
                      {row.verifiedByName || "Not verified"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.verifiedAt ? formatDateTime(row.verifiedAt) : "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <LabFlagBadge flag={row.resultFlag} />
                  </td>

                  <td className="px-5 py-4">
                    <LabStatusBadge status={row.status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/lab/results/${row.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Open
                      <ChevronRight size={14} />
                    </Link>
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
