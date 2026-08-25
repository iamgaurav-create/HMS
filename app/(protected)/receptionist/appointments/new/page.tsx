import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import {
  ReceptionistAppointmentForm,
  type DoctorOption,
  type PatientOption,
} from "@/components/receptionist/receptionist-appointment-form";

export default async function ReceptionistNewAppointmentPage() {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } =
    await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/receptionist/appointments/new",
    });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (userRole !== "Receptionist" && userRole !== "admin" && userRole !== "SuperAdmin") {
    redirect("/unauthorized");
  }

  const [doctors, patients] = await Promise.all([
    db.doctor.findMany({
      where: { status: "Active" },
      select: {
        id: true,
        name: true,
        specialization: true,
        department: true,
        availability_status: true,
        working_days: {
          select: {
            day: true,
            start_time: true,
            close_time: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.patient.findMany({
      where: { status: "Active" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        patientNumber: true,
        email: true,
        phone: true,
      },
      orderBy: { first_name: "asc" },
    }),
  ]);

  const formattedDoctors: DoctorOption[] = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    department: doctor.department,
    availability_status: doctor.availability_status,
    working_days: doctor.working_days,
  }));

  const formattedPatients: PatientOption[] = patients.map((patient) => ({
    id: patient.id,
    firstName: patient.first_name,
    lastName: patient.last_name,
    patientNumber: patient.patientNumber,
    email: patient.email,
    phone: patient.phone,
  }));

  return (
    <AppShell userRole={userRole}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/dashboard?role=Receptionist"
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Book Patient Appointment
          </h1>

          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Select a patient, doctor, date and available time to schedule an appointment.
          </p>

          <ReceptionistAppointmentForm
            doctors={formattedDoctors}
            patients={formattedPatients}
          />
        </div>
      </div>
    </AppShell>
  );
}
