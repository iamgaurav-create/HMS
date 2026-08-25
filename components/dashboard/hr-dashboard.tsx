"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { StaffsTable, Staff } from "@/components/tables/staffs-table";
import { QuickActionCard } from "@/components/cards/quick-action-card";
import { Input } from "@/components/ui/input";
import { AppointmentStatsChart } from "@/components/charts/appointment-stats-chart";
import { RevenueAnalyticsChart } from "@/components/charts/revenue-analytics-chart";
import { DepartmentPerformanceChart } from "@/components/charts/department-performance-chart";
import { PatientTrendChart } from "@/components/charts/patient-trend-chart";
import { RecentActivitiesTable } from "@/components/tables/recent-activities-table";
import { UpcomingAppointmentsTable } from "@/components/tables/upcoming-appointments-table";
import type { DashboardMetrics } from "@/lib/db/dashboard-data";
import type { ActivityItem } from "@/components/tables/recent-activities-table";
import type { AppointmentRow } from "@/components/tables/upcoming-appointments-table";
import {
  Users,
  Stethoscope,
  UserPlus,
  UserCheck,
  UserMinus,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";

export interface HRDashboardProps {
  metrics: {
    totalStaff: number;
    totalDoctors: number;
    activeStaff: number;
    newThisMonth: number;
    inactiveStaff: number;
    inactiveDoctors: number;
    pendingOnboarding: number;
  };
  staffList: Staff[];
  activities?: ActivityItem[];
  appointments?: AppointmentRow[];
}

export function HRDashboard({
  metrics,
  staffList,
  activities = [],
  appointments = [],
}: HRDashboardProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const handleAddDoctor = () => {
    router.push("/doctors/registration");
  };

  const handleAddStaff = () => {
    router.push("/staffs/registration");
  };

  const handleViewDoctors = () => {
    router.push("/doctors");
  };

  const handleViewStaff = () => {
    router.push("/staffs");
  };

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return staffList.filter((staff) => {
      const matchesSearch =
        !query ||
        staff.name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        staff.phone.includes(query) ||
        staff.department?.toLowerCase().includes(query) ||
        (staff.hospitalEmail?.toLowerCase().includes(query) ?? false);

      const matchesRole =
        roleFilter === "all" || staff.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || staff.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(staffList.map((s) => s.role)));
    return uniqueRoles.sort();
  }, [staffList]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStaff.length / 10));
  }, [filteredStaff.length]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="HR Manager"
        roleName="HR Portal"
        subtitle="Manage staff recruitment, onboarding, and personnel records."
        onQuickAction={handleAddDoctor}
        actionText="Add New Doctor"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={metrics.totalStaff.toString()}
          change="All departments"
          trend="neutral"
          subtitle="Hospital workforce"
          icon={<Users className="h-5 w-5" />}
          gradient="from-sky-500/20 to-indigo-500/10"
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Total Doctors"
          value={metrics.totalDoctors.toString()}
          change="Medical staff"
          trend="neutral"
          subtitle="Active consultants"
          icon={<Stethoscope className="h-5 w-5" />}
          gradient="from-teal-500/20 to-emerald-500/10"
          iconColor="text-teal-600 bg-teal-500/10 dark:bg-teal-500/20"
        />
        <StatCard
          title="Active Staff"
          value={metrics.activeStaff.toString()}
          change="Currently employed"
          trend="up"
          subtitle="Active status"
          icon={<UserCheck className="h-5 w-5" />}
          gradient="from-emerald-500/20 to-teal-500/10"
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="New This Month"
          value={metrics.newThisMonth.toString()}
          change="Recent hires"
          trend="up"
          subtitle="Last 30 days"
          icon={<UserPlus className="h-5 w-5" />}
          gradient="from-indigo-500/20 to-purple-500/10"
          iconColor="text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20"
        />
        <StatCard
          title="Inactive Staff"
          value={metrics.inactiveStaff.toString()}
          change="Deactivated / dormant"
          trend={metrics.inactiveStaff > 0 ? "down" : "neutral"}
          subtitle="Non-active accounts"
          icon={<UserMinus className="h-5 w-5" />}
          gradient="from-slate-500/20 to-slate-500/10"
          iconColor="text-slate-600 bg-slate-500/10 dark:bg-slate-500/20"
        />
        <StatCard
          title="Inactive Doctors"
          value={metrics.inactiveDoctors.toString()}
          change="Offboarded doctors"
          trend={metrics.inactiveDoctors > 0 ? "down" : "neutral"}
          subtitle="Non-active doctors"
          icon={<Stethoscope className="h-5 w-5" />}
          gradient="from-amber-500/20 to-orange-500/10"
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Pending Onboarding"
          value={metrics.pendingOnboarding.toString()}
          change="Awaiting password reset"
          trend={metrics.pendingOnboarding > 0 ? "up" : "neutral"}
          subtitle="Incomplete setup"
          icon={<ClipboardCheck className="h-5 w-5" />}
          gradient="from-rose-500/20 to-pink-500/10"
          iconColor="text-rose-600 bg-rose-500/10 dark:bg-rose-500/20"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            Staff Management Actions
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Recruitment & onboarding</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickActionCard
            title="Add Doctor"
            description="Onboard medical consultant"
            icon={<Stethoscope className="h-5 w-5" />}
            onClick={handleAddDoctor}
            color="bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-300"
          />
          <QuickActionCard
            title="Add Staff"
            description="Register new employee"
            icon={<UserPlus className="h-5 w-5" />}
            onClick={handleAddStaff}
            color="bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300"
          />
          <QuickActionCard
            title="View Doctors"
            description="Manage doctor profiles"
            icon={<Stethoscope className="h-5 w-5" />}
            onClick={handleViewDoctors}
            color="bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300"
          />
          <QuickActionCard
            title="View All Staff"
            description="Personnel directory"
            icon={<Users className="h-5 w-5" />}
            onClick={handleViewStaff}
            color="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300"
          />
        </div>
      </div>

      {/* 4 Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppointmentStatsChart />
        <RevenueAnalyticsChart />
        <DepartmentPerformanceChart />
        <PatientTrendChart />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivitiesTable items={activities} />
        <UpcomingAppointmentsTable items={appointments} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            All Staff Directory
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredStaff.length} records
          </span>
        </div>

        <StaffsTable
          staffs={filteredStaff}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          allRoles={roles}
          currentPage={currentPage}
          totalPages={totalPages}
          totalStaff={staffList.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
