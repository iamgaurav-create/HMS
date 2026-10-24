import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

const PHARMACY_ROLES: string[] = [
  "SuperAdmin",
  "admin",
  "Pharmacist",
];

const bodySchema = z.object({
  prescriptionId: z.string().min(1),
  medicineId: z.string().min(1),
  batchId: z.string().min(1),
  quantity: z.number().int().positive(),
  dispensedBy: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const { userId: actorId, sessionClaims } = await auth();

  if (!actorId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !PHARMACY_ROLES.includes(role)) {
    return Response.json(
      { message: "You do not have pharmacy access" },
      { status: 403 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { message: "Validation failed" },
      { status: 400 }
    );
  }

  const { prescriptionId, medicineId, batchId, quantity } =
    parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const prescription = await tx.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          medicines: {
            where: { medicine_id: medicineId },
          },
        },
      });

      if (!prescription) {
        throw new Error("Prescription not found");
      }

      if (prescription.status === "CANCELLED") {
        throw new Error(
          "Cancelled prescriptions cannot be dispensed"
        );
      }

      if (prescription.status === "DISPENSED") {
        throw new Error(
          "Prescription is already fully dispensed"
        );
      }

      const line = prescription.medicines[0];

      if (!line) {
        throw new Error(
          "Medicine is not part of this prescription"
        );
      }

      const remaining = line.quantity - line.dispensed_qty;

      if (remaining <= 0) {
        throw new Error(
          "This medicine is already fully dispensed"
        );
      }

      if (quantity > remaining) {
        throw new Error(
          `Only ${remaining} units remaining for this medicine`
        );
      }

      const batch = await tx.medicineBatch.findUnique({
        where: { id: batchId },
      });

      if (!batch || batch.medicine_id !== medicineId) {
        throw new Error(
          "Batch not found for the selected medicine"
        );
      }

      if (batch.expiry_date.getTime() <= Date.now()) {
        throw new Error("This batch has expired");
      }

      if (batch.quantity < quantity) {
        throw new Error(
          `Only ${batch.quantity} units available in this batch`
        );
      }

      const updatedBatch = await tx.medicineBatch.updateMany({
        where: {
          id: batchId,
          quantity: { gte: quantity },
        },
        data: { quantity: { decrement: quantity } },
      });

      if (updatedBatch.count !== 1) {
        throw new Error(
          "Stock changed while dispensing. Please try again."
        );
      }

      await tx.stockTransaction.create({
        data: {
          medicine_id: medicineId,
          batch_id: batchId,
          type: "DISPENSE",
          quantity,
          unit_price: batch.selling_price,
          reason: `Prescription ${prescription.id}`,
          created_by: actorId,
        },
      });

      await tx.prescriptionMedicine.update({
        where: { id: line.id },
        data: { dispensed_qty: { increment: quantity } },
      });

      const updatedItems =
        await tx.prescriptionMedicine.findMany({
          where: { prescription_id: prescription.id },
          select: { quantity: true, dispensed_qty: true },
        });

      const fullyDispensed = updatedItems.every(
        (item) => item.dispensed_qty >= item.quantity
      );

      const partiallyDispensed = updatedItems.some(
        (item) => item.dispensed_qty > 0
      );

      const newStatus = fullyDispensed
        ? "DISPENSED"
        : partiallyDispensed
          ? "PARTIALLY_DISPENSED"
          : "PENDING";

      if (newStatus !== prescription.status) {
        await tx.prescription.update({
          where: { id: prescription.id },
          data: { status: newStatus },
        });
      }

      return { status: newStatus };
    });

    return Response.json({
      ok: true,
      status: result.status,
      message:
        result.status === "DISPENSED"
          ? "Prescription fully dispensed successfully."
          : "Medicine dispensed successfully.",
    });
  } catch (error) {
    console.error("[api/pharmacy/dispense]", error);

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to dispense medicine",
      },
      { status: 400 }
    );
  }
}
