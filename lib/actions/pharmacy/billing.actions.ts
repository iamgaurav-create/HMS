"use server";
import db from "@/lib/db";
import { PharmacyBillStatus, PharmacyPaymentMethod, StockTransactionType } from "@/lib/generated/prisma/enums";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { number } from "zod";



async function requirePharmacyAccess(){
  const { userId, sessionClaims } = await auth();
  if(!userId){
    throw new Error("Unauthorized");
  }
  const role =
  (sessionClaims?.metadata as{role?:string} | undefined)?.role ??
  (sessionClaims?.publicMetadata as {role?: string} | undefined)?.role;

  if (!["SuperAdmin", "admin", "Pharmacist"].includes(role ?? "")) {
    throw new Error("You do not have pharmacy access");
  }
return userId;
}

function generateBillNumber(){
    const date = new Date();
    const year= date.getFullYear();
    const month = String(date.getMonth()+1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2,"0");

    const random = Math.floor(100000 + Math.random() * 900000);
    return `PH-${year}${month}${day}-${random}`;
}

export async function createPharmacyBillAction(
    prescriptionId: string,
    discount: number = 0
){
    await requirePharmacyAccess();
    const prescription = await db.prescription.findUnique({
        where:{
            id: prescriptionId,
        },
        include:{
            patient: true,
            medicines:{
                include:{
                    medicine: true,
                }
            }
        }
    });
    if(!prescription){
        throw new Error("Prescription not found");
    }
    const transaction= await db.stockTransaction.findMany({
        where:{
            type: StockTransactionType.DISPENSE,
            reason: `Prescription ${prescription.id}`,
        },
        include:{
            medicine: true,
        },
        orderBy:{
            created_at: "asc"
        }
    });
    if(transaction.length === 0){
        throw new Error("No medicine has been dispensed for this prescription");
    }

    const medicineMap = new Map<
    string,{
        medicine_id: string;
        medicine_name: string;
        quantity: number;
        total: number;
    }
    >();
    for(const transtations of transaction){
        const current =medicineMap.get(transtations.medicine_id);
        const quantity = transtations.quantity;

        const total= quantity*(transtations.unit_price ?? 0);

        if(current){
            current.quantity += quantity;
            current.total +=total;
        }else{
            medicineMap.set(transtations.medicine_id,{
                medicine_id: transtations.medicine_id,
                medicine_name: transtations.medicine.name,
                quantity,
                total,
            });
        }
    }
    const items = Array.from(medicineMap.values());

      const subtotal = items.reduce(
    (sum, item) => sum + item.total,
    0
    );

    const totalAmount = Math.max(subtotal - discount, 0);

    const existingBill = await db.pharmacyBill.findFirst({
        where:{
            prescription_id: prescription.id,
            status:{
                not: PharmacyBillStatus.CANCELLED,
            }
        }
    });
    if(existingBill){
        const balanceAmount = Math.max(totalAmount - existingBill.amount_paid, 0);
        await db.pharmacyBill.update({
            where: { id: existingBill.id },
            data: {
                discount,
                subtotal,
                total_amount: totalAmount,
                balance_amount: balanceAmount,
            },
        });
        revalidatePath("/pharmacy/billing");
        revalidatePath(`/pharmacy/billing/${existingBill.id}`);
        const updated = await db.pharmacyBill.findUnique({
            where: { id: existingBill.id },
            include: {
                items: { include: { medicine: true } },
                patient: true,
                prescription: true,
                payments: { orderBy: { created_at: "desc" } },
            },
        });
        if (!updated) {
            throw new Error("Failed to retrieve updated bill");
        }
        return updated;
    }
  const bill = await db.pharmacyBill.create({
    data: {
      bill_number: generateBillNumber(),
      patient_id: prescription.patient_id,
      prescription_id: prescription.id,
      subtotal,
      discount,
      total_amount: totalAmount,
      amount_paid: 0,
      balance_amount: totalAmount,
      status: PharmacyBillStatus.UNPAID,

      items: {
        create: items.map((item) => ({
          medicine_id: item.medicine_id,
          medicine_name: item.medicine_name,
          quantity: item.quantity,
          unit_price:
            item.quantity > 0
              ? item.total / item.quantity
              : 0,
          total_price: item.total,
        })),
      },
    },
    include: {
      items: true,
      patient: true,
      prescription: true,
    },
  });

  revalidatePath("/pharmacy/billing");
  revalidatePath(
    `/pharmacy/billing/${bill.id}`
  );
  return bill;
}

export async function getPharmacyBillsAction(){
    await requirePharmacyAccess();
    return db.pharmacyBill.findMany({
        include:{
            patient: true,
            prescription: true,
            items: true,
        },
        orderBy:{
            created_at: "desc",
        },
    });
}

export async function getPharmacyBillAction(
    billId: string
){
    await requirePharmacyAccess();
    
    const bill = await db.pharmacyBill.findUnique({
        where:{
            id:billId,
        },
        include:{
            patient: true,
            prescription: true,
            items: {
                include:{
                    medicine: true,
                },
            },
            payments:{
                orderBy:{
                    created_at: "desc",
                },
            },
        },
    });
    if(!bill){
        throw new Error("Pharmacy bill not found");
    }
    return bill;
}

export async function updatePharmacyBillDiscountAction(
    billId: string,
    discount: number
) {
    await requirePharmacyAccess();

    const bill = await db.pharmacyBill.findUnique({
        where: { id: billId },
    });
    if (!bill) {
        throw new Error("Bill not found");
    }
    if (bill.status === PharmacyBillStatus.CANCELLED) {
        throw new Error("Bill is cancelled");
    }

    const discountAmount = Math.max(discount, 0);
    const totalAmount = Math.max(bill.subtotal - discountAmount, 0);
    const balanceAmount = Math.max(totalAmount - bill.amount_paid, 0);

    const status =
        totalAmount <= 0
            ? PharmacyBillStatus.PAID
            : bill.amount_paid > 0
              ? PharmacyBillStatus.PARTIAL
              : bill.status;

    const updatedBill = await db.pharmacyBill.update({
        where: { id: billId },
        data: {
            discount: discountAmount,
            total_amount: totalAmount,
            balance_amount: balanceAmount,
            status,
        },
        include: {
            patient: true,
            items: { include: { medicine: true } },
            payments: { orderBy: { created_at: "desc" } },
        },
    });

    revalidatePath("/pharmacy/billing");
    revalidatePath(`/pharmacy/billing/${billId}`);

    return updatedBill;
}

export async function payPharmacyBillAction( input: {
    billId: string;
    amount: number;
    method: PharmacyPaymentMethod;
    transactionId?: string;
}){
    await requirePharmacyAccess();
    if(!Number.isFinite(input.amount) || input.amount <= 0){
        throw new Error("Invalid Payment amount");
    }

    const result = await db.$transaction(
        async (tx) => {
            const bill = await tx.pharmacyBill.findUnique({
                where:{
                    id: input.billId,
                },
            });
            if(!bill){
                throw new Error("Bill not found");
            }
            if(bill.status ===PharmacyBillStatus.CANCELLED){
                throw new Error("Bill is Cancelled");
            }
            const remaining = bill.total_amount-bill.amount_paid;
            if(remaining <= 0 ){
                throw new Error("Bill is already fully paid");
            }
            if(input.amount > remaining){
                throw new Error(`Maximum payment allowed is ${remaining.toFixed(2)}`)
            }


            const newAmountPaid = bill.amount_paid+ input.amount;
            const newBalance = bill.total_amount- newAmountPaid;

            const status = newBalance <= 0
            ? PharmacyBillStatus.PAID
            : PharmacyBillStatus.PARTIAL;

            await tx.pharmacyPayment.create({
                data:{
                    bill_id: bill.id,
                    amount: input.amount,
                    method: input.method,
                    transaction_id: input.transactionId || null,
                },
            });
            const updateBill = await tx.pharmacyBill.update({
                where: {
                    id: bill.id,
                },
                data:{
                    amount_paid: newAmountPaid,
                    balance_amount: Math.max(newBalance, 0),
                    status,
                },
                include:{
                    patient: true,
                    items: true,
                    payments:{
                        orderBy:{
                            created_at: "desc",
                        },
                    },
                },
            });
            return updateBill;
        },
        {
            timeout: 30000,
        }
    );
     revalidatePath("/pharmacy/billing");
     revalidatePath(
    `/pharmacy/billing/${input.billId}`
 );

  return result;

}

