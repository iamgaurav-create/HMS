"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  Stethoscope,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { AppointmentStatusActions } from "./appointment-status-actions";

export interface AppointmentItem {
  id: number;
  appointmentDate: Date | string;
  time: string;
  type: string;
  status: string;
  reason: string | null;
  patient: {
    first_name: string;
    last_name: string;
    patientNumber: string;
    phone: string;
  };
  doctor: {
    name: string;
    specialization: string;
    department: string | null;
  };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "Confirmed":
    case "Scheduled":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
    case "InProgress":
    case "CheckedIn":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
    case "Cancelled":
    case "NoShow":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800";
  }
}

export function AppointmentsList({
  initialAppointments,
  isStaffOrAdmin,
}: {
  initialAppointments: AppointmentItem[];
  isStaffOrAdmin: boolean;
}) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "Pending").length,
    [appointments]
  );

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        !search.trim() ||
        `${a.patient.first_name} ${a.patient.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        a.patient.patientNumber.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.reason && a.reason.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && a.status === "Pending") ||
        (statusFilter === "scheduled" && (a.status === "Scheduled" || a.status === "Confirmed")) ||
        (statusFilter === "completed" && a.status === "Completed") ||
        (statusFilter === "cancelled" && (a.status === "Cancelled" || a.status === "NoShow"));

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient, MRN, doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-slate-900 text-white dark:bg-sky-600"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            All ({appointments.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`relative rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white"
                : "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("scheduled")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "scheduled"
                ? "bg-sky-600 text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Scheduled
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Completed
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("cancelled")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "cancelled"
                ? "bg-red-600 text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Appointments Roster ({filtered.length})
          </h2>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {pendingCount} Pending Action
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No appointments found matching your criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((apt) => (
              <div
                key={apt.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    {apt.patient.first_name[0]}{apt.patient.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </h3>
                      <span className="text-xs text-slate-400">
                        ({apt.patient.patientNumber})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Doctor: <span className="font-semibold text-slate-700 dark:text-slate-300">Dr. {apt.doctor.name}</span> · {apt.doctor.specialization}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(apt.appointmentDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {apt.time}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {apt.type}
                      </span>
                      {apt.reason && (
                        <span className="text-slate-400 italic">
                          &ldquo;{apt.reason}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                      apt.status
                    )}`}
                  >
                    {apt.status}
                  </span>

                  {isStaffOrAdmin && (
                    <AppointmentStatusActions
                      appointmentId={apt.id}
                      currentStatus={apt.status}
                      onStatusChange={(newStatus) => handleStatusChange(apt.id, newStatus)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
