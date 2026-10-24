import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FlaskConical } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { LabResultsTable } from "@/components/laboratory/results/lab-results-table";
import { getLaboratoryResultRows } from "@/lib/db/laboratory-results";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LabResultsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/results" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const rows = await getLaboratoryResultRows();

  const awaitingReview = rows.filter((row) => row.status === "Under Review").length;
  const inProgress = rows.filter(
    (row) => row.status === "In Progress" || row.status === "Sample Collected"
  ).length;
  const verified = rows.filter(
    (row) => row.status === "Verified" || row.status === "Released"
  ).length;

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <FlaskConical size={17} />
              Laboratory Management
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Laboratory Results
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Every test that needs a result, a review or a verification. Open a
              test to work on its parameters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {rows.length} tests
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              {awaitingReview} awaiting review
            </span>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {inProgress} in progress
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              {verified} verified
            </span>
          </div>
        </section>

        <LabResultsTable rows={rows} />
      </main>
    </AppShell>
  );
}
