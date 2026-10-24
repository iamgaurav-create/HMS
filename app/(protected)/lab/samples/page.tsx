import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { FlaskConical } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { LabSamplesTable } from "@/components/laboratory/samples/lab-samples-table";
import { getLaboratorySampleRows } from "@/lib/db/laboratory-results";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LabSamplesPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/samples" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const rows = await getLaboratorySampleRows();

  const awaitingCollection = rows.filter(
    (row) => !row.sampleCollectedAt
  ).length;
  const collected = rows.filter(
    (row) => row.sampleCollectedAt && row.sampleStatus !== "Rejected"
  ).length;
  const rejected = rows.filter((row) => row.sampleStatus === "Rejected").length;

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
              Sample Tracking
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Every specimen that belongs to a laboratory test, with its
              accession number, its collection time and its current state.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {rows.length} samples
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
              {awaitingCollection} awaiting collection
            </span>
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
              {collected} collected
            </span>
            <span className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {rejected} rejected
            </span>
          </div>
        </section>

        <LabSamplesTable rows={rows} />
      </main>
    </AppShell>
  );
}
