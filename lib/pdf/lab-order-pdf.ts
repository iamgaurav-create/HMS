import PDFDocument from "pdfkit";
import type { DoctorLabOrder } from "@/lib/db/doctor-lab-orders";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BODY_TOP = 56;
const FOOTER_TOP = PAGE_HEIGHT - 52;

const COLORS = {
  header: "#1e1b4b",
  headerAccent: "#4f46e5",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  surface: "#f8fafc",
  indigo: "#4f46e5",
  indigoSoft: "#eef2ff",
  white: "#ffffff",
};

const STATUS_COLORS: Record<string, { text: string; background: string }> = {
  pending: { text: "#b45309", background: "#fef3c7" },
  "in progress": { text: "#1d4ed8", background: "#dbeafe" },
  "sample collected": { text: "#6d28d9", background: "#ede9fe" },
  completed: { text: "#047857", background: "#d1fae5" },
  cancelled: { text: "#b91c1c", background: "#fee2e2" },
};

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function calculateAge(dateOfBirth: Date) {
  const birth = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function statusColors(status: string) {
  return STATUS_COLORS[status.trim().toLowerCase()] ?? {
    text: COLORS.textMuted,
    background: COLORS.surface,
  };
}

function drawLabel(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.textMuted)
    .text(label.toUpperCase(), x, y, { width, lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.text)
    .text(value || "—", x, y + 10, { width, lineBreak: false });
}

function drawCard(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  doc
    .roundedRect(x, y, width, height, 6)
    .fillColor(COLORS.white)
    .fill();

  doc
    .roundedRect(x, y, width, height, 6)
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .rect(x, y, 3, height)
    .fillColor(COLORS.headerAccent)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.header)
    .text(title.toUpperCase(), x + 14, y + 12, { width: width - 24, lineBreak: false });
}

function drawPageChrome(doc: PDFKit.PDFDocument, order: DoctorLabOrder) {
  doc
    .rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    .fillColor(COLORS.white)
    .fill();

  doc
    .rect(0, 0, PAGE_WIDTH, 96)
    .fillColor(COLORS.header)
    .fill();

  doc
    .rect(0, 92, PAGE_WIDTH, 4)
    .fillColor(COLORS.headerAccent)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.white)
    .text("HOSPITAL MANAGEMENT SYSTEM", MARGIN, 26, {
      width: 320,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text("Laboratory Department  •  Diagnostic Services", MARGIN, 47, {
      width: 320,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor("#a5b4fc")
    .text("Laboratory Test Request & Authorisation Sheet", MARGIN, 62, {
      width: 320,
      lineBreak: false,
    });

  const rightColumnWidth = 220;
  const rightColumnX = PAGE_WIDTH - MARGIN - rightColumnWidth;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.white)
    .text("LABORATORY TEST ORDER", rightColumnX, 26, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(`Order Number: ${order.orderNumber}`, rightColumnX, 47, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(`Order Date: ${formatDate(order.testDate)}`, rightColumnX, 61, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(`Total Tests: ${order.testCount}`, rightColumnX, 75, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });
}

function drawSummaryStrip(doc: PDFKit.PDFDocument, order: DoctorLabOrder) {
  const y = 112;
  const height = 44;

  doc
    .roundedRect(MARGIN, y, CONTENT_WIDTH, height, 6)
    .fillColor(COLORS.indigoSoft)
    .fill();

  const columnWidth = CONTENT_WIDTH / 4;
  const entries = [
    { label: "Order Status", value: order.status },
    { label: "Tests Requested", value: String(order.testCount) },
    { label: "Total Amount", value: formatCurrency(order.total) },
    {
      label: "Appointment Date",
      value: formatDate(order.appointmentDate),
    },
  ];

  entries.forEach((entry, index) => {
    const x = MARGIN + index * columnWidth + 14;

    drawLabel(doc, entry.label, entry.value, x, y + 10, columnWidth - 22);

    if (index < entries.length - 1) {
      doc
        .moveTo(MARGIN + (index + 1) * columnWidth, y + 10)
        .lineTo(MARGIN + (index + 1) * columnWidth, y + height - 10)
        .lineWidth(0.6)
        .strokeColor("#c7d2fe")
        .stroke();
    }
  });

  return y + height;
}

function drawInfoCards(doc: PDFKit.PDFDocument, order: DoctorLabOrder) {
  const y = 168;
  const height = 118;
  const gap = 14;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;

  drawCard(doc, "Patient Details", MARGIN, y, cardWidth, height);

  const patientFields: Array<[string, string]> = [
    ["Patient Name", order.patientName],
    ["Patient Number", order.patientNumber],
    [
      "Age / Sex",
      `${calculateAge(order.patientDateOfBirth)} years  •  ${order.patientGender || "—"}`,
    ],
    ["Contact", order.patientPhone || "—"],
  ];

  patientFields.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      MARGIN + 14,
      y + 32 + index * 20,
      cardWidth - 28
    );
  });

  const rightX = MARGIN + cardWidth + gap;

  drawCard(doc, "Requesting Doctor", rightX, y, cardWidth, height);

  const doctorFields: Array<[string, string]> = [
    ["Doctor Name", order.doctorName ? `Dr. ${order.doctorName}` : "—"],
    ["Specialization", order.doctorSpecialization || "—"],
    ["License Number", order.doctorLicenseNumber || "—"],
    ["Contact", order.doctorPhone || "—"],
  ];

  doctorFields.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      rightX + 14,
      y + 32 + index * 20,
      cardWidth - 28
    );
  });

  return y + height;
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  columns: { index: number; test: number; status: number; price: number }
) {
  const height = 20;

  doc
    .rect(MARGIN, y, CONTENT_WIDTH, height)
    .fillColor(COLORS.header)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLORS.white)
    .text("#", MARGIN + 8, y + 6.5, { width: 20, lineBreak: false })
    .text(
      "Laboratory Test",
      MARGIN + columns.index + 8,
      y + 6.5,
      { width: columns.test - 16, lineBreak: false }
    )
    .text("Status", MARGIN + columns.index + columns.test, y + 6.5, {
      width: columns.status,
      align: "center",
      lineBreak: false,
    })
    .text(
      "Price",
      MARGIN + CONTENT_WIDTH - columns.price - 8,
      y + 6.5,
      { width: columns.price, align: "right", lineBreak: false }
    );

  return y + height;
}

function drawTestsTable(
  doc: PDFKit.PDFDocument,
  order: DoctorLabOrder,
  startY: number
) {
  const columns = {
    index: 26,
    test: 292,
    status: 96,
    price: CONTENT_WIDTH - 26 - 292 - 96,
  };

  let y = drawTableHeader(doc, startY, columns);

  order.tests.forEach((test, index) => {
    doc.font("Helvetica-Bold").fontSize(8.5);
    const nameHeight = doc.heightOfString(test.name, {
      width: columns.test - 20,
    });

    doc.font("Helvetica").fontSize(7);
    const descriptionHeight = test.description
      ? doc.heightOfString(test.description, {
          width: columns.test - 20,
        })
      : 0;

    const rowHeight = Math.max(
      24,
      12 + nameHeight + descriptionHeight + 6
    );

    if (y + rowHeight > FOOTER_TOP - 8) {
      doc.addPage();
      y = drawTableHeader(doc, BODY_TOP, columns);
    }

    if (index % 2 === 1) {
      doc
        .rect(MARGIN, y, CONTENT_WIDTH, rowHeight)
        .fillColor(COLORS.surface)
        .fill();
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.textMuted)
      .text(String(index + 1), MARGIN + 8, y + 8, { width: 20, lineBreak: false });

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text(test.name, MARGIN + columns.index + 8, y + 7, {
        width: columns.test - 20,
      });

    if (test.description) {
      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(COLORS.textMuted)
        .text(test.description, MARGIN + columns.index + 8, y + 9 + nameHeight, {
          width: columns.test - 20,
        });
    }

    const colors = statusColors(test.status);
    const pillWidth = 78;
    const pillHeight = 13;
    const pillX = MARGIN + columns.index + columns.test + 9;
    const pillY = y + (rowHeight - pillHeight) / 2;

    doc
      .roundedRect(pillX, pillY, pillWidth, pillHeight, 6)
      .fillColor(colors.background)
      .fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .fillColor(colors.text)
      .text(test.status, pillX, pillY + 4, {
        width: pillWidth,
        align: "center",
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text(
        formatCurrency(test.price),
        MARGIN + CONTENT_WIDTH - columns.price - 8,
        y + 8,
        { width: columns.price, align: "right", lineBreak: false }
      );

    y += rowHeight;

    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + CONTENT_WIDTH, y)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();
  });

  const totalHeight = 24;

  if (y + totalHeight > FOOTER_TOP - 8) {
    doc.addPage();
    y = BODY_TOP;
  }

  doc
    .rect(MARGIN, y, CONTENT_WIDTH, totalHeight)
    .fillColor(COLORS.indigoSoft)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.header)
    .text("Order Total", MARGIN + 8, y + 8, { lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.header)
    .text(
      formatCurrency(order.total),
      MARGIN + CONTENT_WIDTH - columns.price - 8,
      y + 7,
      { width: columns.price, align: "right", lineBreak: false }
    );

  y += totalHeight;

  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + CONTENT_WIDTH, y)
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();

  return y;
}

function drawNotes(doc: PDFKit.PDFDocument, order: DoctorLabOrder, startY: number) {
  if (!order.notes || !order.notes.trim()) {
    return startY;
  }

  const notes = order.notes.trim();
  doc.font("Helvetica").fontSize(8);
  const height = 26 + doc.heightOfString(notes, { width: CONTENT_WIDTH - 28 });

  let y = startY + 16;

  if (y + height > FOOTER_TOP - 8) {
    doc.addPage();
    y = BODY_TOP;
  }

  doc
    .roundedRect(MARGIN, y, CONTENT_WIDTH, height, 6)
    .fillColor(COLORS.surface)
    .fill();

  doc
    .roundedRect(MARGIN, y, CONTENT_WIDTH, height, 6)
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(COLORS.header)
    .text("CLINICAL NOTES / TEST INSTRUCTIONS", MARGIN + 14, y + 10, {
      width: CONTENT_WIDTH - 28,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.text)
    .text(notes, MARGIN + 14, y + 24, { width: CONTENT_WIDTH - 28 });

  return y + height;
}

function drawSignatures(
  doc: PDFKit.PDFDocument,
  order: DoctorLabOrder,
  startY: number
) {
  const height = 78;
  let y = startY + 26;

  if (y + height > FOOTER_TOP - 8) {
    doc.addPage();
    y = BODY_TOP;
  }

  const gap = 20;
  const columnWidth = (CONTENT_WIDTH - gap) / 2;

  const blocks = [
    {
      title: "Requested By",
      name: order.doctorName ? `Dr. ${order.doctorName}` : "—",
      detail: order.doctorSpecialization || "",
    },
    {
      title: "Authorised By",
      name: "Laboratory In-charge",
      detail: "Signature & date",
    },
  ];

  blocks.forEach((block, index) => {
    const x = MARGIN + index * (columnWidth + gap);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(COLORS.text)
      .text(block.title, x, y, { width: columnWidth, lineBreak: false });

    doc
      .moveTo(x, y + 40)
      .lineTo(x + columnWidth, y + 40)
      .lineWidth(0.6)
      .strokeColor(COLORS.textMuted)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.textMuted)
      .text(block.name, x, y + 45, { width: columnWidth, lineBreak: false });

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.textMuted)
      .text(block.detail, x, y + 56, { width: columnWidth, lineBreak: false });
  });

  return y + height;
}

function drawFooter(
  doc: PDFKit.PDFDocument,
  order: DoctorLabOrder,
  pageNumber: number,
  pageCount: number
) {
  doc
    .moveTo(MARGIN, FOOTER_TOP)
    .lineTo(MARGIN + CONTENT_WIDTH, FOOTER_TOP)
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(COLORS.textMuted)
    .text(
      "This document is a laboratory test request and does not constitute a diagnostic report.",
      MARGIN,
      FOOTER_TOP + 8,
      { width: 340, lineBreak: false }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(COLORS.header)
    .text(
      `${order.orderNumber}  •  Page ${pageNumber} of ${pageCount}  •  Generated ${formatDateTime(new Date())}`,
      MARGIN + CONTENT_WIDTH - 220,
      FOOTER_TOP + 8,
      { width: 220, align: "right", lineBreak: false }
    );
}

/**
 * Builds the printed laboratory test request for an order. The document is
 * paginated so an order with many tests stays readable, and every page
 * carries the order reference in the footer.
 */
export function generateLabOrderPdf(order: DoctorLabOrder): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: {
        Title: `Laboratory Test Order ${order.orderNumber}`,
        Author: "Hospital Management System",
        Subject: `Laboratory test request for ${order.patientName}`,
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

    drawPageChrome(doc, order);

    drawSummaryStrip(doc, order);
    const cardsBottom = drawInfoCards(doc, order);
    const tableBottom = drawTestsTable(doc, order, cardsBottom + 18);
    const notesBottom = drawNotes(doc, order, tableBottom);
    drawSignatures(doc, order, notesBottom);

    const range = doc.bufferedPageRange();

    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      drawFooter(doc, order, index - range.start + 1, range.count);
    }

    doc.end();
  });
}
