import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { PrescriptionDetails } from "../components/prescription-details";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist", "Doctor", "Nurse"];

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: `/pharmacy/prescriptions/${id}` });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const prescription = await db.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: true,
      medicines: {
        include: {
          medicine: {
            include: {
              batches: {
                where: {
                  quantity: { gt: 0 },
                  expiry_date: { gt: new Date() },
                },
                orderBy: { expiry_date: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!prescription) {
    notFound();
  }

  const staff = userId
    ? await db.staff.findUnique({
        where: { clerkUserId: userId },
        select: { name: true },
      })
    : null;

  const canDispense =
    userRole === "SuperAdmin" ||
    userRole === "admin" ||
    userRole === "Pharmacist";

  return (
    <AppShell userRole={userRole}>
      <PrescriptionDetails
        prescription={prescription}
        dispensedBy={staff?.name ?? ""}
        canDispense={canDispense}
      />
    </AppShell>
  );
}