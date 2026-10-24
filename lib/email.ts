import nodemailer from "nodemailer";

// ============================================================
// Environment configuration
// ============================================================

const HOSPITAL_EMAIL =
  process.env.SMTP_FROM ||
  process.env.HOSPITAL_EMAIL ||
  process.env.SMTP_USER;

const HOSPITAL_NAME =
  process.env.HOSPITAL_NAME || "Hospital Management System";

const SMTP_HOST = process.env.SMTP_HOST;

const SMTP_PORT = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : 587;

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ============================================================
// Shared Nodemailer transporter
// ============================================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const host = (SMTP_HOST || "").toLowerCase();

  // Check SMTP configuration
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    host.includes("yourprovider.com") ||
    host.includes("your-provider.com") ||
    host.includes("example.com")
  ) {
    console.error(
      "[Email] Set SMTP_HOST, SMTP_USER, SMTP_PASS, and a verified SMTP_FROM/HOSPITAL_EMAIL before sending mail."
    );

    return null;
  }

  // Create transporter only once
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,

      // Port 465 = SSL
      // Port 587 = STARTTLS
      secure: SMTP_PORT === 465,

      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },

      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  return transporter;
}

// ============================================================
// Normal email
// ============================================================

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;

  /**
   * Optional attachments.
   *
   * This allows the same function to send
   * normal emails as well as emails with PDFs/files.
   */
  attachments?: nodemailer.SendMailOptions["attachments"];
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: SendEmailOptions) {
  const t = getTransporter();

  if (!t) {
    console.error(
      "[Email] SMTP is not configured; message was not sent."
    );

    return {
      success: false,
      error: new Error("SMTP is not configured"),
    };
  }

  if (!to) {
    return {
      success: false,
      error: new Error("Recipient email is missing"),
    };
  }

  try {
    const sendMailPromise = t.sendMail({
      from: `"${HOSPITAL_NAME}" <${HOSPITAL_EMAIL!}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Email sending timed out after 30 seconds"));
      }, 30000);
    });

    await Promise.race([sendMailPromise, timeoutPromise]);

    console.log(`[Email] Email sent successfully to ${to}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Email] Failed to send:", error);

    return {
      success: false,
      error,
    };
  }
}

// ============================================================
// Purchase Order Email
// ============================================================

export type PurchaseOrderEmailData = {
  supplierName: string;
  supplierEmail: string;
  orderNumber: string;
  pdf: Buffer;
};

export async function sendPurchaseOrderEmail(
  data: PurchaseOrderEmailData
) {
  // ----------------------------------------------------------
  // Validate supplier email
  // ----------------------------------------------------------

  if (!data.supplierEmail) {
    return {
      success: false,
      error: new Error("Supplier email is missing"),
    };
  }

  // ----------------------------------------------------------
  // Validate PDF
  // ----------------------------------------------------------

  if (!data.pdf || !Buffer.isBuffer(data.pdf)) {
    return {
      success: false,
      error: new Error("Purchase order PDF is missing or invalid"),
    };
  }

  // ----------------------------------------------------------
  // Validate order number
  // ----------------------------------------------------------

  if (!data.orderNumber) {
    return {
      success: false,
      error: new Error("Purchase order number is missing"),
    };
  }

  // ----------------------------------------------------------
  // Escape dynamic values for HTML
  // ----------------------------------------------------------

  const supplierName = escapeHtml(data.supplierName);
  const orderNumber = escapeHtml(data.orderNumber);

  // ----------------------------------------------------------
  // Send email using the shared sendEmail() function
  // ----------------------------------------------------------

  return sendEmail({
    to: data.supplierEmail,

    subject: `Purchase Order ${data.orderNumber}`,

    text: `
Hello ${data.supplierName},

The hospital pharmacy has placed a new purchase order.

Purchase Order: ${data.orderNumber}

Please find the purchase order PDF attached to this email.

Regards,
Hospital Pharmacy
`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        "
      >
        <h2>Hospital Pharmacy</h2>

        <p>
          Hello ${supplierName},
        </p>

        <p>
          The hospital pharmacy has placed a new
          purchase order.
        </p>

        <p>
          <strong>Purchase Order:</strong>
          ${orderNumber}
        </p>

        <p>
          Please find the purchase order PDF attached
          to this email.
        </p>

        <p>
          Regards,<br />
          Hospital Pharmacy
        </p>
      </div>
    `,

    attachments: [
      {
        filename: `${data.orderNumber}.pdf`,
        content: data.pdf,
        contentType: "application/pdf",
      },
    ],
  });
}

// ============================================================
// HTML Escape Helper
// ============================================================

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}