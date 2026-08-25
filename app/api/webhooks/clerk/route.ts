import { verifyWebhook } from "@clerk/backend/webhooks";
import { assignUserRole } from "@/lib/auth/assign-role";
import { AppRole } from "@/lib/auth/roles";
import { isAppRole } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const event = await verifyWebhook(request);

    switch (event.type) {
      case "user.created": {
        const user = event.data;
        const existingRole = user.public_metadata?.role;
        if (!isAppRole(existingRole)) {
          await assignUserRole(user.id, AppRole.patient);
        }
        break;
      }
      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[clerk webhook]", error);
    return new Response("Webhook verification failed", { status: 400 });
  }
}
