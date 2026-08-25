import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import {
  AppointmentsList,
  type AppointmentItem,
} from "@/components/appointments/appointments-list";

export default async function AppointmentsMasterPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/appointments" });
  }

  let userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    const staff = await db.staff.findFirst({
      where: { clerkUserId: userId },
      select: { role: true },
    });
    if (staff) userRole = staff.role;
  }

  const role = userRole || "Receptionist";

  // If patient, redirect to patient appointments
  if (role === "patient") {
    redirect("/patient/appointments");
  }

  const appointments = await db.appointment.findMany({
    include: {
      patient: {
        select: {
          first_name: true,
          last_name: true,
          patientNumber: true,
          phone: true,
        },
      },
      doctor: {
        select: {
          name: true,
          specialization: true,
          department: true,
        },
      },
    },
    orderBy: { appointment_date: "desc" },
    take: 100,
  });

  const formattedAppointments: AppointmentItem[] = appointments.map((apt) => ({
    id: apt.id,
    appointmentDate: apt.appointment_date,
    time: apt.time,
    type: apt.type,
    status: apt.status,
    reason: apt.reason,
    patient: {
      first_name: apt.patient.first_name,
      last_name: apt.patient.last_name,
      patientNumber: apt.patient.patientNumber,
      phone: apt.patient.phone,
    },
    doctor: {
      name: apt.doctor.name,
      specialization: apt.doctor.specialization,
      department: apt.doctor.department,
    },
  }));

  const isStaffOrAdmin =
    role === "Receptionist" ||
    role === "admin" ||
    role === "SuperAdmin" ||
    role === "Doctor" ||
    role === "Nurse";

  const bookingHref = isStaffOrAdmin
    ? "/receptionist/appointments/new"
    : "/patient/appointments/new";

  const pendingCount = appointments.filter((a) => a.status === "Pending").length;
  const scheduledCount = appointments.filter(
    (a) => a.status === "Scheduled" || a.status === "Confirmed"
  ).length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const cancelledCount = appointments.filter(
    (a) => a.status === "Cancelled" || a.status === "NoShow"
  ).length;

  return (
    <AppShell userRole={role}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Hospital Appointments
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review, accept, reject, and schedule doctor consultations.
              </p>
            </div>

            <Link
              href={bookingHref}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
            >
              <CalendarPlus className="h-4 w-4" />
              Book Appointment
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-slate-500">Total Bookings</span>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
                {appointments.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Pending Approval
              </span>
              <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                Scheduled / Confirmed
              </span>
              <p className="mt-1 text-2xl font-black text-sky-600 dark:text-sky-400">
                {scheduledCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </p>
            </div>
          </div>

          {/* Interactive Appointments List with Accept / Reject Actions */}
          <AppointmentsList
            initialAppointments={formattedAppointments}
            isStaffOrAdmin={isStaffOrAdmin}
          />
        </div>
      </div>
    </AppShell>
  );
}
