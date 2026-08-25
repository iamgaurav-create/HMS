"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  toggleDoctorStatusAction,
  offboardDoctorAction,
  deleteDoctorAction,
} from "@/lib/actions/dashboard-actions";
import {
  ShieldAlert,
  ShieldCheck,
  UserX,
  Trash2,
} from "lucide-react";

interface DoctorDetailActionsProps {
  doctorId: string;
  currentStatus: string;
  doctorName: string;
  userRole: string;
  clerkUserId: string | null;
}

export function DoctorDetailActions({
  doctorId,
  currentStatus,
  doctorName,
  userRole,
  clerkUserId,
}: DoctorDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [offboardOpen, setOffboardOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canRemoveDoctor = userRole === "SuperAdmin" || userRole === "admin" || userRole === "HR";
  const isActive = currentStatus === "Active";

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = isActive ? "Inactive" : "Active";
      const result = await toggleDoctorStatusAction(
        doctorId,
        newStatus as "Active" | "Inactive" | "Dormant"
      );
      if (result.success) {
        toast.success(
          `Dr. ${doctorName} has been ${newStatus === "Active" ? "reactivated" : "deactivated"}.`
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
      const result = await offboardDoctorAction(doctorId);
      if (result.success) {
        toast.success(`Dr. ${doctorName} has been offboarded successfully.`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to offboard doctor.");
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
      const result = await deleteDoctorAction(doctorId);
      if (result.success) {
        toast.success(`Dr. ${doctorName} has been permanently deleted.`);
        router.push("/doctors");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete doctor.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setDeleteOpen(false);
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

        {/* Delete — admin only */}
        {canRemoveDoctor && (
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
        title={isActive ? "Deactivate Doctor Account" : "Reactivate Doctor Account"}
        description={
          isActive
            ? `Are you sure you want to deactivate Dr. ${doctorName}'s account? They will no longer be able to log in or manage appointments.`
            : `Are you sure you want to reactivate Dr. ${doctorName}'s account? They will be able to log in and manage appointments again.`
        }
        confirmLabel={isActive ? "Deactivate" : "Reactivate"}
        variant={isActive ? "warning" : "default"}
        loading={loading}
      />

      {/* Offboard confirmation */}
      <ConfirmationDialog
        open={offboardOpen}
        onClose={() => setOffboardOpen(false)}
        onConfirm={handleOffboard}
        title="Offboard Doctor"
        description={`This will deactivate Dr. ${doctorName}'s account and disable their login access. Their patient records, appointments, and diagnosis history will be preserved. This action can be reversed by reactivating the account.`}
        confirmLabel="Offboard"
        variant="warning"
        loading={loading}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Permanently Delete Doctor Record"
        description={`This will permanently delete Dr. ${doctorName}'s account. This action cannot be undone. Note: Doctors with existing appointments or diagnoses cannot be deleted — use offboarding instead.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        loading={loading}
      />
    </>
  );
}
