import { createResource, createSignal, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { adminApi } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

interface PetitionFormData {
  slug: string
  title: string
  summary: string
  body: string
  recipientName: string
  recipientDescription: string
  status: string
  goalCount: string
  allowPublicNames: boolean
  allowComments: boolean
  requireVerification: boolean
  startsAt: string
  endsAt: string
}

const emptyForm = (): PetitionFormData => ({
  slug: '',
  title: '',
  summary: '',
  body: '',
  recipientName: '',
  recipientDescription: '',
  status: 'draft',
  goalCount: '',
  allowPublicNames: false,
  allowComments: false,
  requireVerification: true,
  startsAt: '',
  endsAt: '',
})

export default function PetitionEditorPage() {
  const token = getToken() ?? ''
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEdit = !!params.id

  const [form, setForm] = createSignal<PetitionFormData>(emptyForm())
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

  // Load existing petition for editing
  const [existing] = createResource(
    () => (isEdit ? params.id : undefined),
    async (id) => {
      const p = await adminApi.getPetition(token, id!)
      setForm({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        body: p.body,
        recipientName: p.recipientName,
        recipientDescription: p.recipientDescription ?? '',
        status: p.status,
        goalCount: p.goalCount ? String(p.goalCount) : '',
        allowPublicNames: p.allowPublicNames,
        allowComments: p.allowComments,
        requireVerification: p.requireVerification,
        startsAt: p.startsAt ? new Date(p.startsAt).toISOString().slice(0, 16) : '',
        endsAt: p.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : '',
      })
      return p
    },
  )

  function update<K extends keyof PetitionFormData>(key: K, value: PetitionFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (saving()) return
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const f = form()
      const payload = {
        slug: f.slug,
        title: f.title,
        summary: f.summary,
        body: f.body,
        recipientName: f.recipientName,
        recipientDescription: f.recipientDescription || undefined,
        status: f.status,
        goalCount: f.goalCount ? parseInt(f.goalCount) : undefined,
        allowPublicNames: f.allowPublicNames,
        allowComments: f.allowComments,
        requireVerification: f.requireVerification,
        startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined,
        endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined,
      }

      if (isEdit) {
        await adminApi.updatePetition(token, params.id!, payload)
        setSuccess('Petition updated successfully.')
      } else {
        const created = await adminApi.createPetition(token, payload)
        navigate(`/admin/petitions/${created.id}/edit`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save petition')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style="max-width: 760px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h1 class="page-title" style="margin: 0;">
          {isEdit ? 'Edit petition' : 'New petition'}
        </h1>
        <Show when={isEdit && existing()}>
          <a
            href={`/petition/${existing()?.slug}`}
            target="_blank"
            class="btn btn-secondary"
            style="font-size: 0.85rem;"
          >
            View public page ↗
          </a>
        </Show>
      </div>

      <Show when={existing.loading}>
        <p style="color: var(--color-text-muted);">Loading…</p>
      </Show>

      <Show when={error()}>
        <div class="alert alert-error">{error()}</div>
      </Show>
      <Show when={success()}>
        <div class="alert alert-success">{success()}</div>
      </Show>

      <form onSubmit={handleSubmit}>
        <div class="card" style="margin-bottom: 1.25rem;">
          <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Basic information</h2>

          <div class="form-group">
            <label for="title">Title *</label>
            <input
              id="title"
              type="text"
              required
              value={form().title}
              onInput={(e) => {
                update('title', e.currentTarget.value)
                if (!isEdit) update('slug', autoSlug(e.currentTarget.value))
              }}
            />
          </div>

          <div class="form-group">
            <label for="slug">Slug *</label>
            <input
              id="slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              value={form().slug}
              onInput={(e) => update('slug', e.currentTarget.value)}
            />
            <small style="color: var(--color-text-muted);">
              URL: /petition/{form().slug || '…'}
            </small>
          </div>

          <div class="form-group">
            <label for="summary">Summary * (shown in listing)</label>
            <textarea
              id="summary"
              required
              rows="2"
              maxLength={500}
              value={form().summary}
              onInput={(e) => update('summary', e.currentTarget.value)}
            />
          </div>

          <div class="form-group">
            <label for="body">Body * (full petition text)</label>
            <textarea
              id="body"
              required
              rows="10"
              value={form().body}
              onInput={(e) => update('body', e.currentTarget.value)}
            />
          </div>
        </div>

        <div class="card" style="margin-bottom: 1.25rem;">
          <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Recipient</h2>

          <div class="form-group">
            <label for="recipientName">Recipient name *</label>
            <input
              id="recipientName"
              type="text"
              required
              value={form().recipientName}
              onInput={(e) => update('recipientName', e.currentTarget.value)}
            />
          </div>

          <div class="form-group">
            <label for="recipientDescription">Recipient description</label>
            <input
              id="recipientDescription"
              type="text"
              value={form().recipientDescription}
              onInput={(e) => update('recipientDescription', e.currentTarget.value)}
            />
          </div>
        </div>

        <div class="card" style="margin-bottom: 1.25rem;">
          <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem;">Settings</h2>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label for="status">Status</label>
              <select
                id="status"
                value={form().status}
                onChange={(e) => update('status', e.currentTarget.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div class="form-group">
              <label for="goalCount">Signature goal</label>
              <input
                id="goalCount"
                type="number"
                min="1"
                value={form().goalCount}
                onInput={(e) => update('goalCount', e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <label for="startsAt">Starts at</label>
              <input
                id="startsAt"
                type="datetime-local"
                value={form().startsAt}
                onInput={(e) => update('startsAt', e.currentTarget.value)}
              />
            </div>
            <div class="form-group">
              <label for="endsAt">Ends at</label>
              <input
                id="endsAt"
                type="datetime-local"
                value={form().endsAt}
                onInput={(e) => update('endsAt', e.currentTarget.value)}
              />
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
            {(
              [
                ['requireVerification', 'Require email verification'],
                ['allowPublicNames', 'Allow public names'],
                ['allowComments', 'Allow comments'],
              ] as [keyof PetitionFormData, string][]
            ).map(([key, label]) => (
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400; cursor: pointer;">
                <input
                  type="checkbox"
                  style="width: auto;"
                  checked={form()[key] as boolean}
                  onChange={(e) => update(key, e.currentTarget.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem;">
          <button type="submit" class="btn btn-primary" disabled={saving()}>
            {saving() ? 'Saving…' : isEdit ? 'Save changes' : 'Create petition'}
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            onClick={() => navigate('/admin/petitions')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
