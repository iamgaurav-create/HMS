"use client";

import React from "react";
import Link from "next/link";
import { StatCard } from "@/components/cards/stat-card";
import { QuickActionCard } from "@/components/cards/quick-action-card";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { useRouter } from "next/navigation";
import type { RoleCount } from "@/lib/db/dashboard-data";
import {
  Stethoscope,
  UserPlus,
  Users,
  ShieldCheck,
  FlaskConical,
  Pill,
  Calculator,
  HeartPulse,
  ClipboardCheck,
  ArrowRight,
  Clock,
  UserMinus,
  Sparkles,
  Activity,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/roles";

const ROLE_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string; iconColor: string; href: string }> = {
  Receptionist: {
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-300",
    gradient: "from-blue-500/20 to-indigo-500/10",
    iconColor: "text-blue-600 bg-blue-500/10 dark:bg-blue-500/20",
    href: "/hr/receptionists",
  },
  Nurse: {
    icon: <HeartPulse className="h-5 w-5" />,
    color: "bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300",
    gradient: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-600 bg-rose-500/10 dark:bg-rose-500/20",
    href: "/hr/nurses",
  },
  LabTechnician: {
    icon: <FlaskConical className="h-5 w-5" />,
    color: "bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300",
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600 bg-amber-500/10 dark:bg-amber-500/20",
    href: "/hr/lab-technicians",
  },
  Pharmacist: {
    icon: <Pill className="h-5 w-5" />,
    color: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300",
    gradient: "from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20",
    href: "/hr/pharmacists",
  },
  Accountant: {
    icon: <Calculator className="h-5 w-5" />,
    color: "bg-violet-500/15 text-violet-600 dark:bg-violet-500/25 dark:text-violet-300",
    gradient: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-600 bg-violet-500/10 dark:bg-violet-500/20",
    href: "/hr/accountants",
  },
  HR: {
    icon: <Users className="h-5 w-5" />,
    color: "bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300",
    gradient: "from-sky-500/20 to-indigo-500/10",
    iconColor: "text-sky-600 bg-sky-500/10 dark:bg-sky-500/20",
    href: "/staffs",
  },
};

export interface HRManagementHubProps {
  roleCounts: RoleCount[];
  doctorCount: { total: number; active: number; inactive: number };
  pendingOnboarding: number;
  recentActivities: { id: string; action: string; time: string }[];
}

export function HRManagementHub({
  roleCounts,
  doctorCount,
  pendingOnboarding,
  recentActivities,
}: HRManagementHubProps) {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="HR Manager"
        roleName="HR Management Portal"
        subtitle="Manage staff accounts, onboarding, roles, and personnel records across all departments."
        onQuickAction={() => router.push("/staffs/registration")}
        actionText="Register New Staff"
      />

      {/* Doctor Card + Role Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-500" />
            Staff by Department
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Click a card to manage</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Doctor Card */}
          <Link href="/hr/doctors" className="block">
            <StatCard
              title="Doctors"
              value={doctorCount.total.toString()}
              change={`${doctorCount.active} active · ${doctorCount.inactive} inactive`}
              trend="neutral"
              subtitle="Medical staff"
              icon={<Stethoscope className="h-5 w-5" />}
              gradient="from-teal-500/20 to-emerald-500/10"
              iconColor="text-teal-600 bg-teal-500/10 dark:bg-teal-500/20"
            />
          </Link>

          {/* Role-specific cards */}
          {roleCounts
            .filter((rc) => rc.role !== "HR")
            .map((rc) => {
              const config = ROLE_CONFIG[rc.role];
              if (!config) return null;
              return (
                <Link key={rc.role} href={config.href} className="block">
                  <StatCard
                    title={ROLE_LABELS[rc.role as AppRole] || rc.role}
                    value={rc.total.toString()}
                    change={`${rc.active} active · ${rc.inactive} inactive`}
                    trend="neutral"
                    subtitle={`${rc.role} accounts`}
                    icon={config.icon}
                    gradient={config.gradient}
                    iconColor={config.iconColor}
                  />
                </Link>
              );
            })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-500" />
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickActionCard
            title="Register Doctor"
            description="Onboard a new medical consultant"
            icon={<Stethoscope className="h-5 w-5" />}
            onClick={() => router.push("/staffs/registration?defaultRole=Doctor")}
            color="bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-300"
          />
          <QuickActionCard
            title="Register Staff"
            description="Add a new employee"
            icon={<UserPlus className="h-5 w-5" />}
            onClick={() => router.push("/staffs/registration")}
            color="bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300"
          />
          <QuickActionCard
            title="Onboarding Status"
            description={`${pendingOnboarding} pending setup`}
            icon={<ClipboardCheck className="h-5 w-5" />}
            onClick={() => router.push("/hr/onboarding")}
            color="bg-amber-500/15 text-amber-600 dark:bg-amber-500/25 dark:text-amber-300"
          />
          <QuickActionCard
            title="Account Status"
            description="Manage active/inactive accounts"
            icon={<UserMinus className="h-5 w-5" />}
            onClick={() => router.push("/hr/account-status")}
            color="bg-rose-500/15 text-rose-600 dark:bg-rose-500/25 dark:text-rose-300"
          />
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              Recent HR Activity
            </h2>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40">
                      <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {activity.action}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
