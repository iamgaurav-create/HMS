import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Permission } from "./permissions";
import { roleHasPermission, roleHasAnyPermission } from "./permissions";
import type { AppRole } from "./roles";
import { getRoleFromSessionClaims } from "./session";

const SIGN_IN_PATH = "/sign-in";
const UNAUTHORIZED_PATH = "/unauthorized";

export async function requireUserId(): Promise<string> {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/" });
  }
  return userId!;
}

export async function requireRole(allowed: AppRole | AppRole[]): Promise<{
  userId: string;
  role: AppRole;
}> {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/" });
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  if (!role || !allowedRoles.includes(role)) {
    redirect(UNAUTHORIZED_PATH);
  }

  return { userId: userId!, role };
}

export async function requirePermission(permission: Permission): Promise<{
  userId: string;
  role: AppRole;
}> {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn({ returnBackUrl: SIGN_IN_PATH });
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  if (!role || !roleHasPermission(role, permission)) {
    redirect(UNAUTHORIZED_PATH);
  }

  return { userId: userId!, role };
}

export async function requireAnyPermission(
  permissions: Permission[]
): Promise<{ userId: string; role: AppRole }> {
  const { userId, sessionClaims, redirectToSignIn } = await auth();
  if (!userId) {
    redirectToSignIn({ returnBackUrl: SIGN_IN_PATH });
  }

  const role = getRoleFromSessionClaims(sessionClaims);
  if (!role || !roleHasAnyPermission(role, permissions)) {
    redirect(UNAUTHORIZED_PATH);
  }

  return { userId: userId!, role };
}
