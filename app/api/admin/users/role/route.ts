import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { assignUserRole } from "@/lib/auth/assign-role";
import { AppRole } from "@/lib/auth/roles";
import { getRoleFromSessionClaims } from "@/lib/auth/session";

const roleSchema = z.enum([
  AppRole.admin,
  AppRole.HR,
  AppRole.Doctor,
  AppRole.Nurse,
  AppRole.LabTechnician,
  AppRole.patient,
]);

const bodySchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
});

export async function POST(request: Request) {
  const { userId: actorId, sessionClaims } = await auth();
  if (!actorId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorRole = getRoleFromSessionClaims(sessionClaims);
  if (actorRole !== AppRole.admin && actorRole !== AppRole.SuperAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId, role } = parsed.data;

  try {
    await assignUserRole(userId, role);
    return Response.json({ ok: true, userId, role });
  } catch (error) {
    console.error("[assign role]", error);
    return Response.json(
      { error: "Failed to update user role in Clerk" },
      { status: 502 }
    );
  }
}
