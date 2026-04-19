import { createMemo, createResource, createSignal, Show } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import QuillEditor from '@/components/QuillEditor.js'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { adminApi } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'

export default function PetitionUpdatesPage() {
  const token = getToken() ?? ''
  const params = useParams<{ id: string }>()

  const [message, setMessage] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [publishInFlight, setPublishInFlight] = createSignal(false)
  const [deleteTargetId, setDeleteTargetId] = createSignal<string | null>(null)

  const [petition] = createResource(() => params.id, (id) => adminApi.getPetition(token, id))
  const [updates, { refetch }] = createResource(() => params.id, (id) => adminApi.getPetitionUpdates(token, id))

  const [selectedUpdateId, setSelectedUpdateId] = createSignal<string | null>(null)
  const [title, setTitle] = createSignal('')
  const [content, setContent] = createSignal('')

  const selectedUpdate = createMemo(() =>
    updates()?.updates.find((item) => item.id === selectedUpdateId()) ?? null,
  )

  function selectUpdate(id: string) {
    const item = updates()?.updates.find((it) => it.id === id)
    if (!item) return
    setSelectedUpdateId(item.id)
    setTitle(item.currentTitle)
    setContent(item.currentContent)
    setError(null)
    setMessage(null)
  }

  async function reloadAndKeepSelection() {
    const previousSelection = selectedUpdateId()
    await refetch()

    const data = updates()?.updates ?? []
    if (!data.length) {
      setSelectedUpdateId(null)
      return
    }

    const existingSelection = previousSelection
      ? data.find((item) => item.id === previousSelection)
      : null

    const next = existingSelection ?? data[0]
    setSelectedUpdateId(next.id)
    setTitle(next.currentTitle)
    setContent(next.currentContent)
  }

  async function handleCreateOrSave() {
    setError(null)
    setMessage(null)
    setSaving(true)
    try {
      if (!title().trim() || !content().trim()) {
        throw new Error('Title and content are required.')
      }

      if (!selectedUpdateId()) {
        const created = await adminApi.createPetitionUpdate(token, params.id, {
          title: title().trim(),
          content: content().trim(),
        })
        setSelectedUpdateId(created.id)
        setMessage('Draft update created.')
      } else {
        await adminApi.updatePetitionUpdate(token, params.id, selectedUpdateId()!, {
          title: title().trim(),
          content: content().trim(),
        })
        setMessage('Draft update saved.')
      }
      await reloadAndKeepSelection()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save update')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    setError(null)
    setMessage(null)
    setPublishInFlight(true)
    try {
      if (!title().trim() || !content().trim()) {
        throw new Error('Title and content are required.')
      }

      let currentId = selectedUpdateId()
      if (!currentId) {
        const created = await adminApi.createPetitionUpdate(token, params.id, {
          title: title().trim(),
          content: content().trim(),
        })
        currentId = created.id
        setSelectedUpdateId(created.id)
      }

      await adminApi.publishPetitionUpdate(token, params.id, currentId, {
        title: title().trim(),
        content: content().trim(),
      })
      setMessage('Update published as a new immutable version.')
      await reloadAndKeepSelection()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish update')
    } finally {
      setPublishInFlight(false)
    }
  }

  async function handleDelete() {
    const id = deleteTargetId()
    if (!id) return

    setError(null)
    setMessage(null)
    try {
      await adminApi.deletePetitionUpdate(token, params.id, id)
      setMessage('Update deleted. Timeline placeholder remains publicly visible.')
      setDeleteTargetId(null)
      await reloadAndKeepSelection()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete update')
    }
  }

  return (
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold">Petition Updates</h1>
          <Show when={petition()}>
            {(p) => (
              <p class="text-sm text-muted-foreground mt-1">
                {p().title}
              </p>
            )}
          </Show>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" as={A} href={`/admin/petitions/${params.id}/edit`}>
            Back to petition
          </Button>
          <Show when={petition()}>
            {(p) => (
              <Button variant="outline" as="a" href={`/petition/${p().slug}`} target="_blank">
                Open public page ↗
              </Button>
            )}
          </Show>
        </div>
      </div>

      <Show when={updates.loading || petition.loading}>
        <Skeleton class="h-64 w-full rounded-lg" animate />
      </Show>

      <Show when={error()}>
        <Alert variant="destructive">
          <AlertDescription>{error()}</AlertDescription>
        </Alert>
      </Show>

      <Show when={message()}>
        <Alert>
          <AlertDescription>{message()}</AlertDescription>
        </Alert>
      </Show>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Existing updates</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <Button
              variant="outline"
              class="w-full justify-start"
              onClick={() => {
                setSelectedUpdateId(null)
                setTitle('')
                setContent('')
                setError(null)
                setMessage(null)
              }}
            >
              + New draft update
            </Button>

            <Show
              when={(updates()?.updates.length ?? 0) > 0}
              fallback={<p class="text-sm text-muted-foreground">No updates yet.</p>}
            >
              {updates()?.updates.map((update) => {
                const active = selectedUpdateId() === update.id
                const lastVersion = update.versions[0]
                return (
                  <button
                    type="button"
                    class={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-foreground/50 bg-muted' : 'hover:bg-muted/40'}`}
                    onClick={() => selectUpdate(update.id)}
                  >
                    <div class="font-medium line-clamp-2">{update.currentTitle}</div>
                    <div class="text-xs text-muted-foreground mt-1">
                      {update.deletedAt ? 'Deleted' : `${update.versions.length} published version(s)`}
                    </div>
                    <Show when={lastVersion}>
                      <div class="text-xs text-muted-foreground mt-0.5">
                        Latest: v{lastVersion?.versionNumber} on {new Date(lastVersion!.publishedAt).toLocaleString()}
                      </div>
                    </Show>
                  </button>
                )
              })}
            </Show>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">
              <Show when={selectedUpdate()} fallback={'New draft update'}>
                {(item) => `Editing: ${item().currentTitle}`}
              </Show>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <TextField>
              <TextFieldLabel>Title *</TextFieldLabel>
              <TextFieldInput
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                required
              />
            </TextField>

            <div class="space-y-1">
              <label class="text-sm font-medium">Content *</label>
              <QuillEditor
                id="petition-update-editor"
                value={content()}
                onValueChange={setContent}
                placeholder="Write your petition update here…"
                minHeight="14rem"
              />
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCreateOrSave}
                disabled={saving() || (!!selectedUpdateId() && !!selectedUpdate()?.deletedAt)}
              >
                {saving() ? 'Saving…' : selectedUpdateId() ? 'Save draft' : 'Create draft'}
              </Button>
              <Button
                variant="secondary"
                onClick={handlePublish}
                disabled={publishInFlight() || !!selectedUpdate()?.deletedAt}
              >
                {publishInFlight() ? 'Publishing…' : selectedUpdateId() ? 'Publish new version' : 'Publish now'}
              </Button>
              <Button
                variant="destructive"
                disabled={!selectedUpdateId() || !!selectedUpdate()?.deletedAt}
                onClick={() => setDeleteTargetId(selectedUpdateId())}
              >
                Delete update
              </Button>
            </div>

            <Show when={selectedUpdate()}>
              {(item) => (
                <div class="space-y-2 border-t pt-4">
                  <h2 class="text-sm font-semibold">Published versions</h2>
                  <Show
                    when={item().versions.length > 0}
                    fallback={<p class="text-sm text-muted-foreground">No published versions yet.</p>}
                  >
                    <div class="space-y-3">
                      {item().versions.map((version) => (
                        <Card>
                          <CardHeader class="pb-2">
                            <CardTitle class="text-sm">
                              v{version.versionNumber}: {version.title}
                            </CardTitle>
                            <p class="text-xs text-muted-foreground">
                              Published {new Date(version.publishedAt).toLocaleString()}
                              {version.publisher ? ` by ${version.publisher.email}` : ''}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div class="petition-body text-sm" innerHTML={version.content} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteTargetId() !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Delete update"
        description="Delete this update from the visible timeline. A placeholder stays, and published versions remain accessible."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
