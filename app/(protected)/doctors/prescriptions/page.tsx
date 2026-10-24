import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PrescriptionsClient from "./components/prescriptions-client";

export const dynamic = "force-dynamic";

export default async function DoctorPrescriptionsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !["Doctor", "SuperAdmin", "admin", "Nurse", "Pharmacist"].includes(role)) {
    redirect("/unauthorized?reason=missing_role");
  }

  const doctor = await db.doctor.findFirst({
    where: {
      OR: [
        { clerkUserId: userId },
        { id: userId },
      ],
    },
  });

  const isDoctor = role === "Doctor";

  const prescriptions = await db.prescription.findMany({
    where: isDoctor && doctor ? { doctor_id: doctor.id } : {},
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          first_name: true,
          last_name: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
          specialization: true,
        },
      },
      medicines: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              generic_name: true,
              unit: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const canCreate = ["Doctor", "SuperAdmin", "admin"].includes(role);

  return (
    <AppShell userRole={role}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Medical Prescriptions
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {isDoctor
                ? "Manage and track prescriptions created by you"
                : "View and manage clinical medical prescriptions"}
            </p>
          </div>

          {canCreate && (
            <Link href="/doctors/prescriptions/create">
              <Button className="rounded-xl bg-sky-600 text-xs font-bold text-white hover:bg-sky-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            </Link>
          )}
        </div>

        <PrescriptionsClient prescriptions={prescriptions} />
      </div>
    </AppShell>
  );
}