"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardCheck,
  Clock3,
  FlaskConical,
  LoaderCircle,
  PencilLine,
  Save,
  Send,
  ShieldCheck,
  TestTube2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LabFlagBadge, LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import {
  amendLabTestResult,
  saveLabTestResult,
  submitLabTestForReview,
  verifyLabTestResult,
  type LabResultActionState,
} from "@/lib/actions/laboratory/lab-results.actions";
import { LAB_RESULT_FLAGS } from "@/lib/lab/lab-test-templates";
import { parseResultData } from "@/lib/lab/lab-validation";
import type { LabTestTemplate } from "@/components/laboratory/shared/lab-types";
import { cn } from "@/lib/utils";

const INITIAL_STATE: LabResultActionState = {
  success: false,
  message: "",
};

export type LabResultEntryTest = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  price: number;
  notes: string | null;
  resultData: unknown;
  resultFlag: string | null;
  sampleType: string | null;
  sampleId: string | null;
  sampleCollectedAt: string | null;
  sampleStatus: string | null;
  performedBy: string | null;
  performedByName: string | null;
  performedAt: string | null;
  submittedAt: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  releasedByName: string | null;
  releasedAt: string | null;
  amendedByName: string | null;
  amendedAt: string | null;
  amendmentReason: string | null;
};

export type LabResultEntryFormProps = {
  test: LabResultEntryTest;
  template: LabTestTemplate;
  canEdit: boolean;
  canVerify: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function MetaItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof TestTube2;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={12} className="text-indigo-500" />
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-200">
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * The result entry sheet of a single test.
 *
 * Every test of an order has its own sheet with the parameters of that test,
 * the specimen information, the professional that performed the test and the
 * professional that verified it. The values the technician typed stay in the
 * form when the server refuses the result.
 */
export function LabResultEntryForm({
  test,
  template,
  canEdit,
  canVerify,
}: LabResultEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [amending, setAmending] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [overrides, setOverrides] = useState<
    Record<string, { value?: string; flag?: string }>
  >({});
  const [sampleOverrides, setSampleOverrides] = useState<{
    sampleType?: string;
    sampleId?: string;
    sampleCollectedAt?: string;
    sampleStatus?: string;
    notes?: string;
  }>({});

  /**
   * The rows of the result sheet. The result sheet of the laboratory decides
   * the unit and the reference range, the stored result holds the values.
   */
  const rows = useMemo(() => {
    const stored = parseResultData(test.resultData);
    const storedMap = new Map(stored.map((parameter) => [parameter.name, parameter]));

    return template.parameters.map((parameter) => {
      const existing = storedMap.get(parameter.name);

      return {
        name: parameter.name,
        unit: parameter.unit,
        referenceRange: parameter.referenceRange || existing?.referenceRange || "",
        value: existing?.value ?? "",
        flag: existing?.flag ?? "Normal",
      };
    });
  }, [template, test.resultData]);

  const isVerified = test.status === "Verified" || test.status === "Released";
  const isCancelled = test.status === "Cancelled";
  const isEditable = canEdit && !isCancelled && (amending || !isVerified);
  const isUnderReview = test.status === "Under Review";

  const sampleType = sampleOverrides.sampleType ?? test.sampleType ?? template.specimen;
  const sampleId = sampleOverrides.sampleId ?? test.sampleId ?? "";
  const sampleCollectedAt =
    sampleOverrides.sampleCollectedAt ?? toDateTimeLocal(test.sampleCollectedAt);
  const sampleStatus = sampleOverrides.sampleStatus ?? test.sampleStatus ?? "Collected";
  const notes = sampleOverrides.notes ?? test.notes ?? "";

  function setRowValue(name: string, value: string) {
    setOverrides((current) => ({
      ...current,
      [name]: { ...current[name], value },
    }));
  }

  function setRowFlag(name: string, flag: string) {
    setOverrides((current) => ({
      ...current,
      [name]: { ...current[name], flag },
    }));
  }

  function buildFormData() {
    const formData = new FormData();

    formData.set("testId", String(test.id));
    formData.set("sampleType", sampleType);
    formData.set("sampleId", sampleId);
    formData.set("sampleCollectedAt", sampleCollectedAt);
    formData.set("sampleStatus", sampleStatus);
    formData.set("notes", notes);
    formData.set(
      "parameters",
      JSON.stringify(
        rows.map((row) => ({
          name: row.name,
          value: overrides[row.name]?.value ?? row.value,
          unit: row.unit,
          referenceRange: row.referenceRange,
          flag: overrides[row.name]?.flag ?? row.flag,
        }))
      )
    );

    return formData;
  }

  function handleSave(mode: "draft" | "submit" | "amend") {
    startTransition(async () => {
      setFeedback(null);

      if (mode === "amend") {
        const formData = buildFormData();
        formData.set("amendmentReason", amendmentReason);

        const result = await amendLabTestResult(INITIAL_STATE, formData);

        if (!result.success) {
          setFeedback({ tone: "error", message: result.message });
          return;
        }

        setAmending(false);
        setAmendmentReason("");
        setFeedback({ tone: "success", message: result.message });
        router.refresh();
        return;
      }

      const result = await saveLabTestResult(INITIAL_STATE, buildFormData());

      if (!result.success) {
        setFeedback({ tone: "error", message: result.message });
        return;
      }

      setFeedback({ tone: "success", message: result.message });

      if (mode === "submit") {
        const submitted = await submitLabTestForReview(test.id);

        if (!submitted.success) {
          setFeedback({ tone: "error", message: submitted.message });
          return;
        }

        setFeedback({ tone: "success", message: submitted.message });
      }

      router.refresh();
    });
  }

  function handleVerify() {
    startTransition(async () => {
      setFeedback(null);

      const result = await verifyLabTestResult(test.id);

      if (!result.success) {
        setFeedback({ tone: "error", message: result.message });
        return;
      }

      setFeedback({ tone: "success", message: result.message });
      router.refresh();
    });
  }

  const inputClass =
    "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800/60";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="flex flex-col gap-3 border-b border-slate-200/80 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <FlaskConical size={17} />
          </span>

          <div>
            <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
              {test.name}
              <LabStatusBadge status={test.status} />
              {test.resultFlag ? (
                <LabFlagBadge flag={test.resultFlag} />
              ) : null}
            </h3>

            {test.description ? (
              <p className="mt-1 max-w-2xl text-xs text-slate-500">
                {test.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/lab/results/${test.id}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Open test
          </Link>
        </div>
      </header>

      <div className="space-y-5 p-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetaItem
            label="Performed by"
            value={test.performedByName ?? "Not recorded"}
            icon={TestTube2}
          />
          <MetaItem
            label="Verified by"
            value={test.verifiedByName ?? "Not verified"}
            icon={ShieldCheck}
          />
          <MetaItem
            label="Verified on"
            value={test.verifiedAt ? formatDateTime(test.verifiedAt) : "—"}
            icon={Clock3}
          />
          <MetaItem
            label="Released by"
            value={test.releasedByName ?? "Not released"}
            icon={ClipboardCheck}
          />
        </section>

        {test.amendmentReason ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              <span className="font-semibold">Amended</span> on{" "}
              {formatDateTime(test.amendedAt)}
              {test.amendedByName ? ` by ${test.amendedByName}` : ""}:{" "}
              {test.amendmentReason}
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label
              htmlFor={`sample-type-${test.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Specimen type
            </label>
            <Input
              id={`sample-type-${test.id}`}
              className={cn(inputClass, "mt-1.5")}
              value={sampleType}
              disabled={!isEditable}
              onChange={(event) =>
                setSampleOverrides((current) => ({
                  ...current,
                  sampleType: event.target.value,
                }))
              }
              placeholder="e.g. Serum"
            />
          </div>

          <div className="lg:col-span-1">
            <label
              htmlFor={`sample-id-${test.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Sample / accession ID
            </label>
            <Input
              id={`sample-id-${test.id}`}
              className={cn(inputClass, "mt-1.5")}
              value={sampleId}
              disabled={!isEditable}
              onChange={(event) =>
                setSampleOverrides((current) => ({
                  ...current,
                  sampleId: event.target.value,
                }))
              }
              placeholder="e.g. ACC-2024-0001"
            />
          </div>

          <div className="lg:col-span-1">
            <label
              htmlFor={`sample-collected-${test.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Collection date &amp; time
            </label>
            <Input
              id={`sample-collected-${test.id}`}
              type="datetime-local"
              className={cn(inputClass, "mt-1.5")}
              value={sampleCollectedAt}
              disabled={!isEditable}
              onChange={(event) =>
                setSampleOverrides((current) => ({
                  ...current,
                  sampleCollectedAt: event.target.value,
                }))
              }
            />
          </div>

          <div className="lg:col-span-1">
            <label
              htmlFor={`sample-status-${test.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Sample status
            </label>
            <select
              id={`sample-status-${test.id}`}
              className={cn(inputClass, "mt-1.5")}
              value={sampleStatus}
              disabled={!isEditable}
              onChange={(event) =>
                setSampleOverrides((current) => ({
                  ...current,
                  sampleStatus: event.target.value,
                }))
              }
            >
              <option value="Awaiting Collection">Awaiting Collection</option>
              <option value="Collected">Collected</option>
              <option value="Received">Received</option>
              <option value="Rejected">Rejected</option>
              <option value="Processed">Processed</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Result parameters
            </h4>
            <p className="text-xs text-slate-500">
              Reference ranges follow the laboratory configuration
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Parameter</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Reference range</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Flag</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.name} className="align-middle">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.unit || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.referenceRange || "Not configured"}
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`value-${test.id}-${row.name}`}>
                        Result of {row.name}
                      </label>
                      <Input
                        id={`value-${test.id}-${row.name}`}
                        className={cn(inputClass, "h-9 max-w-[180px]")}
                        value={overrides[row.name]?.value ?? row.value}
                        disabled={!isEditable}
                        onChange={(event) => setRowValue(row.name, event.target.value)}
                        placeholder="Enter value"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <label className="sr-only" htmlFor={`flag-${test.id}-${row.name}`}>
                        Flag of {row.name}
                      </label>
                      <select
                        id={`flag-${test.id}-${row.name}`}
                        className={cn(inputClass, "h-9 w-[130px]")}
                        value={overrides[row.name]?.flag ?? row.flag}
                        disabled={!isEditable}
                        onChange={(event) => setRowFlag(row.name, event.target.value)}
                      >
                        {LAB_RESULT_FLAGS.map((flag) => (
                          <option key={flag} value={flag}>
                            {flag}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <label
            htmlFor={`notes-${test.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Technical notes
          </label>
          <Textarea
            id={`notes-${test.id}`}
            rows={3}
            className="mt-1.5"
            value={notes}
            disabled={!isEditable}
            onChange={(event) =>
              setSampleOverrides((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
            placeholder="Comments of the laboratory, method used, remarks of the technician..."
          />
        </section>

        {amending ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <label
              htmlFor={`amendment-${test.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"
            >
              Reason of the amendment
            </label>
            <Textarea
              id={`amendment-${test.id}`}
              rows={2}
              className="mt-1.5"
              value={amendmentReason}
              onChange={(event) => setAmendmentReason(event.target.value)}
              placeholder="Explain why the verified result is corrected. The reason is stored in the audit log."
            />
          </section>
        ) : null}

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          {canEdit && !isVerified && !isCancelled ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleSave("draft")}
                className="h-9 gap-1.5"
              >
                {isPending ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save draft
              </Button>

              <Button
                type="button"
                disabled={isPending}
                onClick={() => handleSave("submit")}
                className="h-9 gap-1.5"
              >
                {isPending ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Save &amp; submit for review
              </Button>
            </>
          ) : null}

          {canEdit && isVerified && !amending ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setAmending(true)}
              className="h-9 gap-1.5"
            >
              <PencilLine size={15} />
              Amend result
            </Button>
          ) : null}

          {canEdit && amending ? (
            <>
              <Button
                type="button"
                disabled={isPending || amendmentReason.trim().length < 10}
                onClick={() => handleSave("amend")}
                className="h-9 gap-1.5"
              >
                {isPending ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <PencilLine size={15} />
                )}
                Save amendment
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setAmending(false);
                  setAmendmentReason("");
                }}
                className="h-9"
              >
                Cancel
              </Button>
            </>
          ) : null}

          {canVerify && isUnderReview ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleVerify}
              className="h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            >
              {isPending ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <ShieldCheck size={15} />
              )}
              Verify result
            </Button>
          ) : null}

          {!canEdit ? (
            <p className="text-xs text-slate-500">
              You do not have permission to change laboratory results.
            </p>
          ) : null}

          {isVerified && !amending ? (
            <p className="text-xs text-slate-500">
              A verified result can only be changed through the audited
              amendment workflow.
            </p>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
