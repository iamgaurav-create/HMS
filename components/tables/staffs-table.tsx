"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Users, Eye, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";
import {
  resendStaffCredentialsAction,
  toggleStaffStatusAction,
} from "@/lib/actions/dashboard-actions";

export type Staff = {
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
  created_at: Date | string;
};

const statusColors: Record<string, string> = {
  Active:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
  Inactive:
    "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
  Dormant:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function StaffsTable({
  staffs,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  allRoles = [],
  currentPage = 1,
  totalPages = 1,
  totalStaff = 0,
  onPageChange,
  userRole,
}: {
  staffs: Staff[];
  roleFilter?: string;
  setRoleFilter?: (value: string) => void;
  statusFilter?: string;
  setStatusFilter?: (value: string) => void;
  allRoles?: string[];
  currentPage?: number;
  totalPages?: number;
  totalStaff?: number;
  onPageChange?: (page: number) => void;
  userRole?: AppRole;
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [localRoleFilter, setLocalRoleFilter] = useState("all");
  const [localStatusFilter, setLocalStatusFilter] = useState("all");
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedRole = roleFilter ?? localRoleFilter;
  const selectedStatus = statusFilter ?? localStatusFilter;

  const isHRViewer = userRole === "HR";

  const availableRoles = allRoles.length
    ? allRoles
    : Array.from(new Set(staffs.map((staff) => staff.role))).sort();

  const visibleRoles = isHRViewer
    ? availableRoles.filter((role) => role !== "HR")
    : availableRoles;

  const filteredStaffs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return staffs.filter((staff) => {
      const matchesSearch =
        !query ||
        staff.name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        staff.role.toLowerCase().includes(query) ||
        (staff.department?.toLowerCase().includes(query) ?? false) ||
        staff.phone.toLowerCase().includes(query) ||
        (staff.hospitalEmail?.toLowerCase().includes(query) ?? false);

      const matchesRole =
        selectedRole === "all" || staff.role === selectedRole;

      const matchesStatus =
        selectedStatus === "all" || staff.status === selectedStatus;

      const notHR = !isHRViewer || staff.role !== "HR";

      return matchesSearch && matchesRole && matchesStatus && notHR;
    });
  }, [
    staffs,
    searchQuery,
    selectedRole,
    selectedStatus,
    isHRViewer,
  ]);

  const handleResendCredentials = async (staff: Staff) => {
    setActionLoading(`credentials-${staff.id}`);

    try {
      const result = await resendStaffCredentialsAction("staff", staff.id);

      if (!result.success) {
        toast.error(
          result.error || "Failed to resend credentials."
        );
        return;
      }

      toast.success(
        `New login credentials have been sent to ${staff.email}.`
      );
    } catch {
      toast.error("Failed to resend credentials.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (staff: Staff) => {
    const newStatus =
      staff.status === "Active" ? "Inactive" : "Active";

    setStatusLoadingId(staff.id);

    try {
      const result = await toggleStaffStatusAction(
        staff.id,
        newStatus
      );

      if (!result.success) {
        toast.error(
          result.error || "Unable to update account status."
        );
        return;
      }

      toast.success(
        `${staff.name}'s account is now ${newStatus.toLowerCase()}.`
      );

      router.refresh();
    } catch {
      toast.error("Unable to update account status.");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const updateRoleFilter = (value: string) => {
    setLocalRoleFilter(value);
    setRoleFilter?.(value);
    onPageChange?.(1);
  };

  const updateStatusFilter = (value: string) => {
    setLocalStatusFilter(value);
    setStatusFilter?.(value);
    onPageChange?.(1);
  };

  const pageSize = 10;

  const isServerPaginated =
    totalStaff > 0 && staffs.length <= pageSize && totalPages > 1;

  const paginatedStaffs = isServerPaginated
    ? filteredStaffs
    : filteredStaffs.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      );

  const displayTotal = isServerPaginated
    ? totalStaff
    : filteredStaffs.length;

  const displayStart =
    displayTotal === 0
      ? 0
      : isServerPaginated
        ? (currentPage - 1) * pageSize + 1
        : (currentPage - 1) * pageSize + 1;

  const displayEnd = isServerPaginated
    ? Math.min(currentPage * pageSize, totalStaff)
    : Math.min(currentPage * pageSize, filteredStaffs.length);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Staff Management
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {displayTotal}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Manage and monitor hospital staff
              </p>
            </div>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              type="search"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onPageChange?.(1);
              }}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs shadow-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Filters
            </span>

            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {displayTotal} results
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => updateRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 py-2 text-xs outline-none dark:bg-input/30"
            >
              <option value="all">All Roles</option>

              {visibleRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role as AppRole] || role}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => updateStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-input bg-transparent px-3 py-2 text-xs outline-none dark:bg-input/30"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Dormant">Dormant</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Staff
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Role
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Department
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Contact
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                License #
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Status
              </th>

              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Hospital Email
              </th>

              <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedStaffs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No staff found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStaffs.map((staff) => (
                <tr
                  key={staff.id}
                  className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:ring-slate-700">
                        {getInitials(staff.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {staff.name}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />

                          <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {ROLE_LABELS[staff.role as AppRole] || staff.role}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {staff.department || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900">
                        <Phone className="h-3 w-3 text-slate-400" />
                      </div>

                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {staff.phone || "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {staff.license_number || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${
                        statusColors[staff.status] ||
                        "bg-slate-50 text-slate-600 ring-slate-200"
                      }`}
                    >
                      {staff.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {staff.hospitalEmail || "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/staffs/${staff.id}`}
                        title="View staff"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <button
                        type="button"
                        title="Resend login credentials"
                        disabled={
                          actionLoading ===
                          `credentials-${staff.id}`
                        }
                        onClick={() =>
                          handleResendCredentials(staff)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                      >
                        <Mail className="h-4 w-4" />
                      </button>

                      {userRole &&
                        !(
                          userRole === "HR" &&
                          staff.role === "HR"
                        ) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(staff)
                            }
                            disabled={
                              statusLoadingId === staff.id
                            }
                            className={
                              staff.status === "Active"
                                ? "rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900"
                                : "rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900"
                            }
                          >
                            {statusLoadingId === staff.id
                              ? "Saving..."
                              : staff.status === "Active"
                                ? "Deactivate"
                                : "Reactivate"}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && displayTotal > 0 && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {displayStart}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {displayEnd}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {displayTotal}
              </span>{" "}
              staff members
            </p>
          </div>

          <div className="flex items-center gap-1">
            {currentPage > 1 ? (
              <button
                type="button"
                onClick={() =>
                  onPageChange(currentPage - 1)
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Previous
              </button>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-600">
                Previous
              </span>
            )}

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => onPageChange(page)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  page === currentPage
                    ? "bg-teal-500 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages ? (
              <button
                type="button"
                onClick={() =>
                  onPageChange(currentPage + 1)
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Next
              </button>
            ) : (
              <span className="cursor-not-allowed rounded-lg border border-slate-800 px-3 py-2 text-xs font-medium text-slate-600">
                Next
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}