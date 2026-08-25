import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import db from "@/lib/db";

function calculateAge(dateOfBirth: Date) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function BooleanStatus({
  value,
}: {
  value: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          value
            ? "bg-emerald-500"
            : "bg-slate-300"
        }`}
      />

      <span className="text-xs text-slate-600 dark:text-slate-400">
        {value ? "Accepted" : "Not accepted"}
      </span>
    </div>
  );
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    userId,
    sessionClaims,
    redirectToSignIn: redirectToSignInFn,
  } = await auth();

  if (!userId) {
    redirectToSignInFn({
      returnBackUrl: "/patients",
    });
  }

  const userRole =
    getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect(
      "/unauthorized?reason=missing_role",
    );
  }

  const resolvedParams = await params;

  const patientId = resolvedParams.id;

  const patient = await db.patient.findUnique({
    where: {
      id: patientId,
    },

    select: {
      id: true,
      patientNumber: true,

      first_name: true,
      last_name: true,

      date_of_birth: true,
      gender: true,
      marital_status: true,

      phone: true,
      email: true,
      address: true,

      blood_group: true,

      emergency_contact_name: true,
      emergency_contact_number: true,
      emergency_contact_relation: true,

      allergies: true,
      medical_conditions: true,
      medical_history: true,

      insurance_provider: true,

      privacy_consent: true,
      service_consent: true,
      medical_consent: true,

      created_at: true,
    },
  });

  if (!patient) {
    redirect("/patients");
  }

  const age = calculateAge(
    patient.date_of_birth,
  );

  return (
    <AppShell userRole={userRole}>
      <div className="space-y-6">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Patient Details
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Viewing profile for{" "}
              <span className="font-semibold">
                {patient.first_name}{" "}
                {patient.last_name}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <a
              href={`/patients/${patient.id}/pdf`}
            >
              <Button
                className="rounded-xl bg-sky-600 text-xs font-bold text-white hover:bg-sky-700"
              >
                Download PDF
              </Button>
            </a>

            <Link
              href={`/patient/registration?edit=${patient.id}`}
            >
              <Button
                className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Edit Patient
              </Button>
            </Link>

            <Link href="/patients">
              <Button
                variant="outline"
                className="rounded-xl text-xs"
              >
                Back to List
              </Button>
            </Link>

          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-500">
                    Full Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.first_name}{" "}
                    {patient.last_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Patient ID
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.patientNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Date of Birth
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(
                      patient.date_of_birth,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Age / Gender
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {age} years /{" "}
                    {patient.gender}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Marital Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.marital_status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Blood Group
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.blood_group ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.phone}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500">
                    Address
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.address ||
                      "Not provided"}
                  </p>
                </div>

              </div>
            </div>

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                <div>
                  <p className="text-xs text-slate-500">
                    Contact Name
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {
                      patient.emergency_contact_name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Contact Phone
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {
                      patient.emergency_contact_number
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Relation
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {
                      patient.emergency_contact_relation
                    }
                  </p>
                </div>

              </div>
            </div>

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Medical Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <p className="text-xs text-slate-500">
                    Blood Group
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.blood_group ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Insurance Provider
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.insurance_provider ||
                      "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Allergies
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.allergies ||
                      "None reported"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Medical Conditions
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.medical_conditions ||
                      "None reported"}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500">
                    Medical History
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.medical_history ||
                      "No history recorded"}
                  </p>
                </div>

              </div>
            </div>

          </div>

          <div className="space-y-6">

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Consents
              </h3>

              <div className="space-y-4">

                <BooleanStatus
                  value={
                    patient.privacy_consent
                  }
                />

                <BooleanStatus
                  value={
                    patient.service_consent
                  }
                />

                <BooleanStatus
                  value={
                    patient.medical_consent
                  }
                />

              </div>

            </div>

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Registration Info
              </h3>

              <div className="space-y-4">

                <div>
                  <p className="text-xs text-slate-500">
                    Registered On
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(
                      patient.created_at,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Patient Number
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {patient.patientNumber}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}