"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { buildLabOrderWhere } from "@/lib/db/laboratory-orders";
import {
  nextLabOrderStatuses,
  resolveOrderStage,
} from "@/lib/lab/order-status";

const STAFF_ROLES = ["SuperAdmin", "admin", "LabTechnician"];
const DOCTOR_ROLES = ["Doctor"];

export type LabOrderActionResult = {
  success: boolean;
  message: string;
};

async function getActionContext() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { userId: null, role: null as string | null };
  }

  const role = (sessionClaims?.metadata?.role as string | undefined) ?? null;

  return { userId, role };
}

/**
 * Moves a whole order forward. Every test of the order that is still
 * outstanding moves with it, so the doctor sees one consistent status.
 */
export async function updateLabOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<LabOrderActionResult> {
  const { userId, role } = await getActionContext();

  if (!userId || !role) {
    return { success: false, message: "Please sign in first." };
  }

  const isDoctor = DOCTOR_ROLES.includes(role);
  const isStaff = STAFF_ROLES.includes(role);

  if (!isDoctor && !isStaff) {
    return {
      success: false,
      message: "You do not have permission to update laboratory orders.",
    };
  }

  /**
   * A doctor may only cancel an order, the laboratory moves it through the
   * laboratory stages.
   */
  if (isDoctor && !isStaff && nextStatus !== "Cancelled") {
    return {
      success: false,
      message: "Only the laboratory can change the progress of an order.",
    };
  }

  const rows = await db.labTest.findMany({
    where: buildLabOrderWhere(orderId),
    select: { id: true, status: true, result: true },
  });

  if (rows.length === 0) {
    return { success: false, message: "Laboratory order not found." };
  }

  const stage = resolveOrderStage(rows.map((row) => row.status));
  const allowed = nextLabOrderStatuses(stage);

  if (!allowed.includes(nextStatus)) {
    return {
      success: false,
      message: `An order that is "${stage}" cannot be moved to "${nextStatus}".`,
    };
  }

  if (nextStatus === "Completed") {
    const missingResult = rows.filter(
      (row) => !row.result || row.result.trim().length === 0
    );

    if (missingResult.length > 0) {
      return {
        success: false,
        message:
          "Record the result of every test before completing the order.",
      };
    }
  }

  await db.labTest.updateMany({
    where: {
      ...buildLabOrderWhere(orderId),
      status: { notIn: ["Completed", "Cancelled"] },
    },
    data: { status: nextStatus },
  });

  revalidatePath("/lab/orders");
  revalidatePath("/lab");
  revalidatePath("/doctors/lab-orders");

  return {
    success: true,
    message: `Order moved to "${nextStatus}".`,
  };
}
