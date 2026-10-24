"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type WalkInSaleItem = {
  batchId: string;
  quantity: number;
  discountPercentage: number;
};

type WalkInsaleInput = {
  customerName: string;
  customerPhone?: string;
  paymentMethod: "CASH" | "CARD" | "ONLINE";
  items: WalkInSaleItem[];
};

type QuickAddMedicineInput = {
  name: string;
  generic_name: string;
  category: string;
  manufacturer: string;
  unit: string;
  reorder_level: number;
  batch_number: string;
  expiry_date: string; // ISO string
  quantity: number;
  purchase_price: number;
  selling_price: number;
};

async function requirePharmacist() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Please sign in first.");
  }

  const staff = await db.staff.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { id: userId }],
      status: "Active",
      role: {
        in: ["Pharmacist", "admin", "SuperAdmin"],
      },
    },
    select: {
      id: true,
    },
  });
  if (!staff) {
    throw new Error("You are not authorized to create pharmacy sales.");
  }
  return staff;
}

export async function createWalkInSale(input: WalkInsaleInput) {
  const staff = await requirePharmacist();

  const customerName = input.customerName?.trim();
  const customerPhone = input.customerPhone?.trim() || null;

  if (!customerName || customerName.length > 120) {
    throw new Error("Enter valid customer name");
  }
  if (customerPhone && customerPhone.length > 10) {
    throw new Error("Customer phone number should be only 10 digit");
  }
  if (!["CASH", "CARD", "ONLINE"].includes(input.paymentMethod)) {
    throw new Error("Invalid payment method.");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error("Add at least one medicine.");
  }

  if (input.items.length > 50) {
    throw new Error("Too many items in one sale.");
  }

  const quantities = new Map<
    string,
    { quantity: number; discountPercentage: number }
  >();

  for (const item of input.items) {
    const batchId = item.batchId?.trim();
    const quantity = Number(item.quantity);
    const discountPercentage = Number(item.discountPercentage);

    if (!batchId) {
      throw new Error("Invalid medicine batch.");
    }

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error("Every quantity must be a positive whole number.");
    }

    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      throw new Error("Discount percentage must be between 0 and 100.");
    }

    const existing = quantities.get(batchId);

    if (existing) {
      if (existing.discountPercentage !== discountPercentage) {
        throw new Error(
          `Same medicine batch added with different discount percentages. Please remove and re-add ${batchId}.`
        );
      }
      const combined = existing.quantity + quantity;
      if (!Number.isSafeInteger(combined)) {
        throw new Error("Invalid combined quantity.");
      }
      existing.quantity = combined;
    } else {
      quantities.set(batchId, { quantity, discountPercentage });
    }
  }

  const billId = await db.$transaction(
    async (tx) => {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      const saleItems: {
        medicine_id: string;
        batch_id: string;
        medicine_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        discount: number;
        unit: string;
      }[] = [];

      let subtotal = 0;
      let totalDiscount = 0;

      for (const [batchId, { quantity, discountPercentage }] of quantities) {
        const batch = await tx.medicineBatch.findUnique({
          where: {
            id: batchId,
          },
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                unit: true,
                is_active: true,
                is_otc: true,
              },
            },
          },
        });
        if (!batch) {
          throw new Error("A selected batch no longer exists");
        }
        if (!batch.medicine.is_active) {
          throw new Error(`${batch.medicine.name} is inactive.`);
        }
        if (batch.expiry_date < todayStart) {
          throw new Error(`${batch.medicine.name} has an expired batch.`);
        }

        if (batch.quantity < quantity) {
          throw new Error(
            `Insufficient stock for ${batch.medicine.name}. Available: ${batch.quantity}.`
          );
        }

        if (
          !Number.isFinite(batch.selling_price) ||
          batch.selling_price < 0
        ) {
          throw new Error(`Invalid selling price for ${batch.medicine.name}.`);
        }

        const lineTotal = batch.selling_price * quantity;
        const discountRatio = discountPercentage / 100;
        const lineDiscount = lineTotal * discountRatio;
        const lineAmount = lineTotal - lineDiscount;

        if (!Number.isFinite(lineAmount)) {
          throw new Error("Invalid sale total.");
        }

        subtotal += lineTotal;
        totalDiscount += lineDiscount;

        saleItems.push({
          medicine_id: batch.medicine_id,
          batch_id: batch.id,
          medicine_name: batch.medicine.name,
          quantity,
          unit_price: batch.selling_price,
          total_price: lineAmount,
          discount: lineDiscount,
          unit: batch.medicine.unit,
        });
      }

      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        throw new Error("The sale total must be greater than zero");
      }

      const totalAmount = subtotal - totalDiscount;
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("The sale total must be greater than zero");
      }

      const billNumber = `WALK-${crypto.randomUUID()}`;
      const bill = await tx.pharmacyBill.create({
        data: {
          bill_number: billNumber,
          patient_id: null,
          prescription_id: null,
          customer_name: customerName,
          customer_phone: customerPhone,
          subtotal,
          discount: totalDiscount,
          total_amount: totalAmount,
          amount_paid: totalAmount,
          balance_amount: 0,
          status: "PAID",
          items: {
            create: saleItems,
          },
        },
      });
      await tx.pharmacyPayment.create({
        data: {
          bill_id: bill.id,
          amount: totalAmount,
          method: input.paymentMethod,
        },
      });

      for (const item of saleItems) {
        const update = await tx.medicineBatch.updateMany({
          where: {
            id: item.batch_id,
            quantity: {
              gte: item.quantity,
            },
            expiry_date: {
              gte: todayStart,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        if (update.count !== 1) {
          throw new Error(
            `Stock changed for ${item.medicine_name}. Please refresh and try again.`
          );
        }

        await tx.stockTransaction.create({
          data: {
            medicine_id: item.medicine_id,
            batch_id: item.batch_id,
            type: "DISPENSE",
            quantity: item.quantity,
            reason: `Walk-in pharmacy sale ${billNumber}`,
            created_by: staff.id,
          },
        });
      }

      return bill.id;
    },
    {
      maxWait: 10000,
      timeout: 20000,
    }
  );

  revalidatePath("/pharmacy");
  revalidatePath("/pharmacy/inventory");
  revalidatePath("/pharmacy/billing");
  revalidatePath("/pharmacy/walk-in-sales");

  return { success: true, billId };
}

export async function quickAddMedicineWithBatch(input: QuickAddMedicineInput) {
  const staff = await requirePharmacist();

  const {
    name,
    generic_name,
    category,
    manufacturer,
    unit,
    reorder_level,
    batch_number,
    expiry_date,
    quantity,
    purchase_price,
    selling_price,
  } = input;

  if (!name?.trim()) throw new Error("Medicine name is required");
  if (!generic_name?.trim()) throw new Error("Generic name is required");
  if (!category?.trim()) throw new Error("Category is required");
  if (!manufacturer?.trim()) throw new Error("Manufacturer is required");
  if (!unit?.trim()) throw new Error("Unit is required");
  if (!Number.isInteger(reorder_level) || reorder_level < 0) {
    throw new Error("Reorder level must be a non-negative integer");
  }
  if (!batch_number?.trim()) throw new Error("Batch number is required");
  if (!expiry_date) throw new Error("Expiry date is required");
  const expiry = new Date(expiry_date);
  if (Number.isNaN(expiry.getTime())) throw new Error("Invalid expiry date");
  if (expiry <= new Date()) throw new Error("Expiry date must be in the future");
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantity must be a positive integer");
  if (!Number.isFinite(purchase_price) || purchase_price < 0) throw new Error("Invalid purchase price");
  if (!Number.isFinite(selling_price) || selling_price < 0) throw new Error("Invalid selling price");

  const existing = await db.medicine.findFirst({
    where: { name: { equals: name.trim(), mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) throw new Error(`Medicine "${name}" already exists`);

  const result = await db.$transaction(async (tx) => {
    const medicine = await tx.medicine.create({
      data: {
        name: name.trim(),
        generic_name: generic_name.trim(),
        category: category.trim(),
        manufacturer: manufacturer.trim(),
        unit: unit.trim(),
        reorder_level,
        is_otc: true,
        is_active: true,
      },
    });

    const batch = await tx.medicineBatch.create({
      data: {
        medicine_id: medicine.id,
        batch_number: batch_number.trim(),
        expiry_date: expiry,
        quantity,
        purchase_price,
        selling_price,
      },
    });

    await tx.stockTransaction.create({
      data: {
        medicine_id: medicine.id,
        batch_id: batch.id,
        type: "PURCHASE",
        quantity,
        unit_price: purchase_price,
        reason: `Quick add from walk-in sales`,
        created_by: staff.id,
      },
    });

    return { medicine, batch };
  });

  revalidatePath("/pharmacy/walk-in-sales");
  revalidatePath("/pharmacy/inventory");
  revalidatePath("/pharmacy/medicines");

  return { success: true, medicine: result.medicine, batch: result.batch };
}