import { Suspense } from "react";
import { DashboardSkeleton, RoleDashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";

export function DoctorDashboardContent() {
  return (
    <Suspense fallback={<RoleDashboardSkeleton />}>
      <DoctorDashboardLoader />
    </Suspense>
  );
}

async function DoctorDashboardLoader() {
  const { userId } = await auth();
  const { getDoctorSchedule } = await import("@/lib/db/dashboard-data");

  const schedule = await getDoctorSchedule();

  let doctorName = "Doctor";
  let department = "";

  if (userId) {
    const doctor = await db.doctor.findFirst({
      where: { clerkUserId: userId },
      select: { name: true, department: true },
    });
    if (doctor) {
      doctorName = doctor.name;
      department = doctor.department || "";
    }
  }

  return <DoctorDashboard doctorName={doctorName} department={department} schedule={schedule} />;
}
