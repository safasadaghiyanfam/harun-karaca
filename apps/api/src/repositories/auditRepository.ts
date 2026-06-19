import { prisma } from "../prisma.js";

export async function audit(userId: string | undefined, action: string, entityType: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : undefined
    }
  });
}
