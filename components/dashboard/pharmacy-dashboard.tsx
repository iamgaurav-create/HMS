"use client";

import React, { useState } from "react";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { LowStockTable } from "@/components/tables/low-stock-table";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pill,
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";

export interface PharmacyDashboardProps {
  metrics?: { pendingRx: number; lowStock: number; salesToday: number };
}

export function PharmacyDashboard({ metrics }: PharmacyDashboardProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const pendingRx = [
    { rxNo: "RX-901", patient: "Arthur Pendelton", doc: "Dr. Sarah Jenkins", items: "Lisinopril 10mg (30 tabs)", status: "Ready to Dispense" },
    { rxNo: "RX-902", patient: "Samantha Reed", doc: "Dr. Robert Vance", items: "Amoxicillin 500mg (20 caps)", status: "Queueing" },
    { rxNo: "RX-903", patient: "Marcus Sterling", doc: "Dr. Emily Zhang", items: "Atorvastatin 20mg (30 tabs)", status: "Ready to Dispense" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="Central Hospital Pharmacy"
        roleName="Chief Pharmacist"
        subtitle="14 pending doctor prescriptions queued for dispensing. 5 items on low-stock alert."
        onQuickAction={() => setActiveModal("dispense_medicine")}
        actionText="Dispense Medicine"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Prescriptions"
          value={metrics ? `${metrics.pendingRx} Queued` : "14 Queued"}
          change="E-Prescriptions"
          trend="neutral"
          subtitle="Ready for counter pick-up"
          icon={<Pill className="h-5 w-5" />}
          iconColor="text-rose-600 bg-rose-500/10 dark:bg-rose-500/20"
        />
        <StatCard
          title="Low Stock Medicines"
          value={metrics ? `${metrics.lowStock} Alerts` : "5 Alerts"}
          change="Requires reorder"
          trend="down"
          subtitle="Amoxicillin & Insulin low"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Sales Today"
          value={metrics ? `$${metrics.salesToday.toLocaleString()}` : "$4,850.00"}
          change="+14.2% OTC sales"
          trend="up"
          subtitle="112 Transactions"
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Inventory Items"
          value="1,420 SKU"
          change="Active Stock"
          trend="neutral"
          subtitle="98% Fulfillment Rate"
          icon={<Package className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Table */}
        <div className="lg:col-span-2">
          <LowStockTable onReorder={() => setActiveModal("dispense_medicine")} />
        </div>

        {/* Pending E-Prescription Queue */}
        <div className="rounded-2xl glass-card p-6 glass-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Pill className="h-4 w-4 text-rose-500" /> Doctor E-Prescriptions
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Live Queue</span>
            </div>

            <div className="mt-4 space-y-3">
              {pendingRx.map((rx, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{rx.rxNo}</span>
                    <Badge variant={rx.status === "Ready to Dispense" ? "success" : "warning"}>
                      {rx.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{rx.patient}</p>
                  <p className="text-[11px] text-slate-500">{rx.items} • {rx.doc}</p>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => setActiveModal("dispense_medicine")} className="mt-6 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs">
            + Quick Dispense & Print Barcode Label
          </Button>
        </div>
      </div>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
