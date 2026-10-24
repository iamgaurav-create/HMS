import { auth } from "@clerk/nextjs/server";

import db from "@/lib/db";
import { getRoleFromSessionClaims } from "@/lib/auth/session";
import { roleHasPermission, type Permission } from "@/lib/auth/permissions";
import type { AppRole } from "@/lib/auth/roles";

/**
 * The roles that may work inside the laboratory.
 */
export const LAB_STAFF_ROLES = ["SuperAdmin", "admin", "LabTechnician"] as const;

/**
 * The professional that performs the current action. The staff record is
 * looked up on the server, the browser never sends a staff id, a name or a
 * role.
 */
export type LabActor = {
  userId: string;
  role: AppRole;
  staffId: string;
  name: string;
};

export type LabActorResult =
  | { ok: true; actor: LabActor }
  | { ok: false; message: string };

/**
 * Resolves the signed in professional and checks the permission of the
 * action. A staff record that is not active cannot work on a result.
 */
export async function getLabActor(
  permission: Permission
): Promise<LabActorResult> {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { ok: false, message: "Please sign in first." };
  }

  const role = getRoleFromSessionClaims(sessionClaims);

  if (!role) {
    return {
      ok: false,
      message: "Your account does not have a role in the hospital.",
    };
  }

  if (!roleHasPermission(role, permission)) {
    return {
      ok: false,
      message: "You do not have permission to work on laboratory results.",
    };
  }

  const staff = await db.staff.findFirst({
    where: {
      OR: [{ clerkUserId: userId }, { id: userId }],
      status: "Active",
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!staff) {
    return {
      ok: false,
      message:
        "No active laboratory staff record was found for your account. Ask the administration to complete your onboarding.",
    };
  }

  if (!(LAB_STAFF_ROLES as readonly string[]).includes(staff.role)) {
    return {
      ok: false,
      message:
        "Your staff account is not a laboratory account. Ask the administration for laboratory access.",
    };
  }

  return {
    ok: true,
    actor: {
      userId,
      role,
      staffId: staff.id,
      name: staff.name,
    },
  };
}
