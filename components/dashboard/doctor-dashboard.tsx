"use client";

import React, { useState } from "react";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { InfoCard } from "@/components/cards/info-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AppointmentRow } from "@/components/tables/upcoming-appointments-table";
import type { LabTestRow } from "@/components/tables/pending-tests-table";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  FlaskConical,
  Pill,
  CheckCircle2,
  Stethoscope,
  Plus,
  Search,
  Users,
} from "lucide-react";

export interface DoctorDashboardProps {
  doctorName?: string;
  department?: string;
  schedule?: AppointmentRow[];
  pendingReports?: LabTestRow[];
}

export function DoctorDashboard({ doctorName = "Doctor", department = "", schedule = [], pendingReports = [] }: DoctorDashboardProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [searchHistory, setSearchHistory] = useState("");

  const displayName = doctorName || "Doctor";
  const displayDept = department || "General Medicine";

  const defaultSchedule: AppointmentRow[] = [
    { id: "APT-001", patientName: "Arthur Pendelton", doctorName: displayName, department: displayDept, time: "09:00 AM", type: "Cardiology Follow-up", status: "Completed" },
    { id: "APT-002", patientName: "Samantha Reed", doctorName: displayName, department: displayDept, time: "10:30 AM", type: "ECG Review & Diagnosis", status: "Scheduled" },
    { id: "APT-003", patientName: "Marcus Sterling", doctorName: displayName, department: displayDept, time: "11:45 AM", type: "Hypertension Check", status: "Pending" },
    { id: "APT-004", patientName: "Jessica Alba", doctorName: displayName, department: displayDept, time: "02:15 PM", type: "Post-op Review", status: "Scheduled" },
  ];

  const scheduleItems = schedule.length > 0 ? schedule.map(item => ({ ...item, doctorName: item.doctorName || displayName })) : defaultSchedule;

  const defaultPendingReports: LabTestRow[] = [
    { testId: "REP-401", patientName: "Arthur Pendelton", testName: "Echocardiogram Scan", doctorName: displayName, priority: "Urgent", requestedAt: "2 hrs ago", status: "Sample Collected" },
    { testId: "REP-402", patientName: "Grace Kelly", testName: "Lipid Profile & Troponin", doctorName: displayName, priority: "Normal", requestedAt: "5 hrs ago", status: "Pending" },
    { testId: "REP-403", patientName: "Henry Cavill", testName: "Chest X-Ray", doctorName: displayName, priority: "High", requestedAt: "1 hr ago", status: "Sample Collected" },
  ];

  const reports = pendingReports.length > 0 ? pendingReports.map(r => ({ ...r, doctorName: r.doctorName || displayName })) : defaultPendingReports;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName={displayName}
        roleName={displayDept ? `${displayDept} Specialist` : "Attending Physician"}
        subtitle="You have 8 consultations scheduled today. 2 urgent lab reports require your review."
        onQuickAction={() => setActiveModal("book_appointment")}
        actionText="Book New Patient Slot"
      />

      {/* Doctor Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Schedule"
          value="8 Patients"
          change="4 Consulted"
          trend="up"
          subtitle="Next: Samantha Reed (10:30 AM)"
          icon={<CalendarIcon className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Completed Consultations"
          value="4 Done"
          change="50% Completed"
          trend="up"
          subtitle="Avg 18 mins / consultation"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Pending Lab Reports"
          value="3 Reports"
          change="2 Ready to Review"
          trend="down"
          subtitle="1 Urgent Echocardiogram"
          icon={<FlaskConical className="h-5 w-5" />}
          iconColor="text-indigo-600 bg-indigo-500/10 dark:bg-indigo-500/20"
        />
        <StatCard
          title="Prescriptions Issued"
          value="12 Today"
          change="100% E-signed"
          trend="up"
          subtitle="Pharmacy Synced"
          icon={<Pill className="h-5 w-5" />}
          iconColor="text-rose-600 bg-rose-500/10 dark:bg-rose-500/20"
        />
      </div>

      {/* Tabs View */}
      <Tabs defaultValue="schedule">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 pb-px bg-transparent">
          <TabsTrigger value="schedule">Today&apos;s Schedule & Consultations</TabsTrigger>
          <TabsTrigger value="history">Patient Medical History Search</TabsTrigger>
          <TabsTrigger value="reports">Pending Lab Requests & Reports</TabsTrigger>
          <TabsTrigger value="shortcuts">Prescription & Clinical Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule List */}
            <div className="lg:col-span-2 rounded-2xl glass-card p-6 glass-card-hover">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Clinical OPD Roster (Room 204)
                  </h3>
                </div>
                <Button size="sm" onClick={() => setActiveModal("record_vitals")} className="rounded-xl bg-sky-600 text-white font-bold text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Quick Prescribe
                </Button>
              </div>

               <div className="mt-4 space-y-3">
                 {scheduleItems.map((item) => (
                   <div
                     key={item.id}
                     className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-sky-300 transition-colors"
                   >
                     <div className="flex items-center gap-3">
                       <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-lg">
                         {item.time}
                       </span>
                       <div>
                         <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                           {item.patientName}
                         </h4>
                         <p className="text-[11px] text-slate-500">{item.type} • {item.department}</p>
                       </div>
                     </div>
                     <Badge
                       variant={
                         item.status === "Completed"
                           ? "success"
                           : item.status === "Scheduled"
                           ? "info"
                           : "warning"
                       }
                     >
                       {item.status}
                     </Badge>
                   </div>
                 ))}
               </div>
            </div>

            {/* Mini Calendar Planner */}
            <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-800">
                  Doctor Calendar Planner
                </h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 dark:bg-slate-800 text-sky-900 dark:text-sky-300 font-semibold">
                    <span>Cardiology Grand Rounds</span>
                    <span className="text-[10px]">08:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 font-semibold">
                    <span>OPD Consultation Hours</span>
                    <span className="text-[10px]">09:00 AM - 01:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-purple-300 font-semibold">
                    <span>Cardiac Surgery Assist (OR 3)</span>
                    <span className="text-[10px]">03:30 PM</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 cursor-pointer hover:underline">
                  Open Interactive Calendar →
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-2xl glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                placeholder="Search patient medical history by name, MRN number, or diagnosis..."
                className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-xl px-4 py-2.5 text-xs outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                Patient Medical Record Lookup: Arthur Pendelton (MRN #P-1094)
              </h4>
              <p className="text-xs text-slate-500">
                History: Essential Hypertension (5 yrs), Type 2 Diabetes. Allergic to Penicillin. Last BP: 138/88 mmHg.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="rounded-2xl glass-card p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Pending Diagnostics & Lab Reports
            </h3>
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.testId} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{rep.patientName}</h4>
                    <p className="text-[11px] text-slate-500">{rep.testName} • {rep.testId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rep.priority === "Urgent" ? "destructive" : "secondary"}>
                      {rep.priority}
                    </Badge>
                    <Button size="sm" onClick={() => alert(`Reviewing report ${rep.testId}`)} className="rounded-xl text-xs">
                      Review Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shortcuts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Prescription Shortcuts" icon={<Pill className="h-4 w-4" />} badge="Quick Rx">
              <p>Standard Hypertension Rx (Lisinopril 10mg daily)</p>
              <Button size="sm" onClick={() => setActiveModal("dispense_medicine")} className="mt-2 w-full rounded-xl bg-sky-600 text-white font-bold text-xs">
                Issue Standard Rx
              </Button>
            </InfoCard>
            <InfoCard title="Lab Request Preset" icon={<FlaskConical className="h-4 w-4" />} badge="Lab Order">
              <p>Order Routine Cardiac Panel (Lipid, ECG, Troponin)</p>
              <Button size="sm" onClick={() => setActiveModal("upload_lab")} className="mt-2 w-full rounded-xl bg-indigo-600 text-white font-bold text-xs">
                Send Lab Request
              </Button>
            </InfoCard>
            <InfoCard title="Patient Roster" icon={<Users className="h-4 w-4" />} badge="View All">
              <p>Browse and manage all registered patients</p>
              <Link href="/patients">
                <Button size="sm" className="mt-2 w-full rounded-xl bg-teal-600 text-white font-bold text-xs">
                  Open Patient Roster
                </Button>
              </Link>
            </InfoCard>
          </div>
        </TabsContent>
      </Tabs>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
