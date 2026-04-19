import type { Context, Next } from 'hono'
import { t } from '../lib/i18n.js'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 30

function getIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  )
}

export function rateLimit(maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS) {
  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip = getIp(c)
    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    entry.count++
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      return c.json({ error: t(c, 'api.too_many_requests') }, 429)
    }

    await next()
  }
}

// Periodically clean expired entries to avoid memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60_000)
