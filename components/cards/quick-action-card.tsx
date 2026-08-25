import React from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  color = "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400",
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl glass-card p-5 glass-card-hover transition-all border border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 w-full"
    >
      <div className="flex items-center justify-between w-full">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110 shadow-xs",
            color
          )}
        >
          {icon}
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      <h4 className="mt-4 text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
        {title}
      </h4>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </button>
  );
}
