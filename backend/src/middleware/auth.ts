import type { Context, Next } from 'hono'
import { verify, sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-secret'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = verify(token, JWT_SECRET) as JwtPayload
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

export function signToken(payload: JwtPayload): string {
  return sign(payload, JWT_SECRET, { expiresIn: '24h' })
}
