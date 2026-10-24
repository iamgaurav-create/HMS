
"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

type AdjustmentInput = {
  batchId: string;
  operation: "ADD" | "REMOVE" | "DAMAGED" | "EXPIRED";
  quantity: number;
  reason: string;
};

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

type PharmacyStaffResult = {
  id: string;
  role: string;
};

async function requiredPharmacyStaff(): Promise<PharmacyStaffResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("You must be signed in.");
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !ALLOWED_ROLES.includes(role)) {
    throw new Error(
      "You are not authorized to manage pharmacy inventory.",
    );
  }

  return { id: userId, role };
}

export async function createStockAdjustment(input: AdjustmentInput) {
  const batchId = input.batchId?.trim();
  const reason = input.reason?.trim();
  const quantity = Number(input.quantity);
  const operation = input.operation;

  if (!batchId) {
    throw new Error("Select a medicine batch.");
  }

  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }

  if (!reason || reason.length < 3 || reason.length > 500) {
    throw new Error("Enter a reason between 3 and 500 characters.");
  }

  const validOperations = ["ADD", "REMOVE", "DAMAGED", "EXPIRED"];

  if (!validOperations.includes(operation)) {
    throw new Error("Invalid stock adjustment operation.");
  }

  const staff = await requiredPharmacyStaff();

  await db.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.findUnique({
      where: { id: batchId },
      include: {
        medicine: {
          select: {
            id: true,
            is_active: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Medicine batch not found.");
    }

    if (!batch.medicine.is_active) {
      throw new Error("This medicine is inactive.");
    }

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const isExpired = batch.expiry_date < todayStart;

    if (operation === "ADD" && isExpired) {
      throw new Error("Stock cannot be added to an expired batch.");
    }

    if (operation === "EXPIRED" && !isExpired) {
      throw new Error("This batch has not expired yet.");
    }

    const decreasesStock = operation !== "ADD";

    if (decreasesStock && quantity > batch.quantity) {
      throw new Error(
        `Insufficient stock. Available quantity: ${batch.quantity}.`,
      );
    }

    const transactionType =
      operation === "DAMAGED"
        ? "DAMAGED"
        : operation === "EXPIRED"
          ? "EXPIRED"
          : "ADJUSTMENT";

    const updateResult = await tx.medicineBatch.updateMany({
      where: {
        id: batchId,
        ...(decreasesStock
          ? { quantity: { gte: quantity } }
          : {}),
      },
      data: {
        quantity: decreasesStock
          ? { decrement: quantity }
          : { increment: quantity },
      },
    });

    if (updateResult.count !== 1) {
      throw new Error(
        "The batch stock could not be updated. It may have changed or the batch may no longer exist. Refresh and try again.",
      );
    }

    await tx.stockTransaction.create({
      data: {
        medicine_id: batch.medicine_id,
        batch_id: batch.id,
        type: transactionType,
        quantity: decreasesStock ? -quantity : quantity,
        reason: `${operation}: ${reason}`,
        created_by: staff.id,
      },
    });
  });

  revalidatePath("/pharmacy/inventory");
  revalidatePath("/pharmacy/inventory/alerts");
  revalidatePath("/pharmacy/inventory/adjustments");
  revalidatePath("/pharmacy");

  return { success: true };
}
