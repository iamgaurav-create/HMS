import { requireRole } from "@/lib/auth/guards";
import { getStaffByRole } from "@/lib/db/dashboard-data";
import { RoleStaffPage } from "@/components/staff/role-staff-page";

export const dynamic = "force-dynamic";

export default async function HRNursesPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const nurses = await getStaffByRole("Nurse");

  return (
    <RoleStaffPage
      title="Nurse Management"
      subtitle="Register, update, and manage nurse accounts and assignments."
      roleName="Nurse"
      roleValue="Nurse"
      staffList={nurses}
      registerHref="/staffs/registration?defaultRole=Nurse"
    />
  );
}
