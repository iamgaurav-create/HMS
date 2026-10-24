import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { BillDetails } from "../components/bill-details";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function PharmacyBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: `/pharmacy/billing/${id}` });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const bill = await db.pharmacyBill.findUnique({
    where: { id },
    include: {
      patient: true,
      prescription: true,
      items: {
        include: {
          medicine: true,
        },
      },
      payments: {
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!bill) {
    notFound();
  }

  const canCollectPayment = userRole === "SuperAdmin" || userRole === "admin" || userRole === "Pharmacist";

  return (
    <AppShell userRole={userRole}>
      <BillDetails bill={bill} canCollectPayment={canCollectPayment} />
    </AppShell>
  );
}