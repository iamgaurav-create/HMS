import { requireRole } from "@/lib/auth/guards";
import { getStaffByRole } from "@/lib/db/dashboard-data";
import { RoleStaffPage } from "@/components/staff/role-staff-page";

export const dynamic = "force-dynamic";

export default async function HRPharmacistsPage() {
  await requireRole(["SuperAdmin", "admin", "HR"]);
  const pharmacists = await getStaffByRole("Pharmacist");

  return (
    <RoleStaffPage
      title="Pharmacist Management"
      subtitle="Register, update, and manage pharmacist accounts."
      roleName="Pharmacist"
      roleValue="Pharmacist"
      staffList={pharmacists}
      registerHref="/staffs/registration?defaultRole=Pharmacist"
    />
  );
}
