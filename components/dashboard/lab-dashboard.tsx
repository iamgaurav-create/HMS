"use client";

import React, { useState } from "react";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { PendingTestsTable } from "@/components/tables/pending-tests-table";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LabTestRow } from "@/components/tables/pending-tests-table";
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  FileCheck,
  Upload,
  Syringe,
} from "lucide-react";

export interface LabDashboardProps {
  pendingTests?: LabTestRow[];
  metrics?: { pending: number; completed: number };
}

export function LabDashboard({ pendingTests = [], metrics }: LabDashboardProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const sampleLog = [
    { sampleId: "SMP-8801", test: "CBC Blood Sample", patient: "Arthur Pendelton", status: "In Centrifuge", time: "10 min ago" },
    { sampleId: "SMP-8802", test: "Lipid Profile Blood", patient: "Samantha Reed", status: "Reagent Added", time: "25 min ago" },
    { sampleId: "SMP-8803", test: "Urine Routine Culture", patient: "Emma Watson", status: "Incubating", time: "40 min ago" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="Central Diagnostic Laboratory"
        roleName="Lab Technician"
        subtitle="18 pending diagnostic test orders. 12 samples collected and ready for processing."
        onQuickAction={() => setActiveModal("upload_lab")}
        actionText="Upload Test Report"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Tests"
          value={metrics ? `${metrics.pending} Orders` : "18 Orders"}
          change="4 High Priority"
          trend="down"
          subtitle="Awaiting lab technician"
          icon={<FlaskConical className="h-5 w-5" />}
          iconColor="text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20"
        />
        <StatCard
          title="Completed Tests"
          value={metrics ? `${metrics.completed} Completed` : "42 Completed"}
          change="Today's total"
          trend="up"
          subtitle="98% Turnaround accuracy"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Sample Collection"
          value="12 Samples"
          change="Barcoded"
          trend="neutral"
          subtitle="Phlebotomy Bay 1 & 2"
          icon={<Syringe className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Reports Ready"
          value="15 Reports"
          change="Published to EMR"
          trend="up"
          subtitle="Ready for doctor review"
          icon={<FileCheck className="h-5 w-5" />}
          iconColor="text-purple-600 bg-purple-500/10 dark:bg-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Test Queue Table */}
        <div className="lg:col-span-2">
          <PendingTestsTable items={pendingTests} onUploadReport={() => setActiveModal("upload_lab")} />
        </div>

        {/* Live Sample Collection Log */}
        <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Syringe className="h-4 w-4 text-indigo-500" /> Active Sample Log
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Phlebotomy</span>
            </div>

            <div className="mt-4 space-y-3">
              {sampleLog.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.sampleId}</span>
                    <span className="text-[10px] text-slate-400">{s.time}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{s.test}</p>
                  <p className="text-[11px] text-slate-500">{s.patient} • <span className="text-indigo-500 font-semibold">{s.status}</span></p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => setActiveModal("upload_lab")} className="mt-6 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
            + Publish Result to Patient EHR
          </Button>
        </div>
      </div>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
