"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";
import {
  toggleStaffStatusAction,
  offboardStaffAction,
  deleteStaffAction,
  changeStaffRoleAction,
} from "@/lib/actions/dashboard-actions";
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface StaffDetailActionsProps {
  staffId: string;
  currentStatus: string;
  currentRole: string;
  staffName: string;
  userRole: string;
  clerkUserId: string | null;
}

export function StaffDetailActions({
  staffId,
  currentStatus,
  currentRole,
  staffName,
  userRole,
  clerkUserId,
}: StaffDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleChangeOpen, setRoleChangeOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const canRemoveStaff = userRole === "SuperAdmin" || userRole === "admin" || (userRole === "HR" && currentRole !== "HR");
  const isActive = currentStatus === "Active";

  const staffRoles: AppRole[] = [
    "Receptionist",
    "Nurse",
    "LabTechnician",
    "Pharmacist",
    "Accountant",
    "HR",
  ];
  const assignableRoles = userRole === "HR" ? staffRoles.filter((role) => role !== "HR") : staffRoles;

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = isActive ? "Inactive" : "Active";
      const result = await toggleStaffStatusAction(
        staffId,
        newStatus as "Active" | "Inactive" | "Dormant"
      );
      if (result.success) {
        toast.success(
          `${staffName} has been ${newStatus === "Active" ? "reactivated" : "deactivated"}.`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setDeactivateOpen(false);
    }
  };

  const handleOffboard = async () => {
    setLoading(true);
    try {
      const result = await offboardStaffAction(staffId);
      if (result.success) {
        toast.success(`${staffName} has been offboarded successfully.`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to offboard staff.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setOffboardOpen(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteStaffAction(staffId);
      if (result.success) {
        toast.success(`${staffName} has been permanently deleted.`);
        router.push("/staffs");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete staff.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      setRoleChangeOpen(false);
      return;
    }

    setLoading(true);
    try {
      const result = await changeStaffRoleAction(
        staffId,
        selectedRole as AppRole
      );
      if (result.success) {
        toast.success(
          `${staffName}'s role has been changed to ${ROLE_LABELS[selectedRole as AppRole] || selectedRole}.`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to change role.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setRoleChangeOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle status */}
        <button
          type="button"
          onClick={() => setDeactivateOpen(true)}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            isActive
              ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/60"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
          }`}
        >
          {isActive ? (
            <ShieldAlert className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {isActive ? "Deactivate" : "Reactivate"}
        </button>

        {/* Offboard */}
        {isActive && (
          <button
            type="button"
            onClick={() => setOffboardOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-400 dark:hover:bg-orange-950/60"
          >
            <UserX className="h-4 w-4" />
            Offboard
          </button>
        )}

        {/* Change role */}
        <button
          type="button"
          onClick={() => setRoleChangeOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-950/60"
        >
          <RefreshCw className="h-4 w-4" />
          Change Role
        </button>

        {/* Delete — admin only */}
        {canRemoveStaff && (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>

      {/* Deactivate/Reactivate confirmation */}
      <ConfirmationDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleToggleStatus}
        title={
          currentRole === "HR" && isActive
            ? "Deactivate HR Account"
            : isActive
              ? "Deactivate Staff Account"
              : "Reactivate Staff Account"
        }
        description={
          currentRole === "HR" && isActive
            ? `You are about to deactivate the HR account for ${staffName}. This will revoke their system login access and may impact HR operations. Proceed with caution.`
            : isActive
              ? `Are you sure you want to deactivate ${staffName}'s account? They will no longer be able to log in to the system.`
              : `Are you sure you want to reactivate ${staffName}'s account? They will be able to log in again.`
        }
        confirmLabel={isActive ? "Deactivate" : "Reactivate"}
        variant={currentRole === "HR" && isActive ? "danger" : isActive ? "warning" : "default"}
        loading={loading}
      />

      {/* Offboard confirmation */}
      <ConfirmationDialog
        open={offboardOpen}
        onClose={() => setOffboardOpen(false)}
        onConfirm={handleOffboard}
        title="Offboard Staff Member"
        description={`This will deactivate ${staffName}'s account and disable their login access. The staff record will be preserved for audit purposes. This action can be reversed by reactivating the account.`}
        confirmLabel="Offboard"
        variant="warning"
        loading={loading}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Permanently Delete Staff Record"
        description={`This will permanently delete ${staffName}'s account and all associated data. Their Clerk login will also be removed. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={loading}
      />

      {/* Role change dialog */}
      {roleChangeOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
          style={{ position: "fixed" }}
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setRoleChangeOpen(false)} />
          <div className="relative z-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Change Staff Role
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Select a new role for {staffName}. This will update both the
              database and their login permissions.
            </p>
            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Current Role:{" "}
                <span className="text-slate-900 dark:text-white">
                  {ROLE_LABELS[currentRole as AppRole] || currentRole}
                </span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none dark:bg-input/30"
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] || r}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRoleChangeOpen(false)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChange}
                disabled={loading || selectedRole === currentRole}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-colors hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
