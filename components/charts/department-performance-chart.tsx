"use client";

import React from "react";
import { Building2 } from "lucide-react";

export function DepartmentPerformanceChart() {
  const departments = [
    { name: "Cardiology", admissions: 124, efficiency: 94, color: "bg-sky-500" },
    { name: "Neurology", admissions: 98, efficiency: 89, color: "bg-teal-500" },
    { name: "Orthopedics", admissions: 85, efficiency: 92, color: "bg-indigo-500" },
    { name: "Pediatrics", admissions: 110, efficiency: 96, color: "bg-purple-500" },
    { name: "Emergency", admissions: 215, efficiency: 98, color: "bg-rose-500" },
  ];

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Department Performance
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Admissions and patient care efficiency rates
          </p>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          5 Core Wards
        </span>
      </div>

      <div className="my-4 space-y-3.5">
        {departments.map((dept, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">{dept.name}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {dept.admissions} Patients ({dept.efficiency}% score)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${dept.color} rounded-full transition-all duration-500`}
                style={{ width: `${(dept.admissions / 220) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Highest Volume: Emergency</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          93.8% Overall Satisfaction
        </span>
      </div>
    </div>
  );
}
