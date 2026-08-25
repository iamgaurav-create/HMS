import db from "@/lib/db";

/**
 * Create an audit log entry for staff-related changes.
 * Call this from server actions to record who did what and when.
 */
export async function createAuditLog(params: {
  userId: string;
  recordId: string;
  action: string;
  details: string;
  model: string;
}) {
  try {
    await db.auditlog.create({
      data: {
        user_id: params.userId,
        record_id: params.recordId,
        action: params.action,
        details: params.details,
        model: params.model,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    // Audit logging should never break the calling action
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}
