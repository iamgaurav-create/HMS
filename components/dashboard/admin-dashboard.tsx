"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppointmentStatsChart } from "@/components/charts/appointment-stats-chart";
import { RevenueAnalyticsChart } from "@/components/charts/revenue-analytics-chart";
import { DepartmentPerformanceChart } from "@/components/charts/department-performance-chart";
import { PatientTrendChart } from "@/components/charts/patient-trend-chart";
import { RecentActivitiesTable } from "@/components/tables/recent-activities-table";
import { UpcomingAppointmentsTable } from "@/components/tables/upcoming-appointments-table";
import { QuickActionCard } from "@/components/cards/quick-action-card";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import type { DashboardMetrics } from "@/lib/db/dashboard-data";
import type { ActivityItem } from "@/components/tables/recent-activities-table";
import type { AppointmentRow } from "@/components/tables/upcoming-appointments-table";
import {
  Users,
  Stethoscope,
  Calendar,
  BedDouble,
  DollarSign,
  CreditCard,
  Bed,
  ShieldAlert,
  UserPlus,
  FileSpreadsheet,
  PlusCircle,
  BarChart3,
  Sparkles,
  UserCheck,
} from "lucide-react";

export interface AdminDashboardProps {
  metrics: DashboardMetrics;
  activities?: ActivityItem[];
  appointments?: AppointmentRow[];
  isSuperAdmin?: boolean;
}

export function AdminDashboard({ metrics, activities = [], appointments = [], isSuperAdmin = false }: AdminDashboardProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleAddDoctor = () => {
    router.push("/doctors/registration");
  };

  const handleAddHR = () => {
    router.push("/hr/registration");
  };

  const handleAddStaff = () => {
    router.push("/staffs/registration");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Hero Welcome Banner */}
      <WelcomeCard
        userName={isSuperAdmin ? "Super Administrator" : "Hospital Administrator"}
        roleName={isSuperAdmin ? "Super Admin" : "Admin Portal"}
        subtitle="Hospital ERP metrics are updated live. All departments are operating within expected parameters."
        onQuickAction={handleAddDoctor}
        actionText="Add New Doctor"
      />

      {/* 8 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value={metrics.totalPatients.toLocaleString()}
          change="+12% this month"
          trend="up"
          subtitle="1,024 Active Records"
          icon={<Users className="h-5 w-5" />}
          gradient="from-sky-500/20 to-indigo-500/10"
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Total Doctors"
          value={metrics.totalDoctors.toString()}
          change="8 Wards Active"
          trend="neutral"
          subtitle="94% Availability Rate"
          icon={<Stethoscope className="h-5 w-5" />}
          gradient="from-teal-500/20 to-emerald-500/10"
          iconColor="text-teal-600 bg-teal-500/10 dark:bg-teal-500/20"
        />
        <StatCard
          title="Today's Appointments"
          value={metrics.todaysAppointments.toString()}
          change="+8 today"
          trend="up"
          subtitle="34 Consultations Done"
          icon={<Calendar className="h-5 w-5" />}
          gradient="from-indigo-500/20 to-purple-500/10"
          iconColor="text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20"
        />
        <StatCard
          title="Active Admissions"
          value={metrics.activeAdmissions.toString()}
          change="82% Occupancy"
          trend="up"
          subtitle="32 Ward Beds Occupied"
          icon={<BedDouble className="h-5 w-5" />}
          gradient="from-purple-500/20 to-rose-500/10"
          iconColor="text-purple-600 bg-purple-500/10 dark:bg-purple-500/20"
        />
        <StatCard
          title="Revenue Today"
          value={`$${metrics.revenueToday.toLocaleString()}`}
          change="+18.4%"
          trend="up"
          subtitle="Gross Daily Collection"
          icon={<DollarSign className="h-5 w-5" />}
          gradient="from-emerald-500/20 to-teal-500/10"
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Pending Bills"
          value={metrics.pendingBills.toString()}
          change="Requires Follow-up"
          trend="down"
          subtitle="$15,800 Uncollected"
          icon={<CreditCard className="h-5 w-5" />}
          gradient="from-amber-500/20 to-orange-500/10"
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Available Beds"
          value={metrics.availableBeds.toString()}
          change="Ready for Intake"
          trend="neutral"
          subtitle="12 General, 6 ICU"
          icon={<Bed className="h-5 w-5" />}
          gradient="from-sky-500/20 to-cyan-500/10"
          iconColor="text-cyan-600 bg-cyan-500/10 dark:bg-cyan-500/20"
        />
        <StatCard
          title="Emergency Patients"
          value={metrics.emergencyPatients.toString()}
          change="Triaged"
          trend="up"
          subtitle="Emergency Ward Bay 1-4"
          icon={<ShieldAlert className="h-5 w-5" />}
          gradient="from-rose-500/20 to-red-500/10"
          iconColor="text-rose-600 bg-rose-500/10 dark:bg-rose-500/20"
        />
      </div>

      {/* Quick Action Buttons Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            Quick ERP Actions
          </h2>
          <span className="text-xs text-slate-500 font-semibold">One-click hospital workflows</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickActionCard
            title="HR"
            description="Onboard HR manager"
            icon={<UserCheck className="h-5 w-5" />}
            onClick={handleAddHR}
            color="bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/25 dark:text-cyan-300"
          />
          <QuickActionCard
            title="Staff Management"
            description="Register new employee"
            icon={<Users className="h-5 w-5" />}
            onClick={handleAddStaff}
            color="bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300"
          />
          <QuickActionCard
            title="Book Appointment"
            description="Schedule consultation slot"
            icon={<Calendar className="h-5 w-5" />}
            onClick={() => setActiveModal("book_appointment")}
            color="bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-300"
          />
          <QuickActionCard
            title="Add Doctor"
            description="Onboard medical consultant"
            icon={<Stethoscope className="h-5 w-5" />}
            onClick={handleAddDoctor}
            color="bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-300"
          />
          <QuickActionCard
            title="Generate Bill"
            description="Create payment invoice"
            icon={<CreditCard className="h-5 w-5" />}
            onClick={() => setActiveModal("generate_bill")}
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

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
