import { requireRole } from "@/lib/auth/guards";
import { getStaffByRole } from "@/lib/db/dashboard-data";
import { RoleStaffPage } from "@/components/staff/role-staff-page";

export const dynamic = "force-dynamic";

export default async function HRLabTechniciansPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const labTechnicians = await getStaffByRole("LabTechnician");

  return (
    <RoleStaffPage
      title="Lab Technician Management"
      subtitle="Register, update, and manage lab technician accounts."
      roleName="Lab Technician"
      roleValue="LabTechnician"
      staffList={labTechnicians}
      registerHref="/staffs/registration?defaultRole=LabTechnician"
    />
  );
}
