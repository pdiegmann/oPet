import { Hono } from 'hono'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../db.js'
import { authMiddleware, signToken } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { createAuditLog } from '../lib/audit.js'
import { exportSignatures } from '../lib/export.js'
import type { AppVariables } from '../types.js'

export const adminRoutes = new Hono<{ Variables: AppVariables }>()

// ── Auth ──────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

adminRoutes.post('/login', rateLimit(10, 60_000), async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid credentials' }, 422)

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  await createAuditLog('user.login', 'User', user.id, user.id)

  return c.json({ token, user: { id: user.id, email: user.email, role: user.role } })
})

// All routes below require authentication
adminRoutes.use('*', authMiddleware)

// ── Dashboard ─────────────────────────────────────────────────────────────────

adminRoutes.get('/dashboard', async (c) => {
  const [
    totalPetitions,
    activePetitions,
    totalSignatures,
    verifiedSignatures,
    recentSignatures,
    recentPetitions,
  ] = await Promise.all([
    prisma.petition.count(),
    prisma.petition.count({ where: { status: 'active' } }),
    prisma.signature.count({ where: { withdrawn: false } }),
    prisma.signature.count({ where: { verified: true, withdrawn: false } }),
    prisma.signature.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { petition: { select: { title: true, slug: true } } },
    }),
    prisma.petition.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { signatures: { where: { verified: true, withdrawn: false } } } } },
    }),
  ])

  return c.json({
    stats: { totalPetitions, activePetitions, totalSignatures, verifiedSignatures },
    recentSignatures,
    recentPetitions: recentPetitions.map((p) => ({
      ...p,
      signatureCount: p._count.signatures,
    })),
  })
})

// ── Petitions ─────────────────────────────────────────────────────────────────

const petitionSchema = z.object({
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(4).max(200),
  summary: z.string().min(10).max(1500),
  body: z.string().min(20),
  recipientName: z.string().min(2).max(200),
  recipientDescription: z.string().max(1500).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']).default('draft'),
  goalCount: z.number().int().positive().optional(),
  allowPublicNames: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  requireVerification: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
})

adminRoutes.get('/petitions', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')))
  const status = c.req.query('status')
  const skip = (page - 1) * limit

  const where = status ? { status } : {}

  const [petitions, total] = await Promise.all([
    prisma.petition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { signatures: { where: { verified: true, withdrawn: false } } } },
        creator: { select: { email: true } },
      },
    }),
    prisma.petition.count({ where }),
  ])

  return c.json({
    petitions: petitions.map((p) => ({ ...p, signatureCount: p._count.signatures })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

adminRoutes.get('/petitions/:id', async (c) => {
  const petition = await prisma.petition.findUnique({
    where: { id: c.req.param('id') },
    include: {
      creator: { select: { email: true } },
      _count: { select: { signatures: true } },
    },
  })
  if (!petition) return c.json({ error: 'Not found' }, 404)
  return c.json(petition)
})

adminRoutes.post('/petitions', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = petitionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const existing = await prisma.petition.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) return c.json({ error: 'Slug already in use' }, 409)

  const petition = await prisma.petition.create({
    data: {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
      createdBy: user.userId,
    },
  })

  await createAuditLog('petition.created', 'Petition', petition.id, user.userId)
  return c.json(petition, 201)
})

adminRoutes.put('/petitions/:id', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = petitionSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const existing = await prisma.petition.findUnique({ where: { id: c.req.param('id') } })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const petition = await prisma.petition.update({
    where: { id: c.req.param('id') },
    data: {
      ...parsed.data,
      startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : undefined,
      endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
    },
  })

  await createAuditLog('petition.updated', 'Petition', petition.id, user.userId)
  return c.json(petition)
})

adminRoutes.delete('/petitions/:id', async (c) => {
  const user = c.get('user')
  const existing = await prisma.petition.findUnique({ where: { id: c.req.param('id') } })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  await prisma.petition.update({
    where: { id: c.req.param('id') },
    data: { status: 'archived' },
  })

  await createAuditLog('petition.archived', 'Petition', c.req.param('id'), user.userId)
  return c.json({ message: 'Petition archived' })
})

// ── Petition Updates ──────────────────────────────────────────────────────────

const petitionUpdateDraftSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(1),
})

const petitionUpdatePatchSchema = petitionUpdateDraftSchema.partial()

const petitionUpdatePublishSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(1).optional(),
})

adminRoutes.get('/petitions/:id/updates', async (c) => {
  const petition = await prisma.petition.findUnique({ where: { id: c.req.param('id') } })
  if (!petition) return c.json({ error: 'Not found' }, 404)

  const updates = await prisma.petitionUpdate.findMany({
    where: { petitionId: petition.id },
    orderBy: [{ lastPublishedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      creator: { select: { id: true, email: true } },
      updater: { select: { id: true, email: true } },
      deleter: { select: { id: true, email: true } },
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { publisher: { select: { id: true, email: true } } },
      },
    },
  })

  return c.json({ updates })
})

adminRoutes.post('/petitions/:id/updates', async (c) => {
  const user = c.get('user')
  const petition = await prisma.petition.findUnique({ where: { id: c.req.param('id') } })
  if (!petition) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = petitionUpdateDraftSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const update = await prisma.petitionUpdate.create({
    data: {
      petitionId: petition.id,
      currentTitle: parsed.data.title,
      currentContent: parsed.data.content,
      createdBy: user.userId,
      updatedBy: user.userId,
    },
    include: {
      creator: { select: { id: true, email: true } },
      updater: { select: { id: true, email: true } },
      versions: true,
    },
  })

  await createAuditLog('petition.update.created', 'PetitionUpdate', update.id, user.userId, {
    petitionId: petition.id,
  })

  return c.json(update, 201)
})

adminRoutes.put('/petitions/:id/updates/:updateId', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = petitionUpdatePatchSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)
  if (!Object.keys(parsed.data).length) return c.json({ error: 'No changes provided' }, 422)

  const existing = await prisma.petitionUpdate.findUnique({ where: { id: c.req.param('updateId') } })
  if (!existing || existing.petitionId !== c.req.param('id')) return c.json({ error: 'Not found' }, 404)
  if (existing.deletedAt) return c.json({ error: 'Update is deleted' }, 409)

  const update = await prisma.petitionUpdate.update({
    where: { id: existing.id },
    data: {
      currentTitle: parsed.data.title,
      currentContent: parsed.data.content,
      updatedBy: user.userId,
    },
    include: {
      creator: { select: { id: true, email: true } },
      updater: { select: { id: true, email: true } },
      deleter: { select: { id: true, email: true } },
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { publisher: { select: { id: true, email: true } } },
      },
    },
  })

  await createAuditLog('petition.update.modified', 'PetitionUpdate', update.id, user.userId, {
    petitionId: existing.petitionId,
  })

  return c.json(update)
})

adminRoutes.get('/petitions/:id/updates/:updateId/versions', async (c) => {
  const existing = await prisma.petitionUpdate.findUnique({
    where: { id: c.req.param('updateId') },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: { publisher: { select: { id: true, email: true } } },
      },
      creator: { select: { id: true, email: true } },
      updater: { select: { id: true, email: true } },
      deleter: { select: { id: true, email: true } },
    },
  })
  if (!existing || existing.petitionId !== c.req.param('id')) return c.json({ error: 'Not found' }, 404)
  return c.json(existing)
})

adminRoutes.post('/petitions/:id/updates/:updateId/publish', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = petitionUpdatePublishSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const existing = await prisma.petitionUpdate.findUnique({
    where: { id: c.req.param('updateId') },
    include: {
      versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
    },
  })
  if (!existing || existing.petitionId !== c.req.param('id')) return c.json({ error: 'Not found' }, 404)
  if (existing.deletedAt) return c.json({ error: 'Update is deleted' }, 409)

  const title = parsed.data.title ?? existing.currentTitle
  const content = parsed.data.content ?? existing.currentContent
  const publishedAt = new Date()
  const versionNumber = (existing.versions[0]?.versionNumber ?? 0) + 1

  const version = await prisma.$transaction(async (tx) => {
    const createdVersion = await tx.petitionUpdateVersion.create({
      data: {
        petitionUpdateId: existing.id,
        versionNumber,
        title,
        content,
        publishedAt,
        publishedBy: user.userId,
      },
      include: { publisher: { select: { id: true, email: true } } },
    })

    await tx.petitionUpdate.update({
      where: { id: existing.id },
      data: {
        currentTitle: title,
        currentContent: content,
        lastPublishedAt: publishedAt,
        updatedBy: user.userId,
      },
    })

    return createdVersion
  })

  await createAuditLog('petition.update.published', 'PetitionUpdate', existing.id, user.userId, {
    petitionId: existing.petitionId,
    versionNumber,
  })

  return c.json(version, 201)
})

adminRoutes.delete('/petitions/:id/updates/:updateId', async (c) => {
  const user = c.get('user')
  const existing = await prisma.petitionUpdate.findUnique({ where: { id: c.req.param('updateId') } })
  if (!existing || existing.petitionId !== c.req.param('id')) return c.json({ error: 'Not found' }, 404)

  if (existing.deletedAt) {
    return c.json({ message: 'Update already deleted' })
  }

  await prisma.petitionUpdate.update({
    where: { id: existing.id },
    data: {
      deletedAt: new Date(),
      deletedBy: user.userId,
    },
  })

  await createAuditLog('petition.update.deleted', 'PetitionUpdate', existing.id, user.userId, {
    petitionId: existing.petitionId,
  })

  return c.json({ message: 'Update deleted' })
})

// ── Signatures ────────────────────────────────────────────────────────────────

adminRoutes.get('/petitions/:id/signatures', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50')))
  const skip = (page - 1) * limit
  const verified = c.req.query('verified')
  const withdrawn = c.req.query('withdrawn')

  const petition = await prisma.petition.findUnique({ where: { id: c.req.param('id') } })
  if (!petition) return c.json({ error: 'Not found' }, 404)

  const where = {
    petitionId: c.req.param('id'),
    ...(verified !== undefined ? { verified: verified === 'true' } : {}),
    ...(withdrawn !== undefined ? { withdrawn: withdrawn === 'true' } : {}),
  }

  const [signatures, total] = await Promise.all([
    prisma.signature.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.signature.count({ where }),
  ])

  return c.json({ signatures, total, page, totalPages: Math.ceil(total / limit) })
})

adminRoutes.delete('/signatures/:id', async (c) => {
  const user = c.get('user')
  const sig = await prisma.signature.findUnique({ where: { id: c.req.param('id') } })
  if (!sig) return c.json({ error: 'Not found' }, 404)

  await prisma.signature.update({
    where: { id: c.req.param('id') },
    data: { withdrawn: true, withdrawnAt: new Date() },
  })

  await createAuditLog('signature.admin_removed', 'Signature', c.req.param('id'), user.userId)
  return c.json({ message: 'Signature removed' })
})

// ── Export ────────────────────────────────────────────────────────────────────

const exportSchema = z.object({
  format: z.enum(['csv', 'json']),
  petitionId: z.string().optional(),
  verified: z.boolean().optional(),
  withdrawn: z.boolean().optional(),
  country: z.string().optional(),
})

adminRoutes.post('/export', async (c) => {
  const user = c.get('user')
  const body = await c.req.json().catch(() => null)
  const parsed = exportSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const { format, ...filters } = parsed.data

  const result = await exportSignatures(format, filters)

  await prisma.export.create({
    data: {
      petitionId: filters.petitionId ?? null,
      createdBy: user.userId,
      format,
      filtersJson: JSON.stringify(filters),
    },
  })

  await createAuditLog('export.created', 'Export', 'bulk', user.userId, { format, filters })

  c.header('Content-Type', result.contentType)
  c.header('Content-Disposition', `attachment; filename="${result.filename}"`)
  return c.body(result.data)
})

// ── Audit logs ────────────────────────────────────────────────────────────────

adminRoutes.get('/audit', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '50')))
  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { email: true } } },
    }),
    prisma.auditLog.count(),
  ])

  return c.json({ logs, total, page, totalPages: Math.ceil(total / limit) })
})

// ── Backup & Restore ──────────────────────────────────────────────────────────

adminRoutes.get('/backup', async (c) => {
  const user = c.get('user')

  const petitions = await prisma.petition.findMany({
    include: {
      signatures: true,
      updates: {
        include: {
          versions: {
            orderBy: { versionNumber: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    petitions: petitions.map(({ signatures, updates, ...petition }) => ({
      ...petition,
      signatures,
      updates,
    })),
  }

  await createAuditLog('backup.created', 'System', 'backup', user.userId)

  const filename = `opet-backup-${new Date().toISOString().split('T')[0]}.json`
  c.header('Content-Type', 'application/json')
  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  return c.json(backup)
})

const backupSignatureSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  withdrawn: z.boolean().default(false),
  publicOptIn: z.boolean().default(false),
  updatesOptIn: z.boolean().default(false),
  recipientShareOptIn: z.boolean().default(false),
  createdAt: z.string().optional(),
  verifiedAt: z.string().nullable().optional(),
  withdrawnAt: z.string().nullable().optional(),
})

const backupPetitionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  recipientName: z.string(),
  recipientDescription: z.string().nullable().optional(),
  status: z.string().default('draft'),
  goalCount: z.number().nullable().optional(),
  allowPublicNames: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  requireVerification: z.boolean().default(true),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  signatures: z.array(backupSignatureSchema).optional().default([]),
  updates: z.array(
    z.object({
      currentTitle: z.string(),
      currentContent: z.string(),
      lastPublishedAt: z.string().nullable().optional(),
      deletedAt: z.string().nullable().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
      versions: z.array(
        z.object({
          versionNumber: z.number().int().positive(),
          title: z.string(),
          content: z.string(),
          publishedAt: z.string().optional(),
        }),
      ).optional().default([]),
    }),
  ).optional().default([]),
})

const restoreSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  petitions: z.array(backupPetitionSchema),
})

adminRoutes.post('/restore', async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json().catch(() => null)
  const parsed = restoreSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid backup format', details: parsed.error.flatten() }, 422)
  }

  let restoredPetitions = 0
  let restoredSignatures = 0
  let restoredUpdates = 0
  let restoredUpdateVersions = 0

  await prisma.$transaction(async (tx) => {
    for (const petitionData of parsed.data.petitions) {
      const { signatures, updates, createdAt, startsAt, endsAt, ...petitionFields } = petitionData

      const petition = await tx.petition.upsert({
        where: { slug: petitionFields.slug },
        update: {
          title: petitionFields.title,
          summary: petitionFields.summary,
          body: petitionFields.body,
          recipientName: petitionFields.recipientName,
          recipientDescription: petitionFields.recipientDescription ?? null,
          status: petitionFields.status,
          goalCount: petitionFields.goalCount ?? null,
          allowPublicNames: petitionFields.allowPublicNames,
          allowComments: petitionFields.allowComments,
          requireVerification: petitionFields.requireVerification,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
        },
        create: {
          slug: petitionFields.slug,
          title: petitionFields.title,
          summary: petitionFields.summary,
          body: petitionFields.body,
          recipientName: petitionFields.recipientName,
          recipientDescription: petitionFields.recipientDescription ?? null,
          status: petitionFields.status,
          goalCount: petitionFields.goalCount ?? null,
          allowPublicNames: petitionFields.allowPublicNames,
          allowComments: petitionFields.allowComments,
          requireVerification: petitionFields.requireVerification,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
          createdBy: user.userId,
          ...(createdAt ? { createdAt: new Date(createdAt) } : {}),
        },
      })
      restoredPetitions++

      for (const sig of signatures) {
        const { createdAt: sigCreatedAt, verifiedAt, withdrawnAt, ...sigFields } = sig

        await tx.signature.upsert({
          where: { petitionId_email: { petitionId: petition.id, email: sigFields.email } },
          update: {
            fullName: sigFields.fullName,
            city: sigFields.city ?? null,
            country: sigFields.country ?? null,
            comment: sigFields.comment ?? null,
            verified: sigFields.verified,
            withdrawn: sigFields.withdrawn,
            publicOptIn: sigFields.publicOptIn,
            updatesOptIn: sigFields.updatesOptIn,
            recipientShareOptIn: sigFields.recipientShareOptIn,
            verifiedAt: verifiedAt ? new Date(verifiedAt) : null,
            withdrawnAt: withdrawnAt ? new Date(withdrawnAt) : null,
          },
          create: {
            petitionId: petition.id,
            fullName: sigFields.fullName,
            email: sigFields.email,
            city: sigFields.city ?? null,
            country: sigFields.country ?? null,
            comment: sigFields.comment ?? null,
            verified: sigFields.verified,
            withdrawn: sigFields.withdrawn,
            publicOptIn: sigFields.publicOptIn,
            updatesOptIn: sigFields.updatesOptIn,
            recipientShareOptIn: sigFields.recipientShareOptIn,
            verifiedAt: verifiedAt ? new Date(verifiedAt) : null,
            withdrawnAt: withdrawnAt ? new Date(withdrawnAt) : null,
            ...(sigCreatedAt ? { createdAt: new Date(sigCreatedAt) } : {}),
          },
        })
        restoredSignatures++
      }

      await tx.petitionUpdate.deleteMany({ where: { petitionId: petition.id } })
      for (const backupUpdate of updates) {
        const { versions, createdAt: updateCreatedAt, updatedAt, deletedAt, lastPublishedAt, ...updateFields } = backupUpdate
        const createdUpdate = await tx.petitionUpdate.create({
          data: {
            petitionId: petition.id,
            currentTitle: updateFields.currentTitle,
            currentContent: updateFields.currentContent,
            lastPublishedAt: lastPublishedAt ? new Date(lastPublishedAt) : null,
            deletedAt: deletedAt ? new Date(deletedAt) : null,
            createdBy: user.userId,
            updatedBy: user.userId,
            deletedBy: deletedAt ? user.userId : null,
            ...(updateCreatedAt ? { createdAt: new Date(updateCreatedAt) } : {}),
            ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}),
          },
        })
        restoredUpdates++

        for (const version of versions) {
          await tx.petitionUpdateVersion.create({
            data: {
              petitionUpdateId: createdUpdate.id,
              versionNumber: version.versionNumber,
              title: version.title,
              content: version.content,
              publishedAt: version.publishedAt ? new Date(version.publishedAt) : new Date(),
              publishedBy: user.userId,
            },
          })
          restoredUpdateVersions++
        }
      }
    }
  })

  await createAuditLog('backup.restored', 'System', 'restore', user.userId, {
    restoredPetitions,
    restoredSignatures,
    restoredUpdates,
    restoredUpdateVersions,
  })

  return c.json({
    message: 'Restore complete',
    restoredPetitions,
    restoredSignatures,
    restoredUpdates,
    restoredUpdateVersions,
  })
})

// ── Users ─────────────────────────────────────────────────────────────────────

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['admin', 'moderator']).default('moderator'),
})

adminRoutes.get('/users', async (c) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return c.json(users)
})

adminRoutes.post('/users', async (c) => {
  const actorUser = c.get('user')
  if (actorUser.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)

  const body = await c.req.json().catch(() => null)
  const parsed = userSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return c.json({ error: 'Email already in use' }, 409)

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, role: parsed.data.role },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  await createAuditLog('user.created', 'User', user.id, actorUser.userId)
  return c.json(user, 201)
})
