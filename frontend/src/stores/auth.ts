import { createSignal } from 'solid-js'

const TOKEN_KEY = 'opet_admin_token'
const USER_KEY = 'opet_admin_user'

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'organizer' | 'reader'
}

function normalizeRole(role?: string): AuthUser['role'] {
  const value = (role ?? '').toLowerCase()
  if (value === 'admin') return 'admin'
  if (value === 'organizer' || value === 'moderator') return 'organizer'
  return 'reader'
}

// NOTE: Tokens are stored in localStorage for simplicity. In a high-security
// deployment, prefer httpOnly cookies set by the server to reduce XSS exposure.
const stored = localStorage.getItem(TOKEN_KEY)
const storedUser = localStorage.getItem(USER_KEY)

const [token, setTokenSignal] = createSignal<string | null>(stored)
const [user, setUserSignal] = createSignal<AuthUser | null>(
  storedUser
    ? (() => {
        const parsed = JSON.parse(storedUser) as { id: string; email: string; role?: string }
        return { id: parsed.id, email: parsed.email, role: normalizeRole(parsed.role) }
      })()
    : null,
)

export function getToken() {
  return token()
}

export function getUser() {
  return user()
}

export function isAuthenticated() {
  return !!token()
}

export function isAdmin() {
  return user()?.role === 'admin'
}

export function canWritePetitions() {
  const role = user()?.role
  return role === 'admin' || role === 'organizer'
}

export function login(newToken: string, newUser: AuthUser) {
  const normalizedUser: AuthUser = { ...newUser, role: normalizeRole(newUser.role) }
  localStorage.setItem(TOKEN_KEY, newToken)
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
  setTokenSignal(newToken)
  setUserSignal(normalizedUser)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  setTokenSignal(null)
  setUserSignal(null)
}
