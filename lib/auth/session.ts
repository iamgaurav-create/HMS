import { auth } from "@clerk/nextjs/server";
import type { Permission } from "./permissions";
import { roleHasPermission, roleHasAnyPermission } from "./permissions";
import type { AppRole } from "./roles";
import { isAppRole } from "./roles";

export type AuthSession = {
  userId: string;
  role: AppRole;
};

export function getRoleFromSessionClaims(
  sessionClaims: CustomJwtSessionClaims | null | undefined
): AppRole | undefined {
  const role = sessionClaims?.metadata?.role;
  return isAppRole(role) ? role : undefined;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const role = getRoleFromSessionClaims(sessionClaims);
  if (!role) return null;

  return { userId, role };
}

export async function getOptionalRole(): Promise<AppRole | undefined> {
  const { sessionClaims } = await auth();
  return getRoleFromSessionClaims(sessionClaims);
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getOptionalRole();
  return roleHasPermission(role, permission);
}

export async function hasAnyPermission(
  permissions: Permission[]
): Promise<boolean> {
  const role = await getOptionalRole();
  return roleHasAnyPermission(role, permissions);
}
