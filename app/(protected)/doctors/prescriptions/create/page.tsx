import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  getPrescriptionPatientsAction,
  getPrescriptionMedicineAction,
} from "@/lib/actions/doctor/prescription.actions";

import PrescriptionForm from "../components/prescription-form";

export const dynamic = "force-dynamic";

export default async function CreatePrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole || !["Doctor", "SuperAdmin", "admin"].includes(userRole)) {
    redirect("/unauthorized?reason=missing_role");
  }

  const [patients, medicines] = await Promise.all([
    getPrescriptionPatientsAction(),
    getPrescriptionMedicineAction(),
  ]);

  let doctor = await db.doctor.findFirst({
    where: {
      OR: [
        {
          clerkUserId: userId,
        },
        {
          id: userId,
        },
      ],
    },
    select: {
      id: true,
      name: true,
      specialization: true,
      license_number: true,
      phone: true,
    },
  });

  if (!doctor && (userRole === "SuperAdmin" || userRole === "admin")) {
    doctor = await db.doctor.findFirst({
      where: { status: "Active" },
      select: {
        id: true,
        name: true,
        specialization: true,
        license_number: true,
        phone: true,
      },
    });
  }

  const resolvedSearchParams = await searchParams;
  const preselectedPatientId =
    resolvedSearchParams.patientId && patients.some(
      (patient) => patient.id === resolvedSearchParams.patientId,
    )
      ? resolvedSearchParams.patientId
      : "";

  return (
    <AppShell userRole={userRole}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Create Prescription
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and issue a new medical prescription for a patient
            </p>
          </div>

          <Link href="/doctors/prescriptions">
            <Button variant="outline" className="rounded-xl text-xs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Prescriptions
            </Button>
          </Link>
        </div>

        <PrescriptionForm
          patients={patients}
          medicines={medicines}
          doctor={doctor}
          preselectedPatientId={preselectedPatientId}
        />
      </div>
    </AppShell>
  );
}