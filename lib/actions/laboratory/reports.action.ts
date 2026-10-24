"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { createAuditLog } from "@/lib/db/audit";
import { Permission } from "@/lib/auth/permissions";
import { getLabActor } from "@/lib/lab/lab-actor";
import { buildLabOrderWhere, getLabOrderRequestingDoctor } from "@/lib/db/laboratory-orders";
import { LAB_RELEASED_STATUS, LAB_VERIFIED_STATUS } from "@/lib/lab/order-status";

export type LabReportActionState = {
  success: boolean;
  message: string;
};

/**
 * Releases the report of an order.
 *
 * A report is only released when every test of the order was verified by an
 * authorised professional, so a released report always holds approved results.
 */
export async function releaseLabReport(
  orderId: string
): Promise<LabReportActionState> {
  const actor = await getLabActor(Permission.RELEASE_LAB_REPORTS);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  const orderKey = orderId?.trim();

  if (!orderKey) {
    return { success: false, message: "Invalid laboratory order." };
  }

  const tests = await db.labTest.findMany({
    where: buildLabOrderWhere(orderKey),
    select: {
      id: true,
      status: true,
      service: { select: { service_name: true } },
    },
  });

  if (tests.length === 0) {
    return { success: false, message: "The laboratory order was not found." };
  }

  const outstanding = tests.filter(
    (test) =>
      test.status !== LAB_VERIFIED_STATUS && test.status !== LAB_RELEASED_STATUS
  );

  if (outstanding.length > 0) {
    return {
      success: false,
      message: `Verify ${outstanding.length} of the ${
        tests.length
      } tests before releasing the report.`,
    };
  }

  const cancelled = tests.filter((test) => test.status === "Cancelled");

  if (cancelled.length === tests.length) {
    return {
      success: false,
      message: "A cancelled order cannot be released.",
    };
  }

  const pending = tests.filter((test) => test.status !== LAB_RELEASED_STATUS);

  try {
    await db.$transaction(async (tx) => {
      await tx.labTest.updateMany({
        where: {
          id: { in: pending.map((test) => test.id) },
        },
        data: {
          status: LAB_RELEASED_STATUS,
          released_by: actor.actor.staffId,
          released_by_name: actor.actor.name,
          released_at: new Date(),
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: orderKey,
      action: "release_lab_report",
      details: `Laboratory report released by ${actor.actor.name}.`,
      model: "LabOrder",
    });

    const requesting = await getLabOrderRequestingDoctor(orderKey);

    if (requesting?.doctorId) {
      const patientName = await db.labTest.findFirst({
        where: buildLabOrderWhere(orderKey),
        select: {
          medical_record: {
            select: {
              patient: { select: { first_name: true, last_name: true } },
            },
          },
        },
      });

      await db.notification
        .create({
          data: {
            user_id: requesting.doctorId,
            title: "Laboratory report released",
            message: `The laboratory report of ${
              patientName
                ? `${patientName.medical_record.patient.first_name} ${patientName.medical_record.patient.last_name}`
                : "the patient"
            } was verified and released.`,
            type: "lab_result",
            link: "/doctors/lab-orders",
          },
        })
        .catch(() => undefined);
    }

    revalidatePath("/lab");
    revalidatePath("/lab/orders");
    revalidatePath(`/lab/orders/${orderKey}`);
    revalidatePath("/lab/results");
    revalidatePath("/lab/reports");
    revalidatePath("/lab/verification");

    return {
      success: true,
      message: "The laboratory report was released.",
    };
  } catch (error) {
    console.error("Failed to release laboratory report:", error);

    return {
      success: false,
      message: "Unable to release the report. Please try again.",
    };
  }
}
