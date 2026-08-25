"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppNavbar } from "@/components/navbar/app-navbar";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppRole } from "@/lib/auth/roles";

function SidebarFallback() {
  return (
    <aside className="glass-sidebar h-screen w-64 shrink-0 p-4 space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </div>
    </aside>
  );
}

function NavbarFallback() {
  return (
    <header className="glass-nav sticky top-0 z-20 h-16 px-6 flex items-center justify-between">
      <Skeleton className="h-9 w-64 rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
    </header>
  );
}

export function AppShell({
  userRole,
  children,
}: {
  userRole: AppRole;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full medical-gradient-subtle">
      <Suspense fallback={<SidebarFallback />}>
        <AppSidebar userRole={userRole} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<NavbarFallback />}>
          <AppNavbar userRole={userRole} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
