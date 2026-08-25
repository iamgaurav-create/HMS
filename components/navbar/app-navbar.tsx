"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";
import { NotificationsPopover } from "./notifications-popover";
import { AppRole, ROLE_LABELS } from "@/lib/auth/roles";
import { useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";

export function AppNavbar({ userRole }: { userRole: AppRole }) {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const activeRole = (searchParams.get("role") as AppRole) || userRole;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 glass-nav px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Left: Search & Role Context */}
      <div className="flex items-center gap-4">
        <GlobalSearch />
        
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Active Workspace:
          </span>
          <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
            {ROLE_LABELS[activeRole] || activeRole}
          </span>
        </div>
      </div>

      {/* Right: Actions, Theme, Notifications & User Avatar */}
      <div className="flex items-center gap-2.5 md:gap-3" suppressHydrationWarning>
        {/* Quick Emergency / Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>System Healthy</span>
        </div>

        {mounted ? (
          <>
            <NotificationsPopover />
            <ThemeToggle />
            <div className="pl-1 border-l border-slate-200 dark:border-slate-800 flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 border border-slate-200 dark:border-slate-800 shadow-xs",
                  },
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            <div className="h-9 w-9 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          </div>
        )}
      </div>
    </header>
  );
}
