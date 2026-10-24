"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, FileText, Pill, ReceiptText, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentForm from "./payment-form";

type BillItem = {
  id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  medicine: {
    id: string;
    name: string;
    generic_name: string | null;
    category: string | null;
    manufacturer: string | null;
    unit: string;
  };
};

type Payment = {
  id: string;
  bill_id: string;
  amount: number;
  method: "CASH" | "CARD" | "ONLINE";
  transaction_id: string | null;
  created_at: Date;
};

type Bill = {
  id: string;
  bill_number: string;
   patient_id: string | null;
  prescription_id: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance_amount: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  created_at: Date;
  updated_at: Date;
   patient: {
    id: string;
    patientNumber: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    date_of_birth: Date;
    gender: string;
    address: string;
  } | null;
  prescription: { id: string } | null;
  items: BillItem[];
  payments: Payment[];
};

interface BillDetailsProps {
  bill: Bill;
  canCollectPayment: boolean;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PAID: "default",
  PARTIAL: "secondary",
  UNPAID: "destructive",
  CANCELLED: "outline",
};

function getStatusVariant(status: string) {
  return statusVariants[status] || "outline";
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPaymentMethod(method: string) {
  const methods: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    ONLINE: "Online / UPI",
  };
  return methods[method] || method;
}

export function BillDetails({ bill, canCollectPayment }: BillDetailsProps) {
  const balance = bill.balance_amount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/pharmacy/billing"
          className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              Bill #{bill.bill_number}
            </h1>
            <Badge variant={getStatusVariant(bill.status)} className="capitalize">
              {bill.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created on{" "}
            {new Date(bill.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <ReceiptText className="h-5 w-5 text-primary" />
              Patient Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-semibold">
                  {bill.patient?.first_name || "Unknown"} {bill.patient?.last_name || ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Patient #</p>
                <p className="font-semibold">{bill.patient?.patientNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-semibold">{bill.patient?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold">{bill.patient?.email || "N/A"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-semibold">{bill.patient?.address || "N/A"}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Bill Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3">Medicine</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3 text-right">Unit Price</th>
                      <th className="pb-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <p className="font-semibold">
                            {item.medicine_name || item.medicine.name}
                          </p>
                          {item.medicine.generic_name && (
                            <p className="text-xs text-muted-foreground">
                              {item.medicine.generic_name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {item.medicine.unit}
                          </p>
                        </td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 text-right">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {bill.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bill.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {formatPaymentMethod(payment.method)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                          {payment.transaction_id && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {payment.transaction_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  {formatCurrency(bill.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Discount</span>
                <span className="font-semibold">
                  -{formatCurrency(bill.discount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold">
                  {formatCurrency(bill.total_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(bill.amount_paid)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Balance</span>
                <span
                  className={`font-bold ${
                    bill.balance_amount > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(bill.balance_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {canCollectPayment && balance > 0 && (
            <PaymentForm billId={bill.id} balance={balance} />
          )}
        </div>
      </div>
    </div>
  );
}
