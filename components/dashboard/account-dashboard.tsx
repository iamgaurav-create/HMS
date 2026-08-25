"use client";

import React, { useState } from "react";
import { WelcomeCard } from "@/components/cards/welcome-card";
import { StatCard } from "@/components/cards/stat-card";
import { AccountRevenueChart } from "@/components/charts/account-revenue-chart";
import { InvoicesTable } from "@/components/tables/invoices-table";
import { QuickActionModals, ModalType } from "@/components/modals/quick-action-modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceRow } from "@/components/tables/invoices-table";
import {
  DollarSign,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  TrendingUp,
  Plus,
} from "lucide-react";

export interface AccountDashboardProps {
  metrics?: { todayIncome: number; pendingPayments: number; totalInvoices: number };
  invoices?: InvoiceRow[];
}

export function AccountDashboard({ metrics, invoices = [] }: AccountDashboardProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const claims = [
    { claimId: "CLM-9901", provider: "BlueCross Gold", amount: "$8,400.00", status: "Submitted", date: "Jul 26, 2026" },
    { claimId: "CLM-9902", provider: "Aetna Health", amount: "$3,250.00", status: "Approved", date: "Jul 25, 2026" },
    { claimId: "CLM-9903", provider: "UnitedHealthcare", amount: "$4,100.00", status: "Under Review", date: "Jul 24, 2026" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      <WelcomeCard
        userName="Finance & Billing Department"
        roleName="Chief Accountant"
        subtitle="Today's total gross income is $14,850.00. 19 invoices awaiting settlement."
        onQuickAction={() => setActiveModal("generate_bill")}
        actionText="Generate Patient Bill"
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Income"
          value={metrics ? `$${metrics.todayIncome.toLocaleString()}` : "$14,850.00"}
          change="+18.4% today"
          trend="up"
          subtitle="Cash, Card & Online"
          icon={<DollarSign className="h-5 w-5" />}
          iconColor="text-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/20"
        />
        <StatCard
          title="Pending Payments"
          value={metrics ? `$${metrics.pendingPayments.toLocaleString()}` : "$15,800.00"}
          change="19 Unpaid Invoices"
          trend="down"
          subtitle="Requires billing follow-up"
          icon={<CreditCard className="h-5 w-5" />}
          iconColor="text-amber-600 bg-amber-500/10 dark:bg-amber-500/20"
        />
        <StatCard
          title="Total Invoices"
          value={metrics ? `${metrics.totalInvoices} Issued` : "142 Issued"}
          change="This Month"
          trend="up"
          subtitle="92% Paid rate"
          icon={<FileSpreadsheet className="h-5 w-5" />}
          iconColor="text-sky-600 bg-sky-500/10 dark:bg-sky-500/20"
        />
        <StatCard
          title="Insurance Claims"
          value="$24,500.00"
          change="8 Claims Pending"
          trend="neutral"
          subtitle="BlueCross & Aetna"
          icon={<ShieldCheck className="h-5 w-5" />}
          iconColor="text-purple-600 bg-purple-500/10 dark:bg-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountRevenueChart />
        <InvoicesTable items={invoices} onGenerateBill={() => setActiveModal("generate_bill")} />
      </div>

      {/* Insurance Claims Stream */}
      <div className="rounded-2xl glass-card p-6 glass-card-hover">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Third-Party Insurance Claims Status
            </h3>
          </div>
          <Button size="sm" onClick={() => setActiveModal("generate_bill")} className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Submit Claim
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {claims.map((cl) => (
            <div key={cl.claimId} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{cl.claimId}</span>
                <Badge variant={cl.status === "Approved" ? "success" : "warning"}>
                  {cl.status}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cl.provider}</h4>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{cl.amount}</p>
              <p className="text-[10px] text-slate-400">Date Submitted: {cl.date}</p>
            </div>
          ))}
        </div>
      </div>

      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}
