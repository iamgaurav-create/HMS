import { requireRole } from "@/lib/auth/guards";
import { getStaffByRole } from "@/lib/db/dashboard-data";
import { RoleStaffPage } from "@/components/staff/role-staff-page";

export const dynamic = "force-dynamic";

export default async function HRReceptionistsPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const receptionists = await getStaffByRole("Receptionist");

  return (
    <RoleStaffPage
      title="Receptionist Management"
      subtitle="Register, update, and manage receptionist accounts."
      roleName="Receptionist"
      roleValue="Receptionist"
      staffList={receptionists}
      registerHref="/staffs/registration?defaultRole=Receptionist"
    />
  );
}
