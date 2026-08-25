"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { PatientQueueTable } from "@/components/tables/patient-queue-table";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QueueItem } from "@/components/tables/patient-queue-table";
import {
  UserCheck,
  UserPlus,
  Calendar,
  Clock,
  Stethoscope,
  Users,
  CheckCircle2,
} from "lucide-react";

export interface ReceptionistDashboardProps {
  queue?: QueueItem[];
  availability?: Array<{ name: string; dept: string; status: string; room: string; queue: number }>;
  metrics?: { queueCount: number; registrationsToday: number; appointmentsToday: number };
}

export function ReceptionistDashboard({ queue = [], availability = [], metrics }: ReceptionistDashboardProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const defaultDoctors = [
    { name: "Dr. Sarah Jenkins", dept: "Cardiology", status: "Available", room: "OPD 204", queue: 3 },
    { name: "Dr. Robert Vance", dept: "Orthopedics", status: "In Surgery", room: "OR 02", queue: 0 },
    { name: "Dr. Emily Zhang", dept: "Neurology", status: "Available", room: "OPD 108", queue: 2 },
    { name: "Dr. Michael Chang", dept: "Pediatrics", status: "On Break", room: "OPD 302", queue: 1 },
  ];

  const doctorsList = availability.length > 0 ? availability : defaultDoctors;

  const handleRegisterPatient = () => {
    router.push("/patient/registration");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="Reception Desk #1"
        roleName="Receptionist"
        subtitle="14 patients currently checked-in in the waiting hall. 2 doctors available for walk-in consultations."
        onQuickAction={handleRegisterPatient}
        actionText="Register Walk-in Patient"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Patient Queue"
          value={metrics ? `${metrics.queueCount} Waiting` : "14 Waiting"}
          change="Avg wait: 12 min"
          trend="neutral"
          subtitle="Waiting Area Main Hall"
          icon={<UserCheck className="h-5 w-5" />}
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Today's Registrations"
          value={metrics ? `${metrics.registrationsToday} Patients` : "28 Patients"}
          change="+6 Walk-ins"
          trend="up"
          subtitle="Self-service & counter"
          icon={<UserPlus className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Appointment Booking"
          value={metrics ? `${metrics.appointmentsToday} Booked` : "42 Booked"}
          change="34 Checked-in"
          trend="up"
          subtitle="8 Pending Check-in"
          icon={<Calendar className="h-5 w-5" />}
          iconColor="text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20"
        />
        <StatCard
          title="Doctor Availability"
          value={`${doctorsList.filter((d) => d.status === "Available").length} / ${doctorsList.length} Active`}
          change="2 On rounds"
          trend="neutral"
          subtitle="OPD Rooms 101 - 304"
          icon={<Stethoscope className="h-5 w-5" />}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Live Queue Table */}
        <div className="lg:col-span-2">
          <PatientQueueTable items={queue} onCheckIn={() => router.push("/receptionist/appointments/new")} />
        </div>

        {/* Doctor Availability Matrix */}
        <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Doctor OPD Availability Matrix
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Live Room Status</span>
            </div>

            <div className="mt-4 space-y-3">
              {doctorsList.map((doc, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{doc.name}</h4>
                    <p className="text-[10px] text-slate-500">{doc.dept} • {doc.room}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.status === "Available" ? "success" : doc.status === "On Break" ? "warning" : "destructive"}>
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => router.push("/receptionist/appointments/new")} className="mt-6 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs">
            + Assign Patient to Doctor Slot
          </Button>
        </div>
      </div>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
