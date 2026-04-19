import { JSX, Show, createEffect } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { isAuthenticated, logout } from '@/stores/auth.js'
import { Button } from '@/components/ui/button'

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

  const navItems: [string, string][] = [
    ['/admin/dashboard', '📊 Dashboard'],
    ['/admin/petitions', '📋 Petitions'],
    ['/admin/export', '📤 Export'],
    ['/admin/backup', '💾 Backup'],
  ]

  return (
    <Show when={isAuthenticated()} fallback={null}>
      <div class="min-h-screen flex">
        <aside class="w-[220px] bg-slate-800 text-slate-300 flex flex-col shrink-0">
          <div class="px-5 py-6">
            <A href="/admin/dashboard" class="text-xl font-bold text-white no-underline">
              ✊ oPet Admin
            </A>
          </div>

          <nav class="flex-1 flex flex-col gap-1 px-3">
            {navItems.map(([href, label]) => (
              <A
                href={href}
                class="px-3 py-2 rounded text-slate-300 no-underline text-sm transition-colors hover:bg-white/10"
                activeClass="bg-white/10 text-white"
              >
                {label}
              </A>
            ))}
          </nav>

          <div class="px-5 py-4 mt-auto">
            <Button
              variant="ghost"
              class="w-full text-slate-300 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-auto">
          <main class="p-8 flex-1">{props.children}</main>
        </div>
      </div>
    </Show>
  )
}
