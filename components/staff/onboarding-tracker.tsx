"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock,
  UserCheck,
  UserMinus,
  Mail,
  Eye,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { AppRole } from "@/lib/auth/roles";
import { OnboardingReviewActions } from "./onboarding-review-actions";

type OnboardingStaff = {
  id: string;
  name: string;
  email: string;
  role?: string;
  specialization?: string;
  hospitalEmail?: string | null;
  department?: string | null;
  created_at: Date | string;
  status: string;
  onboardingStatus?: string;
  changeRequest?: string | null;
};

type OnboardingDoctor = {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  department?: string | null;
  created_at: Date | string;
  status: string;
};

type OffboardedItem = (OnboardingStaff | OnboardingDoctor) & { updated_at: Date | string };

export interface OnboardingTrackerProps {
  pendingStaff: OnboardingStaff[];
  pendingDoctors: OnboardingDoctor[];
  underReviewStaff: OnboardingStaff[];
  changesRequestedStaff: OnboardingStaff[];
  recentStaff: OnboardingStaff[];
  recentDoctors: OnboardingDoctor[];
  offboardedStaff: (OnboardingStaff & { updated_at: Date | string })[];
  offboardedDoctors: (OnboardingDoctor & { updated_at: Date | string })[];
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return `${parts[0]?.charAt(0) || ""}${parts[1]?.charAt(0) || ""}`.toUpperCase();
}

type Tab = "pending" | "under-review" | "changes-requested" | "recent" | "offboarded";

export function OnboardingTracker({
  pendingStaff,
  pendingDoctors,
  underReviewStaff,
  changesRequestedStaff,
  recentStaff,
  recentDoctors,
  offboardedStaff,
  offboardedDoctors,
}: OnboardingTrackerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "pending",
      label: "Pending",
      icon: <Clock className="h-4 w-4" />,
      count: pendingStaff.length + pendingDoctors.length,
    },
    {
      key: "under-review",
      label: "Under Review",
      icon: <ClipboardCheck className="h-4 w-4" />,
      count: underReviewStaff.length,
    },
    {
      key: "changes-requested",
      label: "Changes Requested",
      icon: <Clock className="h-4 w-4" />,
      count: changesRequestedStaff.length,
    },
    {
      key: "recent",
      label: "Recently Onboarded",
      icon: <UserCheck className="h-4 w-4" />,
      count: recentStaff.length + recentDoctors.length,
    },
    {
      key: "offboarded",
      label: "Offboarded",
      icon: <UserMinus className="h-4 w-4" />,
      count: offboardedStaff.length + offboardedDoctors.length,
    },
  ];

  const renderRow = (
    item: OnboardingStaff | OnboardingDoctor,
    type: "staff" | "doctor",
    showUpdated = false,
    showReviewActions = false
  ) => {
    const role = "role" in item ? item.role : "Doctor";
    const detailHref = type === "doctor" ? `/doctors/${item.id}` : `/staffs/${item.id}`;
    const dateLabel = showUpdated && "updated_at" in item
      ? formatDate((item as OffboardedItem).updated_at)
      : formatDate(item.created_at);

    return (
      <tr key={`${type}-${item.id}`} className="group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 dark:ring-slate-700">
              {getInitials(item.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-slate-400" />
                <p className="max-w-[180px] truncate text-[10px] text-slate-400">{item.email}</p>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {ROLE_LABELS[role as AppRole] || role || "Doctor"}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {item.department || ("specialization" in item ? item.specialization : "—") || "—"}
          </span>
        </td>
        <td className="px-4 py-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {dateLabel}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[10px] font-bold ring-1 ${
              item.status === "Active"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900"
                : item.status === "Dormant"
                  ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900"
                  : "bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800"
            }`}
          >
            {item.status}
          </span>
        </td>
        <td className="px-6 py-4">
          {showReviewActions && type === "staff" ? (
            <OnboardingReviewActions staffId={item.id} staffName={item.name} />
          ) : <Link
            href={detailHref}
            title="View details"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
          >
            <Eye className="h-4 w-4" />
          </Link>}
        </td>
      </tr>
    );
  };

  const renderTable = (items: (OnboardingStaff | OnboardingDoctor)[], types: ("staff" | "doctor")[], showUpdated = false, showReviewActions = false) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50">
            <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Staff</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Role</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
            <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {showUpdated ? "Last Updated" : "Joined"}
            </th>
            <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
            <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                    <ClipboardCheck className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No records found</p>
                  <p className="mt-1 text-xs text-slate-400">No matching staff in this category.</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item, idx) => renderRow(item, types[idx] || "staff", showUpdated, showReviewActions))
          )}
        </tbody>
      </table>
    </div>
  );

  const getPendingItems = () => {
    const items: (OnboardingStaff | OnboardingDoctor)[] = [];
    const types: ("staff" | "doctor")[] = [];
    pendingDoctors.forEach((d) => { items.push(d); types.push("doctor"); });
    pendingStaff.forEach((s) => { items.push(s); types.push("staff"); });
    return { items, types };
  };

  const getRecentItems = () => {
    const items: (OnboardingStaff | OnboardingDoctor)[] = [];
    const types: ("staff" | "doctor")[] = [];
    recentDoctors.forEach((d) => { items.push(d); types.push("doctor"); });
    recentStaff.forEach((s) => { items.push(s); types.push("staff"); });
    return { items, types };
  };

  const getOffboardedItems = () => {
    const items: (OnboardingStaff | OnboardingDoctor)[] = [];
    const types: ("staff" | "doctor")[] = [];
    offboardedDoctors.forEach((d) => { items.push(d); types.push("doctor"); });
    offboardedStaff.forEach((s) => { items.push(s); types.push("staff"); });
    return { items, types };
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      {/* Tabs */}
      <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === "pending" && (() => {
        const { items, types } = getPendingItems();
        return renderTable(items, types, false, true);
      })()}
      {activeTab === "under-review" && renderTable(underReviewStaff, underReviewStaff.map(() => "staff"), false, true)}
      {activeTab === "changes-requested" && renderTable(changesRequestedStaff, changesRequestedStaff.map(() => "staff"), false, true)}
      {activeTab === "recent" && (() => {
        const { items, types } = getRecentItems();
        return renderTable(items, types);
      })()}
      {activeTab === "offboarded" && (() => {
        const { items, types } = getOffboardedItems();
        return renderTable(items, types, true);
      })()}
    </section>
  );
}
