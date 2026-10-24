"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FlaskConical,
  LoaderCircle,
  Send,
  Stethoscope,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabStatusBadge } from "@/components/laboratory/shared/lab-status-badge";
import { LabResultEntryForm } from "@/components/laboratory/results/result-entry-form";
import { updateLabOrderStatus } from "@/lib/actions/laboratory/orders.action";
import { releaseLabReport } from "@/lib/actions/laboratory/reports.action";
import {
  labStatusActionLabel,
  nextLabOrderStatuses,
  resolveOrderStage,
} from "@/lib/lab/order-status";
import { resolveLabTemplate } from "@/lib/lab/lab-template";
import type {
  LaboratoryOrder,
  LaboratoryOrderTest,
} from "@/components/laboratory/orders/lab-orders-table";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function InfoCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof User;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 p-5 dark:border-slate-800">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon size={15} className="text-indigo-500" />
        {title}
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="text-right text-sm font-medium text-slate-900 dark:text-white">
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LabOrderDetails({
  order,
  canEdit,
  canVerify,
  canRelease,
}: {
  order: LaboratoryOrder;
  canEdit: boolean;
  canVerify: boolean;
  canRelease: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const stage = resolveOrderStage(
    order.tests.map((test) => test.status)
  );
  const nextStatuses = nextLabOrderStatuses(stage);
  const primaryStatus = nextStatuses.find((status) => status !== "Cancelled");
  const cancelStatus = nextStatuses.find((status) => status === "Cancelled");

  const allVerified = order.tests
    .filter((test) => test.status !== "Cancelled")
    .every((test) => test.status === "Verified" || test.status === "Released");

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const result = await updateLabOrderStatus(order.orderId, status);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      router.refresh();
    });
  }

  function handleRelease() {
    startTransition(async () => {
      const result = await releaseLabReport(order.orderId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/lab/orders"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft size={15} />
            Back to orders
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Order {order.orderNumber}
            <LabStatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {order.testCount} {order.testCount === 1 ? "test" : "tests"} ·
            Ordered on {formatDate(order.testDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {primaryStatus ? (
            <Button
              disabled={isPending}
              onClick={() => handleStatusChange(primaryStatus)}
              className="h-9 gap-1.5"
            >
              {isPending ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : null}
              {labStatusActionLabel(primaryStatus)}
            </Button>
          ) : null}

          {cancelStatus ? (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleStatusChange(cancelStatus)}
              className="h-9 gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              Cancel order
            </Button>
          ) : null}

          {canRelease && allVerified ? (
            <Button
              disabled={isPending}
              onClick={handleRelease}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              Release report
            </Button>
          ) : null}

          <a
            href={`/lab/orders/${order.orderId}/report`}
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-500/10"
          >
            <Download size={14} />
            Report PDF
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          title="Patient"
          icon={User}
          rows={[
            ["Name", order.patientName],
            ["Patient number", order.patientNumber],
            ["Phone", order.patientPhone],
            ["Email", order.patientEmail],
          ]}
        />

        <InfoCard
          title="Requesting doctor"
          icon={Stethoscope}
          rows={[
            ["Name", order.doctorName ? `Dr. ${order.doctorName}` : "—"],
            ["Specialization", order.doctorSpecialization],
            ["Appointment", formatDate(order.appointmentDate)],
            ["Order total", formatCurrency(order.total)],
          ]}
        />
      </div>

      {order.notes ? (
        <div className="rounded-2xl border border-slate-200/70 p-5 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClipboardList size={15} className="text-indigo-500" />
            Clinical notes
          </p>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {order.notes}
          </p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical size={18} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Result entry
          </h2>
          <p className="text-sm text-slate-500">
            Every test of the order has its own parameter sheet.
          </p>
        </div>

        {order.tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
            This order does not hold any test.
          </div>
        ) : (
          order.tests.map((test) => (
            <LabResultEntryForm
              key={test.id}
              test={toEntryTest(test)}
              template={resolveLabTemplate(test.name, {
                template_key: test.templateKey ?? "",
                specimen: test.templateSpecimen,
                parameters: test.templateParameters,
              })}
              canEdit={canEdit}
              canVerify={canVerify}
            />
          ))
        )}
      </section>
    </div>
  );
}

/**
 * The shape the result entry sheet needs.
 */
function toEntryTest(test: LaboratoryOrderTest) {
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    status: test.status,
    price: test.price,
    notes: test.notes,
    resultData: test.resultData,
    resultFlag: test.resultFlag,
    sampleType: test.sampleType,
    sampleId: test.sampleId,
    sampleCollectedAt: test.sampleCollectedAt,
    sampleStatus: test.sampleStatus,
    performedBy: test.performedBy,
    performedByName: test.performedByName,
    performedAt: test.performedAt,
    submittedAt: test.submittedAt,
    verifiedByName: test.verifiedByName,
    verifiedAt: test.verifiedAt,
    releasedByName: test.releasedByName,
    releasedAt: test.releasedAt,
    amendedByName: test.amendedByName,
    amendedAt: test.amendedAt,
    amendmentReason: test.amendmentReason,
  };
}
