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

  const prescriptions = await db.prescription.findMany({
    where: {
      patient_id: patientId,
    },
    include: {
      doctor: {
        select: {
          name: true,
          specialization: true,
        },
      },
      medicines: {
        include: {
          medicine: {
            select: {
              name: true,
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

            {(userRole === "Doctor" || userRole === "SuperAdmin" || userRole === "admin") && (
              <Link
                href={`/doctors/prescriptions/create?patientId=${patient.id}`}
              >
                <Button
                  className="rounded-xl bg-sky-600 text-xs font-bold text-white hover:bg-sky-700"
                >
                  Create Prescription
                </Button>
              </Link>
            )}

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

            <div className="rounded-2xl glass-card p-6">

              <h3 className="mb-5 text-sm font-bold text-slate-900 dark:text-slate-100">
                Prescriptions
              </h3>

              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No prescriptions recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map(
                    (prescription) => (
                      <div
                        key={prescription.id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              prescription.status ===
                              "PENDING"
                                ? "bg-yellow-100 text-yellow-700"
                                : prescription.status ===
                                    "DISPENSED"
                                  ? "bg-green-100 text-green-700"
                                  : prescription.status ===
                                      "PARTIALLY_DISPENSED"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                            }`}
                          >
                            {prescription.status}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {new Date(
                              prescription.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500">
                          Dr. {prescription.doctor.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {prescription.doctor.specialization}
                        </p>

                        {prescription.notes && (
                          <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {prescription.notes}
                          </p>
                        )}

                        <div className="mt-3 space-y-1">
                          {prescription.medicines.map(
                            (item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {item.medicine.name}
                                </span>

                                <span className="text-slate-500">
                                  {item.dosage} ·{" "}
                                  {item.frequency}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}