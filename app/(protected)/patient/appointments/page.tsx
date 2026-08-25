import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus, Clock, Stethoscope, CalendarDays, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

function getStatusStyle(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "Confirmed":
    case "Scheduled":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
    case "InProgress":
    case "CheckedIn":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case "Cancelled":
    case "NoShow":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "Cancelled":
    case "NoShow":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <AlertCircle className="h-3.5 w-3.5" />;
  }
}

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } =
    await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/patient/appointments",
    });
  }

  let userRole = getRoleFromSessionClaims(sessionClaims);

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

  const patient = await db.patient.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!patient) {
    redirect("/patient/registration");
  }

  const appointments = await db.appointment.findMany({
    where: { patient_id: patient.id },
    include: {
      doctor: {
        select: {
          name: true,
          specialization: true,
          department: true,
        },
      },
    },
    orderBy: { appointment_date: "desc" },
  });

  const resolvedParams = await searchParams;
  const showSuccess = resolvedParams?.success === "created";

  const upcoming = appointments.filter(
    (a) =>
      new Date(a.appointment_date) >= new Date() &&
      a.status !== "Completed" &&
      a.status !== "Cancelled" &&
      a.status !== "NoShow"
  );
  const past = appointments.filter(
    (a) =>
      new Date(a.appointment_date) < new Date() ||
      a.status === "Completed" ||
      a.status === "Cancelled" ||
      a.status === "NoShow"
  );

  return (
    <AppShell userRole={userRole || "patient"}>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                My Appointments
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                View and manage your appointments at Gaurav Hospital.
              </p>
            </div>

            <Link
              href="/patient/appointments/new"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-700"
            >
              <CalendarPlus className="h-4 w-4" />
              Book New Appointment
            </Link>
          </div>

          {/* Success Banner */}
          {showSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Your appointment has been booked successfully! The doctor will be notified.
            </div>
          )}

          {/* Add Appointment Card */}
          {appointments.length === 0 && (
            <Link
              href="/patient/appointments/new"
              className="group mb-8 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center transition hover:border-sky-400 hover:bg-sky-50/50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-sky-500 dark:hover:bg-sky-950/20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 transition group-hover:scale-110 dark:bg-sky-950 dark:text-sky-400">
                <CalendarPlus className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Book Your First Appointment
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Select a doctor, date and available time slot to get started.
                </p>
              </div>
            </Link>
          )}

          {/* Upcoming Appointments */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                <Clock className="h-4 w-4 text-sky-500" />
                Upcoming Appointments ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Dr. {apt.doctor.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {apt.doctor.specialization}
                          {apt.doctor.department ? ` · ${apt.doctor.department}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(apt.appointment_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {apt.time}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold dark:bg-slate-800">
                            {apt.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-bold sm:self-center ${getStatusStyle(apt.status)}`}
                    >
                      {getStatusIcon(apt.status)}
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          {past.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-100">
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                Past Appointments ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/70 p-5 opacity-80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Dr. {apt.doctor.name}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {apt.doctor.specialization}
                          {apt.doctor.department ? ` · ${apt.doctor.department}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(apt.appointment_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {apt.time}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold dark:bg-slate-800">
                            {apt.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-bold sm:self-center ${getStatusStyle(apt.status)}`}
                    >
                      {getStatusIcon(apt.status)}
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
