import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FileText } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { LabReportsTable } from "@/components/laboratory/reports/lab-reports-table";
import { getLaboratoryReportSummaries } from "@/lib/db/laboratory-reports";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { Permission, roleHasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function LabReportsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/reports" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const reports = await getLaboratoryReportSummaries();

  const released = reports.filter((report) => report.status === "Released").length;
  const awaitingVerification = reports.filter(
    (report) => report.status === "Under Review"
  ).length;
  const provisional = reports.filter(
    (report) => report.status !== "Released" && report.status !== "Completed"
  ).length;

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <FileText size={17} />
              Laboratory Management
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Laboratory Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              One report covers the complete order. Open the PDF to print the
              patient report with every test, the sample and the professionals
              that worked on it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {reports.length} reports
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              {awaitingVerification} awaiting verification
            </span>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {provisional} provisional
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              {released} released
            </span>
          </div>
        </section>

        <LabReportsTable
          reports={reports}
          canRelease={roleHasPermission(userRole, Permission.RELEASE_LAB_REPORTS)}
        />
      </main>
    </AppShell>
  );
}
