import { createSignal } from 'solid-js'

const TOKEN_KEY = 'opet_admin_token'
const USER_KEY = 'opet_admin_user'

export interface AuthUser {
  id: string
  email: string
  role: string
}

// NOTE: Tokens are stored in localStorage for simplicity. In a high-security
// deployment, prefer httpOnly cookies set by the server to reduce XSS exposure.
const stored = localStorage.getItem(TOKEN_KEY)
const storedUser = localStorage.getItem(USER_KEY)

const [token, setTokenSignal] = createSignal<string | null>(stored)
const [user, setUserSignal] = createSignal<AuthUser | null>(
  storedUser ? (JSON.parse(storedUser) as AuthUser) : null,
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

export function login(newToken: string, newUser: AuthUser) {
  localStorage.setItem(TOKEN_KEY, newToken)
  localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  setTokenSignal(newToken)
  setUserSignal(newUser)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  setTokenSignal(null)
  setUserSignal(null)
}
