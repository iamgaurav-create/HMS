import PDFDocument from "pdfkit";

type PurchaseOrderPDFData = {
  order_number: string;
  order_date: Date;
  expected_date: Date | null;

  supplier: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };

  items: {
    quantity: number;
    purchase_price: number;

    medicine: {
      name: string;
      generic_name: string | null;
      unit: string;
    };
  }[];

  notes: string | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

export function generatePurchaseOrderPDF(
  data: PurchaseOrderPDFData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 45,
      info: {
        Title: `Purchase Order ${data.order_number}`,
        Author: "Hospital Management System",
      },
    });

    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    doc.on("error", reject);

   
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#0f172a")
      .text("HOSPITAL MANAGEMENT SYSTEM");

    doc
      .moveDown(0.4)
      .fontSize(13)
      .fillColor("#2563eb")
      .text("PHARMACY PURCHASE ORDER");

    doc
      .moveDown(0.8)
      .strokeColor("#cbd5e1")
      .lineWidth(1)
      .moveTo(45, doc.y)
      .lineTo(550, doc.y)
      .stroke();

    doc.moveDown(1);

   
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#0f172a")
      .text("Purchase Order");

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`PO Number: ${data.order_number}`);

    doc.text(
      `Order Date: ${formatDate(data.order_date)}`,
    );

    doc.text(
      `Expected Delivery: ${
        data.expected_date
          ? formatDate(data.expected_date)
          : "Not specified"
      }`,
    );

    doc.moveDown(1);

   
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("Supplier");

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(data.supplier.name);

    if (data.supplier.email) {
      doc.text(`Email: ${data.supplier.email}`);
    }

    if (data.supplier.phone) {
      doc.text(`Phone: ${data.supplier.phone}`);
    }

    if (data.supplier.address) {
      doc.text(`Address: ${data.supplier.address}`);
    }

    doc.moveDown(1);

   
    const tableTop = doc.y;

    doc
      .rect(45, tableTop, 505, 25)
      .fill("#eff6ff");

    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(9);

    doc.text("Medicine", 52, tableTop + 8);
    doc.text("Qty", 320, tableTop + 8);
    doc.text("Unit Price", 365, tableTop + 8);
    doc.text("Total", 465, tableTop + 8);

    doc.moveDown(2);

   
    let grandTotal = 0;

    data.items.forEach((item) => {
      const itemTotal =
        item.quantity * item.purchase_price;

      grandTotal += itemTotal;

      const medicineName =
        item.medicine.name.length > 38
          ? `${item.medicine.name.substring(0, 38)}...`
          : item.medicine.name;

      const rowY = doc.y;

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#334155")
        .text(medicineName, 52, rowY, {
          width: 250,
        });

      doc.text(
        String(item.quantity),
        320,
        rowY,
      );

      doc.text(
        formatCurrency(item.purchase_price),
        365,
        rowY,
      );

      doc.text(
        formatCurrency(itemTotal),
        465,
        rowY,
      );

      doc.moveDown(1.4);

      doc
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .moveTo(45, doc.y)
        .lineTo(550, doc.y)
        .stroke();

      doc.moveDown(0.6);
    });

   
    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#0f172a")
      .text(
        `Expected Order Total: ${formatCurrency(
          grandTotal,
        )}`,
        340,
        doc.y,
        {
          width: 210,
          align: "right",
        },
      );

   
    if (data.notes) {
      doc.moveDown(2);

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Notes");

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(data.notes, {
          width: 500,
        });
    }

   
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#64748b")
      .text(
        "This document is a purchase order and does not represent final stock receipt or final invoice pricing.",
        45,
        800,
        {
          width: 505,
          align: "center",
        },
      );

    doc.end();
  });
}