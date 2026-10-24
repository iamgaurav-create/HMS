
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { PrintReceiptButton } from "./print-receipt-button";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

type Props = {
  params: Promise<{ id: string }>;
};

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

export default async function PharmacyReceiptPage({ params }: Props) {
  const { id } = await params;

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({
      returnBackUrl: `/pharmacy/billing/${id}/receipt`,
    });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const bill = await db.pharmacyBill.findUnique({
    where: { id },
    include: {
      patient: true,
      items: {
        include: {
          medicine: true,
          batch: true,
        },
      },
      payments: {
        orderBy: {
          created_at: "asc",
        },
      },
    },
  });

  if (!bill) notFound();

  const patientName = bill.patient
    ? `${bill.patient.first_name} ${bill.patient.last_name}`
    : bill.customer_name || "Walk-in customer";

  return (
    <AppShell userRole={userRole}>
      <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href={`/pharmacy/billing/${bill.id}`}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Back to bill
          </Link>

          <PrintReceiptButton />
        </div>

        <article
          id="pharmacy-receipt"
          className="rounded-xl border bg-white p-6 text-slate-900 shadow-sm sm:p-10 print:border-0 print:p-0 print:shadow-none"
        >
          <header className="border-b-2 border-slate-800 pb-5 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Hospital Pharmacy
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Pharmacy Bill / Payment Receipt
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Please retain this receipt for your records.
            </p>
          </header>

          <section className="grid gap-5 border-b py-5 sm:grid-cols-2">
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-slate-500">BILL DETAILS</h2>
              <p>
                <span className="text-slate-500">Bill number: </span>
                <strong>{bill.bill_number}</strong>
              </p>
              <p>
                <span className="text-slate-500">Date: </span>
                {bill.created_at.toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p>
                <span className="text-slate-500">Status: </span>
                <strong>{bill.status}</strong>
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-slate-500">
                CUSTOMER / PATIENT
              </h2>
              <p>
                <span className="text-slate-500">Name: </span>
                <strong>{patientName}</strong>
              </p>

              {bill.patient && (
                <p>
                  <span className="text-slate-500">Patient number: </span>
                  {bill.patient.patientNumber}
                </p>
              )}

              {bill.customer_phone && (
                <p>
                  <span className="text-slate-500">Phone: </span>
                  {bill.customer_phone}
                </p>
              )}
            </div>
          </section>

          <section className="py-5">
            <h2 className="mb-4 font-semibold">Medicine Details</h2>

            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-slate-300 bg-slate-50">
                  <th className="px-2 py-3">Medicine</th>
                  <th className="px-2 py-3">Batch</th>
                  <th className="px-2 py-3 text-right">Qty</th>
                  <th className="px-2 py-3 text-right">Unit price</th>
                  <th className="px-2 py-3 text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="px-2 py-3">
                      {item.medicine_name || item.medicine.name}
                    </td>
                    <td className="px-2 py-3">
                      {item.batch?.batch_number || "—"}
                    </td>
                    <td className="px-2 py-3 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-3 text-right">
                      {currency(item.unit_price)}
                    </td>
                    <td className="px-2 py-3 text-right font-medium">
                      {currency(item.total_price)}
                    </td>
                  </tr>
                ))}

                {bill.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-2 py-6 text-center text-slate-500"
                    >
                      No bill items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="ml-auto max-w-sm space-y-3 border-t border-slate-300 pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Subtotal</span>
              <span>{currency(bill.subtotal)}</span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Discount</span>
              <span>{currency(bill.discount)}</span>
            </div>

            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold">
              <span>Total amount</span>
              <span>{currency(bill.total_amount)}</span>
            </div>

            <div className="flex justify-between gap-4 text-green-700">
              <span>Amount paid</span>
              <span>{currency(bill.amount_paid)}</span>
            </div>

            <div className="flex justify-between gap-4 font-semibold text-orange-700">
              <span>Balance due</span>
              <span>{currency(bill.balance_amount)}</span>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-300 pt-5">
            <h2 className="font-semibold">Payment History</h2>

            {bill.payments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No payments have been recorded.
              </p>
            ) : (
              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Date</th>
                    <th className="py-2">Method</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100">
                      <td className="py-2">
                        {payment.created_at.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2">{payment.method}</td>
                      <td className="py-2 text-right">
                        {currency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <footer className="mt-10 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
            This receipt records the bill and payments currently stored in the
            hospital system.
          </footer>
        </article>
      </main>
    </AppShell>
  );
}
