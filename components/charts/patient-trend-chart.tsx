"use client";

import React from "react";
import { Users, UserPlus } from "lucide-react";

export function PatientTrendChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const trends = [28, 42, 35, 54, 60, 38, 48];

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-teal-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Patient Registration Trend
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily new patient registrations this week
          </p>
        </div>
        <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-600 dark:text-teal-400">
          +305 Total
        </span>
      </div>

      <div className="my-6 flex items-end justify-between gap-2 h-36 pt-4 px-2">
        {trends.map((val, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
            <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {val}
            </span>
            <div
              className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-sky-500 to-teal-400 group-hover:brightness-110 transition-all duration-300 shadow-sm"
              style={{ height: `${(val / 70) * 100}%` }}
            />
            <span className="text-[11px] font-semibold text-slate-400">
              {days[idx]}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Peak Registration: Friday (60)</span>
        <span className="text-sky-600 dark:text-sky-400 font-bold">
          43.5 Avg/Day
        </span>
      </div>
    </div>
  );
}
