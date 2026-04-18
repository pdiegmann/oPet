import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { api, Petition } from '../lib/api.js'

export default function Home() {
  const [search, setSearch] = createSignal('')
  const [query, setQuery] = createSignal('')
  const [page, setPage] = createSignal(1)

  const [data] = createResource(
    () => ({ search: query(), page: page() }),
    (params) => api.getPetitions(params),
  )

  function handleSearch(e: Event) {
    e.preventDefault()
    setQuery(search())
    setPage(1)
  }

  function statusBadge(p: Petition) {
    const pct = p.goalCount ? Math.min(100, Math.round((p.signatureCount / p.goalCount) * 100)) : null
    return (
      <div>
        <span class={`badge badge-${p.status}`}>{p.status}</span>
        {pct !== null && (
          <span style="margin-left: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted);">
            {p.signatureCount} / {p.goalCount} ({pct}%)
          </span>
        )}
        {pct === null && (
          <span style="margin-left: 0.5rem; font-size: 0.8rem; color: var(--color-text-muted);">
            {p.signatureCount} signatures
          </span>
        )}
      </div>
    )
  }

  return (
    <div>
      <section style="text-align: center; padding: 3rem 1rem 2rem;">
        <h1 style="font-size: 2.4rem; font-weight: 800; margin-bottom: 0.75rem;">
          Make your voice heard
        </h1>
        <p style="font-size: 1.15rem; color: var(--color-text-muted); max-width: 560px; margin: 0 auto 2rem;">
          Browse active petitions and add your signature to causes that matter.
        </p>

        <form onSubmit={handleSearch} style="max-width: 480px; margin: 0 auto; display: flex; gap: 0.5rem;">
          <input
            type="search"
            placeholder="Search petitions…"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            style="flex: 1;"
          />
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
      </section>

      <Show when={data.loading}>
        <p style="text-align: center; color: var(--color-text-muted);">Loading petitions…</p>
      </Show>

      <Show when={data.error}>
        <div class="alert alert-error">Failed to load petitions. Please try again.</div>
      </Show>

      <Show when={data()}>
        {(result) => (
          <>
            <Show when={result().petitions.length === 0}>
              <div class="alert alert-info">No petitions found{query() ? ` for "${query()}"` : ''}.</div>
            </Show>

            <div
              style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;"
            >
              <For each={result().petitions}>
                {(petition) => (
                  <A
                    href={`/petition/${petition.slug}`}
                    style="text-decoration: none; color: inherit;"
                  >
                    <article class="card" style="height: 100%; transition: box-shadow 0.15s; cursor: pointer;">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <h2 style="font-size: 1.1rem; font-weight: 700; line-height: 1.3;">
                          {petition.title}
                        </h2>
                      </div>
                      <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 1rem; line-height: 1.5;">
                        {petition.summary}
                      </p>
                      <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">
                        To: <strong>{petition.recipientName}</strong>
                      </div>
                      <Show when={petition.goalCount}>
                        <div class="progress-bar" style="margin-bottom: 0.5rem;">
                          <div
                            class="progress-bar-fill"
                            style={`width: ${Math.min(100, Math.round((petition.signatureCount / (petition.goalCount ?? 1)) * 100))}%`}
                          />
                        </div>
                      </Show>
                      {statusBadge(petition)}
                    </article>
                  </A>
                )}
              </For>
            </div>

            <Show when={result().totalPages > 1}>
              <div class="pagination">
                <button
                  class="btn btn-secondary"
                  disabled={page() <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span style="font-size: 0.9rem; color: var(--color-text-muted);">
                  Page {page()} of {result().totalPages}
                </span>
                <button
                  class="btn btn-secondary"
                  disabled={page() >= result().totalPages}
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
