"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";
import { RoleSwitcher } from "./role-switcher";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Pill,
  CreditCard,
  BedDouble,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hospital,
  Activity,
  UserCheck,
  Package,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: AppRole[];
  badge?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },

  {
    title: "Patients Roster",
    href: "/patients",
    icon: <Users className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Doctor", "Nurse", "Receptionist", "LabTechnician", "Accountant"],
  },
  {
    title: "Doctors & Staff",
    href: "/doctors",
    icon: <Stethoscope className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "HR"],
  },
  {
    title: "Staff Management",
    href: "/staffs",
    icon: <UserCheck className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "HR"],
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: <Calendar className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Doctor", "Nurse", "Receptionist"],
  },
  {
    title: "My Appointments",
    href: "/patient/appointments",
    icon: <Calendar className="h-4 w-4" />,
    roles: ["patient"],
  },
  {
    title: "Prescriptions",
    href: "/prescriptions",
    icon: <Pill className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Doctor", "Pharmacist", "Nurse", "patient"],
  },
  {
    title: "Medical Records",
    href: "/medical-records",
    icon: <FileText className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Doctor", "Nurse", "patient"],
  },
  {
    title: "Laboratory",
    href: "/laboratory",
    icon: <FlaskConical className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "LabTechnician", "Doctor"],
  },
  {
    title: "Pharmacy",
    href: "/pharmacy",
    icon: <Package className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Pharmacist", "Nurse"],
  },
  {
    title: "Billing & Invoices",
    href: "/billing",
    icon: <CreditCard className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Accountant", "Receptionist", "patient"],
  },
  {
    title: "Ward & Bed Status",
    href: "/dashboard?tab=ward",
    icon: <BedDouble className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Nurse", "Doctor"],
  },
  {
    title: "Reports & Analytics",
    href: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin", "Accountant"],
  },
  {
    title: "System Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
    roles: ["SuperAdmin", "admin"],
  },
];

export function AppSidebar({ userRole }: { userRole: AppRole }) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggleCollapsed = useSidebarStore((state) => state.toggle);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as AppRole) || userRole;

  const filteredNavItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(activeRole)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col glass-sidebar transition-all duration-300 z-30 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl medical-gradient text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Hospital className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Gaurav Hospital
              </span>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-1 uppercase tracking-wider">
                Enterprise ERP
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Role Switcher Widget */}
      {!collapsed && (
        <div className="p-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <RoleSwitcher currentRole={userRole} />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
        )}

        {filteredNavItems.map((item) => {
          const roleQuery = searchParams.get("role");
          const targetHref = roleQuery ? `${item.href}?role=${roleQuery}` : item.href;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.title}
              href={targetHref}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 dark:bg-sky-500 dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.title : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              System Online
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors mx-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
