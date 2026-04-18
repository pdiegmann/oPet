import { createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { adminApi } from '../../lib/api.js'
import { login } from '../../stores/auth.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await adminApi.login(email(), password())
      login(res.token, res.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-bg);">
      <div class="card" style="width: 100%; max-width: 400px;">
        <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; text-align: center;">
          ✊ oPet Admin
        </h1>
        <p style="text-align: center; color: var(--color-text-muted); margin-bottom: 1.75rem; font-size: 0.9rem;">
          Sign in to manage petitions
        </p>

        <Show when={error()}>
          <div class="alert alert-error">{error()}</div>
        </Show>

        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autocomplete="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autocomplete="current-password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={loading()}
            style="width: 100%; margin-top: 0.5rem;"
          >
            {loading() ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
