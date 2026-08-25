"use client";

import React from "react";
import { CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function AccountRevenueChart() {
  const weeks = ["W1", "W2", "W3", "W4"];
  const income = [18400, 24100, 21900, 28500];
  const pending = [4200, 3100, 5600, 2900];

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Financial Collections vs Unpaid Claims
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weekly breakdown for Accountant Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Income
          </span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
          </span>
        </div>
      </div>

      <div className="my-6 space-y-4">
        {weeks.map((w, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">{w}</span>
              <span className="text-slate-500 dark:text-slate-400">
                ${income[idx].toLocaleString()} Collected / ${pending[idx].toLocaleString()} Pending
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${(income[idx] / 32000) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full rounded-r-full transition-all duration-500 opacity-80"
                style={{ width: `${(pending[idx] / 32000) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span>Month Total: $92,900 Collected</span>
        <span className="text-amber-600 dark:text-amber-400 font-semibold">
          $15,800 Pending Recovery
        </span>
      </div>
    </div>
  );
}
