import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import prisma from "@/lib/db";

import StockAdjustmentForm from "../components/stock-adjustment-form";
import StockTransactionTable from "../components/stock-transaction-table";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

export default async function StockAdjustmentsPage() {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/pharmacy/inventory/adjustments" });
  }

  const userRole = getRoleFromSessionClaims(sessionClaims);

  if (!userRole) {
    redirect("/unauthorized?reason=missing_role");
  }

  if (!ALLOWED_ROLES.includes(userRole)) {
    redirect("/unauthorized");
  }

  const [batches, transactions] = await Promise.all([
    prisma.medicineBatch.findMany({
      where: {
        medicine: { is_active: true },
      },
      include: {
        medicine: {
          select: {
            name: true,
            unit: true,
          },
        },
      },
      orderBy: [{ medicine: { name: "asc" } }, { expiry_date: "asc" }],
    }),
    prisma.stockTransaction.findMany({
      take: 50,
      orderBy: { created_at: "desc" },
      include: {
        medicine: {
          select: { name: true },
        },
        batch: {
          select: { batch_number: true },
        },
      },
    }),
  ]);

  const createdByIds = [...new Set(transactions.map((t) => t.created_by))];
  const staffNameById = new Map<string, string>();
  if (createdByIds.length > 0) {
    const staffRows = await prisma.staff.findMany({
      where: {
        OR: [
          { id: { in: createdByIds } },
          { clerkUserId: { in: createdByIds } },
        ],
      },
      select: { id: true, clerkUserId: true, name: true },
    });
    for (const s of staffRows) {
      staffNameById.set(s.id, s.name);
      if (s.clerkUserId) staffNameById.set(s.clerkUserId, s.name);
    }
  }

  const transactionRows = transactions.map((t) => ({
    ...t,
    staff: { name: staffNameById.get(t.created_by) ?? null },
  }));

  const batchOptions = batches.map((batch) => ({
    id: batch.id,
    batch_number: batch.batch_number,
    quantity: batch.quantity,
    expiry_date: batch.expiry_date.toISOString(),
    medicine: {
      name: batch.medicine.name,
      unit: batch.medicine.unit,
    },
  }));

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/pharmacy/inventory"
          className="text-sm text-primary hover:underline"
        >
          ← Back to inventory
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Stock Adjustments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Correct inventory discrepancies and record damaged or expired stock.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)]">
        <StockAdjustmentForm
          batches={batchOptions}
          canAddStock={
            userRole === "admin" ||
            userRole === "SuperAdmin" ||
            userRole === "Pharmacist"
          }
        />

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Adjustment Rules</h2>
          <ul className="mt-3 list-disc list-inside space-y-3 text-sm text-muted-foreground">
            <li>Every adjustment requires a reason.</li>
            <li>Stock removal cannot exceed available quantity.</li>
            <li>Expired stock can be removed only after expiry.</li>
            <li>Use Receive Stock for purchased medicines.</li>
            <li>Stock history is never deleted.</li>
          </ul>
        </div>
      </div>

      <StockTransactionTable transactions={transactionRows} />
    </main>
  );
}
