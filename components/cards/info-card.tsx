import React from "react";
import { cn } from "@/lib/utils";

export interface InfoCardProps {
  title: string;
  badge?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
  className?: string;
}

export function InfoCard({
  title,
  badge,
  icon,
  children,
  actionButton,
  className,
}: InfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass-card p-5 glass-card-hover flex flex-col justify-between",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
              {icon}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
          {children}
        </div>
      </div>

      {actionButton && <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">{actionButton}</div>}
    </div>
  );
}
