import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Download, FlaskConical, Stethoscope, User } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { LabResultEntryForm } from "@/components/laboratory/results/result-entry-form";
import { getLaboratoryResultById } from "@/lib/db/laboratory-results";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { Permission, roleHasPermission } from "@/lib/auth/permissions";
import { resolveLabTemplate } from "@/lib/lab/lab-template";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LabResultDetailsPage({ params }: PageProps) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/results" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const { id } = await params;
  const testId = Number(id);

  if (!Number.isSafeInteger(testId) || testId <= 0) {
    notFound();
  }

  const test = await getLaboratoryResultById(testId);

  if (!test) {
    notFound();
  }

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/lab/results"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft size={15} />
              Back to results
            </Link>
            <h1 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {test.testName}
              <span className="text-base font-semibold text-slate-400">
                {test.orderNumber}
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Single laboratory test of the order {test.orderNumber}.
            </p>
          </div>

          <a
            href={`/lab/orders/${test.orderId}/report`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-indigo-500/10"
          >
            <Download size={14} />
            Report PDF
          </a>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 p-5 dark:border-slate-800">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User size={15} className="text-indigo-500" />
              Patient
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Name</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.patientName}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Patient number</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.patientNumber}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Gender</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.patientGender || "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Contact</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.patientPhone || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200/70 p-5 dark:border-slate-800">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Stethoscope size={15} className="text-indigo-500" />
              Order
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Order number</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.orderNumber}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Referring doctor</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.doctorName ? `Dr. ${test.doctorName}` : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Specialization</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.doctorSpecialization || "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-500">Specimen</dt>
                <dd className="text-right font-medium text-slate-900 dark:text-white">
                  {test.sampleType || "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <LabResultEntryForm
          test={{
            id: test.id,
            name: test.testName,
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
          }}
          template={resolveLabTemplate(test.testName, {
            template_key: test.templateKey ?? "",
            specimen: test.templateSpecimen,
            parameters: test.templateParameters,
          })}
          canEdit={roleHasPermission(userRole, Permission.MANAGE_LAB)}
          canVerify={roleHasPermission(userRole, Permission.VERIFY_LAB_RESULTS)}
        />

        <p className="flex items-center gap-2 text-xs text-slate-400">
          <FlaskConical size={13} />
          The order of this test holds every other test of the request.
        </p>
      </main>
    </AppShell>
  );
}
