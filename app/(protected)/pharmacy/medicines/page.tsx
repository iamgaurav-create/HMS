import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

import { MedicinesView } from "./components/medicines-view";
import type { Medicine } from "./components/medicine-table";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function MedicinesPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/medicines" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const medicines = await db.medicine.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      generic_name: true,
      category: true,
      manufacturer: true,
      unit: true,
      reorder_level: true,
      is_active: true,
      is_otc: true,
      created_at: true,
    },
  });

  const initialMedicines: Medicine[] = medicines.map((medicine) => ({
    ...medicine,
    created_at: medicine.created_at.toISOString(),
  }));

  return (
    <AppShell userRole={userRole}>
      <MedicinesView initialMedicines={initialMedicines} />
    </AppShell>
  );
}