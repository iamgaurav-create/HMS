import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PatientRegistrationForm } from "./form";
import db from "@/lib/db";
import { AppRole } from "@/lib/auth/roles";
import { assignUserRole } from "@/lib/auth/assign-role";

export default async function PatientRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn: redirectToSignInFn } = await auth();

  if (!userId) {
    redirectToSignInFn({ returnBackUrl: "/patient/registration" });
  }

  const userRole = sessionClaims?.metadata?.role as AppRole | undefined;
  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit;

  let editingPatient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: Date | string;
    gender: string;
    marital_status: string;
    blood_group: string | null;
    address: string;
    emergency_contact_name: string;
    emergency_contact_number: string;
    emergency_contact_relation: string;
    allergies: string | null;
    medical_conditions: string | null;
    medical_history: string | null;
    insurance_provider: string | null;
  } | null = null;
  let isEditMode = false;

  if (editId) {
    const patient = await db.patient.findUnique({
      where: { id: editId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        date_of_birth: true,
        gender: true,
        marital_status: true,
        blood_group: true,
        address: true,
        emergency_contact_name: true,
        emergency_contact_number: true,
        emergency_contact_relation: true,
        allergies: true,
        medical_conditions: true,
        medical_history: true,
        insurance_provider: true,
      },
    });

    if (patient) {
      editingPatient = patient;
      isEditMode = true;
    }
  }

  const isAdmin = userRole === "SuperAdmin" || userRole === "admin";
  const canRegisterPatients = isAdmin || userRole === "Receptionist" || userRole === "Doctor" || userRole === "Nurse";

  if (isEditMode) {
    return (
      <AppShell userRole={userRole || "patient"}>
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Edit Patient Profile
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Update patient details and medical information.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
              {editingPatient && (
                <PatientRegistrationForm
                  patientId={editingPatient.id}
                  email={editingPatient.email}
                  firstName={editingPatient.first_name}
                  lastName={editingPatient.last_name}
                  isEditMode
                  phone={editingPatient.phone}
                  date_of_birth={editingPatient.date_of_birth ? new Date(editingPatient.date_of_birth).toISOString().split("T")[0] : ""}
                  gender={editingPatient.gender}
                  marital_status={editingPatient.marital_status}
                  blood_group={editingPatient.blood_group || ""}
                  address={editingPatient.address}
                  emergency_contact_name={editingPatient.emergency_contact_name}
                  emergency_contact_number={editingPatient.emergency_contact_number}
                  emergency_contact_relation={editingPatient.emergency_contact_relation}
                  allergies={editingPatient.allergies || ""}
                  medical_conditions={editingPatient.medical_conditions || ""}
                  medical_history={editingPatient.medical_history || ""}
                  insurance_provider={editingPatient.insurance_provider || ""}
                />
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (canRegisterPatients && !isEditMode) {
    return (
      <AppShell userRole={userRole}>
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Register New Patient
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Create a new electronic health record for a patient.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
              <PatientRegistrationForm isAdminMode={canRegisterPatients} />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId!);
  const email = user.emailAddresses[0]?.emailAddress;
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const metadataRole = user.publicMetadata?.role;

  if (!email) {
    redirect("/sign-in");
  }

  const existingPatient = await db.patient.findUnique({
    where: { email },
  });

  if (existingPatient) {
    if (metadataRole !== "patient") {
      await assignUserRole(userId!, AppRole.patient);
    }
    redirect("/dashboard/role/patient");
  }

  if (metadataRole && metadataRole !== "patient") {
    redirect("/dashboard");
  }

  return (
    <AppShell userRole={userRole || "patient"}>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Complete Your Patient Profile
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Fill in your details to activate your health record and access the patient portal.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <PatientRegistrationForm email={email} firstName={firstName} lastName={lastName} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
