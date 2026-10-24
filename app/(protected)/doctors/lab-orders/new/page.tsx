import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import RequestLabTestForm from "@/components/doctor/request-lab-test-form";
import { getDoctorLabOrderFormData } from "@/lib/db/doctor-lab-orders";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function NewDoctorLabOrderPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole || !["Doctor", "SuperAdmin", "admin"].includes(userRole)) {
    redirect("/unauthorized?reason=missing_role");
  }

  const { patients, services } = await getDoctorLabOrderFormData(userId);

  return (
    <AppShell userRole={userRole}>
      <div className="mx-auto max-w-5xl space-y-6">
        <RequestLabTestForm patients={patients} services={services} />
      </div>
    </AppShell>
  );
}
