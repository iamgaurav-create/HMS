"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, Eye, Mail, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/roles";
import { toast } from "sonner";
import { resendStaffCredentialsAction, toggleStaffStatusAction, toggleDoctorStatusAction } from "@/lib/actions/dashboard-actions";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type AccountItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  type: "staff" | "doctor";
  updated_at: Date | string;
};

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return `${parts[0]?.charAt(0) || ""}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

const statusColors: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900",
  Inactive: "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800",
  Dormant: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900",
};

export function AccountStatusTable({ items }: { items: AccountItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ item: AccountItem; newStatus: "Active" | "Inactive" | "Dormant" } | null>(null);

  const handleResendCredentials = async (item: AccountItem) => {
    setActionLoading(`credentials-${item.id}`);
    try {
      const result = await resendStaffCredentialsAction(item.type, item.id);
      if (!result.success) toast.error(result.error || "Failed to resend credentials.");
      else toast.success(`New login credentials have been sent to ${item.email}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query) ||
          item.department?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [items, searchQuery, statusFilter]);

  const handleToggle = async (item: AccountItem, newStatus: "Active" | "Inactive" | "Dormant") => {
    setPendingToggle({ item, newStatus });
  };

  const handleToggleConfirm = async () => {
    if (!pendingToggle) return;
    const { item, newStatus } = pendingToggle;
    setActionLoading(item.id);
    try {
      if (item.type === "doctor") {
        await toggleDoctorStatusAction(item.id, newStatus);
      } else {
        await toggleStaffStatusAction(item.id, newStatus);
      }
      window.location.reload();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setActionLoading(null);
      setPendingToggle(null);
    }
  };

  return (
    <section className="overflow-hidden  rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  Account Status Management
                </h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {filteredItems.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Activate, deactivate, or set accounts to dormant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-10 text-xs shadow-none transition-all focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-transparent px-3 py-2 text-xs outline-none dark:bg-input/30"
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
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Updated</th>
              <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No accounts found</p>
                    <p className="mt-1 text-xs text-slate-400">Try changing your filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:ring-slate-700">
                        {getInitials(item.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <p className="max-w-[180px] truncate text-[10px] text-slate-400">{item.email}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {ROLE_LABELS[item.role as AppRole] || item.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {item.department || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${statusColors[item.status] || "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatDate(item.updated_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={item.type === "doctor" ? `/doctors/${item.id}` : `/staffs/${item.id}`}
                        title="View details"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        title="Resend login credentials"
                        disabled={actionLoading === `credentials-${item.id}`}
                        onClick={() => handleResendCredentials(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 disabled:opacity-50 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {item.status !== "Active" ? (
                        <button
                          type="button"
                          disabled={actionLoading === item.id}
                          onClick={() => setPendingToggle({ item, newStatus: "Active" })}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900"
                        >
                          {actionLoading === item.id ? "..." : "Activate"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading === item.id}
                          onClick={() => setPendingToggle({ item, newStatus: "Inactive" })}
                          className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800"
                        >
                          {actionLoading === item.id ? "..." : "Deactivate"}
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
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{filteredItems.length}</span> accounts
          </p>
        </div>
      )}

      <ConfirmationDialog
        open={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        onConfirm={handleToggleConfirm}
        title={
          pendingToggle?.item.role === "HR"
            ? "Deactivate HR Account"
            : pendingToggle?.newStatus === "Active"
              ? "Activate Account"
              : "Deactivate Account"
        }
        description={
          pendingToggle?.item.role === "HR"
            ? `You are about to deactivate the HR account for ${pendingToggle?.item.name}. This will revoke their login access and may impact HR operations. Proceed with caution.`
            : pendingToggle?.newStatus === "Active"
              ? `Are you sure you want to activate ${pendingToggle?.item.name}'s account? They will regain access to the system.`
              : `Are you sure you want to deactivate ${pendingToggle?.item.name}'s account? They will no longer be able to log in.`
        }
        confirmLabel={pendingToggle?.newStatus === "Active" ? "Activate" : "Deactivate"}
        variant={pendingToggle?.item.role === "HR" ? "danger" : pendingToggle?.newStatus === "Active" ? "default" : "warning"}
        loading={actionLoading === pendingToggle?.item.id}
      />
    </section>
  );
}
