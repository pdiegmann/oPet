import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../db.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { generateToken, hashToken } from '../lib/tokens.js'
import { sendVerificationEmail, sendWithdrawalEmail } from '../lib/email.js'
import { createAuditLog } from '../lib/audit.js'

export const publicRoutes = new Hono()

const dbUrl = (process.env.DATABASE_URL ?? '').trim()
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')

// ── Petition listing ──────────────────────────────────────────────────────────

publicRoutes.get('/petitions', async (c) => {
  const search = c.req.query('search') ?? ''
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') ?? '10')))
  const skip = (page - 1) * limit

  const searchFilter = (field: 'title' | 'summary') =>
    isPostgres
      ? { [field]: { contains: search, mode: 'insensitive' as const } }
      : { [field]: { contains: search } }

  const where = {
    status: 'active' as const,
    ...(search
      ? {
          OR: [searchFilter('title'), searchFilter('summary')],
        }
      : {}),
  }

  const [petitions, total] = await Promise.all([
    prisma.petition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        recipientName: true,
        status: true,
        goalCount: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        _count: { select: { signatures: { where: { verified: true, withdrawn: false } } } },
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

// ── Single petition ───────────────────────────────────────────────────────────

publicRoutes.get('/petitions/:slug', async (c) => {
  const petition = await prisma.petition.findUnique({
    where: { slug: c.req.param('slug') },
    include: {
      _count: { select: { signatures: { where: { verified: true, withdrawn: false } } } },
      signatures: {
        where: { verified: true, withdrawn: false, publicOptIn: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { fullName: true, city: true, country: true, comment: true, createdAt: true },
      },
    },
  })

  if (!petition || !['active', 'completed'].includes(petition.status)) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ ...petition, signatureCount: petition._count.signatures })
})

// ── Sign petition ─────────────────────────────────────────────────────────────

const signSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  city: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  comment: z.string().max(1000).optional(),
  publicOptIn: z.boolean().default(false),
  updatesOptIn: z.boolean().default(false),
  recipientShareOptIn: z.boolean().default(false),
})

publicRoutes.post('/petitions/:slug/sign', rateLimit(10, 60_000), async (c) => {
  const petition = await prisma.petition.findUnique({ where: { slug: c.req.param('slug') } })

  if (!petition || petition.status !== 'active') {
    return c.json({ error: 'Petition not found or not active' }, 404)
  }

  const body = await c.req.json().catch(() => null)
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation error', details: parsed.error.flatten() }, 422)
  }

  const data = parsed.data

  // Check for existing signature
  const existing = await prisma.signature.findUnique({
    where: { petitionId_email: { petitionId: petition.id, email: data.email } },
  })

  if (existing) {
    if (existing.withdrawn) {
      // Allow re-signing after withdrawal
      await prisma.signature.update({
        where: { id: existing.id },
        data: {
          fullName: data.fullName,
          city: data.city,
          country: data.country,
          comment: data.comment,
          publicOptIn: data.publicOptIn,
          updatesOptIn: data.updatesOptIn,
          recipientShareOptIn: data.recipientShareOptIn,
          withdrawn: false,
          withdrawnAt: null,
          verified: false,
          verifiedAt: null,
        },
      })

      if (petition.requireVerification) {
        const { token, hash } = generateToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await prisma.verificationToken.create({
          data: { signatureId: existing.id, tokenHash: hash, expiresAt, type: 'verify' },
        })
        await sendVerificationEmail(data.email, data.fullName, petition.title, token)
      }

      return c.json({ message: 'Re-signed. Please verify your email.' })
    }

    return c.json({ error: 'You have already signed this petition' }, 409)
  }

  const signature = await prisma.signature.create({
    data: {
      petitionId: petition.id,
      fullName: data.fullName,
      email: data.email,
      city: data.city,
      country: data.country,
      comment: data.comment,
      publicOptIn: data.publicOptIn,
      updatesOptIn: data.updatesOptIn,
      recipientShareOptIn: data.recipientShareOptIn,
      verified: !petition.requireVerification,
      verifiedAt: petition.requireVerification ? null : new Date(),
    },
  })

  if (petition.requireVerification) {
    const { token, hash } = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
      data: { signatureId: signature.id, tokenHash: hash, expiresAt, type: 'verify' },
    })
    await sendVerificationEmail(data.email, data.fullName, petition.title, token)
  }

  await createAuditLog('signature.created', 'Signature', signature.id, undefined, {
    petitionId: petition.id,
  })

  return c.json(
    {
      message: petition.requireVerification
        ? 'Signed successfully. Please check your email to verify.'
        : 'Signed successfully.',
      signatureId: signature.id,
    },
    201,
  )
})

// ── Verify email ──────────────────────────────────────────────────────────────

publicRoutes.get('/verify/:token', async (c) => {
  const rawToken = c.req.param('token') ?? ''
  const hash = hashToken(rawToken)

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { tokenHash: hash },
    include: { signature: { include: { petition: true } } },
  })

  if (!tokenRecord) return c.json({ error: 'Invalid token' }, 400)
  if (tokenRecord.usedAt) return c.json({ error: 'Token already used' }, 400)
  if (tokenRecord.expiresAt < new Date()) return c.json({ error: 'Token expired' }, 400)
  if (tokenRecord.type !== 'verify') return c.json({ error: 'Wrong token type' }, 400)

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.signature.update({
      where: { id: tokenRecord.signatureId },
      data: { verified: true, verifiedAt: new Date() },
    }),
  ])

  await createAuditLog('signature.verified', 'Signature', tokenRecord.signatureId)

  return c.json({
    message: 'Email verified successfully.',
    petitionSlug: tokenRecord.signature.petition.slug,
    petitionTitle: tokenRecord.signature.petition.title,
  })
})

// ── Request withdrawal ────────────────────────────────────────────────────────

const withdrawRequestSchema = z.object({ email: z.string().email() })

publicRoutes.post('/petitions/:slug/withdraw-request', rateLimit(5, 60_000), async (c) => {
  const petition = await prisma.petition.findUnique({ where: { slug: c.req.param('slug') } })
  if (!petition) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = withdrawRequestSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid email' }, 422)

  const signature = await prisma.signature.findUnique({
    where: { petitionId_email: { petitionId: petition.id, email: parsed.data.email } },
  })

  // Return success regardless to avoid email enumeration
  if (!signature || signature.withdrawn) {
    return c.json({ message: 'If a matching signature was found, a withdrawal email has been sent.' })
  }

  const { token, hash } = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.verificationToken.create({
    data: { signatureId: signature.id, tokenHash: hash, expiresAt, type: 'withdraw' },
  })
  await sendWithdrawalEmail(parsed.data.email, signature.fullName, petition.title, token)

  return c.json({ message: 'If a matching signature was found, a withdrawal email has been sent.' })
})

// ── Confirm withdrawal ────────────────────────────────────────────────────────

publicRoutes.post('/withdraw/:token', rateLimit(10, 60_000), async (c) => {
  const rawToken = c.req.param('token') ?? ''
  const hash = hashToken(rawToken)

  const tokenRecord = await prisma.verificationToken.findUnique({
    where: { tokenHash: hash },
    include: { signature: { include: { petition: true } } },
  })

  if (!tokenRecord) return c.json({ error: 'Invalid token' }, 400)
  if (tokenRecord.usedAt) return c.json({ error: 'Token already used' }, 400)
  if (tokenRecord.expiresAt < new Date()) return c.json({ error: 'Token expired' }, 400)
  if (tokenRecord.type !== 'withdraw') return c.json({ error: 'Wrong token type' }, 400)

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.signature.update({
      where: { id: tokenRecord.signatureId },
      data: { withdrawn: true, withdrawnAt: new Date() },
    }),
  ])

  await createAuditLog('signature.withdrawn', 'Signature', tokenRecord.signatureId)

  return c.json({
    message: 'Your signature has been withdrawn.',
    petitionSlug: tokenRecord.signature.petition.slug,
    petitionTitle: tokenRecord.signature.petition.title,
  })
})
