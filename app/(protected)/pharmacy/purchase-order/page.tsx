import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { getpurchaseOrderAction } from "@/lib/actions/pharmacy/purchase-order.actions";

import { PurchaseOrderView } from "./components/purchase-order-view";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function PurchaseOrdersPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/purchase-order" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const orders = await getpurchaseOrderAction();

  return (
    <AppShell userRole={userRole}>
      <PurchaseOrderView initialOrders={orders} />
    </AppShell>
  );
}
