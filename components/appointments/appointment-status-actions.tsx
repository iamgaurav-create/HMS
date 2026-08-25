"use client";

import { useState, useTransition } from "react";
import { Check, X, Clock, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/lib/actions/appointment-actions";

interface Props {
  appointmentId: number;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function AppointmentStatusActions({
  appointmentId,
  currentStatus: initialStatus,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleAction = (newStatus: "Scheduled" | "Confirmed" | "CheckedIn" | "Cancelled") => {
    startTransition(async () => {
      const res = await updateAppointmentStatus({
        appointmentId,
        status: newStatus,
      });

      if (res.success) {
        setStatus(newStatus);
        if (onStatusChange) onStatusChange(newStatus);

        if (newStatus === "Scheduled" || newStatus === "Confirmed") {
          toast.success("Appointment Accepted", {
            description: "Appointment confirmed and notification sent to patient & doctor.",
          });
        } else if (newStatus === "Cancelled") {
          toast.info("Appointment Rejected / Cancelled", {
            description: "Appointment cancelled and notification sent to patient & doctor.",
          });
        } else if (newStatus === "CheckedIn") {
          toast.success("Patient Checked In", {
            description: "Patient status updated to Checked In.",
          });
        }
      } else {
        toast.error("Action Failed", {
          description: res.error || "Could not update appointment status.",
        });
      }
    });
  };

  if (status === "Pending") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("Scheduled")}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
          title="Accept and Confirm Appointment"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Accept
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("Cancelled")}
          className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 transition hover:bg-red-500 hover:text-white dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white disabled:opacity-50"
          title="Reject / Cancel Appointment"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Reject
        </button>
      </div>
    );
  }

  if (status === "Scheduled" || status === "Confirmed") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("CheckedIn")}
          className="inline-flex items-center gap-1 rounded-xl bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-600 border border-sky-200 transition hover:bg-sky-600 hover:text-white dark:border-sky-900/50 dark:text-sky-400 dark:hover:bg-sky-600 dark:hover:text-white disabled:opacity-50"
          title="Mark Patient as Checked In"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          Check In
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() => handleAction("Cancelled")}
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 disabled:opacity-50"
          title="Cancel Appointment"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
}
