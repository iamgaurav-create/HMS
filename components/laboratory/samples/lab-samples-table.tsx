"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  Filter,
  FilterX,
  FlaskConical,
  LoaderCircle,
  PencilLine,
  TestTube2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LabSearch } from "@/components/laboratory/shared/lab-search";
import { LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import {
  updateLabSample,
  type LabSampleActionState,
} from "@/lib/actions/laboratory/samples.action";
import type { LaboratorySampleRow } from "@/lib/db/laboratory-results";

const INITIAL_STATE: LabSampleActionState = { success: false, message: "" };

const SAMPLE_STATUSES = [
  "Awaiting Collection",
  "Collected",
  "Received",
  "Rejected",
  "Processed",
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (input: number) => String(input).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The sample tracking of the laboratory. Every sample of every test can be
 * followed and the collection details can be corrected.
 */
export function LabSamplesTable({ rows }: { rows: LaboratorySampleRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (
        statusFilter !== "all" &&
        (row.sampleStatus ?? "Awaiting Collection") !== statusFilter
      ) {
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
        (row.sampleId ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, search, statusFilter]);

  const hasFilters = search.trim().length > 0 || statusFilter !== "all";

  function handleUpdate(row: LaboratorySampleRow, formData: FormData) {
    startTransition(async () => {
      const result = await updateLabSample(INITIAL_STATE, formData);

      if (result.success) {
        toast.success(result.message);
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl glass-card glass-card-hover p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabSearch
            value={search}
            onChange={setSearch}
            placeholder="Search sample, order, patient or test"
            label="Search samples"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by sample status"
          >
            <option value="all">All sample statuses</option>
            {SAMPLE_STATUSES.map((status) => (
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
              {filtered.length} of {rows.length} samples
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
              <th className="px-5 py-4 font-semibold">Sample / accession</th>
              <th className="px-5 py-4 font-semibold">Specimen</th>
              <th className="px-5 py-4 font-semibold">Collected on</th>
              <th className="px-5 py-4 font-semibold">Sample status</th>
              <th className="px-5 py-4 font-semibold">Test status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
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
                    No samples found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {hasFilters
                      ? "Try clearing the filters to see every sample."
                      : "Samples appear here as soon as a specimen is linked to a test."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((row) =>
                editingId === row.id ? (
                  <tr key={row.id} className="bg-indigo-50/40 dark:bg-indigo-500/5">
                    <td colSpan={9} className="px-5 py-4">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleUpdate(row, new FormData(event.currentTarget));
                        }}
                        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                      >
                        <input type="hidden" name="testId" value={row.id} />

                        <div>
                          <label
                            htmlFor={`sample-type-${row.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Specimen type
                          </label>
                          <Input
                            id={`sample-type-${row.id}`}
                            name="sampleType"
                            defaultValue={row.sampleType ?? ""}
                            className="mt-1.5 h-9"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`sample-id-${row.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Sample / accession ID
                          </label>
                          <Input
                            id={`sample-id-${row.id}`}
                            name="sampleId"
                            defaultValue={row.sampleId ?? ""}
                            className="mt-1.5 h-9"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`sample-collected-${row.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Collection date &amp; time
                          </label>
                          <Input
                            id={`sample-collected-${row.id}`}
                            name="sampleCollectedAt"
                            type="datetime-local"
                            defaultValue={toDateTimeLocal(row.sampleCollectedAt)}
                            className="mt-1.5 h-9"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`sample-status-${row.id}`}
                            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                          >
                            Sample status
                          </label>
                          <select
                            id={`sample-status-${row.id}`}
                            name="sampleStatus"
                            defaultValue={row.sampleStatus ?? "Collected"}
                            className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                          >
                            {SAMPLE_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-4">
                          <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 gap-1.5"
                          >
                            {isPending ? (
                              <LoaderCircle size={15} className="animate-spin" />
                            ) : null}
                            Save sample
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => setEditingId(null)}
                            className="h-9 gap-1.5"
                          >
                            <X size={15} />
                            Cancel
                          </Button>
                          <p className="text-xs text-slate-500">
                            The collection time is only changed when a new one is
                            entered.
                          </p>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
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

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {row.sampleId || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {row.sampleType || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.sampleCollectedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <LabStatusBadge
                        status={row.sampleStatus ?? "Awaiting Collection"}
                      />
                    </td>

                    <td className="px-5 py-4">
                      <LabStatusBadge status={row.testStatus} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => setEditingId(row.id)}
                          className="h-8 gap-1 px-2 text-xs"
                        >
                          <PencilLine size={13} />
                          Update
                        </Button>
                        <Link
                          href={`/lab/results/${row.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                          Open
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
