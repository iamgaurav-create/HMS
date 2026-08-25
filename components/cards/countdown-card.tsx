"use client";

import React, { useState, useEffect } from "react";
import { Clock, Stethoscope, MapPin } from "lucide-react";

export interface CountdownCardProps {
  doctorName?: string;
  specialization?: string;
  location?: string;
  appointmentTime?: string; // ISO string or format
}

export function CountdownCard({
  doctorName = "Dr. Sarah Jenkins",
  specialization = "Cardiology Specialist",
  location = "Building B, Room 302",
  appointmentTime,
}: CountdownCardProps) {
  const [defaultAppointmentTime] = useState(
    () => new Date(Date.now() + 2 * 3600 * 1000 + 45 * 60 * 1000).toISOString()
  );
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });
  const targetAppointmentTime = appointmentTime ?? defaultAppointmentTime;

  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date(targetAppointmentTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetAppointmentTime]);

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-6 border-l-4 border-l-sky-500 glass-card-hover">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-sky-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Upcoming Consultation Countdown
          </span>
        </div>
        <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          Confirmed
        </span>
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-500 shrink-0" />
            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              {doctorName}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-6">
            {specialization}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-6 pt-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{location}</span>
          </div>
        </div>

        {/* Live Timer Badges */}
        <div className="flex items-center gap-2 self-center md:self-auto">
          <div className="flex flex-col items-center rounded-xl bg-sky-50 dark:bg-slate-800/80 px-3 py-2 border border-sky-100 dark:border-slate-700">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400">Hours</span>
          </div>
          <span className="text-xl font-bold text-slate-300 dark:text-slate-700">:</span>
          <div className="flex flex-col items-center rounded-xl bg-sky-50 dark:bg-slate-800/80 px-3 py-2 border border-sky-100 dark:border-slate-700">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400">Mins</span>
          </div>
          <span className="text-xl font-bold text-slate-300 dark:text-slate-700">:</span>
          <div className="flex flex-col items-center rounded-xl bg-sky-50 dark:bg-slate-800/80 px-3 py-2 border border-sky-100 dark:border-slate-700">
            <span className="text-xl font-black text-sky-600 dark:text-sky-400">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span className="text-[9px] font-bold uppercase text-slate-400">Secs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
