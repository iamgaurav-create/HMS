import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DoctorRegistrationForm } from "./form";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export default async function DoctorRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/doctors/registration" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  let resolvedRole = userRole;
  if (!resolvedRole) {
    const staffRecord = await db.staff.findFirst({
      where: { clerkUserId: userId },
      select: { role: true },
    });

    if (staffRecord && ["SuperAdmin", "admin", "HR"].includes(staffRecord.role)) {
      resolvedRole = staffRecord.role;
    }
  }

  if (!resolvedRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit;

  let editingDoctor: {
    id: string;
    email: string;
    name: string;
    specialization: string;
    license_number: string;
    phone: string;
    address: string;
    department: string | null;
    availability_status: string | null;
    type: string;
  } | null = null;
  let isEditMode = false;

  if (editId) {
    const doctor = await db.doctor.findUnique({
      where: { id: editId },
      select: {
        id: true,
        email: true,
        name: true,
        specialization: true,
        license_number: true,
        phone: true,
        address: true,
        department: true,
        availability_status: true,
        type: true,
      },
    });

    if (doctor) {
      editingDoctor = doctor;
      isEditMode = true;
    }
  }

  if (isEditMode) {
    return (
      <AppShell userRole={resolvedRole}>
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Edit Doctor Profile
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Update doctor details and information.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
              {editingDoctor && (
                <DoctorRegistrationForm
                  doctorId={editingDoctor.id}
                  email={editingDoctor.email}
                  name={editingDoctor.name}
                  specialization={editingDoctor.specialization}
                  licenseNumber={editingDoctor.license_number}
                  phone={editingDoctor.phone}
                  address={editingDoctor.address}
                  department={editingDoctor.department || ""}
                  availabilityStatus={editingDoctor.availability_status || ""}
                  type={editingDoctor.type}
                  isEditMode
                />
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const canAddDoctors = ["SuperAdmin", "admin", "HR"].includes(resolvedRole);

  if (!canAddDoctors) {
    redirect("/dashboard");
  }

  return (
    <AppShell userRole={resolvedRole}>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Register New Doctor
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create a new doctor profile and add them to the hospital staff.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <DoctorRegistrationForm />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
