import { JSX, Show, createEffect } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { isAuthenticated, logout } from '../stores/auth.js'

interface AdminLayoutProps {
  children?: JSX.Element
}

export default function AdminLayout(props: AdminLayoutProps) {
  const navigate = useNavigate()

  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login', { replace: true })
    }
  })

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <Show when={isAuthenticated()} fallback={null}>
      <div style="min-height: 100vh; display: flex;">
        {/* Sidebar */}
        <aside
          style="width: 220px; background: #1e293b; color: #cbd5e1; padding: 1.5rem 0;
                 display: flex; flex-direction: column; flex-shrink: 0;"
        >
          <div style="padding: 0 1.25rem; margin-bottom: 2rem;">
            <A href="/admin/dashboard" style="font-size: 1.25rem; font-weight: 700; color: #fff; text-decoration: none;">
              ✊ oPet Admin
            </A>
          </div>

          <nav style="flex: 1; display: flex; flex-direction: column; gap: 0.25rem; padding: 0 0.75rem;">
            {([
              ['/admin/dashboard', '📊 Dashboard'],
              ['/admin/petitions', '📋 Petitions'],
              ['/admin/export', '📤 Export'],
              ['/admin/backup', '💾 Backup'],
            ] as [string, string][]).map(([href, label]) => (
              <A
                href={href}
                style="padding: 0.6rem 0.75rem; border-radius: 0.4rem; color: #cbd5e1;
                       text-decoration: none; font-size: 0.95rem; transition: background 0.15s;"
                activeClass="admin-nav-active"
              >
                {label}
              </A>
            ))}
          </nav>

          <div style="padding: 0 1.25rem; margin-top: auto;">
            <button
              onClick={handleLogout}
              style="width: 100%; background: #334155; color: #cbd5e1; border: none;
                     padding: 0.5rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.9rem;"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div style="flex: 1; display: flex; flex-direction: column; overflow: auto;">
          <main style="padding: 2rem 1.5rem; flex: 1;">
            {props.children}
          </main>
        </div>
      </div>

      <style>{`
        .admin-nav-active { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
      `}</style>
    </Show>
  )
}
