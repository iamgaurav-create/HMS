import PDFDocument from "pdfkit";

import type { LabReportData, LabReportTest } from "@/components/laboratory/shared/lab-types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FIRST_BODY_TOP = 172;
const NEXT_BODY_TOP = 62;
const FOOTER_TOP = PAGE_HEIGHT - 54;

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
  green: "#047857",
  greenSoft: "#d1fae5",
  amber: "#b45309",
  amberSoft: "#fef3c7",
  red: "#b91c1c",
  redSoft: "#fee2e2",
  slate: "#475569",
  slateSoft: "#f1f5f9",
};

const STATUS_COLORS: Record<string, { text: string; background: string }> = {
  pending: { text: COLORS.slate, background: COLORS.slateSoft },
  "sample collected": { text: "#6d28d9", background: "#ede9fe" },
  "in progress": { text: "#1d4ed8", background: "#dbeafe" },
  "under review": { text: COLORS.amber, background: COLORS.amberSoft },
  verified: { text: COLORS.green, background: COLORS.greenSoft },
  released: { text: COLORS.indigo, background: COLORS.indigoSoft },
  completed: { text: COLORS.green, background: COLORS.greenSoft },
  cancelled: { text: COLORS.red, background: COLORS.redSoft },
};

const FLAG_COLORS: Record<string, { text: string; background: string }> = {
  normal: { text: COLORS.green, background: COLORS.greenSoft },
  abnormal: { text: COLORS.amber, background: COLORS.amberSoft },
  critical: { text: COLORS.red, background: COLORS.redSoft },
};

function hospitalDetails() {
  return {
    name: process.env.HOSPITAL_NAME || "Hospital Management System",
    department: process.env.HOSPITAL_LAB_DEPARTMENT || "Department of Pathology & Laboratory Medicine",
    address: process.env.HOSPITAL_ADDRESS || "",
    phone: process.env.HOSPITAL_PHONE || "",
    email: process.env.HOSPITAL_EMAIL || "",
  };
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calculateAge(dateOfBirth: Date | string) {
  const birth = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);

  if (Number.isNaN(birth.getTime())) {
    return "—";
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return `${age} years`;
}

function statusColors(status: string) {
  return STATUS_COLORS[status.trim().toLowerCase()] ?? {
    text: COLORS.textMuted,
    background: COLORS.surface,
  };
}

function flagColors(flag: string) {
  return FLAG_COLORS[flag.trim().toLowerCase()] ?? {
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
    .text(title.toUpperCase(), x + 14, y + 12, {
      width: width - 24,
      lineBreak: false,
    });
}

function drawPill(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  colors: { text: string; background: string },
  height = 13
) {
  doc.roundedRect(x, y, width, height, 6).fillColor(colors.background).fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(colors.text)
    .text(text, x, y + 4, { width, align: "center", lineBreak: false });
}

/**
 * The header of the first page. The hospital is printed once, every following
 * page only repeats the reference of the report.
 */
function drawDocumentHeader(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  isFinal: boolean
) {
  const hospital = hospitalDetails();

  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fillColor(COLORS.white).fill();

  doc.rect(0, 0, PAGE_WIDTH, 124).fillColor(COLORS.header).fill();
  doc.rect(0, 120, PAGE_WIDTH, 4).fillColor(COLORS.headerAccent).fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(COLORS.white)
    .text(hospital.name, MARGIN, 24, { width: 340, lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(hospital.department, MARGIN, 45, { width: 340, lineBreak: false });

  const contact: string[] = [];

  if (hospital.address) {
    contact.push(hospital.address);
  }

  if (hospital.phone) {
    contact.push(`Phone: ${hospital.phone}`);
  }

  if (hospital.email) {
    contact.push(hospital.email);
  }

  if (contact.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#a5b4fc")
      .text(contact.join("  •  "), MARGIN, 60, {
        width: 340,
        lineBreak: false,
      });
  }

  const rightColumnWidth = 210;
  const rightColumnX = PAGE_WIDTH - MARGIN - rightColumnWidth;

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(COLORS.white)
    .text("LABORATORY REPORT", rightColumnX, 26, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(`Report No: ${report.orderNumber}`, rightColumnX, 46, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#c7d2fe")
    .text(`Order Date: ${formatDate(report.orderDate)}`, rightColumnX, 60, {
      width: rightColumnWidth,
      align: "right",
      lineBreak: false,
    });

  drawPill(
    doc,
    isFinal ? "FINAL REPORT" : "PROVISIONAL REPORT",
    PAGE_WIDTH - MARGIN - 108,
    78,
    108,
    isFinal
      ? { text: COLORS.white, background: COLORS.green }
      : { text: COLORS.white, background: COLORS.amber },
    15
  );
}

/**
 * The small header that is printed on every page after the first one.
 */
function drawContinuationHeader(doc: PDFKit.PDFDocument, report: LabReportData) {
  const hospital = hospitalDetails();

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.header)
    .text(hospital.name, MARGIN, 26, { width: 300, lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.textMuted)
    .text(
      `Laboratory Report ${report.orderNumber}  •  ${report.patientName}`,
      MARGIN,
      38,
      { width: 320, lineBreak: false }
    );

  doc
    .moveTo(MARGIN, 50)
    .lineTo(MARGIN + CONTENT_WIDTH, 50)
    .lineWidth(0.6)
    .strokeColor(COLORS.border)
    .stroke();
}

/**
 * The warning that is printed when the report is not released yet.
 */
function drawPendingWarning(doc: PDFKit.PDFDocument, report: LabReportData) {
  const outstanding = report.tests.filter(
    (test) => test.status !== "Released" && test.status !== "Cancelled"
  );

  const height = 34;

  doc
    .roundedRect(MARGIN, FIRST_BODY_TOP, CONTENT_WIDTH, height, 6)
    .fillColor(COLORS.amberSoft)
    .fill();

  doc
    .roundedRect(MARGIN, FIRST_BODY_TOP, CONTENT_WIDTH, height, 6)
    .lineWidth(0.6)
    .strokeColor("#fcd34d")
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.amber)
    .text(
      outstanding.length > 0
        ? "PROVISIONAL REPORT - results of this report are not verified and released yet"
        : "PROVISIONAL REPORT - the report was not released yet",
      MARGIN + 12,
      FIRST_BODY_TOP + 8,
      { width: CONTENT_WIDTH - 24, lineBreak: false }
    );

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.amber)
    .text(
      outstanding.length > 0
        ? `${outstanding.length} of ${report.tests.length} tests still wait for verification or release. This document must not be used for clinical decisions.`
        : "This document must not be used for clinical decisions.",
      MARGIN + 12,
      FIRST_BODY_TOP + 19,
      { width: CONTENT_WIDTH - 24, lineBreak: false }
    );

  return FIRST_BODY_TOP + height + 14;
}

/**
 * The cards with the patient and the order information.
 */
function drawInformationCards(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  startY: number
) {
  const height = 118;
  const gap = 14;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;

  drawCard(doc, "Patient Details", MARGIN, startY, cardWidth, height);

  const patientFields: Array<[string, string]> = [
    ["Patient Name", report.patientName],
    ["Patient Number", report.patientNumber],
    [
      "Age / Sex",
      `${calculateAge(report.patientDateOfBirth)}  •  ${
        report.patientGender || "—"
      }`,
    ],
    ["Contact", report.patientPhone || "—"],
  ];

  patientFields.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      MARGIN + 14,
      startY + 32 + index * 20,
      cardWidth - 28
    );
  });

  const rightX = MARGIN + cardWidth + gap;

  drawCard(doc, "Order & Referring Doctor", rightX, startY, cardWidth, height);

  const orderFields: Array<[string, string]> = [
    ["Order Number", report.orderNumber],
    [
      "Referring Doctor",
      report.doctorName ? `Dr. ${report.doctorName}` : "—",
    ],
    [
      "Specialization",
      report.doctorSpecialization || "—",
    ],
    ["Order Status", report.orderStatus],
  ];

  orderFields.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      rightX + 14,
      startY + 32 + index * 20,
      cardWidth - 28
    );
  });

  return startY + height;
}

/**
 * The table with the parameters of a single test.
 */
function drawParameterTable(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  test: LabReportTest,
  startY: number
) {
  const columns = {
    parameter: 160,
    result: 95,
    unit: 75,
    reference: 125,
    flag: CONTENT_WIDTH - 160 - 95 - 75 - 125,
  };

  const drawHeader = (y: number) => {
    doc.rect(MARGIN, y, CONTENT_WIDTH, 19).fillColor(COLORS.header).fill();

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(COLORS.white)
      .text("Parameter", MARGIN + 8, y + 6, { width: columns.parameter - 16, lineBreak: false })
      .text("Result", MARGIN + columns.parameter + 8, y + 6, {
        width: columns.result - 16,
        lineBreak: false,
      })
      .text("Unit", MARGIN + columns.parameter + columns.result + 8, y + 6, {
        width: columns.unit - 16,
        lineBreak: false,
      })
      .text(
        "Reference Range",
        MARGIN + columns.parameter + columns.result + columns.unit + 8,
        y + 6,
        { width: columns.reference - 16, lineBreak: false }
      )
      .text(
        "Flag",
        MARGIN + CONTENT_WIDTH - columns.flag - 8,
        y + 6,
        { width: columns.flag, align: "right", lineBreak: false }
      );

    return y + 19;
  };

  let y = drawHeader(startY);

  const parameters = test.parameters.length > 0
    ? test.parameters
    : [
        {
          name: "Result",
          value: test.result ?? "",
          unit: test.result_unit ?? "",
          referenceRange: test.reference_range ?? "",
          flag: test.result_flag ?? "Normal",
        },
      ];

  parameters.forEach((parameter, index) => {
    doc.font("Helvetica").fontSize(8);
    const valueHeight = doc.heightOfString(parameter.value || "—", {
      width: columns.result - 16,
    });

    const nameHeight = doc.heightOfString(parameter.name, {
      width: columns.parameter - 16,
    });

    const rowHeight = Math.max(18, 8 + Math.max(valueHeight, nameHeight));

    if (y + rowHeight > FOOTER_TOP - 8) {
      doc.addPage();
      drawContinuationHeader(doc, report);
      y = drawHeader(NEXT_BODY_TOP);
    }

    if (index % 2 === 1) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fillColor(COLORS.surface).fill();
    }

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.text)
      .text(parameter.name, MARGIN + 8, y + 6, {
        width: columns.parameter - 16,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(COLORS.text)
      .text(parameter.value || "—", MARGIN + columns.parameter + 8, y + 6, {
        width: columns.result - 16,
      });

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.textMuted)
      .text(parameter.unit || "—", MARGIN + columns.parameter + columns.result + 8, y + 6, {
        width: columns.unit - 16,
      });

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.textMuted)
      .text(
        parameter.referenceRange || "Not configured",
        MARGIN + columns.parameter + columns.result + columns.unit + 8,
        y + 6,
        { width: columns.reference - 16, lineBreak: false }
      );

    const flag = (parameter.flag || "Normal").trim();
    const colors = flagColors(flag);

    doc
      .font("Helvetica-Bold")
      .fontSize(7)
      .fillColor(colors.text)
      .text(flag, MARGIN + CONTENT_WIDTH - columns.flag - 8, y + 6, {
        width: columns.flag,
        align: "right",
        lineBreak: false,
      });

    y += rowHeight;

    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + CONTENT_WIDTH, y)
      .lineWidth(0.4)
      .strokeColor(COLORS.border)
      .stroke();
  });

  return y;
}

/**
 * The sample and the professionals of a single test.
 */
function drawTestFooter(
  doc: PDFKit.PDFDocument,
  test: LabReportTest,
  startY: number
) {
  const height = 54;
  const gap = 12;
  const columnWidth = (CONTENT_WIDTH - gap * 3) / 4;

  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, height, 6)
    .fillColor(COLORS.surface)
    .fill();

  doc
    .roundedRect(MARGIN, startY, CONTENT_WIDTH, height, 6)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke();

  const columns: Array<[string, string]> = [
    ["Specimen", test.sample_type || "—"],
    ["Sample / Accession ID", test.sample_id || "—"],
    [
      "Collected On",
      test.sample_collected_at ? formatDateTime(test.sample_collected_at) : "—",
    ],
    ["Sample Status", test.sample_status || "—"],
  ];

  columns.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      MARGIN + 12 + index * (columnWidth + gap),
      startY + 9,
      columnWidth - 8
    );
  });

  doc
    .moveTo(MARGIN + 12, startY + 34)
    .lineTo(MARGIN + CONTENT_WIDTH - 12, startY + 34)
    .lineWidth(0.4)
    .strokeColor(COLORS.border)
    .stroke();

  const professionals: Array<[string, string]> = [
    [
      "Performed By",
      test.performed_by_name
        ? `${test.performed_by_name}${
            test.performed_at ? `  (${formatDateTime(test.performed_at)})` : ""
          }`
        : "—",
    ],
    [
      "Verified By",
      test.verified_by_name
        ? `${test.verified_by_name}${
            test.verified_at ? `  (${formatDateTime(test.verified_at)})` : ""
          }`
        : "Not verified",
    ],
    [
      "Released By",
      test.released_by_name
        ? `${test.released_by_name}${
            test.released_at ? `  (${formatDateTime(test.released_at)})` : ""
          }`
        : "Not released",
    ],
    ["Test Status", test.status],
  ];

  professionals.forEach(([label, value], index) => {
    drawLabel(
      doc,
      label,
      value,
      MARGIN + 12 + index * (columnWidth + gap),
      startY + 38,
      columnWidth - 8
    );
  });

  return startY + height;
}

/**
 * One block per test of the order.
 */
function drawTestBlock(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  test: LabReportTest,
  startY: number
) {
  let y = startY;

  if (y + 60 > FOOTER_TOP) {
    doc.addPage();
    drawContinuationHeader(doc, report);
    y = NEXT_BODY_TOP;
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(COLORS.header)
    .text(test.name, MARGIN, y, { width: CONTENT_WIDTH - 120, lineBreak: false });

  const colors = statusColors(test.status);

  drawPill(
    doc,
    test.status,
    MARGIN + CONTENT_WIDTH - 82,
    y - 1,
    82,
    colors,
    14
  );

  y += 16;

  if (test.description) {
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.textMuted)
      .text(test.description, MARGIN, y, { width: CONTENT_WIDTH, lineBreak: false });

    y += 11;
  }

  if (test.amendment_reason) {
    doc
      .font("Helvetica-Oblique")
      .fontSize(7)
      .fillColor(COLORS.amber)
      .text(
        `Amended on ${formatDateTime(test.amended_at)}${
          test.amended_by_name ? ` by ${test.amended_by_name}` : ""
        }: ${test.amendment_reason}`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH, lineBreak: false }
      );

    y += 11;
  }

  y += 4;

  y = drawParameterTable(doc, report, test, y);
  y = drawTestFooter(doc, test, y + 8);

  return y + 16;
}

/**
 * The notes of the order.
 */
function drawNotes(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  startY: number
) {
  const notes = report.notes.trim();

  if (!notes) {
    return startY;
  }

  doc.font("Helvetica").fontSize(8);
  const height = 30 + doc.heightOfString(notes, { width: CONTENT_WIDTH - 28 });

  let y = startY;

  if (y + height > FOOTER_TOP - 8) {
    doc.addPage();
    drawContinuationHeader(doc, report);
    y = NEXT_BODY_TOP;
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

/**
 * The signature blocks of the report.
 */
function drawSignatures(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  startY: number
) {
  const height = 84;
  let y = startY + 18;

  if (y + height > FOOTER_TOP - 8) {
    doc.addPage();
    drawContinuationHeader(doc, report);
    y = NEXT_BODY_TOP;
  }

  const gap = 18;
  const columnWidth = (CONTENT_WIDTH - gap * 2) / 3;

  const performed = report.tests.find((test) => test.performed_by_name);
  const verified = report.tests.find((test) => test.verified_by_name);
  const released = report.tests.find((test) => test.released_by_name);

  const blocks = [
    {
      title: "Performed By",
      name: performed?.performed_by_name ?? "—",
      detail: performed?.performed_at
        ? formatDateTime(performed.performed_at)
        : "Laboratory professional",
    },
    {
      title: "Verified By",
      name: verified?.verified_by_name ?? "—",
      detail: verified?.verified_at
        ? formatDateTime(verified.verified_at)
        : "Authorised reviewer",
    },
    {
      title: "Released By",
      name: released?.released_by_name ?? "—",
      detail: released?.released_at
        ? formatDateTime(released.released_at)
        : "Authorised professional",
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
      .moveTo(x, y + 38)
      .lineTo(x + columnWidth, y + 38)
      .lineWidth(0.6)
      .strokeColor(COLORS.textMuted)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.textMuted)
      .text(block.name, x, y + 43, { width: columnWidth, lineBreak: false });

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(COLORS.textMuted)
      .text(block.detail, x, y + 54, { width: columnWidth, lineBreak: false });
  });

  return y + height;
}

/**
 * The footer of every page with the page number.
 */
function drawFooter(
  doc: PDFKit.PDFDocument,
  report: LabReportData,
  pageNumber: number,
  pageCount: number,
  isFinal: boolean
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
      isFinal
        ? "Final laboratory report. Verified and released by the department of pathology."
        : "Provisional laboratory report. Not verified, not for clinical use.",
      MARGIN,
      FOOTER_TOP + 8,
      { width: 330, lineBreak: false }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(COLORS.header)
    .text(
      `${report.orderNumber}  •  Page ${pageNumber} of ${pageCount}  •  Generated ${formatDateTime(
        new Date()
      )}`,
      MARGIN + CONTENT_WIDTH - 230,
      FOOTER_TOP + 8,
      { width: 230, align: "right", lineBreak: false }
    );
}

/**
 * The report of one laboratory order.
 *
 * The report covers every test of the order and holds the patient, the
 * referring doctor, the sample, the parameters, the professionals that
 * performed and verified the test and the status of the test. A report that
 * was not released yet is marked as provisional.
 */
export function generateLabReportPdf(report: LabReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      bufferPages: true,
      info: {
        Title: `Laboratory Report ${report.orderNumber}`,
        Author: hospitalDetails().name,
        Subject: `Laboratory report for ${report.patientName}`,
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

    const isFinal = report.tests.every(
      (test) => test.status === "Released" || test.status === "Cancelled"
    );

    drawDocumentHeader(doc, report, isFinal);

    let y = drawPendingWarning(doc, report);

    y = drawInformationCards(doc, report, y);
    y += 18;

    report.tests.forEach((test) => {
      y = drawTestBlock(doc, report, test, y);
    });

    y = drawNotes(doc, report, y);
    drawSignatures(doc, report, y);

    const range = doc.bufferedPageRange();

    for (let index = range.start; index < range.start + range.count; index += 1) {
      doc.switchToPage(index);
      drawFooter(
        doc,
        report,
        index - range.start + 1,
        range.count,
        isFinal
      );
    }

    doc.end();
  });
}
