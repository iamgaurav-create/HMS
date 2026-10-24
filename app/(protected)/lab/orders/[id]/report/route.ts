import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { getLaboratoryOrderReport } from "@/lib/db/laboratory-reports";
import { generateLabReportPdf } from "@/lib/pdf/lab-report-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["SuperAdmin", "admin", "LabTechnician", "Doctor"];

/**
 * The laboratory report of an order. The document covers every test of the
 * order, so one file holds the complete result of the patient.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { message: "You do not have access to laboratory reports" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const orderId = id?.trim();

  if (!orderId) {
    return NextResponse.json(
      { message: "Invalid laboratory order" },
      { status: 400 }
    );
  }

  try {
    const report = await getLaboratoryOrderReport(orderId);

    if (!report) {
      return NextResponse.json(
        { message: "Laboratory order not found" },
        { status: 404 }
      );
    }

    const pdf = await generateLabReportPdf(report);

    const filename = `${report.orderNumber} - ${report.patientName}`
      .replace(/[<>:"/\\|?*]/g, "")
      .trim();

    const inline = new URL(request.url).searchParams.get("view") === "1";

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}.pdf"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[lab/orders/report]", error);

    return NextResponse.json(
      {
        message: "Failed to generate the laboratory report",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
