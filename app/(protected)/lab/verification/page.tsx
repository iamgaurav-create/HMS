import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { LabVerificationList } from "@/components/laboratory/results/lab-verification-list";
import { getLaboratoryResultRows } from "@/lib/db/laboratory-results";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { Permission, roleHasPermission } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export default async function LabVerificationPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/verification" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const rows = await getLaboratoryResultRows();
  const awaitingReview = rows.filter((row) => row.status === "Under Review");

  return (
    <AppShell userRole={userRole}>
      <main className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={17} />
              Laboratory Management
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Result Verification
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Results that were entered by a laboratory professional and wait for
              an independent review. A result can never be verified by the
              professional that performed it.
            </p>
          </div>

          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            {awaitingReview.length} awaiting verification
          </span>
        </section>

        <LabVerificationList
          rows={awaitingReview}
          canVerify={roleHasPermission(userRole, Permission.VERIFY_LAB_RESULTS)}
        />
      </main>
    </AppShell>
  );
}
