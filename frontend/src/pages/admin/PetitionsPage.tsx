import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, AdminPetition } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

export default function PetitionsPage() {
  const token = getToken() ?? ''
  const [page, setPage] = createSignal(1)
  const [statusFilter, setStatusFilter] = createSignal('')

  const [data, { refetch }] = createResource(
    () => ({ page: page(), status: statusFilter() }),
    (params) => adminApi.getPetitions(token, params),
  )

  async function handleArchive(p: AdminPetition) {
    if (!confirm(`Archive petition "${p.title}"?`)) return
    try {
      await adminApi.archivePetition(token, p.id)
      refetch()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to archive petition')
    }
  }

  return (
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h1 class="page-title" style="margin: 0;">Petitions</h1>
        <A href="/admin/petitions/new" class="btn btn-primary">+ New petition</A>
      </div>

      {/* Filters */}
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
        <select
          style="width: auto;"
          value={statusFilter()}
          onChange={(e) => { setStatusFilter(e.currentTarget.value); setPage(1) }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <Show when={data.loading}>
        <p style="color: var(--color-text-muted);">Loading…</p>
      </Show>

      <Show when={data.error}>
        <div class="alert alert-error">Failed to load petitions.</div>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <div class="card" style="padding: 0; overflow: hidden;">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Signatures</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={d().petitions.length > 0}
                    fallback={
                      <tr>
                        <td colspan="5" style="text-align: center; color: var(--color-text-muted);">
                          No petitions found
                        </td>
                      </tr>
                    }
                  >
                    <For each={d().petitions}>
                      {(p: AdminPetition) => (
                        <tr>
                          <td>
                            <div style="font-weight: 600; font-size: 0.95rem;">{p.title}</div>
                            <div style="font-size: 0.8rem; color: var(--color-text-muted);">/{p.slug}</div>
                          </td>
                          <td><span class={`badge badge-${p.status}`}>{p.status}</span></td>
                          <td>{(p.signatureCount ?? 0).toLocaleString()}</td>
                          <td style="font-size: 0.85rem; color: var(--color-text-muted);">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div style="display: flex; gap: 0.4rem;">
                              <A
                                href={`/admin/petitions/${p.id}/edit`}
                                class="btn btn-secondary"
                                style="font-size: 0.8rem; padding: 0.3rem 0.7rem;"
                              >
                                Edit
                              </A>
                              <A
                                href={`/admin/petitions/${p.id}/signatures`}
                                class="btn btn-secondary"
                                style="font-size: 0.8rem; padding: 0.3rem 0.7rem;"
                              >
                                Signatures
                              </A>
                              <Show when={p.status !== 'archived'}>
                                <button
                                  class="btn btn-danger"
                                  style="font-size: 0.8rem; padding: 0.3rem 0.7rem;"
                                  onClick={() => handleArchive(p)}
                                >
                                  Archive
                                </button>
                              </Show>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </Show>
                </tbody>
              </table>
            </div>

            <Show when={d().totalPages > 1}>
              <div class="pagination">
                <button
                  class="btn btn-secondary"
                  disabled={page() <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span style="font-size: 0.9rem; color: var(--color-text-muted);">
                  Page {page()} of {d().totalPages}
                </span>
                <button
                  class="btn btn-secondary"
                  disabled={page() >= d().totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </Show>
          </>
        )}
      </Show>
    </div>
  )
}
