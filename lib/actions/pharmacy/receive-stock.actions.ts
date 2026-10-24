"use server";

import { getRoleFromSessionClaims } from "@/lib/auth";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "Pharmacist"];

type ReceiveStockItem = {
  purchaseOrderItemId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
};

async function requiredPharmacyAccess() {
  const { userId, sessionClaims } = await auth();
  if (!userId || !sessionClaims) {
    throw new Error("Unauthorized");
  }
  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !ALLOWED_ROLES.includes(role)) {
    throw new Error("You have no permission to receive stock.");
  }
  return {
    role,
    userId,
  };
}

export async function getPurchaseOrderForReceivingAction(
  purchaseOrderId: string,
) {
  await requiredPharmacyAccess();
  if (!purchaseOrderId) {
    throw new Error("Purchase Order Id is required.");
  }

  const purchaseOrder = await db.purchaseOrder.findUnique({
    where: {
      id: purchaseOrderId,
    },
    include: {
      supplier: true,
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  if (!purchaseOrder) {
    throw new Error("Purchase order not found.");
  }

  if (
    purchaseOrder.status !== "ORDERED" &&
    purchaseOrder.status !== "PARTIALLY_RECEIVED"
  ) {
    throw new Error(
      `Stock cannot be received for a purchase order with status ${purchaseOrder.status}`,
    );
  }
  return purchaseOrder;
}

export async function receiveStockAction(
  purchaseOrderId: string,
  items: ReceiveStockItem[],
) {
  const { userId } = await requiredPharmacyAccess();
  if (!purchaseOrderId) {
    return {
      success: false,
      message: "Purchase Order Id required.",
    };
  }
  if (!items || items.length === 0) {
    return {
      success: false,
      message: "No stock items were provided.",
    };
  }
  try {
    const result = await db.$transaction(
      async (tx) => {
        const purchaseOrder = await tx.purchaseOrder.findUnique({
          where: {
            id: purchaseOrderId,
          },
          include: {
            supplier: true,
            items: {
              include: {
                medicine: true,
              },
            },
          },
        });
        if (!purchaseOrder) {
          throw new Error("Purchase order not found");
        }

        if (
          purchaseOrder.status !== "ORDERED" &&
          purchaseOrder.status !== "PARTIALLY_RECEIVED"
        ) {
          throw new Error("This purchase order cannot receive stock.");
        }

        // Prevent from submitting twice
        const submittedItemIds = new Set<string>();

        for (const item of items) {
          if (submittedItemIds.has(item.purchaseOrderItemId)) {
            throw new Error("Duplicate Purchase order item.");
          }
          submittedItemIds.add(item.purchaseOrderItemId);
        }

        //process every received items.

        for (const receivedItem of items) {
          const purchaseOrderItem = purchaseOrder.items.find(
            (item) => item.id === receivedItem.purchaseOrderItemId,
          );
          if (!purchaseOrderItem) {
            throw new Error("Invalid purchase order item.");
          }
          const remainingQuantity =
            purchaseOrderItem.quantity - purchaseOrderItem.received_quantity;
          if (remainingQuantity <= 0) {
            throw new Error(
              `${purchaseOrderItem.medicine.name} has already been completely received.`,
            );
          }
          if (
            !Number.isInteger(receivedItem.quantity) ||
            receivedItem.quantity <= 0
          ) {
            throw new Error(
              `Invalid received quantity for ${purchaseOrderItem.medicine.name}`,
            );
          }
          if (receivedItem.quantity > remainingQuantity) {
            throw new Error(
              `You cannot receive ${receivedItem.quantity} units of ${purchaseOrderItem.medicine.name}. only ${remainingQuantity} units remain.`,
            );
          }

          const batchNumber = receivedItem.batchNumber.trim();
          if (!batchNumber) {
            throw new Error(
              `Batch number is required for ${purchaseOrderItem.medicine.name}`,
            );
          }

          if (!receivedItem.expiryDate) {
            throw new Error(
              `Expiry date is required for ${purchaseOrderItem.medicine.name}.`,
            );
          }

          const expiryDate = new Date(receivedItem.expiryDate);
          if (Number.isNaN(expiryDate.getTime())) {
            throw new Error(
              `Invalid expiry date for ${purchaseOrderItem.medicine.name}.`,
            );
          }
          if (expiryDate <= new Date()) {
            throw new Error(
              `${purchaseOrderItem.medicine.name} has an expired expiry date.`,
            );
          }

          if (
            !Number.isFinite(receivedItem.purchasePrice) ||
            receivedItem.purchasePrice < 0
          ) {
            throw new Error(
              `Invalid purchase price for ${purchaseOrderItem.medicine.name}`,
            );
          }

          if (
            !Number.isFinite(receivedItem.sellingPrice) ||
            receivedItem.sellingPrice < 0
          ) {
            throw new Error(
              `Invalid selling price for ${purchaseOrderItem.medicine.name}.`,
            );
          }

          // Find existing batch
          const existingBatch = await tx.medicineBatch.findFirst({
            where: {
              medicine_id: purchaseOrderItem.medicine_id,
              batch_number: batchNumber,
            },
          });

          let batchId: string;
          if (existingBatch) {
            const updateBatch = await tx.medicineBatch.update({
              where: {
                id: existingBatch.id,
              },
              data: {
                quantity: {
                  increment: receivedItem.quantity,
                },
                expiry_date: expiryDate,

                purchase_price: receivedItem.purchasePrice,

                selling_price: receivedItem.sellingPrice,

                supplier_id: purchaseOrder.supplier_id,
              },
            });
            batchId = updateBatch.id;
          } else {
            const newBatch = await tx.medicineBatch.create({
              data: {
                medicine_id: purchaseOrderItem.medicine_id,

                supplier_id: purchaseOrder.supplier_id,

                batch_number: batchNumber,

                expiry_date: expiryDate,

                quantity: receivedItem.quantity,

                purchase_price: receivedItem.purchasePrice,

                selling_price: receivedItem.sellingPrice,
              },
            });
            batchId = newBatch.id;
          }

          //Create stock ledger transaction.

          await tx.stockTransaction.create({
            data: {
              medicine_id: purchaseOrderItem.medicine_id,
              batch_id: batchId,
              type: "PURCHASE",

              quantity: receivedItem.quantity,
              reason: `Stock received against purchase order ${purchaseOrder.order_number}`,

              created_by: userId ?? "system",
            },
          });

          //update receive quantity
          await tx.purchaseOrderItem.update({
            where: {
              id: purchaseOrderItem.id,
            },
            data: {
              received_quantity: {
                increment: receivedItem.quantity,
              },
            },
          });
        }

        //update purchaseOrder status once after all items
        const updatedItems = await tx.purchaseOrderItem.findMany({
          where: {
            purchase_order_id: purchaseOrderId,
          },
        });

        const allReceived = updatedItems.every(
          (item) => item.received_quantity >= item.quantity,
        );

        const someReceived = updatedItems.some(
          (item) => item.received_quantity > 0,
        );
        const status: "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" =
          allReceived
            ? "RECEIVED"
            : someReceived
              ? "PARTIALLY_RECEIVED"
              : "ORDERED";

        const updateOrder = await tx.purchaseOrder.update({
          where: {
            id: purchaseOrderId,
          },
          data: {
            status,
          },
          include: {
            supplier: true,
            items: {
              include: {
                medicine: true,
              },
            },
          },
        });

        return updateOrder;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
    revalidatePath("/pharmacy/purchase-order");

    revalidatePath("/pharmacy/inventory");

    revalidatePath("/pharmacy");

    return {
      success: true,

      message: "Stock received successfully.",

      order: result,
    };
  } catch (error) {
    console.error("RECEIVE STOCK ERROR:", error);

    return {
      success: false,

      message:
        error instanceof Error ? error.message : "Failed to receive stock.",
    };
  }
}
