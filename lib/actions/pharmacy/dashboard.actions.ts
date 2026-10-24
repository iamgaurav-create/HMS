"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

async function requirePharmacyAccess() {
  const { userId, sessionClaims } = await auth();
  if (!userId || !sessionClaims) {
    throw new Error("Unauthorized");
  }
  const role = getRoleFromSessionClaims(sessionClaims);
  const allowedRoles = ["SuperAdmin", "admin", "Pharmacist"];
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("You do not have permission to view pharmacy dashboard.");
  }
  const staff = await db.staff.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { id: userId }],
      status: "Active",
      role: { in: ["Pharmacist", "admin", "SuperAdmin"] },
    },
    select: { id: true },
  });
  if (!staff) throw new Error("Staff record not found");
  return { staffId: staff.id, role };
}

export async function getPharmacyDashboardData() {
  await requirePharmacyAccess();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // 1. Pending prescriptions (PENDING + PARTIALLY_DISPENSED)
  const pendingPrescriptions = await db.prescription.findMany({
    where: {
      status: { in: ["PENDING", "PARTIALLY_DISPENSED"] },
    },
    include: {
      patient: { select: { first_name: true, last_name: true } },
      doctor: { select: { name: true } },
    },
    orderBy: { created_at: "asc" },
    take: 20,
  });

  // 2. Low stock medicines (active medicines with usable stock <= reorder_level)
  const medicinesWithStock = await db.medicine.findMany({
    where: { is_active: true },
    include: { batches: true },
  });

  const lowStockMedicines = medicinesWithStock
    .map((medicine) => {
      const usableBatches = medicine.batches.filter(
        (b) => b.quantity > 0 && b.expiry_date > now
      );
      const usableStock = usableBatches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        id: medicine.id,
        name: medicine.name,
        stock: usableStock,
        reorderLevel: medicine.reorder_level,
        isLow: usableStock > 0 && usableStock <= medicine.reorder_level,
        isOut: usableStock === 0,
      };
    })
    .filter((m) => m.isLow || m.isOut)
    .sort((a, b) => {
      if (a.isOut && !b.isOut) return -1;
      if (!a.isOut && b.isOut) return 1;
      return a.stock - b.stock;
    })
    .slice(0, 15);

  // 3. Expired & expiring batches
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  const [expiredBatches, expiringBatches] = await Promise.all([
    db.medicineBatch.count({
      where: { quantity: { gt: 0 }, expiry_date: { lt: now } },
    }),
    db.medicineBatch.count({
      where: {
        quantity: { gt: 0 },
        expiry_date: { gte: now, lte: thirtyDaysLater },
      },
    }),
  ]);

  // 4. Sales today (walk-in + prescription bills)
  const [walkInBills, prescriptionBills] = await Promise.all([
    db.pharmacyBill.aggregate({
      where: {
        bill_number: { startsWith: "WALK-" },
        status: { not: "CANCELLED" },
        created_at: { gte: todayStart, lt: todayEnd },
      },
      _sum: { total_amount: true },
      _count: { id: true },
    }),
    db.pharmacyBill.aggregate({
      where: {
        bill_number: { not: { startsWith: "WALK-" } },
        status: { not: "CANCELLED" },
        created_at: { gte: todayStart, lt: todayEnd },
      },
      _sum: { total_amount: true },
      _count: { id: true },
    }),
  ]);

  const salesToday =
    (walkInBills._sum.total_amount ?? 0) + (prescriptionBills._sum.total_amount ?? 0);
  const billsTodayCount =
    (walkInBills._count.id ?? 0) + (prescriptionBills._count.id ?? 0);

  // 5. Inventory totals
  const [activeMedicinesCount, totalBatchesCount] = await Promise.all([
    db.medicine.count({ where: { is_active: true } }),
    db.medicineBatch.count({ where: { quantity: { gt: 0 } } }),
  ]);

  // 6. OTC medicines count (for walk-in sales)
  const otcMedicinesCount = await db.medicine.count({
    where: { is_active: true, is_otc: true },
  });

  // 7. Recent walk-in sales
  const recentWalkInSales = await db.pharmacyBill.findMany({
    where: {
      bill_number: { startsWith: "WALK-" },
      status: { not: "CANCELLED" },
    },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      id: true,
      bill_number: true,
      customer_name: true,
      total_amount: true,
      created_at: true,
      status: true,
    },
  });

  // 8. Recent prescription bills
  const recentPrescriptionBills = await db.pharmacyBill.findMany({
    where: {
      bill_number: { not: { startsWith: "WALK-" } },
      status: { not: "CANCELLED" },
    },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      id: true,
      bill_number: true,
      patient: { select: { first_name: true, last_name: true } },
      total_amount: true,
      created_at: true,
      status: true,
    },
  });

  return {
    metrics: {
      pendingRx: pendingPrescriptions.length,
      lowStock: lowStockMedicines.filter((m) => m.isLow).length,
      outOfStock: lowStockMedicines.filter((m) => m.isOut).length,
      expiredBatches,
      expiringBatches,
      salesToday,
      billsToday: billsTodayCount,
      activeMedicines: activeMedicinesCount,
      totalBatches: totalBatchesCount,
      otcMedicines: otcMedicinesCount,
    },
    lowStockMedicines: lowStockMedicines.map((m) => ({
      id: m.id,
      name: m.name,
      stock: m.stock,
      reorderLevel: m.reorderLevel,
      isOut: m.isOut,
    })),
    pendingPrescriptions: pendingPrescriptions.map((rx) => ({
      id: rx.id,
      patient: `${rx.patient.first_name} ${rx.patient.last_name}`,
      doctor: rx.doctor.name,
      status: rx.status,
      createdAt: rx.created_at.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    })),
    recentWalkInSales,
    recentPrescriptionBills,
  };
}