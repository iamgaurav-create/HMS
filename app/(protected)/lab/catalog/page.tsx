import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { CatalogClient } from "@/components/laboratory/catalog/catalog-client";

export const dynamic = "force-dynamic";

export default async function LabCatalogPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/catalog" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const canAddTests = [
    "SuperAdmin",
    "admin",
    "LabTechnician",
  ].includes(userRole);

  const services = await db.service.findMany({
    orderBy: {
      service_name: "asc",
    },
    select: {
      id: true,
      service_name: true,
      description: true,
      price: true,
      labTemplate: {
        select: {
          template_key: true,
          specimen: true,
          parameters: true,
        },
      },
    },
  });

  return (
    <AppShell userRole={userRole}>
      <CatalogClient services={services} canAddTests={canAddTests} />
    </AppShell>
  );
}
