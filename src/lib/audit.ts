import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type AuditInput = {
  action: string;
  entity: string;
  entityId: string;
  entityRef?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

// Record an immutable audit event. Never throws — an audit failure must not
// block the business operation itself (it is logged to the console instead).
export async function logAudit(input: AuditInput) {
  try {
    const user = await getCurrentUser().catch(() => null);
    await db.auditLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.name ?? "System",
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        entityRef: input.entityRef ?? null,
        before: input.before ? JSON.stringify(input.before) : null,
        after: input.after ? JSON.stringify(input.after) : null,
        reason: input.reason ?? null,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
