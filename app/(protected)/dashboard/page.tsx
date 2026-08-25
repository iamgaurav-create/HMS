import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppRole } from "@/lib/auth/roles";
import { AppShell } from "@/components/layout/app-shell";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AdminDashboardContent } from "./role/[role]/components/admin-dashboard-content";
import { DoctorDashboardContent } from "./role/[role]/components/doctor-dashboard-content";
import { PatientDashboardContent } from "./role/[role]/components/patient-dashboard-content";
import { ReceptionistDashboardContent } from "./role/[role]/components/receptionist-dashboard-content";
import { NurseDashboardContent } from "./role/[role]/components/nurse-dashboard-content";
import { LabDashboardContent } from "./role/[role]/components/lab-dashboard-content";
import { PharmacyDashboardContent } from "./role/[role]/components/pharmacy-dashboard-content";
import { AccountDashboardContent } from "./role/[role]/components/account-dashboard-content";
import { HRDashboardContent } from "./role/[role]/components/hr-dashboard-content";
import db from "@/lib/db";
import { OnboardingStatusNotice } from "@/components/staff/onboarding-status-notice";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/dashboard" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);
  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  const resolvedSearchParams = await searchParams;
  const queryRole = resolvedSearchParams?.role;

  const VALID_ROLES: AppRole[] = [
    "SuperAdmin",
    "admin",
    "HR",
    "Doctor",
    "Receptionist",
    "Nurse",
    "LabTechnician",
    "Pharmacist",
    "Accountant",
    "patient",
  ];

  let targetRole: AppRole = userRole;
  if (queryRole && VALID_ROLES.includes(queryRole as AppRole)) {
    const requestedRole = queryRole as AppRole;
    if (requestedRole === userRole || userRole === "SuperAdmin") {
      targetRole = requestedRole;
    }
  }

  const staffOnboarding = await db.staff.findFirst({
    where: { clerkUserId: userId },
    select: { onboardingStatus: true, changeRequest: true, rejectionReason: true },
  });

  return <RoleDashboardShell userRole={userRole} targetRole={targetRole} staffOnboarding={staffOnboarding} />;
}

async function RoleDashboardShell({
  userRole,
  targetRole,
  staffOnboarding,
}: {
  userRole: AppRole;
  targetRole: AppRole;
  staffOnboarding: { onboardingStatus: string; changeRequest: string | null; rejectionReason: string | null } | null;
}) {
  const SkeletonMap: Record<AppRole, React.ReactNode> = {
    SuperAdmin: <DashboardSkeleton />,
    admin: <DashboardSkeleton />,
    Doctor: <DashboardSkeleton />,
    Receptionist: <DashboardSkeleton />,
    Nurse: <DashboardSkeleton />,
    LabTechnician: <DashboardSkeleton />,
    Pharmacist: <DashboardSkeleton />,
    Accountant: <DashboardSkeleton />,
    HR: <DashboardSkeleton />,
    patient: <DashboardSkeleton />,
  };

  const ContentMap: Record<AppRole, React.ReactNode> = {
    SuperAdmin: <AdminDashboardContent />,
    admin: <AdminDashboardContent />,
    Doctor: <DoctorDashboardContent />,
    Receptionist: <ReceptionistDashboardContent />,
    Nurse: <NurseDashboardContent />,
    LabTechnician: <LabDashboardContent />,
    Pharmacist: <PharmacyDashboardContent />,
    Accountant: <AccountDashboardContent />,
    HR: <HRDashboardContent />,
    patient: <PatientDashboardContent />,
  };

  return (
    <AppShell userRole={userRole}>
      {staffOnboarding && <OnboardingStatusNotice status={staffOnboarding.onboardingStatus} changeRequest={staffOnboarding.changeRequest} rejectionReason={staffOnboarding.rejectionReason} />}
      <Suspense fallback={SkeletonMap[targetRole]}>{ContentMap[targetRole]}</Suspense>
    </AppShell>
  );
}
