"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";
import {
  ShieldCheck,
  Stethoscope,
  UserCheck,
  FlaskConical,
  Pill,
  CreditCard,
  User,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  SuperAdmin: <ShieldAlert className="h-4 w-4 text-purple-500" />,
  admin: <ShieldCheck className="h-4 w-4 text-blue-500" />,
  HR: <UserCheck className="h-4 w-4 text-cyan-500" />,
  Doctor: <Stethoscope className="h-4 w-4 text-emerald-500" />,
  Receptionist: <UserCheck className="h-4 w-4 text-amber-500" />,
  Nurse: <UserCheck className="h-4 w-4 text-teal-500" />,
  LabTechnician: <FlaskConical className="h-4 w-4 text-indigo-500" />,
  Pharmacist: <Pill className="h-4 w-4 text-rose-500" />,
  Accountant: <CreditCard className="h-4 w-4 text-emerald-600" />,
  patient: <User className="h-4 w-4 text-sky-500" />,
};

const PREVIEWABLE_ROLES: Record<AppRole, AppRole[]> = {
  patient: [],
  HR: ["HR", "Receptionist", "Nurse", "patient", "Doctor"],
  Receptionist: ["patient", "Doctor", "Receptionist"],
  Nurse: ["patient", "Doctor", "Nurse"],
  LabTechnician: ["patient", "Doctor", "LabTechnician"],
  Pharmacist: ["patient", "Doctor", "Pharmacist", "Nurse"],
  Accountant: ["patient", "admin", "Accountant"],
  Doctor: ["Receptionist", "Nurse", "LabTechnician", "Pharmacist", "Doctor"],
  admin: ["SuperAdmin", "admin", "HR", "Doctor", "Receptionist", "Nurse", "LabTechnician", "Pharmacist", "Accountant"],
  SuperAdmin: ["SuperAdmin", "admin", "HR", "Doctor", "Receptionist", "Nurse", "LabTechnician", "Pharmacist", "Accountant", "patient"],
};

export function RoleSwitcher({ currentRole }: { currentRole: AppRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as AppRole) || currentRole;
  const [isOpen, setIsOpen] = useState(false);

  const previewableRoles = PREVIEWABLE_ROLES[currentRole] ?? [];

  if (previewableRoles.length === 0) {
    return null;
  }

  const handleSelectRole = (role: AppRole) => {
    setIsOpen(false);
    router.push(`/dashboard?role=${role}`);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/60"
      >
        <div className="flex items-center gap-2 truncate">
          {ROLE_ICONS[activeRole] || ROLE_ICONS.admin}
          <div className="flex flex-col text-left truncate">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Previewing Role
            </span>
            <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {ROLE_LABELS[activeRole] || activeRole}
            </span>
          </div>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-50 duration-150">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Switch ERP View Mode
            </div>
            {previewableRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleSelectRole(role)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeRole === role
                    ? "bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                }`}
              >
                {ROLE_ICONS[role]}
                <span>{ROLE_LABELS[role]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
