"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getAuthSession } from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/roles";
import { AppRole as Role } from "@/lib/auth/roles";

const MEDICINES_PATH = "/pharmacy/medicines";

const ALLOWED_ROLES: AppRole[] = [Role.SuperAdmin, Role.admin, Role.Pharmacist];

type ActionResult<T> =
  | { success: true; message: string; medicine: T }
  | { success: false; error: string };

async function checkPharmacyRole(): Promise<{ userId: string; role: AppRole }> {
  const session = await getAuthSession();

  if (!session) {
    throw new Error("unauthorized");
  }

  if (!ALLOWED_ROLES.includes(session.role)) {
    throw new Error("You have no permission to access this resource");
  }

  return session;
}

function parseReorderLevel(formData: FormData): number {
  const raw = formData.get("reorder_level");
  if (raw === null || raw === "") return 10;
  return Number(String(raw).trim());
}

function parseBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (value === null || value === undefined) return false;
  const str = String(value).trim().toLowerCase();
  return str === "on" || str === "true" || str === "1" || str === "yes";
}

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function getMedicinesAction() {
  try {
    await checkPharmacyRole();

    const medicines = await db.medicine.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return { success: true, medicines };
  } catch (error) {
    console.error("Error fetching medicines:", error);
    return { success: false, medicines: [], error: "Failed to fetch medicines" };
  }
}

export async function getMedicineByAction() {
  return getMedicinesAction();
}

export async function createMedicineAction(
  formData: FormData
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    const name = readText(formData, "name");
    const generic_name = readText(formData, "generic_name");
    const category = readText(formData, "category");
    const manufacturer = readText(formData, "manufacturer");
    const unit = readText(formData, "unit");
    const reorder_level = parseReorderLevel(formData);

    if (!name) return { success: false, error: "Medicine name is required" };
    if (!generic_name) return { success: false, error: "Generic name is required" };
    if (!category) return { success: false, error: "Category is required" };
    if (!manufacturer) return { success: false, error: "Manufacturer is required" };
    if (!unit) return { success: false, error: "Unit is required" };
    if (!Number.isInteger(reorder_level) || reorder_level < 0) {
      return { success: false, error: "Reorder level must be a non-negative integer" };
    }

    const existingMedicines = await db.medicine.findMany({
      where: { name: { contains: name } },
      select: { name: true },
    });

    const duplicate = existingMedicines.some(
      (medicine) => medicine.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return { success: false, error: "Medicine with this name already exists" };
    }

    const is_otc = parseBoolean(formData, "is_otc");
    const newMedicine = await db.medicine.create({
      data: {
        name,
        generic_name,
        category,
        manufacturer,
        unit,
        reorder_level,
        is_otc,
      },
    });

    revalidatePath(MEDICINES_PATH);

    return {
      success: true,
      medicine: newMedicine,
      message: "Medicine created successfully",
    };
  } catch (error) {
    console.error("Error creating medicine:", error);
    return { success: false, error: "Failed to create medicine" };
  }
}

export async function updateMedicineAction(
  medicineId: string,
  formData: FormData
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    if (!medicineId) {
      return { success: false, error: "Medicine ID is required" };
    }

    const name = readText(formData, "name");
    const generic_name = readText(formData, "generic_name");
    const category = readText(formData, "category");
    const manufacturer = readText(formData, "manufacturer");
    const unit = readText(formData, "unit");
    const reorder_level = parseReorderLevel(formData);

    if (!name) return { success: false, error: "Medicine name is required" };
    if (!generic_name) return { success: false, error: "Generic name is required" };
    if (!category) return { success: false, error: "Category is required" };
    if (!manufacturer) return { success: false, error: "Manufacturer is required" };
    if (!unit) return { success: false, error: "Unit is required" };
    if (!Number.isInteger(reorder_level) || reorder_level < 0) {
      return { success: false, error: "Reorder level must be a non-negative integer" };
    }

    const existingMedicine = await db.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!existingMedicine) {
      return { success: false, error: "Medicine not found" };
    }

    const otherMedicines = await db.medicine.findMany({
      where: {
        id: { not: medicineId },
        name: { contains: name },
      },
      select: { name: true },
    });

    const duplicate = otherMedicines.some(
      (medicine) => medicine.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return { success: false, error: "Another medicine with this name already exists" };
    }

    const is_otc = parseBoolean(formData, "is_otc");
    const medicine = await db.medicine.update({
      where: { id: medicineId },
      data: {
        name,
        generic_name,
        category,
        manufacturer,
        unit,
        reorder_level,
        is_otc,
      },
    });

    revalidatePath(MEDICINES_PATH);

    return {
      success: true,
      medicine,
      message: "Medicine updated successfully",
    };
  } catch (error) {
    console.error("Error updating medicine:", error);
    return { success: false, error: "Failed to update medicine" };
  }
}

export async function toggleMedicineStatusAction(
  medicineId: string
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    if (!medicineId) {
      return { success: false, error: "Medicine ID is required" };
    }

    const medicine = await db.medicine.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) {
      return { success: false, error: "Medicine not found" };
    }

    const updatedMedicine = await db.medicine.update({
      where: { id: medicineId },
      data: {
        is_active: !medicine.is_active,
      },
    });

    revalidatePath(MEDICINES_PATH);

    return {
      success: true,
      medicine: updatedMedicine,
      message: `Medicine ${updatedMedicine.is_active ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling medicine status:", error);
    return { success: false, error: "Failed to toggle medicine status" };
  }
}

/** @deprecated Legacy misspelled name kept for existing imports. */
export async function toggeleMedicineStatusAction(medicineId: string) {
  return toggleMedicineStatusAction(medicineId);
}
