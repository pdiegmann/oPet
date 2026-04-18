import { createResource, createSignal, For, Show } from 'solid-js'
import { adminApi, AdminPetition } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

export default function ExportPage() {
  const token = getToken() ?? ''

  const [petitions] = createResource(() => adminApi.getPetitions(token, { page: 1 }))

  const [format, setFormat] = createSignal<'csv' | 'json'>('csv')
  const [petitionId, setPetitionId] = createSignal('')
  const [verified, setVerified] = createSignal('')
  const [withdrawn, setWithdrawn] = createSignal('false')
  const [country, setCountry] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  async function handleExport(e: Event) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await adminApi.exportSignatures(token, format(), {
        petitionId: petitionId() || undefined,
        verified: verified() !== '' ? verified() === 'true' : undefined,
        withdrawn: withdrawn() !== '' ? withdrawn() === 'true' : undefined,
        country: country() || undefined,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style="max-width: 560px;">
      <h1 class="page-title">Export signatures</h1>

      <div class="card">
        <Show when={error()}>
          <div class="alert alert-error">{error()}</div>
        </Show>

        <form onSubmit={handleExport}>
          <div class="form-group">
            <label for="format">Format</label>
            <select
              id="format"
              value={format()}
              onChange={(e) => setFormat(e.currentTarget.value as 'csv' | 'json')}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div class="form-group">
            <label for="petitionId">Petition (optional)</label>
            <Show
              when={!petitions.loading}
              fallback={<p style="color: var(--color-text-muted); font-size: 0.85rem;">Loading petitions…</p>}
            >
              <select
                id="petitionId"
                value={petitionId()}
                onChange={(e) => setPetitionId(e.currentTarget.value)}
              >
                <option value="">All petitions</option>
                <For each={petitions()?.petitions ?? []}>
                  {(p: AdminPetition) => <option value={p.id}>{p.title}</option>}
                </For>
              </select>
            </Show>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label for="verified">Verification status</label>
              <select
                id="verified"
                value={verified()}
                onChange={(e) => setVerified(e.currentTarget.value)}
              >
                <option value="">All</option>
                <option value="true">Verified only</option>
                <option value="false">Unverified only</option>
              </select>
            </div>
            <div class="form-group">
              <label for="withdrawn">Withdrawal status</label>
              <select
                id="withdrawn"
                value={withdrawn()}
                onChange={(e) => setWithdrawn(e.currentTarget.value)}
              >
                <option value="false">Active only</option>
                <option value="true">Withdrawn only</option>
                <option value="">All</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="country">Filter by country (optional)</label>
            <input
              id="country"
              type="text"
              placeholder="e.g. Germany"
              value={country()}
              onInput={(e) => setCountry(e.currentTarget.value)}
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={loading()}
            style="width: 100%;"
          >
            {loading() ? 'Preparing export…' : `Export as ${format().toUpperCase()}`}
          </button>
        </form>
      </div>
    </div>
  )
}
