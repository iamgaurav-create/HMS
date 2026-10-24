"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabFlagBadge, LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import { verifyLabTestResult } from "@/lib/actions/laboratory/lab-results.actions";
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

/**
 * The queue of the results that wait for an independent review. The
 * professional that performed a test can never verify it themselves.
 */
export function LabVerificationList({
  rows,
  canVerify,
}: {
  rows: LaboratoryResultRow[];
  canVerify: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  function handleVerify(testId: number) {
    setBusyId(testId);

    startTransition(async () => {
      const result = await verifyLabTestResult(testId);

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }

      setBusyId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl glass-card glass-card-hover p-12 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
          <ShieldCheck size={24} />
        </div>
        <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">
          Nothing waits for a review
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Results that were submitted by the laboratory appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl glass-card">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
          <tr>
            <th className="px-5 py-4 font-semibold">Order</th>
            <th className="px-5 py-4 font-semibold">Test</th>
            <th className="px-5 py-4 font-semibold">Patient</th>
            <th className="px-5 py-4 font-semibold">Performed by</th>
            <th className="px-5 py-4 font-semibold">Submitted</th>
            <th className="px-5 py-4 font-semibold">Flag</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row) => (
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

              <td className="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
                {row.testName}
              </td>

              <td className="px-5 py-4">
                <p className="text-slate-700 dark:text-slate-300">
                  {row.patientName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.patientNumber}
                </p>
              </td>

              <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                {row.performedByName || "Not recorded"}
              </td>

              <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                {formatDateTime(row.submittedAt)}
              </td>

              <td className="px-5 py-4">
                <LabFlagBadge flag={row.resultFlag} />
              </td>

              <td className="px-5 py-4">
                <LabStatusBadge status={row.status} />
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  {canVerify ? (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleVerify(row.id)}
                      className="h-8 gap-1.5 border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    >
                      {busyId === row.id ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={13} />
                      )}
                      Verify
                    </Button>
                  ) : null}

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
          ))}
        </tbody>
      </table>
    </div>
  );
}
