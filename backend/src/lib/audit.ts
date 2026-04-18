import { prisma } from '../db.js'

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  actorId?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? null,
      action,
      entityType,
      entityId,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
    },
  })
}
