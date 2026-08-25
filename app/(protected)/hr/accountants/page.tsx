import { requireRole } from "@/lib/auth/guards";
import { getStaffByRole } from "@/lib/db/dashboard-data";
import { RoleStaffPage } from "@/components/staff/role-staff-page";

export const dynamic = "force-dynamic";

export default async function HRAccountantsPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const accountants = await getStaffByRole("Accountant");

  return (
    <RoleStaffPage
      title="Accountant Management"
      subtitle="Register, update, and manage accountant accounts."
      roleName="Accountant"
      roleValue="Accountant"
      staffList={accountants}
      registerHref="/staffs/registration?defaultRole=Accountant"
    />
  );
}
