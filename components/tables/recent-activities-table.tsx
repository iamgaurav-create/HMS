import React from "react";
import { Activity, Clock, CheckCircle2, UserPlus, CreditCard, FileText, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status: "Completed" | "Pending" | "Urgent";
  type: "registration" | "billing" | "lab" | "appointment";
}

export function RecentActivitiesTable({ items }: { items?: ActivityItem[] }) {
  const defaultItems: ActivityItem[] = [
    { id: "ACT-101", user: "Nurse Sarah Jenkins", action: "Recorded vitals for Patient #P-1094 (BP: 120/80)", time: "5 mins ago", status: "Completed", type: "appointment" },
    { id: "ACT-102", user: "Dr. Robert Vance", action: "Issued prescription for Amoxicillin 500mg", time: "12 mins ago", type: "lab", status: "Completed" },
    { id: "ACT-103", user: "Reception Desk 2", action: "Registered new walk-in patient: Emma Watson", time: "24 mins ago", type: "registration", status: "Completed" },
    { id: "ACT-104", user: "Accountant Mark", action: "Generated Invoice #INV-2026-904 ($1,450.00)", time: "35 mins ago", type: "billing", status: "Pending" },
    { id: "ACT-105", user: "Lab Technician Alex", action: "Uploaded Lipid Profile test result for P-884", time: "50 mins ago", type: "lab", status: "Urgent" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Recent System Activities
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-semibold">Live Audit Trail</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">User / Actor</th>
              <th className="pb-3 font-bold">Action Details</th>
              <th className="pb-3 font-bold">Timestamp</th>
              <th className="pb-3 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 text-slate-900 dark:text-slate-100 font-bold whitespace-nowrap">
                  {row.user}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                  {row.action}
                </td>
                <td className="py-3 text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{row.time}</span>
                  </div>
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Badge
                    variant={
                      row.status === "Completed"
                        ? "success"
                        : row.status === "Urgent"
                        ? "destructive"
                        : "warning"
                    }
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
