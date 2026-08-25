"use client";

import React, { useState } from "react";
import { UserCheck, Clock, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentStatusActions } from "@/components/appointments/appointment-status-actions";

export interface QueueItem {
  id?: number;
  token: string;
  patientName: string;
  type: "Walk-in" | "Appointment";
  assignedDoctor: string;
  waitTime: string;
  rawStatus?: string;
  status: "Checked-In" | "With Doctor" | "Waiting" | "Completed";
}

export function PatientQueueTable({
  items,
  onCheckIn,
}: {
  items?: QueueItem[];
  onCheckIn?: () => void;
}) {
  const [list, setList] = useState<QueueItem[]>(items || []);

  const handleStatusChange = (id: number, newStatus: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              rawStatus: newStatus,
              status:
                newStatus === "CheckedIn"
                  ? "Checked-In"
                  : newStatus === "Completed"
                  ? "Completed"
                  : "Waiting",
            }
          : item
      )
    );
  };

  const displayList = list.length > 0 ? list : items || [];

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Reception Live Patient Queue
          </h3>
        </div>
        {onCheckIn && (
          <Button
            onClick={onCheckIn}
            size="sm"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Book / Check-In Patient
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Token</th>
              <th className="pb-3 font-bold">Patient Name</th>
              <th className="pb-3 font-bold">Type</th>
              <th className="pb-3 font-bold">Assigned Doctor</th>
              <th className="pb-3 font-bold">Est. Wait</th>
              <th className="pb-3 font-bold">Status</th>
              <th className="pb-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No active patients in queue.
                </td>
              </tr>
            ) : (
              displayList.map((row) => (
                <tr
                  key={row.token}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {row.token}
                  </td>
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.patientName}
                  </td>
                  <td className="py-3 text-slate-500 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.type === "Walk-in"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                    {row.assignedDoctor}
                  </td>
                  <td className="py-3 text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{row.waitTime}</span>
                    </div>
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <Badge
                      variant={
                        row.rawStatus === "Pending"
                          ? "warning"
                          : row.status === "With Doctor"
                          ? "success"
                          : row.status === "Checked-In"
                          ? "info"
                          : row.status === "Completed"
                          ? "secondary"
                          : "warning"
                      }
                    >
                      {row.rawStatus === "Pending" ? "Pending" : row.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    {row.id ? (
                      <div className="flex justify-end">
                        <AppointmentStatusActions
                          appointmentId={row.id}
                          currentStatus={row.rawStatus || (row.status === "Waiting" ? "Pending" : "Scheduled")}
                          onStatusChange={(newStatus) => handleStatusChange(row.id!, newStatus)}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
