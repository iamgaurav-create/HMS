import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StaffRegistrationForm } from "./form";
import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

export default async function StaffRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/staffs/registration" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const canManageStaff = ["SuperAdmin", "admin", "HR"].includes(userRole);
  if (!canManageStaff) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit;

  let editingStaff: {
    id: string;
    email: string;
    name: string;
    phone: string;
    address: string;
    department: string | null;
    license_number: string | null;
    role: string;
    hospitalEmail: string | null;
    status: string;
  } | null = null;
  let isEditMode = false;

  if (editId) {
    const staff = await db.staff.findUnique({
      where: { id: editId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        department: true,
        license_number: true,
        role: true,
        hospitalEmail: true,
        status: true,
      },
    });

    if (staff) {
      editingStaff = staff;
      isEditMode = true;
    }
  }

  if (isEditMode) {
    return (
      <AppShell userRole={userRole}>
        <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Edit Staff Profile
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Update staff details and information.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
              {editingStaff && (
                <StaffRegistrationForm
                  staffId={editingStaff.id}
                  email={editingStaff.email}
                  name={editingStaff.name}
                  phone={editingStaff.phone}
                  address={editingStaff.address}
                  department={editingStaff.department || ""}
                  licenseNumber={editingStaff.license_number ?? ""}
                  role={editingStaff.role}
                  hospitalEmail={editingStaff.hospitalEmail ?? ""}
                  status={editingStaff.status}
                  isEditMode
                  actorRole={userRole}
                />
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell userRole={userRole}>
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Register New Staff
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create a new staff profile and add them to the hospital system.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-sky-500/5 dark:border-slate-800 dark:bg-slate-900/80">
            <StaffRegistrationForm actorRole={userRole} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
