import React from "react";
import { Calendar, Clock, Stethoscope, User, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AppointmentRow {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  time: string;
  type: string;
  status: "Scheduled" | "Completed" | "Pending" | "Cancelled";
}

export function UpcomingAppointmentsTable({ items }: { items?: AppointmentRow[] }) {
  const defaultItems: AppointmentRow[] = [
    { id: "APT-901", patientName: "Arthur Pendelton", doctorName: "Dr. Sarah Jenkins", department: "Cardiology", time: "10:30 AM", type: "Follow-up", status: "Scheduled" },
    { id: "APT-902", patientName: "Samantha Reed", doctorName: "Dr. Robert Vance", department: "Orthopedics", time: "11:15 AM", type: "First Visit", status: "Scheduled" },
    { id: "APT-903", patientName: "Marcus Sterling", doctorName: "Dr. Emily Zhang", department: "Neurology", time: "01:45 PM", type: "Consultation", status: "Pending" },
    { id: "APT-904", patientName: "Jessica Alba", doctorName: "Dr. Sarah Jenkins", department: "Cardiology", time: "02:30 PM", type: "ECG Review", status: "Scheduled" },
    { id: "APT-905", patientName: "David Beckham", doctorName: "Dr. Michael Chang", department: "Pediatrics", time: "03:15 PM", type: "Check-up", status: "Completed" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Upcoming Appointments
          </h3>
        </div>
        <span className="text-xs text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer">
          View Full Schedule →
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Time</th>
              <th className="pb-3 font-bold">Patient</th>
              <th className="pb-3 font-bold">Doctor & Dept</th>
              <th className="pb-3 font-bold">Type</th>
              <th className="pb-3 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{row.time}</span>
                  </div>
                </td>
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold text-[10px]">
                      {row.patientName.charAt(0)}
                    </div>
                    <span>{row.patientName}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-200">{row.doctorName}</span>
                    <span className="text-[10px] text-slate-400">{row.department}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-500 whitespace-nowrap">{row.type}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Badge
                    variant={
                      row.status === "Scheduled"
                        ? "info"
                        : row.status === "Completed"
                        ? "success"
                        : row.status === "Cancelled"
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
