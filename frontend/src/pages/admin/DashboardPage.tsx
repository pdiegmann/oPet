import { createResource, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, Signature, AdminPetition } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

export default function DashboardPage() {
  const token = getToken() ?? ''

  const [data] = createResource(() => adminApi.getDashboard(token))

  return (
    <div>
      <h1 class="page-title">Dashboard</h1>

      <Show when={data.loading}>
        <p style="color: var(--color-text-muted);">Loading…</p>
      </Show>

      <Show when={data.error}>
        <div class="alert alert-error">Failed to load dashboard data.</div>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            {/* Stats */}
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
              {(
                [
                  ['Total Petitions', d().stats.totalPetitions, '#2563eb'],
                  ['Active Petitions', d().stats.activePetitions, '#16a34a'],
                  ['Total Signatures', d().stats.totalSignatures, '#7c3aed'],
                  ['Verified Signatures', d().stats.verifiedSignatures, '#d97706'],
                ] as [string, number, string][]
              ).map(([label, value, color]) => (
                <div class="card" style="text-align: center;">
                  <div style={`font-size: 2rem; font-weight: 800; color: ${color};`}>
                    {value.toLocaleString()}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent petitions */}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                  <h2 style="font-size: 1.05rem; font-weight: 700;">Recent Petitions</h2>
                  <A href="/admin/petitions" style="font-size: 0.85rem;">View all →</A>
                </div>
                <div class="card" style="padding: 0;">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Signatures</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={d().recentPetitions}>
                        {(p: AdminPetition) => (
                          <tr>
                            <td>
                              <A href={`/admin/petitions/${p.id}/signatures`} style="font-size: 0.9rem;">
                                {p.title}
                              </A>
                            </td>
                            <td><span class={`badge badge-${p.status}`}>{p.status}</span></td>
                            <td>{p.signatureCount?.toLocaleString() ?? 0}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h2 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.75rem;">
                  Recent Signatures
                </h2>
                <div class="card" style="padding: 0;">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Petition</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={d().recentSignatures}>
                        {(s: Signature & { petition?: { title: string; slug: string } }) => (
                          <tr>
                            <td style="font-size: 0.9rem;">{s.fullName}</td>
                            <td style="font-size: 0.85rem; color: var(--color-text-muted);">
                              {(s as unknown as { petition: { title: string } }).petition?.title ?? '—'}
                            </td>
                            <td>
                              <Show
                                when={s.verified}
                                fallback={<span style="color: var(--color-warning); font-size: 0.8rem;">pending</span>}
                              >
                                <span style="color: var(--color-success); font-size: 0.8rem;">verified</span>
                              </Show>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
