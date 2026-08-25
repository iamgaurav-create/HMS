import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import {
  PatientAppointmentForm,
  type DoctorOption,
} from "@/components/patient/patient-appointment-form";

export default async function NewPatientAppointmentPage() {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } =
    await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/patient/appointments/new",
    });
  }

  let userRole = getRoleFromSessionClaims(sessionClaims);

  // Fetch Clerk user details as fallback if email or role is missing in session claims
  let userEmail = sessionClaims?.email as string | undefined;
  if (!userEmail) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId!);
      userEmail = user.emailAddresses[0]?.emailAddress;
      if (!userRole) {
        userRole = (user.publicMetadata?.role as any) || undefined;
      }
    } catch (e) {
      console.error("Error fetching Clerk user:", e);
    }
  }

  if (!userEmail) {
    redirect("/sign-in");
  }

  // Find patient record
  const patient = await db.patient.findUnique({
    where: {
      email: userEmail,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      patientNumber: true,
    },
  });

  if (!patient) {
    redirect("/patient/registration");
  }

  const doctors = await db.doctor.findMany({
    where: {
      status: "Active",
    },
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
    orderBy: {
      name: "asc",
    },
  });

  const formattedDoctors: DoctorOption[] = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    specialization: doctor.specialization,
    department: doctor.department,
    availability_status: doctor.availability_status,
    working_days: doctor.working_days,
  }));

  return (
    <AppShell userRole={userRole || "patient"}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/patient/appointments"
            className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Appointments
          </Link>

          <h1 className="mb-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Book an Appointment
          </h1>

          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Choose a doctor, date and available time for your appointment.
          </p>

          <PatientAppointmentForm
            patientId={patient.id}
            patientName={`${patient.first_name} ${patient.last_name}`}
            patientNumber={patient.patientNumber}
            doctors={formattedDoctors}
          />
        </div>
      </div>
    </AppShell>
  );
}
