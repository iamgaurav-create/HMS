"use client";

import React from "react";
import { DollarSign, TrendingUp } from "lucide-react";

export function RevenueAnalyticsChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const revenueData = [32000, 41000, 38000, 52000, 61000, 58000, 74500];
  const maxVal = 80000;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Revenue Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monthly gross income vs collections
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>+24.8% YOY</span>
        </div>
      </div>

      {/* SVG Responsive Area Chart */}
      <div className="my-6 h-44 w-full">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 400 150">
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
          <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />
          <line x1="0" y1="130" x2="400" y2="130" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" />

          {/* Area Fill */}
          <path
            d="M 10 110 L 60 90 L 120 98 L 180 65 L 240 45 L 305 52 L 380 20 L 380 140 L 10 140 Z"
            fill="url(#revenueGrad)"
          />

          {/* Smooth Line */}
          <path
            d="M 10 110 L 60 90 L 120 98 L 180 65 L 240 45 L 305 52 L 380 20"
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {[
            { x: 10, y: 110, val: "$32k" },
            { x: 60, y: 90, val: "$41k" },
            { x: 120, y: 98, val: "$38k" },
            { x: 180, y: 65, val: "$52k" },
            { x: 240, y: 45, val: "$61k" },
            { x: 305, y: 52, val: "$58k" },
            { x: 380, y: 20, val: "$74.5k" },
          ].map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={pt.x} cy={pt.y} r="5" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
            </g>
          ))}
        </svg>

        {/* X Axis Labels */}
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-2 px-1">
          {months.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-slate-500">Peak Month: July ($74,500)</span>
        <span className="text-sky-600 dark:text-sky-400 font-bold">Avg $51.0k/mo</span>
      </div>
    </div>
  );
}
