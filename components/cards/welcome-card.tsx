import React from "react";
import { Sparkles, Calendar, ShieldCheck, HeartPulse, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface WelcomeCardProps {
  userName?: string;
  roleName?: string;
  subtitle?: string;
  onQuickAction?: () => void;
  actionText?: string;
}

export function WelcomeCard({
  userName = "Healthcare Professional",
  roleName = "Medical Staff",
  subtitle = "Hospital operations are functioning normally. 18 ICU beds available.",
  onQuickAction,
  actionText = "Quick Action",
}: WelcomeCardProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 p-6 md:p-8 text-white shadow-xl shadow-sky-500/10">
      {/* Background Decorative Medical Art Elements */}
      <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 top-0 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{currentDate}</span>
            <span className="opacity-60">•</span>
            <span className="text-teal-200 font-bold uppercase tracking-wider text-[10px]">
              {roleName}
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Welcome back, <span className="text-teal-200">{userName}</span> 👋
          </h1>

          <p className="text-sm md:text-base text-sky-100/90 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {onQuickAction && (
          <Button
            onClick={onQuickAction}
            size="lg"
            className="rounded-2xl bg-white text-sky-900 font-bold hover:bg-sky-50 shadow-lg shadow-black/10 transition-all hover:scale-105 shrink-0 border border-white/40"
          >
            <span>{actionText}</span>
            <ArrowRight className="h-4 w-4 ml-2 text-sky-600" />
          </Button>
        )}
      </div>
    </div>
  );
}
