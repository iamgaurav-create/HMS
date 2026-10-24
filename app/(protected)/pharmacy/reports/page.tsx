import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import prisma from "@/lib/db";

import PharmacyReportExport from "./components/pharmacy-report-export";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

type SearchParams = Promise<{
  from?: string;
  to?: string;
}>;

type ReportPageProps = {
  searchParams: SearchParams;
};

function getValidDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? fallback : date;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type PatientSelect = {
  first_name: string;
  last_name: string;
  patientNumber: string;
} | null;

function formatPatientName(
  patient: PatientSelect,
  customerName?: string | null
) {
  if (patient) {
    return `${patient.first_name} ${patient.last_name}`;
  }
  return customerName || "Unknown";
}

function formatPatientNumber(
  patient: PatientSelect,
  customerPhone?: string | null
) {
  return patient?.patientNumber || customerPhone || "—";
}

export default async function PharmacyReportsPage({
  searchParams,
}: ReportPageProps) {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/reports" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const params = await searchParams;
  const today = new Date();
  const defaultFrom = new Date();
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);

  const from = getValidDate(params.from, defaultFrom);
  const toDate = getValidDate(params.to, today);

  const startDate =
    from.getTime() <= toDate.getTime() ? from : toDate;

  const endDate =
    from.getTime() <= toDate.getTime() ? toDate : from;

  const endExclusive = new Date(endDate);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  const dateFilter = {
    gte: startDate,
    lt: endExclusive,
  };

  const [bills, payments] = await Promise.all([
    prisma.pharmacyBill.findMany({
      where: {
        created_at: dateFilter,
      },
      include: {
        patient: {
          select: {
            first_name: true,
            last_name: true,
            patientNumber: true,
          },
        },
        items: true,
      },
      orderBy: {
        created_at: "desc",
      },
    }),
    prisma.pharmacyPayment.findMany({
      where: {
        created_at: dateFilter,
      },
      include: {
         bill: {
          select: {
            bill_number: true,
            customer_name: true,
            customer_phone: true,
            patient: {
              select: {
                first_name: true,
                last_name: true,
                patientNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    }),
  ]);

  const totalBilled = bills.reduce(
    (sum, bill) => sum + bill.total_amount,
    0
  );

  const totalCollected = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const totalOutstanding = bills.reduce(
    (sum, bill) =>
      sum + Math.max(0, bill.total_amount - bill.amount_paid),
    0
  );

  const paidBills = bills.filter(
    (bill) => bill.status === "PAID"
  ).length;

  const partialBills = bills.filter(
    (bill) => bill.status === "PARTIAL"
  ).length;

  const unpaidBills = bills.filter(
    (bill) => bill.status === "UNPAID"
  ).length;

  const medicineMap = new Map<
    string,
    {
      name: string;
      quantity: number;
      sales: number;
    }
  >();

  for (const bill of bills) {
    for (const item of bill.items) {
      const existing = medicineMap.get(item.medicine_name);

      if (existing) {
        existing.quantity += item.quantity;
        existing.sales += item.total_price;
      } else {
        medicineMap.set(item.medicine_name, {
          name: item.medicine_name,
          quantity: item.quantity,
          sales: item.total_price,
        });
      }
    }
  }

  const topMedicines = Array.from(medicineMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const exportRows = [
    ...bills.map((bill) => ({
      section: "Bill",
      date: bill.created_at.toISOString(),
      reference: bill.bill_number,
      patient: formatPatientName(bill.patient, bill.customer_name),
      description: bill.status,
      quantity: "",
      amount: bill.total_amount,
      collected: bill.amount_paid,
      balance: Math.max(0, bill.total_amount - bill.amount_paid),
    })),
    ...payments.map((payment) => ({
      section: "Payment",
      date: payment.created_at.toISOString(),
      reference: payment.bill.bill_number,
      patient: formatPatientName(
        payment.bill.patient,
        payment.bill.customer_name
      ),
      description: payment.method,
      quantity: "",
      amount: payment.amount,
      collected: payment.amount,
      balance: "",
    })),
    ...topMedicines.map((medicine) => ({
      section: "Medicine",
      date: "",
      reference: "",
      patient: "",
      description: medicine.name,
      quantity: medicine.quantity,
      amount: medicine.sales,
      collected: "",
      balance: "",
    })),
  ];

  const statCards = [
    {
      title: "Total Billed",
      value: formatCurrency(totalBilled),
      description: `${bills.length} bills created`,
    },
    {
      title: "Payments Collected",
      value: formatCurrency(totalCollected),
      description: `${payments.length} payments recorded`,
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(totalOutstanding),
      description: `${unpaidBills} unpaid bills`,
    },
    {
      title: "Paid Bills",
      value: paidBills.toString(),
      description: `${partialBills} partial · ${unpaidBills} unpaid`,
    },
  ];

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pharmacy Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Billing, collection, and medicine usage reports
          </p>
        </div>

        <PharmacyReportExport rows={exportRows} />
      </div>

      <form className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="from" className="text-sm font-medium">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={startDate.toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="flex-1 space-y-2">
          <label htmlFor="to" className="text-sm font-medium">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={endDate.toISOString().slice(0, 10)}
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
        >
          Generate Report
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">
              {card.title}
            </p>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {card.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">Medicine Usage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Top 10 medicines by quantity billed during the selected period
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Medicine</th>
                <th className="px-5 py-3 font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Sales Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topMedicines.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No medicine sales found for this period.
                  </td>
                </tr>
              ) : (
                topMedicines.map((medicine) => (
                  <tr key={medicine.name}>
                    <td className="px-5 py-4 font-medium">
                      {medicine.name}
                    </td>
                    <td className="px-5 py-4">
                      {medicine.quantity}
                    </td>
                    <td className="px-5 py-4">
                      {formatCurrency(medicine.sales)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">Recent Pharmacy Bills</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bills created during the selected period
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Bill Number</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bills.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No pharmacy bills found for this period.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-5 py-4 font-medium">
                      <a
                        href={`/pharmacy/billing/${bill.id}`}
                        className="text-primary hover:underline"
                      >
                        {bill.bill_number}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        {formatPatientName(bill.patient, bill.customer_name)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPatientNumber(
                          bill.patient,
                          bill.customer_phone
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDate(bill.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatCurrency(bill.amount_paid)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatCurrency(
                        Math.max(0, bill.total_amount - bill.amount_paid)
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          bill.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : bill.status === "PARTIAL"
                              ? "bg-amber-100 text-amber-700"
                              : bill.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold">Payment History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Payments recorded during the selected period
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Bill Number</th>
                <th className="px-5 py-3 font-medium">Patient</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-muted-foreground"
                  >
                    No payments found for this period.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 font-medium">
                      {payment.bill.bill_number}
                    </td>
                      <td className="px-5 py-4">
                        {formatPatientName(
                          payment.bill.patient,
                          payment.bill.customer_name
                        )}
                      </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-5 py-4">{payment.method}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
