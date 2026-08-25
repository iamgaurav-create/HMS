import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { HRRegistrationForm } from "./form";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export default async function HRRegistrationPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/hr/registration" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const canManageHR = ["SuperAdmin", "admin", "HR"].includes(userRole);
  if (!canManageHR) {
    redirect("/dashboard");
  }

  return (
    <AppShell userRole={userRole}>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Register New HR
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Onboard a new HR manager and send them login credentials.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <HRRegistrationForm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
