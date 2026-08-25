import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/auth/guards";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import type { AppRole } from "@/lib/auth/roles";
import {
  getStaffCountsByRole,
  getHRMetrics,
  getRecentStaffActivities,
} from "@/lib/db/dashboard-data";
import { HRManagementHub } from "@/components/dashboard/hr-management-hub";

export default async function HRPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const staff = await db.staff.findFirst({
    where: { clerkUserId: userId },
    select: { mustChangePassword: true },
  });

  if (staff?.mustChangePassword) {
    redirect("/staff/change-password");
  }

  await requireRole(["SuperAdmin", "admin", "HR"]);
  const userRole = getRoleFromSessionClaims(sessionClaims);

  const [roleCounts, hrMetrics, recentActivitiesRaw] = await Promise.all([
    getStaffCountsByRole(),
    getHRMetrics(),
    getRecentStaffActivities(),
  ]);

  const doctorCount = {
    total: hrMetrics.totalDoctors,
    active: hrMetrics.totalDoctors - hrMetrics.inactiveDoctors,
    inactive: hrMetrics.inactiveDoctors,
  };

  const recentActivities = recentActivitiesRaw.map((a) => ({
    id: a.id,
    action: a.action,
    time: a.time,
  }));

  return (
    <AppShell userRole={userRole as AppRole}>
      <HRManagementHub
        roleCounts={roleCounts}
        doctorCount={doctorCount}
        pendingOnboarding={hrMetrics.pendingOnboarding}
        recentActivities={recentActivities}
      />
    </AppShell>
  );
}
