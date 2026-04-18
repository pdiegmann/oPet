import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { adminApi, Signature } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

export default function SignaturesPage() {
  const token = getToken() ?? ''
  const params = useParams<{ id: string }>()

  const [page, setPage] = createSignal(1)
  const [verifiedFilter, setVerifiedFilter] = createSignal('')
  const [withdrawnFilter, setWithdrawnFilter] = createSignal('false')

  const [data, { refetch }] = createResource(
    () => ({
      page: page(),
      verified: verifiedFilter() !== '' ? verifiedFilter() === 'true' : undefined,
      withdrawn: withdrawnFilter() !== '' ? withdrawnFilter() === 'true' : undefined,
    }),
    (filters) => adminApi.getSignatures(token, params.id, filters),
  )

  async function handleRemove(sig: Signature) {
    if (!confirm(`Remove signature from ${sig.fullName}?`)) return
    try {
      await adminApi.removeSignature(token, sig.id)
      refetch()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove signature')
    }
  }

  return (
    <div>
      <h1 class="page-title">Signatures</h1>

      {/* Filters */}
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
        <select
          style="width: auto;"
          value={verifiedFilter()}
          onChange={(e) => { setVerifiedFilter(e.currentTarget.value); setPage(1) }}
        >
          <option value="">All (verified &amp; unverified)</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
        <select
          style="width: auto;"
          value={withdrawnFilter()}
          onChange={(e) => { setWithdrawnFilter(e.currentTarget.value); setPage(1) }}
        >
          <option value="false">Active only</option>
          <option value="true">Withdrawn only</option>
          <option value="">All</option>
        </select>
      </div>

      <Show when={data.loading}>
        <p style="color: var(--color-text-muted);">Loading…</p>
      </Show>
      <Show when={data.error}>
        <div class="alert alert-error">Failed to load signatures.</div>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <div style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--color-text-muted);">
              {d().total.toLocaleString()} signature(s) found
            </div>

            <div class="card" style="padding: 0; overflow: hidden;">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <Show
                    when={d().signatures.length > 0}
                    fallback={
                      <tr>
                        <td colspan="6" style="text-align: center; color: var(--color-text-muted);">
                          No signatures found
                        </td>
                      </tr>
                    }
                  >
                    <For each={d().signatures}>
                      {(sig: Signature) => (
                        <tr>
                          <td style="font-weight: 500;">{sig.fullName}</td>
                          <td style="font-size: 0.85rem;">{sig.email}</td>
                          <td style="font-size: 0.85rem; color: var(--color-text-muted);">
                            {[sig.city, sig.country].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td>
                            <Show
                              when={sig.withdrawn}
                              fallback={
                                <Show
                                  when={sig.verified}
                                  fallback={
                                    <span style="color: var(--color-warning); font-size: 0.8rem;">⏳ pending</span>
                                  }
                                >
                                  <span style="color: var(--color-success); font-size: 0.8rem;">✓ verified</span>
                                </Show>
                              }
                            >
                              <span style="color: var(--color-danger); font-size: 0.8rem;">✕ withdrawn</span>
                            </Show>
                          </td>
                          <td style="font-size: 0.8rem; color: var(--color-text-muted);">
                            {new Date(sig.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Show when={!sig.withdrawn}>
                              <button
                                class="btn btn-danger"
                                style="font-size: 0.75rem; padding: 0.25rem 0.6rem;"
                                onClick={() => handleRemove(sig)}
                              >
                                Remove
                              </button>
                            </Show>
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
