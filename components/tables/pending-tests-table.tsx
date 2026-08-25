import React from "react";
import { FlaskConical, Upload, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface LabTestRow {
  testId: string;
  testName: string;
  patientName: string;
  doctorName: string;
  priority: "High" | "Normal" | "Urgent";
  requestedAt: string;
  status: "Pending" | "Sample Collected" | "Completed";
}

export function PendingTestsTable({ items, onUploadReport }: { items?: LabTestRow[]; onUploadReport?: () => void }) {
  const defaultItems: LabTestRow[] = [
    { testId: "LAB-401", testName: "Complete Blood Count (CBC)", patientName: "Arthur Pendelton", doctorName: "Dr. Sarah Jenkins", priority: "Urgent", requestedAt: "30 mins ago", status: "Sample Collected" },
    { testId: "LAB-402", testName: "Lipid Profile & Cholesterol", patientName: "Samantha Reed", doctorName: "Dr. Robert Vance", priority: "Normal", requestedAt: "1 hour ago", status: "Pending" },
    { testId: "LAB-403", testName: "Thyroid Stimulating Hormone (TSH)", patientName: "Emma Watson", doctorName: "Dr. Emily Zhang", priority: "Normal", requestedAt: "2 hours ago", status: "Pending" },
    { testId: "LAB-404", testName: "Renal Function Panel", patientName: "Marcus Sterling", doctorName: "Dr. Sarah Jenkins", priority: "High", requestedAt: "3 hours ago", status: "Sample Collected" },
    { testId: "LAB-405", testName: "HbA1c Blood Sugar", patientName: "Jessica Alba", doctorName: "Dr. Michael Chang", priority: "Normal", requestedAt: "4 hours ago", status: "Completed" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Laboratory Order Queue & Diagnostics
          </h3>
        </div>
        {onUploadReport && (
          <Button onClick={onUploadReport} size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs">
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload Test Report
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Test ID</th>
              <th className="pb-3 font-bold">Test Name</th>
              <th className="pb-3 font-bold">Patient & Doctor</th>
              <th className="pb-3 font-bold">Priority</th>
              <th className="pb-3 font-bold">Requested</th>
              <th className="pb-3 font-bold text-right">Status / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.testId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                  {row.testId}
                </td>
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.testName}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{row.patientName}</span>
                    <span className="text-[10px] text-slate-400">Ref: {row.doctorName}</span>
                  </div>
                </td>
                <td className="py-3 whitespace-nowrap">
                  <Badge variant={row.priority === "Urgent" ? "destructive" : row.priority === "High" ? "warning" : "secondary"}>
                    {row.priority}
                  </Badge>
                </td>
                <td className="py-3 text-slate-400 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{row.requestedAt}</span>
                  </div>
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Badge
                    variant={
                      row.status === "Completed"
                        ? "success"
                        : row.status === "Sample Collected"
                        ? "info"
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
