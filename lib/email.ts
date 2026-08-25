import nodemailer from "nodemailer";

// SMTP providers reject mail when the From address is not a verified sender.
// Use an explicitly configured sender when available, otherwise use the SMTP
// account itself instead of a placeholder address.
const HOSPITAL_EMAIL = process.env.SMTP_FROM || process.env.HOSPITAL_EMAIL || process.env.SMTP_USER;
const HOSPITAL_NAME = process.env.HOSPITAL_NAME || "Hospital Management System";
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const host = (SMTP_HOST || "").toLowerCase();
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    host.includes("yourprovider.com") ||
    host.includes("your-provider.com") ||
    host.includes("example.com")
  ) {
    console.error("[Email] Set SMTP_HOST, SMTP_USER, SMTP_PASS, and a verified SMTP_FROM/HOSPITAL_EMAIL before sending mail.");
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const t = getTransporter();
  if (!t) {
    console.error("[Email] SMTP is not configured; message was not sent.");
    return { success: false, error: new Error("SMTP is not configured") };
  }
  try {
    await t.sendMail({
      from: `"${HOSPITAL_NAME}" <${HOSPITAL_EMAIL!}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return { success: false, error };
  }
}
