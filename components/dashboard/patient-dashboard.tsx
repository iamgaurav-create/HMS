"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { CountdownCard } from "@/components/cards/countdown-card";
import { InfoCard } from "@/components/cards/info-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickActionCard } from "@/components/cards/quick-action-card";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Stethoscope,
  FlaskConical,
  Pill,
  CreditCard,
  PhoneCall,
  ShieldCheck,
  Download,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export interface PatientDashboardProps {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    insurance_provider?: string | null;
    emergency_contact_name: string;
    emergency_contact_relation: string;
    emergency_contact_number: string;
    appointments: {
      time: string;
      appointment_date: Date;
      doctor: { name: string };
      type: string;
    }[];
    payments: {
      receipt_number: number;
      total_amount: number;
      status: string;
      appointment?: { type: string };
    }[];
    medical?: {
      prescriptions?: string | null;
      lab_test: { service: { service_name: string }; test_date: Date; status: string }[];
    }[];
  } | null;
}

export function PatientDashboard({ patient }: PatientDashboardProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const userName = patient ? `${patient.first_name} ${patient.last_name}` : "Patient";
  const nextAppointment = patient?.appointments?.[0];
  const nextDoctor = nextAppointment?.doctor?.name || "Assigned Doctor";
  const nextSpecialization = nextAppointment?.type || "Consultation";
  const nextDate = nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "No upcoming appointment";
  const nextTime = nextAppointment?.time || "";

  const prescriptions = patient?.medical?.flatMap((record) =>
    record.prescriptions ? [record.prescriptions] : []
  ) ?? [];
  const labReports = patient?.medical?.[0]?.lab_test?.map((lt) => ({
    title: lt.service.service_name,
    date: new Date(lt.test_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: lt.status === "Completed" ? "Reviewed" : "Pending",
    file: `${lt.service.service_name.replace(/\s+/g, "_")}_Report.pdf`,
  })) || [];
  const bills = patient?.payments?.map((p) => ({
    invoice: `#INV-2026-${p.receipt_number}`,
    service: p.appointment?.type || "Hospital Services",
    amount: `$${p.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    status: p.status === "paid" ? "Paid" : p.status === "PartPayment" ? "Part Payment" : "Unpaid",
  })) || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName={userName}
        roleName="Patient Portal"
        subtitle={nextAppointment ? `Your next ${nextSpecialization.toLowerCase()} with ${nextDoctor} is scheduled for ${nextDate}${nextTime ? ` at ${nextTime}` : ""}.` : "Welcome to your patient portal. Book an appointment to get started."}
        onQuickAction={() => router.push("/patient/appointments/new")}
        actionText="Book New Appointment"
      />

      {nextAppointment && (
        <CountdownCard
          doctorName={nextDoctor}
          specialization={`${nextSpecialization} • Room 204`}
          location="Gaurav Hospital OPD Wing B"
        />
      )}

      {/* Quick Action Buttons */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-500" />
          Patient Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionCard
            title="Book Appointment"
            description="Select slot & doctor"
            icon={<Calendar className="h-5 w-5" />}
            onClick={() => router.push("/patient/appointments/new")}
            color="bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-300"
          />
          <QuickActionCard
            title="Download Report"
            description="Access latest lab results"
            icon={<Download className="h-5 w-5" />}
            onClick={() => alert("Downloading latest lab report PDF...")}
            color="bg-teal-500/15 text-teal-600 dark:bg-teal-500/25 dark:text-teal-300"
          />
          <QuickActionCard
            title="Pay Bill"
            description="Online secure checkout"
            icon={<CreditCard className="h-5 w-5" />}
            onClick={() => setActiveModal("generate_bill")}
            color="bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-300"
          />
          <QuickActionCard
            title="Message Doctor"
            description="Direct consultation chat"
            icon={<MessageSquare className="h-5 w-5" />}
            onClick={() => alert("Opening secure doctor messaging portal...")}
            color="bg-purple-500/15 text-purple-600 dark:bg-purple-500/25 dark:text-purple-300"
          />
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InfoCard title="Assigned Primary Doctor" icon={<Stethoscope className="h-4 w-4" />} badge="Primary Care">
          <p className="font-bold text-slate-900 dark:text-slate-100">{nextDoctor || "Assigned Doctor"}</p>
          <p className="text-slate-500">{nextSpecialization} • {nextAppointment ? "OPD Wing B Room 204" : "Check appointments"}</p>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold pt-1">Available Mon - Fri (09:00 AM - 04:00 PM)</p>
        </InfoCard>

        <InfoCard title="Insurance Details" icon={<ShieldCheck className="h-4 w-4" />} badge="Active Coverage">
          <p className="font-bold text-slate-900 dark:text-slate-100">{patient?.insurance_provider || "BlueCross Gold Health Plan"}</p>
          <p className="text-slate-500">{patient ? `Policy #BC-${patient.id.slice(0, 7)} • Group #8849` : "Policy #BC-9984021 • Group #8849"}</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">100% Inpatient Co-pay Covered</p>
        </InfoCard>

        <InfoCard title="Emergency Contact" icon={<PhoneCall className="h-4 w-4" />} badge="Emergency">
          <p className="font-bold text-slate-900 dark:text-slate-100">{patient ? `${patient.emergency_contact_name} (${patient.emergency_contact_relation})` : "Eleanor Pendelton (Spouse)"}</p>
          <p className="text-slate-500">{patient ? `Phone: ${patient.emergency_contact_number}` : "Phone: +1 (555) 998-1122"}</p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold pt-1">Hospital Emergency Hotline: 911 / Ext 104</p>
        </InfoCard>
      </div>

      {/* Patient Data Tabs */}
      <Tabs defaultValue="history">
        <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 pb-px bg-transparent">
          <TabsTrigger value="history">Medical History</TabsTrigger>
          <TabsTrigger value="prescriptions">My Prescriptions</TabsTrigger>
          <TabsTrigger value="labs">Lab Reports & Diagnostics</TabsTrigger>
          <TabsTrigger value="billing">Bills & Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <div className="rounded-2xl glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personal Medical Timeline
            </h3>
            <div className="space-y-3 border-l-2 border-sky-500 pl-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400">Jul 15, 2026</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Routine Cardiac Follow-up</h4>
                <p className="text-xs text-slate-500">Echocardiogram normal. Lisinopril dosage maintained.</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400">Jan 10, 2026</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Annual Comprehensive Health Check</h4>
                <p className="text-xs text-slate-500">BP: 124/80 mmHg. Blood glucose 95 mg/dL. All parameters stable.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prescriptions">
          <div className="rounded-2xl glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active Prescriptions & Medications
            </h3>
            <div className="space-y-3">
              {prescriptions.map((prescription, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Pill className="h-4 w-4 text-sky-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Prescription</h4>
                      <p className="text-[11px] text-slate-500">{prescription}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Recorded</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="labs">
          <div className="rounded-2xl glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Diagnostic Lab Reports
            </h3>
            <div className="space-y-3">
              {labReports.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-4 w-4 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{l.title}</h4>
                      <p className="text-[11px] text-slate-500">Date: {l.date}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => alert(`Downloading ${l.file}...`)} className="rounded-xl text-xs bg-sky-600 text-white font-bold">
                    <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <div className="rounded-2xl glass-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Bills & Payments
            </h3>
            <div className="space-y-3">
              {bills.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{b.invoice}</h4>
                    <p className="text-[11px] text-slate-500">{b.service} • Amount: {b.amount}</p>
                  </div>
                  <Badge variant={b.status === "Paid" ? "success" : "destructive"}>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
