"use server";

import { getRoleFromSessionClaims } from "@/lib/auth";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";


const ALLOWED_ROLES =[
    "SuperAdmin",
    "admin",
    "Pharmacist",
];

async function requireInventoryAccess(){
    const {sessionClaims} = await auth();

    if(!sessionClaims){
        throw new Error("Unauthorized");
    }
    const role = getRoleFromSessionClaims(sessionClaims);
    
     if (
    !role ||
    !ALLOWED_ROLES.includes(role)
  ) {
    throw new Error(
      "You do not have permission to view inventory."
    );
  }
  return role;
}


export type InventoryStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "EXPIRING_SOON"
  | "EXPIRED";

  export type InventoryRow ={
    medicineId: string;
    medicineName: string;
    genericName: string | null;
    category: string | null;
    manufacturer: string | null;
    unit: string;
    reorderLevel: number;

    batchId: string;
    batchNumber: string;

    supplierName: string;

    quantity: number;

    expiryDate: string;

    purchasePrice: number;
    sellingPrice: number;

    status: InventoryStatus;

    totalMedicineStock: number;
};

export type InventoryStats ={
    totalMedicines: number;
    totalUnits: number;
    lowStock: number;
    outOfStock: number;
    expiringSoon: number;
    expired: number;
}

export async function getInventoryAction(){
    await requireInventoryAccess();
    const now = new Date();

    const medicine = await db.medicine.findMany({
        where:{
            is_active: true,
        },
        include:{
            batches:{
                include:{
                    supplier: true,
                },
                orderBy:{
                    expiry_date: "asc",
                },
            },
        },
        orderBy:{
            name: "asc"
        }
    });

    const rows: InventoryRow[] =[];
    
    let totalUnits = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let expiringSoon = 0;
    let expired = 0;

    const totalMedicines = medicine.length;
    for(const medi of medicine){
        const availableBatches = medi.batches.filter(
            (batch)=>
                batch.expiry_date > now &&
                batch.quantity > 0
        );
        const totalMedicineStock =
        availableBatches.reduce(
        (total, batch) =>
          total + batch.quantity,
        0
      );
      totalUnits += totalMedicineStock;

      const medicineOutOfStock =
      totalMedicineStock === 0;

      const medicineLowStock =
      totalMedicineStock > 0 &&
      totalMedicineStock <=
          medi.reorder_level;

         if (medicineOutOfStock) {
      outOfStock++;
    } else if (medicineLowStock) {
      lowStock++;
    }


      const medicineExpired =
      medi.batches.some(
        (batch)=>
            batch.expiry_date <= now &&
        batch.quantity > 0
    );

    if(medicineExpired){
        expired++;
    }
    // 30 days expiry

    const thirtyDays = new Date(
        now.getTime() + 30*24*60*60*1000
    );

    const medicineExpiringSoon =
      medi.batches.some(
        (batch) =>
          batch.expiry_date > now &&
          batch.expiry_date <=
            thirtyDays &&
          batch.quantity > 0
      );
      if(medicineExpiringSoon){
        expiringSoon++;
      }

      for (const batch of medi.batches) {
      const expiry =
        batch.expiry_date;

      const isExpired =
        expiry <= now;

      const isExpiringSoon =
        expiry > now &&
        expiry <= thirtyDays;

      let status:
        | InventoryStatus =
        "IN_STOCK";

      if (isExpired) {
        status = "EXPIRED";
      } else if (isExpiringSoon) {
        status = "EXPIRING_SOON";
      } else if (
        medicineOutOfStock
      ) {
        status = "OUT_OF_STOCK";
      } else if (
        medicineLowStock
      ) {
        status = "LOW_STOCK";
      } else {
        status = "IN_STOCK";
      }

      rows.push({
        medicineId: medi.id,

        medicineName:
          medi.name,

        genericName:
          medi.generic_name,

        category:
          medi.category,

        manufacturer:
          medi.manufacturer,

        unit:
          medi.unit,

        reorderLevel:
          medi.reorder_level,

        batchId:
          batch.id,

        batchNumber:
          batch.batch_number,

        supplierName:
          batch.supplier?.name ??
          "Unknown Supplier",

        quantity:
          batch.quantity,

        expiryDate:
          batch.expiry_date.toISOString(),

        purchasePrice:
          batch.purchase_price,

        sellingPrice:
          batch.selling_price,

        status,

        totalMedicineStock,
      });
    }
  }

  return {
    rows,

    stats: {
      totalMedicines,
      totalUnits,
      lowStock,
      outOfStock,
      expiringSoon,
      expired,
    } satisfies InventoryStats,
  };
}