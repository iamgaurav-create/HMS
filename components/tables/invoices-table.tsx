import React from "react";
import { CreditCard, DollarSign, Download, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface InvoiceRow {
  invoiceId: string;
  patientName: string;
  service: string;
  totalAmount: string;
  amountPaid: string;
  date: string;
  status: "Paid" | "Unpaid" | "Part Payment";
}

export function InvoicesTable({ items, onGenerateBill }: { items?: InvoiceRow[]; onGenerateBill?: () => void }) {
  const defaultItems: InvoiceRow[] = [
    { invoiceId: "INV-2026-901", patientName: "Arthur Pendelton", service: "Cardiology OPD & Echo", totalAmount: "$850.00", amountPaid: "$850.00", date: "Jul 27, 2026", status: "Paid" },
    { invoiceId: "INV-2026-902", patientName: "Samantha Reed", service: "Orthopedic Surgery Deposit", totalAmount: "$4,200.00", amountPaid: "$2,000.00", date: "Jul 26, 2026", status: "Part Payment" },
    { invoiceId: "INV-2026-903", patientName: "Marcus Sterling", service: "ICU Stay & Medication", totalAmount: "$3,150.00", amountPaid: "$0.00", date: "Jul 25, 2026", status: "Unpaid" },
    { invoiceId: "INV-2026-904", patientName: "Emma Watson", service: "Lab Diagnostics & MRI", totalAmount: "$1,450.00", amountPaid: "$1,450.00", date: "Jul 25, 2026", status: "Paid" },
    { invoiceId: "INV-2026-905", patientName: "Jessica Alba", service: "Pediatric Consultation", totalAmount: "$320.00", amountPaid: "$320.00", date: "Jul 24, 2026", status: "Paid" },
  ];

  const list = items && items.length > 0 ? items : defaultItems;

  return (
    <div className="rounded-2xl glass-card p-6 glass-card-hover">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Billing Invoices & Receivables
          </h3>
        </div>
        {onGenerateBill && (
          <Button onClick={onGenerateBill} size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> Generate Bill
          </Button>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              <th className="pb-3 font-bold">Invoice ID</th>
              <th className="pb-3 font-bold">Patient</th>
              <th className="pb-3 font-bold">Service / Description</th>
              <th className="pb-3 font-bold">Total Amount</th>
              <th className="pb-3 font-bold">Date</th>
              <th className="pb-3 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {list.map((row) => (
              <tr key={row.invoiceId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {row.invoiceId}
                </td>
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.patientName}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                  {row.service}
                </td>
                <td className="py-3 font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.totalAmount}
                </td>
                <td className="py-3 text-slate-400 whitespace-nowrap">{row.date}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Badge
                    variant={
                      row.status === "Paid"
                        ? "success"
                        : row.status === "Part Payment"
                        ? "warning"
                        : "destructive"
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
