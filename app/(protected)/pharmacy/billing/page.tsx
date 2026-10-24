import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { BillingView } from "./components/billing-view";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function PharmacyBillingPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/billing" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const bills = await db.pharmacyBill.findMany({
    include: {
      patient: true,
      prescription: true,
      items: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const initialBills = bills.map((bill) => ({
    ...bill,
    bill_number: bill.bill_number,
    created_at: bill.created_at.toISOString(),
    updated_at: bill.updated_at.toISOString(),
  }));

  return (
    <AppShell userRole={userRole}>
      <BillingView initialBills={initialBills} />
    </AppShell>
  );
}