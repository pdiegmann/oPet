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
  title: z.string().min(5).max(200),
  summary: z.string().min(10).max(500),
  body: z.string().min(20),
  recipientName: z.string().min(2).max(200),
  recipientDescription: z.string().max(500).optional(),
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
