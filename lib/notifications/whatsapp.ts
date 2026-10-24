import twilio from "twilio";

const accountSid =
  process.env.TWILIO_ACCOUNT_SID;

const authToken =
  process.env.TWILIO_AUTH_TOKEN;

const whatsappFrom =
  process.env.TWILIO_WHATSAPP_FROM;

function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials are not configured",
    );
  }

  return twilio(
    accountSid,
    authToken,
  );
}

function normalizePhone(phone: string) {
  const normalized = phone.replace(
    /[\s()-]/g,
    "",
  );

  if (!normalized.startsWith("+")) {
    return `+${normalized}`;
  }

  return normalized;
}

export async function sendPurchaseOrderWhatsApp(
  data: {
    supplierName: string;
    supplierPhone: string;
    orderNumber: string;
    pdfUrl: string;
  },
) {
  if (!whatsappFrom) {
    throw new Error(
      "Twilio WhatsApp sender is not configured",
    );
  }

  const client =
    getTwilioClient();

  const messageBody = `Hello ${data.supplierName},

A new purchase order has been placed by the hospital pharmacy.

Purchase Order: ${data.orderNumber}

Please review the attached purchase order PDF.

Hospital Pharmacy`;

  const messageParams: any = {
    from: whatsappFrom,
    to: `whatsapp:${normalizePhone(
      data.supplierPhone,
    )}`,
    body: messageBody,
  };

  if (data.pdfUrl && data.pdfUrl.startsWith("https://")) {
    messageParams.mediaUrl = [data.pdfUrl];
  }

  try {
    const message =
      await client.messages.create(messageParams);

    return message.sid;
  } catch (error: any) {
    console.error("[WhatsApp] Failed to send message:", error);
    const code = error?.code;
    const messageText = error?.message || "";

    const isInvalidWhatsAppNumber =
      code === 63016 ||
      messageText.includes("not a valid WhatsApp-enabled") ||
      messageText.includes("To number is not a valid WhatsApp-enabled");

    if (isInvalidWhatsAppNumber) {
      throw new Error(
        `WhatsApp is not available for number ${data.supplierPhone}`,
      );
    }

    if (messageText.includes("not a valid")) {
      throw new Error(
        `WhatsApp is not available for number ${data.supplierPhone}`,
      );
    }

    throw new Error(
      error?.message || "Failed to send WhatsApp message",
    );
  }
}
