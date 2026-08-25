import { requireRole } from "@/lib/auth/guards";
import { getAllStaffAndDoctors } from "@/lib/db/dashboard-data";
import { AccountStatusTable } from "@/components/tables/account-status-table";
import { auth } from "@clerk/nextjs/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HRAccountStatusPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const { userId, sessionClaims } = await auth();
  const userRole = getRoleFromSessionClaims(sessionClaims);
  const { staff, doctors } = await getAllStaffAndDoctors();

  const isHRViewer = userRole === "HR";

  const items = [
    ...staff
      .filter((s) => !isHRViewer || s.role !== "HR")
      .map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        department: s.department,
        status: s.status,
        type: "staff" as const,
        updated_at: s.updated_at,
      })),
    ...doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: "Doctor",
      department: d.department || d.specialization,
      status: d.status,
      type: "doctor" as const,
      updated_at: d.updated_at,
    })),
  ];

  return (
    <div className="space-y-6 pb-12 p-8 animate-in fade-in-50 duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Account Status Management
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Activate, deactivate, or reactivate staff and doctor accounts
        </p>
      </div>
      <AccountStatusTable items={items} />
    </div>
  );
}
