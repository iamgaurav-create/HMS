import { Suspense } from "react";
import { RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { PatientDashboard, type PatientDashboardProps } from "@/components/dashboard/patient-dashboard";
import { clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export function PatientDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <PatientDashboardLoader />
    </Suspense>
  );
}

async function PatientDashboardLoader() {
  const { auth } = await import("@clerk/nextjs/server");
  const { getPatientByEmail } = await import("@/lib/db/dashboard-data");

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  if (!email) {
    redirect("/sign-in");
  }

  const patient = await getPatientByEmail(email);

  if (!patient) {
    redirect("/patient/registration");
  }

  return (
    <PatientDashboard
      patient={patient as PatientDashboardProps["patient"]}
    />
  );
}
