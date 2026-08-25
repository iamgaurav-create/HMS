import React from "react";
import { BedDouble, HeartPulse, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface WardPatient {
  bedNo: string;
  patientName: string;
  ageGender: string;
  doctor: string;
  vitals: string;
  medicationStatus: "Due Now" | "Given" | "Pending";
  condition: "Stable" | "Critical" | "Improving";
}

export function WardPatientsTable({ items, onRecordVitals }: { items?: WardPatient[]; onRecordVitals?: () => void }) {
  const defaultItems: WardPatient[] = [
    { bedNo: "ICU-02", patientName: "Alexander Wright", ageGender: "58 / Male", doctor: "Dr. Sarah Jenkins", vitals: "BP 138/88 | Temp 98.6°F | HR 82", medicationStatus: "Due Now", condition: "Critical" },
    { bedNo: "W3-Bed 04", patientName: "Grace Kelly", ageGender: "34 / Female", doctor: "Dr. Robert Vance", vitals: "BP 118/74 | Temp 98.4°F | HR 72", medicationStatus: "Given", condition: "Stable" },
    { bedNo: "W3-Bed 09", patientName: "Henry Cavill", ageGender: "42 / Male", doctor: "Dr. Emily Zhang", vitals: "BP 124/80 | Temp 99.1°F | HR 78", medicationStatus: "Pending", condition: "Improving" },
    { bedNo: "ICU-04", patientName: "Charlotte Bronte", ageGender: "67 / Female", doctor: "Dr. Sarah Jenkins", vitals: "BP 145/92 | Temp 101.2°F | HR 94", medicationStatus: "Due Now", condition: "Critical" },
    { bedNo: "W2-Bed 12", patientName: "Daniel Craig", ageGender: "51 / Male", doctor: "Dr. Michael Chang", vitals: "BP 120/78 | Temp 98.6°F | HR 68", medicationStatus: "Given", condition: "Stable" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Ward & ICU Inpatients (32 Occupied Beds)
          </h3>
        </div>
        {onRecordVitals && (
          <Button onClick={onRecordVitals} size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Record Vitals
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Bed No</th>
              <th className="pb-3 font-bold">Patient & Age</th>
              <th className="pb-3 font-bold">Attending Doctor</th>
              <th className="pb-3 font-bold">Latest Vitals</th>
              <th className="pb-3 font-bold">Medication</th>
              <th className="pb-3 font-bold text-right">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.bedNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 font-extrabold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                  {row.bedNo}
                </td>
                <td className="py-3 text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-bold">{row.patientName}</span>
                    <span className="text-[10px] text-slate-400">{row.ageGender}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                  {row.doctor}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <HeartPulse className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="font-mono text-[11px]">{row.vitals}</span>
                  </div>
                </td>
                <td className="py-3 whitespace-nowrap">
                  <Badge
                    variant={
                      row.medicationStatus === "Due Now"
                        ? "destructive"
                        : row.medicationStatus === "Given"
                        ? "success"
                        : "warning"
                    }
                  >
                    {row.medicationStatus}
                  </Badge>
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      row.condition === "Critical"
                        ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 animate-pulse"
                        : row.condition === "Improving"
                        ? "bg-sky-500/20 text-sky-700 dark:text-sky-300"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {row.condition}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
