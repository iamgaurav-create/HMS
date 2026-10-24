import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { PrescriptionsView } from "./components/prescriptions-view";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist", "Doctor", "Nurse"];

export default async function PrescriptionsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/prescriptions" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const prescriptions = await db.prescription.findMany({
    orderBy: { created_at: "desc" },
    include: {
      patient: true,
      doctor: true,
      medicines: {
        include: {
          medicine: true,
        },
      },
    },
  });

  const initialPrescriptions = prescriptions.map((prescription) => ({
    ...prescription,
    created_at: prescription.created_at.toISOString(),
    updated_at: prescription.updated_at.toISOString(),
    medicines: prescription.medicines.map((item) => ({
      ...item,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
    })),
  }));

  return (
    <AppShell userRole={userRole}>
      <PrescriptionsView prescriptions={initialPrescriptions} />
    </AppShell>
  );
}