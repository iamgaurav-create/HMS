"use server";

import db from "@/lib/db";
import { sendPurchaseOrderEmail } from "@/lib/email";
import { generatePurchaseOrderPDF } from "@/lib/pharmach/purchase-order-pdf";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


const ALLOWER_ROLES=[
 "SuperAdmin",
 "admin",
 "Pharmacist",
 ]

async function checkAuthorization(){
    const {sessionClaims} = await auth();

    const role = sessionClaims?.metadata?.role as string | undefined;
    if(!role || !ALLOWER_ROLES.includes(role)){
        throw new Error("Unauthorized");
    }
    return role;
}

export async function getpurchaseOrderAction(){
    await checkAuthorization();
    return db.purchaseOrder.findMany({
        orderBy:{
            created_at: "desc",
        },
        include:{
            supplier: true,
            items:{
                include:{
                    medicine: true,
                },
            },
        },
    });
}

export async function getActiveSuppliersAction(){
    await checkAuthorization();
    return db.supplier.findMany({
        where:{ is_active: true },
        orderBy:{ name: "asc" },
    });
}

export async function getActiveMedicinesAction(){
    await checkAuthorization();
    return db.medicine.findMany({
        where:{ is_active: true },
        orderBy:{ name: "asc" },
    });
}


export async function createPurchaseOrderAction(data: {
    supplier_id: string;
    expected_date?: Date;
    notes?: string;
    items:{
        medicine_id:string;
        quantity: number;
        purchase_price: number;
    }[];
}){
    const {sessionClaims} = await auth();

    const role = sessionClaims?.metadata?.role as string | undefined;
    if(!role || !ALLOWER_ROLES.includes(role)){
        throw new Error("Unauthorized");
    }

    if(!data.supplier_id){
        throw new Error("Supplier is required");
    }
    if(!data.items.length){
        throw new Error("At least one Medicine is required");
    }
    for(const item of data.items){
        if(item.quantity <=0){
            throw new Error("Quantity must be greater than 0")
        };
    }

    const supplier = await db.supplier.findUnique({
    where:{
        id: data.supplier_id,
        },
    });
    if(!supplier){
        throw new Error("Supplier not found");
    }
    if(!supplier.is_active){
        throw new Error("supplier is inactive");
    }

    const orderNumber = `PO-${Date.now()}`;

    const purchaseOrder = await db.purchaseOrder.create({
        data:{
            order_number: orderNumber,
            supplier_id: data.supplier_id,
            expected_date:data.expected_date || null,
            notes: data.notes|| null,
            created_by: sessionClaims?.sub || "",
            status: "DRAFT",

            items: {
            create: data.items.map((item) => ({
            medicine_id: item.medicine_id,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
          })),
        },
      },
        include: {
            supplier:  true,
            items:{
                include:{
                    medicine: true,
                },
            },
        },
    });

    revalidatePath("/pharmacy/purchase-order");
    return purchaseOrder

}


export async function placePurchaseOrderAction(id : string){
    console.log("[PlaceOrder] Starting placePurchaseOrderAction for id:", id);
    await checkAuthorization();
    console.log("[PlaceOrder] Authorization passed");
    const order= await db.purchaseOrder.findUnique({
        where:{
            id,
        },
        include:{
            supplier: true,
        items:{
            include: {
                medicine: true,
            },    
        },
        },
        });
        console.log("[PlaceOrder] Order found:", order ? `id=${order.id}, status=${order.status}` : "null");
        if(!order){
            throw new Error("Purchase order not found");
        }
        if(!order.items.length){
            throw new Error("Purchase order has not medicines")
        }
        if (!order.supplier.is_active) {
        throw new Error(
        "Supplier is inactive"
        );
    }

    if(!order.supplier.email){
        throw new Error(
        "Supplier has no email address"
        );
    }

    console.log("[PlaceOrder] Generating PDF...");
    const pdf = await generatePurchaseOrderPDF({
            order_number:order.order_number,
            order_date:order.order_date,
            expected_date: order.expected_date,
            supplier:{
                name:order.supplier.name,
                phone:order.supplier.phone,
                email:order.supplier.email,
                address:order.supplier.address,
            },
            items:order.items.map((item)=>({
                quantity: item.quantity,
                purchase_price: item.purchase_price,
                medicine:{
                    name:item.medicine.name,
                    generic_name:item.medicine.generic_name,
                    unit:item.medicine.unit,
                },
            })),
            notes:order.notes,
        })

        const pdfUrl = `data:application/pdf;base64,${Buffer.from(pdf).toString("base64")}`;
        console.log("[PlaceOrder] PDF generated, length:", pdf.length);
        let emailSend=false;
        if(order.supplier.email){
            try{
                console.log("[PlaceOrder] Sending email to:", order.supplier.email);
                const emailResult = await sendPurchaseOrderEmail({
                    supplierName: order.supplier.name,
                    supplierEmail:order.supplier.email,
                    orderNumber:order.order_number,
                    pdf,
                });
                console.log("[PlaceOrder] Email result:", emailResult);
                if (emailResult.success) {
                  emailSend = true;
                } else {
                  console.error("purchase order email failed:", emailResult.error);
                }
            }
            catch(error){
                console.error("purchase order email failed:", error);
            }
        }

        if(!emailSend){
            throw new Error("Purchase order was not sent. Email notification failed.");
        }
        console.log("[PlaceOrder] Email sent successfully, updating order...");

//update

const updateOrder= await db.purchaseOrder.update({
    where:{
        id,
    },
    data:{
        status:"ORDERED",
        pdf_url: pdfUrl || null,
        email_sent_at:emailSend
        ?new Date()
        :null,
    }
});
console.log("[PlaceOrder] Order updated:", updateOrder.id);

revalidatePath("/pharmacy/purchase-order");
console.log("[PlaceOrder] Revalidated path, returning success");
return{ 
success:true,
orderId:updateOrder.id,
orderNumber:updateOrder.order_number,
pdfUrl:updateOrder.pdf_url,
emailSend,
};
}

//cancle

export async function canclePurchaseOrderAction(id:string){
    await checkAuthorization();
    const order = await db.purchaseOrder.findUnique({
        where:{
            id,
        },
    });
    if(!order){
        throw new Error("Purchase Order not found");
    }
    if(order.status !=="DRAFT"){
        throw new Error("Only draft order can be cancelled")
    }
    await db.purchaseOrder.update({
        where:{
            id,
        },
        data:{
            status:"CANCELLED",
        },
    });
    revalidatePath("/pharmacy/purchase-order");
    return {
        success: true,
    };
}


//generate purchase order Num

async function generateOrderNumber(){
    const year= new Date().getFullYear();
    const count= await db.purchaseOrder.count();
    return  `PO-${year}-${String(count+1).padStart(5, "0")}`
}


//cloudnaey for saving

