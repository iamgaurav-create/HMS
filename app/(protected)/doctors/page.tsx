import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { DoctorsTable } from "@/components/tables/doctors-table";

export const dynamic = "force-dynamic";

export default async function DoctorsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/doctors" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const canAddDoctors = ["SuperAdmin", "admin", "HR"].includes(userRole);

  const doctors = await db.doctor.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      specialization: true,
      license_number: true,
      phone: true,
      address: true,
      department: true,
      img: true,
      availability_status: true,
      status: true,
      type: true,
      created_at: true,
    },
  });

  return (
    <AppShell userRole={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Doctors & Staff
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage and view all registered doctors and staff members
            </p>
          </div>
          {canAddDoctors && (
            <Link
              href="/doctors/registration"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              Register New Doctor
            </Link>
          )}
        </div>
        <DoctorsTable doctors={doctors} />
      </div>
    </AppShell>
  );
}
