import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: string;
  iconColor?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  trend = "up",
  subtitle,
  icon,
  gradient = "from-sky-500/10 to-teal-500/5",
  iconColor = "text-sky-500 bg-sky-500/10 dark:bg-sky-500/20",
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl glass-card p-5 glass-card-hover cursor-pointer transition-all",
        onClick && "hover:ring-2 hover:ring-sky-500/40"
      )}
    >
      {/* Decorative subtle background gradient blur */}
      <div
        className={cn(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-all group-hover:scale-125",
          gradient
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 shadow-xs",
            iconColor
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>

        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
              trend === "up"
                ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                : trend === "down"
                ? "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                : "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
            )}
          >
            {trend === "up" && <TrendingUp className="h-3 w-3" />}
            {trend === "down" && <TrendingDown className="h-3 w-3" />}
            {trend === "neutral" && <Minus className="h-3 w-3" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
