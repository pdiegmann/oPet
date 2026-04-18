import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams, useNavigate } from '@solidjs/router'
import { api, SignPayload } from '../lib/api.js'

export default function PetitionPage() {
  const params = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [petition] = createResource(() => params.slug, api.getPetition)

  const [form, setForm] = createSignal<SignPayload>({
    fullName: '',
    email: '',
    city: '',
    country: '',
    comment: '',
    publicOptIn: false,
    updatesOptIn: false,
    recipientShareOptIn: false,
  })
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  function update<K extends keyof SignPayload>(key: K, value: SignPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (submitting()) return
    setError(null)
    setSubmitting(true)
    try {
      await api.signPetition(params.slug, form())
      navigate(`/petition/${params.slug}/success`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Show when={petition.loading}>
        <p style="color: var(--color-text-muted);">Loading…</p>
      </Show>
      <Show when={petition.error}>
        <div class="alert alert-error">Petition not found.</div>
      </Show>

      <Show when={petition()}>
        {(p) => (
          <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start;">
            {/* Petition details */}
            <div>
              <div style="margin-bottom: 1rem;">
                <span class={`badge badge-${p().status}`}>{p().status}</span>
              </div>
              <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">{p().title}</h1>
              <p style="color: var(--color-text-muted); margin-bottom: 0.35rem;">
                To: <strong>{p().recipientName}</strong>
                <Show when={p().recipientDescription}>
                  {' – '}{p().recipientDescription}
                </Show>
              </p>
              <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
                {p().signatureCount.toLocaleString()} signatures
                <Show when={p().goalCount}> of {p().goalCount?.toLocaleString()} goal</Show>
              </p>
              <Show when={p().goalCount}>
                <div class="progress-bar" style="margin-bottom: 1.5rem;">
                  <div
                    class="progress-bar-fill"
                    style={`width: ${Math.min(100, Math.round((p().signatureCount / (p().goalCount ?? 1)) * 100))}%`}
                  />
                </div>
              </Show>

              <div
                style="line-height: 1.75; white-space: pre-wrap; margin-bottom: 2rem;"
                innerHTML={p().body.replace(/\n/g, '<br>')}
              />

              <Show when={p().allowPublicNames && p().signatures && p().signatures!.length > 0}>
                <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem;">
                  Recent signers
                </h2>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
                  <For each={p().signatures}>
                    {(sig) => (
                      <div class="card" style="padding: 0.85rem 1rem;">
                        <strong>{sig.fullName}</strong>
                        <Show when={sig.city || sig.country}>
                          <span style="color: var(--color-text-muted); font-size: 0.85rem; margin-left: 0.5rem;">
                            {[sig.city, sig.country].filter(Boolean).join(', ')}
                          </span>
                        </Show>
                        <Show when={sig.comment}>
                          <p style="margin-top: 0.35rem; font-size: 0.9rem; color: var(--color-text-muted);">
                            "{sig.comment}"
                          </p>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Signature form */}
            <aside>
              <div class="card" style="position: sticky; top: 1.5rem;">
                <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 1.25rem;">
                  Sign this petition
                </h2>

                <Show when={error()}>
                  <div class="alert alert-error">{error()}</div>
                </Show>

                <Show
                  when={p().status === 'active'}
                  fallback={
                    <div class="alert alert-info">
                      This petition is currently {p().status} and not accepting new signatures.
                    </div>
                  }
                >
                  <form onSubmit={handleSubmit}>
                    <div class="form-group">
                      <label for="fullName">Full name *</label>
                      <input
                        id="fullName"
                        type="text"
                        required
                        value={form().fullName}
                        onInput={(e) => update('fullName', e.currentTarget.value)}
                      />
                    </div>

                    <div class="form-group">
                      <label for="email">Email address *</label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form().email}
                        onInput={(e) => update('email', e.currentTarget.value)}
                      />
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                      <div class="form-group">
                        <label for="city">City</label>
                        <input
                          id="city"
                          type="text"
                          value={form().city ?? ''}
                          onInput={(e) => update('city', e.currentTarget.value)}
                        />
                      </div>
                      <div class="form-group">
                        <label for="country">Country</label>
                        <input
                          id="country"
                          type="text"
                          value={form().country ?? ''}
                          onInput={(e) => update('country', e.currentTarget.value)}
                        />
                      </div>
                    </div>

                    <Show when={p().allowComments}>
                      <div class="form-group">
                        <label for="comment">Comment (optional)</label>
                        <textarea
                          id="comment"
                          rows="3"
                          maxLength={1000}
                          value={form().comment ?? ''}
                          onInput={(e) => update('comment', e.currentTarget.value)}
                        />
                      </div>
                    </Show>

                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
                      <Show when={p().allowPublicNames}>
                        <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer;">
                          <input
                            type="checkbox"
                            style="width: auto;"
                            checked={form().publicOptIn}
                            onChange={(e) => update('publicOptIn', e.currentTarget.checked)}
                          />
                          Display my name publicly
                        </label>
                      </Show>

                      <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer;">
                        <input
                          type="checkbox"
                          style="width: auto;"
                          checked={form().updatesOptIn}
                          onChange={(e) => update('updatesOptIn', e.currentTarget.checked)}
                        />
                        Send me updates about this petition
                      </label>

                      <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer;">
                        <input
                          type="checkbox"
                          style="width: auto;"
                          checked={form().recipientShareOptIn}
                          onChange={(e) => update('recipientShareOptIn', e.currentTarget.checked)}
                        />
                        Share my signature with the recipient
                      </label>
                    </div>

                    <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 1rem;">
                      By signing, you agree to our{' '}
                      <a href="/privacy" target="_blank">Privacy Policy</a>.
                      {p().requireVerification && ' You will receive a confirmation email.'}
                    </p>

                    <button
                      type="submit"
                      class="btn btn-primary"
                      disabled={submitting()}
                      style="width: 100%;"
                    >
                      {submitting() ? 'Submitting…' : 'Sign petition'}
                    </button>
                  </form>
                </Show>
              </div>
            </aside>
          </div>
        )}
      </Show>
    </div>
  )
}
