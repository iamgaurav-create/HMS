import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hospital, ShieldCheck } from "lucide-react";
import prisma from "@/lib/db";
import { PrintReceiptButton } from "./print-receipt-button";

export const dynamic = "force-dynamic";

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

export default async function WalkInReceiptPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const staff = await prisma.staff.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { id: userId }],
      status: "Active",
      role: { in: ["Pharmacist", "admin", "SuperAdmin"] },
    },
    select: { id: true },
  });

  if (!staff) {
    redirect("/unauthorized");
  }

  const { billId } = await params;

  const bill = await prisma.pharmacyBill.findUnique({
    where: { id: billId },
    include: {
      items: true,
      payments: {
        orderBy: {
          created_at: "asc",
        },
      },
    },
  });

  if (!bill || !bill.bill_number.startsWith("WALK-")) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background medical-gradient-subtle p-4 print:bg-white print:p-0 md:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap justify-between gap-3 print:hidden">
          <Link
            href="/pharmacy/walk-in-sales"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft size={16} />
            New Sale
          </Link>

          <PrintReceiptButton />
        </div>

        <article
          id="pharmacy-receipt"
          className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm print:border-0 print:p-0 print:shadow-none md:p-10"
        >
          <header className="border-b border-border pb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl medical-gradient text-white shadow-md shadow-sky-500/25">
              <Hospital size={28} />
            </div>
            <h1 className="bg-gradient-to-br from-sky-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent dark:from-sky-400 dark:to-teal-400 print:bg-none print:text-black">
              HOSPITAL PHARMACY
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Walk-in Sales Receipt
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck size={15} />
              PAYMENT RECEIVED
            </p>
          </header>

          <section className="grid gap-4 border-b border-border py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Bill Number</p>
              <p className="mt-1 font-semibold">{bill.bill_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="mt-1 font-semibold">
                {bill.created_at.toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="mt-1 font-semibold">
                {bill.customer_name || "Walk-in Customer"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="mt-1 font-semibold">
                {bill.customer_phone || "Not provided"}
              </p>
            </div>
          </section>

          <div className="overflow-x-auto py-5">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-border bg-muted">
                  <th className="py-3 pr-3 font-semibold text-muted-foreground">
                    Medicine
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    Qty
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-muted-foreground">
                    Price
                  </th>
                  <th className="py-3 pl-3 text-right font-semibold text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3 pr-3 font-medium">
                      {item.medicine_name}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {currency(item.unit_price)}
                    </td>
                    <td className="py-3 pl-3 text-right font-medium">
                      {currency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="ml-auto max-w-xs space-y-3 border-t border-border pt-5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency(bill.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discount</span>
              <span>{currency(bill.discount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{currency(bill.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <span>Paid</span>
              <span>{currency(bill.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-orange-600 dark:text-orange-400">
              <span>Balance</span>
              <span>{currency(bill.balance_amount)}</span>
            </div>
          </section>

          {bill.payments.length > 0 && (
            <section className="mt-8 border-t border-border pt-5">
              <h2 className="font-semibold">Payment History</h2>

              <table className="mt-3 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th className="py-2">Method</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border">
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
            </section>
          )}

          <footer className="mt-10 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Thank you for visiting our pharmacy.
          </footer>
        </article>
      </div>
    </main>
  );
}
