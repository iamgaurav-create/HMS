import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import db from "@/lib/db";

export const runtime = "nodejs";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  navy: "#0f172a",
  navyLight: "#1e293b",
  teal: "#0f766e",
  tealLight: "#14b8a6",
  emerald: "#059669",
  text: "#0f172a",
  textLight: "#475569",
  muted: "#64748b",
  border: "#e2e8f0",
  background: "#f8fafc",
  white: "#ffffff",
  greenBackground: "#ecfdf5",
  greenBorder: "#a7f3d0",
};

function calculateAge(dateOfBirth: Date) {
  const today = new Date();
  const birth = new Date(dateOfBirth);

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDifference =
    today.getMonth() -
    birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getValue(
  value: string | null | undefined,
  fallback = "Not provided",
) {
  if (!value || value.trim() === "") {
    return fallback;
  }

  return value.trim();
}

function truncate(
  value: string | null | undefined,
  maxLength: number,
  fallback = "Not provided",
) {
  const text = getValue(value, fallback);

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - 3) + "...";
}

function drawBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = COLORS.white,
) {
  doc
    .roundedRect(
      x,
      y,
      width,
      height,
      7,
    )
    .fillColor(fill)
    .fill();

  doc
    .roundedRect(
      x,
      y,
      width,
      height,
      7,
    )
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();
}

function drawSectionTitle(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.navy)
    .text(
      title.toUpperCase(),
      MARGIN,
      y,
      {
        width: CONTENT_WIDTH,
        height: 11,
        lineBreak: false,
      },
    );

  doc
    .moveTo(
      MARGIN,
      y + 14,
    )
    .lineTo(
      PAGE_WIDTH - MARGIN,
      y + 14,
    )
    .lineWidth(0.7)
    .strokeColor(COLORS.border)
    .stroke();
}

function drawField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.muted)
    .text(
      label.toUpperCase(),
      x,
      y,
      {
        width,
        height: 9,
        lineBreak: false,
      },
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.text)
    .text(
      value,
      x,
      y + 11,
      {
        width,
        height: 16,
        ellipsis: true,
        lineBreak: false,
      },
    );
}

function drawConsent(
  doc: PDFKit.PDFDocument,
  label: string,
  active: boolean,
  x: number,
  y: number,
) {
  doc
    .circle(
      x + 4,
      y + 4,
      4,
    )
    .fillColor(
      active
        ? COLORS.emerald
        : "#cbd5e1",
    )
    .fill();

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.textLight)
    .text(
      label,
      x + 13,
      y,
      {
        width: 120,
        height: 10,
        lineBreak: false,
      },
    );
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(
        "Unauthorized",
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Patient ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const patient =
      await db.patient.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          patientNumber: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          gender: true,
          marital_status: true,
          phone: true,
          email: true,
          address: true,
          blood_group: true,
          emergency_contact_name: true,
          emergency_contact_number: true,
          emergency_contact_relation: true,
          allergies: true,
          medical_conditions: true,
          medical_history: true,
          insurance_provider: true,
          privacy_consent: true,
          service_consent: true,
          medical_consent: true,
          created_at: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          message: "Patient not found",
        },
        {
          status: 404,
        },
      );
    }

    const age = calculateAge(
      patient.date_of_birth,
    );

    const doc =
      new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: true,
        info: {
          Title: `Patient Profile - ${patient.patientNumber}`,
          Author:
            "Hospital Management System",
          Subject:
            "Patient Medical Profile",
        },
      });

    const chunks: Buffer[] = [];

    const pdfPromise =
      new Promise<Buffer>(
        (resolve, reject) => {
          doc.on(
            "data",
            (chunk: Buffer) => {
              chunks.push(chunk);
            },
          );

          doc.on("end", () => {
            resolve(
              Buffer.concat(chunks),
            );
          });

          doc.on("error", reject);
        },
      );

    doc
      .rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
      )
      .fillColor(COLORS.white)
      .fill();

    doc
      .rect(
        0,
        0,
        PAGE_WIDTH,
        118,
      )
      .fillColor(COLORS.navy)
      .fill();

    doc
      .rect(
        0,
        114,
        PAGE_WIDTH,
        4,
      )
      .fillColor(COLORS.tealLight)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor(COLORS.white)
      .text(
        "HOSPITAL MANAGEMENT SYSTEM",
        MARGIN,
        27,
        {
          width: 360,
          height: 23,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#cbd5e1")
      .text(
        "PATIENT MEDICAL PROFILE",
        MARGIN,
        53,
        {
          width: 300,
          height: 12,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor("#94a3b8")
      .text(
        "CONFIDENTIAL HEALTHCARE DOCUMENT",
        MARGIN,
        69,
        {
          width: 300,
          height: 10,
          lineBreak: false,
        },
      );

    drawBox(
      doc,
      420,
      27,
      139,
      52,
      COLORS.navyLight,
    );

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#94a3b8")
      .text(
        "PATIENT NUMBER",
        433,
        38,
        {
          width: 110,
          height: 9,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(
        patient.patientNumber,
        433,
        51,
        {
          width: 110,
          height: 16,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(COLORS.navy)
      .text(
        `${patient.first_name} ${patient.last_name}`,
        MARGIN,
        138,
        {
          width: 360,
          height: 20,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `${age} years  •  ${getValue(
          patient.gender,
        )}  •  Blood Group: ${getValue(
          patient.blood_group,
          "N/A",
        )}`,
        MARGIN,
        163,
        {
          width: 360,
          height: 12,
          lineBreak: false,
        },
      );

    doc
      .roundedRect(
        424,
        137,
        135,
        42,
        8,
      )
      .fillColor(COLORS.greenBackground)
      .fill();

    doc
      .roundedRect(
        424,
        137,
        135,
        42,
      )
      .lineWidth(0.6)
      .strokeColor(
        COLORS.greenBorder,
      )
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#047857")
      .text(
        "RECORD STATUS",
        437,
        147,
        {
          width: 110,
          height: 8,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.emerald)
      .text(
        "ACTIVE",
        437,
        158,
        {
          width: 110,
          height: 11,
          lineBreak: false,
        },
      );

    drawSectionTitle(
      doc,
      "Personal Information",
      201,
    );

    const columnGap = 10;

    const threeColumnWidth =
      (CONTENT_WIDTH -
        columnGap * 2) /
      3;

    drawBox(
      doc,
      MARGIN,
      223,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        threeColumnWidth +
        columnGap,
      223,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        (threeColumnWidth +
          columnGap) *
          2,
      223,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawField(
      doc,
      "Date of Birth",
      formatDate(
        patient.date_of_birth,
      ),
      MARGIN + 11,
      235,
      threeColumnWidth - 22,
    );

    drawField(
      doc,
      "Age",
      `${age} years`,
      MARGIN +
        threeColumnWidth +
        columnGap +
        11,
      235,
      threeColumnWidth - 22,
    );

    drawField(
      doc,
      "Gender",
      getValue(patient.gender),
      MARGIN +
        (threeColumnWidth +
          columnGap) *
          2 +
        11,
      235,
      threeColumnWidth - 22,
    );

    drawBox(
      doc,
      MARGIN,
      281,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        threeColumnWidth +
        columnGap,
      281,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        (threeColumnWidth +
          columnGap) *
          2,
      281,
      threeColumnWidth,
      50,
      COLORS.background,
    );

    drawField(
      doc,
      "Marital Status",
      getValue(
        patient.marital_status,
      ),
      MARGIN + 11,
      293,
      threeColumnWidth - 22,
    );

    drawField(
      doc,
      "Phone",
      getValue(patient.phone),
      MARGIN +
        threeColumnWidth +
        columnGap +
        11,
      293,
      threeColumnWidth - 22,
    );

    drawField(
      doc,
      "Email",
      truncate(
        patient.email,
        31,
      ),
      MARGIN +
        (threeColumnWidth +
          columnGap) *
          2 +
        11,
      293,
      threeColumnWidth - 22,
    );

    drawBox(
      doc,
      MARGIN,
      339,
      CONTENT_WIDTH,
      48,
      COLORS.background,
    );

    drawField(
      doc,
      "Address",
      truncate(
        patient.address,
        115,
      ),
      MARGIN + 11,
      351,
      CONTENT_WIDTH - 22,
    );

    drawSectionTitle(
      doc,
      "Emergency Contact",
      403,
    );

    drawBox(
      doc,
      MARGIN,
      425,
      CONTENT_WIDTH,
      51,
      COLORS.background,
    );

    const emergencyWidth =
      (CONTENT_WIDTH - 44) / 3;

    drawField(
      doc,
      "Contact Name",
      truncate(
        patient.emergency_contact_name,
        30,
      ),
      MARGIN + 12,
      437,
      emergencyWidth,
    );

    drawField(
      doc,
      "Contact Number",
      getValue(
        patient.emergency_contact_number,
      ),
      MARGIN +
        22 +
        emergencyWidth,
      437,
      emergencyWidth,
    );

    drawField(
      doc,
      "Relation",
      truncate(
        patient.emergency_contact_relation,
        25,
      ),
      MARGIN +
        32 +
        emergencyWidth * 2,
      437,
      emergencyWidth,
    );

    drawSectionTitle(
      doc,
      "Medical Information",
      496,
    );

    const medicalWidth =
      (CONTENT_WIDTH -
        columnGap) /
      2;

    drawBox(
      doc,
      MARGIN,
      518,
      medicalWidth,
      55,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        medicalWidth +
        columnGap,
      518,
      medicalWidth,
      55,
      COLORS.background,
    );

    drawField(
      doc,
      "Allergies",
      truncate(
        patient.allergies,
        50,
        "None reported",
      ),
      MARGIN + 12,
      531,
      medicalWidth - 24,
    );

    drawField(
      doc,
      "Medical Conditions",
      truncate(
        patient.medical_conditions,
        50,
        "None reported",
      ),
      MARGIN +
        medicalWidth +
        columnGap +
        12,
      531,
      medicalWidth - 24,
    );

    drawBox(
      doc,
      MARGIN,
      583,
      medicalWidth,
      55,
      COLORS.background,
    );

    drawBox(
      doc,
      MARGIN +
        medicalWidth +
        columnGap,
      583,
      medicalWidth,
      55,
      COLORS.background,
    );

    drawField(
      doc,
      "Insurance Provider",
      truncate(
        patient.insurance_provider,
        50,
        "Not provided",
      ),
      MARGIN + 12,
      596,
      medicalWidth - 24,
    );

    drawField(
      doc,
      "Blood Group",
      getValue(
        patient.blood_group,
        "Not specified",
      ),
      MARGIN +
        medicalWidth +
        columnGap +
        12,
      596,
      medicalWidth - 24,
    );

    drawBox(
      doc,
      MARGIN,
      648,
      CONTENT_WIDTH,
      58,
      COLORS.background,
    );

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.muted)
      .text(
        "MEDICAL HISTORY",
        MARGIN + 12,
        660,
        {
          width: 200,
          height: 9,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.textLight)
      .text(
        truncate(
          patient.medical_history,
          170,
          "No medical history recorded",
        ),
        MARGIN + 12,
        674,
        {
          width: CONTENT_WIDTH - 24,
          height: 20,
          ellipsis: true,
          lineBreak: false,
        },
      );

    drawSectionTitle(
      doc,
      "Consent & Registration",
      724,
    );

    drawBox(
      doc,
      MARGIN,
      746,
      CONTENT_WIDTH,
      54,
      COLORS.background,
    );

    drawConsent(
      doc,
      "Privacy Policy",
      patient.privacy_consent,
      MARGIN + 12,
      758,
    );

    drawConsent(
      doc,
      "Medical Services",
      patient.service_consent,
      MARGIN + 175,
      758,
    );

    drawConsent(
      doc,
      "Records Sharing",
      patient.medical_consent,
      MARGIN + 350,
      758,
    );

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor(COLORS.muted)
      .text(
        `Registered: ${formatDate(
          patient.created_at,
        )}`,
        MARGIN + 12,
        783,
        {
          width: 150,
          height: 8,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor(COLORS.muted)
      .text(
        `Generated: ${formatDateTime(
          new Date(),
        )}`,
        MARGIN + 180,
        783,
        {
          width: 180,
          height: 8,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(6)
      .fillColor(COLORS.teal)
      .text(
        patient.patientNumber,
        MARGIN + 390,
        783,
        {
          width: 133,
          height: 8,
          align: "right",
          lineBreak: false,
        },
      );

    doc
      .moveTo(
        MARGIN,
        816,
      )
      .lineTo(
        PAGE_WIDTH - MARGIN,
        816,
      )
      .lineWidth(0.6)
      .strokeColor(COLORS.border)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(6)
      .fillColor(COLORS.teal)
      .text(
        "HOSPITAL MANAGEMENT SYSTEM",
        MARGIN,
        823,
        {
          width: 200,
          height: 8,
          lineBreak: false,
        },
      );

    doc
      .font("Helvetica")
      .fontSize(5.8)
      .fillColor("#94a3b8")
      .text(
        "CONFIDENTIAL PATIENT INFORMATION",
        330,
        823,
        {
          width: 229,
          height: 8,
          align: "right",
          lineBreak: false,
        },
      );

    doc.end();

    const pdfBuffer =
      await pdfPromise;

    const patientName =
      `${patient.first_name} ${patient.last_name}`
        .replace(
          /[<>:"/\\|?*]/g,
          "",
        )
        .trim();

    const filename =
      `${patient.patientNumber} - ${patientName}.pdf`;

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            `attachment; filename="${filename}"`,
          "Content-Length":
            pdfBuffer.length.toString(),
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "PATIENT PDF ERROR:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Failed to generate patient PDF",
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    );
  }
}