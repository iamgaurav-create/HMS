"use client";

import React, { useState } from "react";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { WardPatientsTable } from "@/components/tables/ward-patients-table";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WardPatient } from "@/components/tables/ward-patients-table";
import {
  BedDouble,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
} from "lucide-react";

export interface NurseDashboardProps {
  wardPatients?: WardPatient[];
  metrics?: { vitalsToday: number; activePatients: number };
}

export function NurseDashboard({ wardPatients = [], metrics }: NurseDashboardProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const defaultInstructions = [
    { doctor: "Dr. Sarah Jenkins", patient: "Alexander Wright (ICU Bed 02)", note: "Administer IV Saline 500ml and monitor Blood Pressure every 2 hours.", priority: "Urgent" as const },
    { doctor: "Dr. Robert Vance", patient: "Grace Kelly (Ward 3 Bed 04)", note: "Post-op knee dressing change required at 02:00 PM.", priority: "Routine" as const },
    { doctor: "Dr. Emily Zhang", patient: "Henry Cavill (Ward 3 Bed 09)", note: "Discharge assessment & medication reconciliation.", priority: "Routine" as const },
  ];

  const instructions = defaultInstructions;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="Nurse Station 3 (Ward B & ICU)"
        roleName="Head Nurse"
        subtitle="32 ward beds occupied. 4 patients due for immediate medication & vitals check."
        onQuickAction={() => setActiveModal("record_vitals")}
        actionText="Log Patient Vitals"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ward Patients"
          value={`${wardPatients.length} Occupied`}
          change="82% Capacity"
          trend="up"
          subtitle="Wards 1, 2, 3 & ICU"
          icon={<BedDouble className="h-5 w-5" />}
          iconColor="text-teal-600 bg-teal-500/10 dark:bg-teal-500/20"
        />
        <StatCard
          title="Vitals Logged Today"
          value={metrics ? `${metrics.vitalsToday} Checks` : "48 Checks"}
          change="100% Up-to-date"
          trend="up"
          subtitle="Next check at 12:00 PM"
          icon={<HeartPulse className="h-5 w-5" />}
          iconColor="text-rose-600 bg-rose-500/10 dark:bg-rose-500/20"
        />
        <StatCard
          title="Medication Schedule"
          value="18 Due"
          change="4 Urgent Doses"
          trend="down"
          subtitle="IV & Oral Medication"
          icon={<Clock className="h-5 w-5" />}
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Assigned Beds"
          value="12 Beds"
          change="Station 3"
          trend="neutral"
          subtitle="Nurse Sarah & Team"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Patients Roster Table */}
        <div className="lg:col-span-2">
          <WardPatientsTable items={wardPatients} onRecordVitals={() => setActiveModal("record_vitals")} />
        </div>

        {/* Doctor Instructions Stream */}
        <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-500" /> Doctor Instructions Feed
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Live Orders</span>
            </div>

             <div className="mt-4 space-y-3">
               {instructions.map((ins, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{ins.doctor}</span>
                    <Badge variant={ins.priority === "Urgent" ? "destructive" : "secondary"}>
                      {ins.priority}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">{ins.patient}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{ins.note}</p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => setActiveModal("dispense_medicine")} className="mt-6 w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs">
            Confirm Dose Administered
          </Button>
        </div>
      </div>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
