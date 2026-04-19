import { createResource, createSignal, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { adminApi } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import QuillEditor from '@/components/QuillEditor.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TextField, TextFieldDescription, TextFieldInput, TextFieldLabel,
} from '@/components/ui/text-field'

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

type StatusOpt = { label: string; value: string }
const STATUS_OPTIONS: StatusOpt[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function PetitionEditorPage() {
  const token = getToken() ?? ''
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEdit = !!params.id

  const [form, setForm] = createSignal<PetitionFormData>(emptyForm())
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

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
    <div class="max-w-3xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{isEdit ? 'Edit petition' : 'New petition'}</h1>
        <div class="flex items-center gap-2">
          <Show when={isEdit && params.id}>
            <Button variant="outline" size="sm" as="a" href={`/admin/petitions/${params.id}/updates`}>
              Manage updates
            </Button>
          </Show>
          <Show when={isEdit && existing()}>
            <Button variant="outline" size="sm" as="a" href={`/petition/${existing()?.slug}`} target="_blank">
              View public page ↗
            </Button>
          </Show>
        </div>
      </div>

      <Show when={existing.loading}>
        <Skeleton class="h-64 w-full rounded-lg mb-4" animate />
      </Show>

      <Show when={error()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{error()}</AlertDescription>
        </Alert>
      </Show>
      <Show when={success()}>
        <Alert class="mb-4">
          <AlertDescription>{success()}</AlertDescription>
        </Alert>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-4">
        <Card>
          <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <TextField>
              <TextFieldLabel>Title *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                value={form().title}
                onInput={(e) => {
                  update('title', e.currentTarget.value)
                  if (!isEdit) update('slug', autoSlug(e.currentTarget.value))
                }}
              />
            </TextField>

            <TextField>
              <TextFieldLabel>Slug *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                pattern="[a-z0-9-]+"
                value={form().slug}
                onInput={(e) => update('slug', e.currentTarget.value)}
              />
              <TextFieldDescription>URL: /petition/{form().slug || '…'}</TextFieldDescription>
            </TextField>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Summary * (shown in listing)</label>
              <QuillEditor
                id="summary"
                value={form().summary}
                onValueChange={(val) => update('summary', val)}
                placeholder="Short summary shown in the petition listing…"
                minHeight="5rem"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Body * (full petition text)</label>
              <QuillEditor
                id="body"
                value={form().body}
                onValueChange={(val) => update('body', val)}
                placeholder="Full petition text…"
                minHeight="14rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recipient</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <TextField>
              <TextFieldLabel>Recipient name *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                value={form().recipientName}
                onInput={(e) => update('recipientName', e.currentTarget.value)}
              />
            </TextField>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Recipient description</label>
              <QuillEditor
                id="recipientDescription"
                value={form().recipientDescription}
                onValueChange={(val) => update('recipientDescription', val)}
                placeholder="Brief description of the petition recipient…"
                minHeight="5rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Status</label>
                <Select
                  options={STATUS_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={STATUS_OPTIONS.find(o => o.value === form().status) ?? null}
                  onChange={(opt) => update('status', opt?.value ?? 'draft')}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<StatusOpt>>{(state) => state.selectedOption()?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>

              <TextField>
                <TextFieldLabel>Signature goal</TextFieldLabel>
                <TextFieldInput
                  type="number"
                  min="1"
                  value={form().goalCount}
                  onInput={(e) => update('goalCount', e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>Starts at</TextFieldLabel>
                <TextFieldInput
                  type="datetime-local"
                  value={form().startsAt}
                  onInput={(e) => update('startsAt', e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>Ends at</TextFieldLabel>
                <TextFieldInput
                  type="datetime-local"
                  value={form().endsAt}
                  onInput={(e) => update('endsAt', e.currentTarget.value)}
                />
              </TextField>
            </div>

            <div class="flex flex-col gap-3 pt-1">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().requireVerification}
                  onChange={(checked) => update('requireVerification', checked)}
                />
                Require email verification
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().allowPublicNames}
                  onChange={(checked) => update('allowPublicNames', checked)}
                />
                Allow public names
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().allowComments}
                  onChange={(checked) => update('allowComments', checked)}
                />
                Allow comments
              </label>
            </div>
          </CardContent>
        </Card>

        <div class="flex gap-3 pb-8">
          <Button type="submit" disabled={saving()}>
            {saving() ? 'Saving…' : isEdit ? 'Save changes' : 'Create petition'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/petitions')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
