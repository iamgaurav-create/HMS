
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, Printer } from "lucide-react";

type Bill = {
  id: string;
  bill_number: string | number;
  subtotal: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  status: string;
  created_at: Date | string;
  patient: {
    patientNumber: string;
    first_name: string;
    last_name: string;
  } | null;
};

type Props = {
  bills: Bill[];
};

export function BillingList({ bills }: Props) {
  function getStatusBadge(status: string) {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PAID: "default",
      PARTIAL: "secondary",
      UNPAID: "destructive",
      CANCELLED: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status.toLowerCase()}
      </Badge>
    );
  }

  const currency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Bill #</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Patient #</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {bills.map((bill) => (
              <tr key={bill.id} className="border-t hover:bg-muted/50">
                <td className="px-4 py-4 font-mono text-sm font-medium">
                  {bill.bill_number}
                </td>

                <td className="px-4 py-4 font-medium">
                  {bill.patient
                    ? `${bill.patient.first_name} ${bill.patient.last_name}`
                    : "Walk-in customer"}
                </td>

                <td className="px-4 py-4 font-mono text-sm text-muted-foreground">
                  {bill.patient?.patientNumber || "—"}
                </td>

                <td className="px-4 py-4 text-right font-medium">
                  {currency(bill.total_amount)}
                </td>

                <td className="px-4 py-4 text-right font-medium text-green-600">
                  {currency(bill.amount_paid)}
                </td>

                <td className="px-4 py-4 text-right font-medium text-orange-600">
                  {currency(bill.balance_amount)}
                </td>

                <td className="px-4 py-4">
                  {getStatusBadge(bill.status)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/pharmacy/billing/${bill.id}`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1"
                      )}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>

                    <Link
                      href={`/pharmacy/billing/${bill.id}/receipt`}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "gap-1"
                      )}
                    >
                      <Printer className="h-4 w-4" />
                      Print Bill
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bills.length === 0 && (
        <div className="p-10 text-center text-muted-foreground">
          <p className="text-lg font-medium">No pharmacy bills found</p>
          <p className="mt-1 text-sm">
            Bills will appear here once they have been created.
          </p>
        </div>
      )}
    </div>
  );
}
