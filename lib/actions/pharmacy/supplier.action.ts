"use server";

import { revalidatePath } from "next/cache";

import db from "@/lib/db";
import { getAuthSession } from "@/lib/auth/session";
import type { AppRole } from "@/lib/auth/roles";
import { AppRole as Role } from "@/lib/auth/roles";

const SUPPLIERS_PATH = "/pharmacy/suppliers";

const ALLOWED_ROLES: AppRole[] = [Role.SuperAdmin, Role.admin, Role.Pharmacist];

type ActionResult<T> =
  | { success: true; message: string; supplier: T }
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

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function readSupplierFields(formData: FormData) {
  return {
    name: readText(formData, "name"),
    phone: readText(formData, "phone"),
    email: readText(formData, "email"),
    address: readText(formData, "address"),
  };
}

export async function getSuppliersAction() {
  try {
    await checkPharmacyRole();

    const suppliers = await db.supplier.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return { success: true, suppliers };
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return { success: false, suppliers: [], error: "Failed to fetch suppliers" };
  }
}

export async function createSupplierAction(
  formData: FormData
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    const { name, phone, email, address } = readSupplierFields(formData);

    if (!name) return { success: false, error: "Supplier name is required" };
    if (!phone) return { success: false, error: "Supplier phone is required" };
    if (!email) return { success: false, error: "Supplier email is required" };
    if (!address) return { success: false, error: "Supplier address is required" };

    const existingSuppliers = await db.supplier.findMany({
      where: { name: { contains: name } },
      select: { name: true },
    });

    const duplicate = existingSuppliers.some(
      (supplier) => supplier.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return { success: false, error: "Supplier with this name already exists" };
    }

    const supplier = await db.supplier.create({
      data: {
        name,
        phone,
        email,
        address,
      },
    });

    revalidatePath(SUPPLIERS_PATH);

    return {
      success: true,
      supplier,
      message: "Supplier created successfully",
    };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function updateSupplierAction(
  supplierId: string,
  formData: FormData
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    if (!supplierId) {
      return { success: false, error: "Supplier ID is required" };
    }

    const { name, phone, email, address } = readSupplierFields(formData);

    if (!name) return { success: false, error: "Supplier name is required" };
    if (!phone) return { success: false, error: "Supplier phone is required" };
    if (!email) return { success: false, error: "Supplier email is required" };
    if (!address) return { success: false, error: "Supplier address is required" };

    const existingSupplier = await db.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!existingSupplier) {
      return { success: false, error: "Supplier not found" };
    }

    const otherSuppliers = await db.supplier.findMany({
      where: {
        id: { not: supplierId },
        name: { contains: name },
      },
      select: { name: true },
    });

    const duplicate = otherSuppliers.some(
      (supplier) => supplier.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return { success: false, error: "Another supplier with this name already exists" };
    }

    const supplier = await db.supplier.update({
      where: { id: supplierId },
      data: {
        name,
        phone,
        email,
        address,
      },
    });

    revalidatePath(SUPPLIERS_PATH);

    return {
      success: true,
      supplier,
      message: "Supplier updated successfully",
    };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function toggleSupplierStatusAction(
  supplierId: string
): Promise<ActionResult<unknown>> {
  try {
    await checkPharmacyRole();

    if (!supplierId) {
      return { success: false, error: "Supplier ID is required" };
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return { success: false, error: "Supplier not found" };
    }

    const updatedSupplier = await db.supplier.update({
      where: { id: supplierId },
      data: {
        is_active: !supplier.is_active,
      },
    });

    revalidatePath(SUPPLIERS_PATH);

    return {
      success: true,
      supplier: updatedSupplier,
      message: `Supplier ${updatedSupplier.is_active ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling supplier status:", error);
    return { success: false, error: "Failed to toggle supplier status" };
  }
}

/** @deprecated Legacy misspelled name kept for existing imports. */
export async function toggleSuppierStatusAction(supplierId: string) {
  return toggleSupplierStatusAction(supplierId);
}