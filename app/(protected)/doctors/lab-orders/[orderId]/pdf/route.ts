import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { getDoctorLabOrder } from "@/lib/db/doctor-lab-orders";
import { generateLabOrderPdf } from "@/lib/pdf/lab-order-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["Doctor", "SuperAdmin", "admin"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { message: "You do not have access to laboratory orders" },
      { status: 403 }
    );
  }

  const { orderId } = await params;

  try {
    const order = await getDoctorLabOrder(userId, orderId);

    if (!order) {
      return NextResponse.json(
        { message: "Laboratory order not found" },
        { status: 404 }
      );
    }

    const pdf = await generateLabOrderPdf(order);

    const filename = `${order.orderNumber} - ${order.patientName}`
      .replace(/[<>:"/\\|?*]/g, "")
      .trim();

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[doctors/lab-orders/pdf]", error);

    return NextResponse.json(
      {
        message: "Failed to generate the laboratory order PDF",
        error:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
