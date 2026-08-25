import { clerkClient } from "@clerk/nextjs/server";
import type { AppRole } from "./roles";

/**
 * Persists role on the Clerk user. Requires a Dashboard session claim mapping, e.g.
 * { "metadata": { "role": "{{user.public_metadata.role}}" } }
 */
export async function assignUserRole(userId: string, role: AppRole) {
  const client = await clerkClient();
  try {
    if (typeof (client.users as any).updateUserMetadata === "function") {
      await (client.users as any).updateUserMetadata(userId, {
        publicMetadata: { role },
      });
      return;
    }
  } catch (err) {
    console.warn("updateUserMetadata fallback to updateUser:", err);
  }
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  });
}
