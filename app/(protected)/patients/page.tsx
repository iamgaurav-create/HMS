import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { PatientsTable } from "@/components/tables/patients-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const {
    userId,
    sessionClaims,
    redirectToSignIn,
  } = await auth();

  if (!userId) {
    redirectToSignIn({
      returnBackUrl: "/patients",
    });
  }

  const userRole =
    getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const params = await searchParams;

  const page = Math.max(
    1,
    Number(params.page) || 1,
  );

  const pageSize = 10;

  const skip = (page - 1) * pageSize;

  const [patients, totalPatients] =
    await Promise.all([
      db.patient.findMany({
        skip,
        take: pageSize,
        orderBy: {
          created_at: "desc",
        },
        select: {
          id: true,
          patientNumber: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          gender: true,
          phone: true,
          email: true,
          blood_group: true,
          emergency_contact_name: true,
          emergency_contact_number: true,
          insurance_provider: true,
          status: true,
          created_at: true,
        },
      }),

      db.patient.count(),
    ]);

  const totalPages = Math.ceil(
    totalPatients / pageSize,
  );

  return (
    <AppShell userRole={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Patients Roster
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage and view all registered
              patients
            </p>
          </div>

          {(userRole === "SuperAdmin" || userRole === "admin") && (
            <Link href="/patient/registration">
              <Button className="rounded-xl bg-sky-600 text-xs font-bold text-white hover:bg-sky-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </Link>
          )}
        </div>

        <PatientsTable
          patients={patients}
          currentPage={page}
          totalPages={totalPages}
          totalPatients={totalPatients}
        />
      </div>
    </AppShell>
  );
}