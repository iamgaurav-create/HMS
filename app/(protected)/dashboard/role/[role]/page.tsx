import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AdminDashboardContent } from "./components/admin-dashboard-content";
import { DoctorDashboardContent } from "./components/doctor-dashboard-content";
import { PatientDashboardContent } from "./components/patient-dashboard-content";
import { ReceptionistDashboardContent } from "./components/receptionist-dashboard-content";
import { NurseDashboardContent } from "./components/nurse-dashboard-content";
import { LabDashboardContent } from "./components/lab-dashboard-content";
import { PharmacyDashboardContent } from "./components/pharmacy-dashboard-content";
import { AccountDashboardContent } from "./components/account-dashboard-content";
import { HRDashboardContent } from "./components/hr-dashboard-content";
import {
  DashboardSkeleton,
  AdminSkeleton,
  DoctorSkeleton,
  PatientSkeleton,
  ReceptionistSkeleton,
  NurseSkeleton,
  LabSkeleton,
  PharmacySkeleton,
  AccountSkeleton,
  HRSkeleton,
} from "@/components/dashboard/dashboard-skeleton";
import { Suspense } from "react";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";

type RoleDashboardProps = {
  params: Promise<{ role: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RoleDashboardPage({ params }: RoleDashboardProps) {
  const { role } = await params;

  const validRoles: AppRole[] = [
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

  if (!validRoles.includes(role as AppRole)) {
    notFound();
  }

  const SkeletonMap: Record<AppRole, React.ReactNode> = {
    SuperAdmin: <AdminSkeleton />,
    admin: <AdminSkeleton />,
    Doctor: <DoctorSkeleton />,
    Receptionist: <ReceptionistSkeleton />,
    Nurse: <NurseSkeleton />,
    LabTechnician: <LabSkeleton />,
    Pharmacist: <PharmacySkeleton />,
    Accountant: <AccountSkeleton />,
    HR: <HRSkeleton />,
    patient: <PatientSkeleton />,
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
    <AppShell userRole={role as AppRole}>
      <Suspense fallback={SkeletonMap[role as AppRole]}>
        {ContentMap[role as AppRole]}
      </Suspense>
    </AppShell>
  );
}

export function generateStaticParams() {
  return [
    { role: "SuperAdmin" },
    { role: "admin" },
    { role: "HR" },
    { role: "Doctor" },
    { role: "Receptionist" },
    { role: "Nurse" },
    { role: "LabTechnician" },
    { role: "Pharmacist" },
    { role: "Accountant" },
    { role: "patient" },
  ];
}

export async function generateMetadata({ params }: RoleDashboardProps) {
  const { role } = await params;
  return {
    title: `${ROLE_LABELS[role as AppRole] || role} Dashboard | Gaurav Hospital`,
    description: `${ROLE_LABELS[role as AppRole] || role} dashboard for hospital management`,
  };
}
