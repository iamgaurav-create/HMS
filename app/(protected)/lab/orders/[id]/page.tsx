
import { redirect, notFound } from "next/navigation";
import { LabOrderDetails } from "@/components/laboratory/orders/lab-order-details";
import { getLaboratoryOrderById } from "@/lib/db/laboratory-orders";
import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { Permission, roleHasPermission } from "@/lib/auth/permissions";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LaboratoryOrderDetailsPage({
  params,
}: PageProps) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/lab/orders" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const { id } = await params;
  const orderId = id.trim();

  if (!orderId) {
    notFound();
  }

  const order = await getLaboratoryOrderById(orderId);

  if (!order) {
    notFound();
  }

  return (
    <AppShell userRole={userRole}>
      <LabOrderDetails
        order={order}
        canEdit={roleHasPermission(userRole, Permission.MANAGE_LAB)}
        canVerify={roleHasPermission(userRole, Permission.VERIFY_LAB_RESULTS)}
        canRelease={roleHasPermission(userRole, Permission.RELEASE_LAB_REPORTS)}
      />
    </AppShell>
  );
}
