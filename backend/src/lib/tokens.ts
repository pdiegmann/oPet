import { randomBytes, createHash } from 'crypto'

/**
 * Generate a secure random token and return both the raw token
 * (sent to the user) and its SHA-256 hash (stored in the database).
 */
export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex')
  const hash = hashToken(token)
  return { token, hash }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
