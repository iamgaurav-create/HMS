"use client";

import React from "react";
import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

export function AppointmentStatsChart() {
  const stats = [
    { label: "Completed", count: 142, percentage: 65, color: "bg-emerald-500", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
    { label: "Scheduled", count: 48, percentage: 22, color: "bg-sky-500", icon: <Clock className="h-4 w-4 text-sky-500" /> },
    { label: "Cancelled", count: 18, percentage: 8, color: "bg-rose-500", icon: <XCircle className="h-4 w-4 text-rose-500" /> },
    { label: "Pending", count: 11, percentage: 5, color: "bg-amber-500", icon: <Calendar className="h-4 w-4 text-amber-500" /> },
  ];

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Appointment Statistics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Today&apos;s consultation breakdown (219 Total)
          </p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400">
          This Week
        </span>
      </div>

      {/* Progress Bar Stack */}
      <div className="my-6 space-y-2">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
          {stats.map((item, i) => (
            <div
              key={i}
              className={`${item.color} h-full rounded-full transition-all duration-500`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.label}: ${item.count} (${item.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {item.count}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
