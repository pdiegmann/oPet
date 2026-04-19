import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams, useNavigate } from '@solidjs/router'
import { api, SignPayload } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '@/components/ui/text-field'
import { StatusBadge, type PetitionStatus } from '@/components/StatusBadge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

export default function PetitionPage() {
  const params = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [petition] = createResource(() => params.slug, api.getPetition)
  const [updates] = createResource(() => params.slug, (slug) =>
    api.getPetitionUpdates(slug, { includeVersionHistory: true }),
  )
  const [expandedUpdates, setExpandedUpdates] = createSignal<Set<string>>(new Set())
  const [historyShownUpdates, setHistoryShownUpdates] = createSignal<Set<string>>(new Set())

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

  function toggleExpanded(updateId: string) {
    setExpandedUpdates((prev) => {
      const next = new Set(prev)
      if (next.has(updateId)) next.delete(updateId)
      else next.add(updateId)
      return next
    })
  }

  function toggleHistory(updateId: string) {
    setHistoryShownUpdates((prev) => {
      const next = new Set(prev)
      if (next.has(updateId)) next.delete(updateId)
      else next.add(updateId)
      return next
    })
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
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Show when={petition.loading}>
        <div class="space-y-4">
          <Skeleton class="h-8 w-2/3 rounded" animate />
          <Skeleton class="h-4 w-1/3 rounded" animate />
          <Skeleton class="h-40 w-full rounded" animate />
        </div>
      </Show>

      <Show when={petition.error}>
        <Alert variant="destructive">
          <AlertDescription>Petition not found.</AlertDescription>
        </Alert>
      </Show>

      <Show when={petition()}>
        {(p) => (
          <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Petition details */}
            <div class="min-w-0">
              <div class="mb-3">
                <StatusBadge status={p().status as PetitionStatus} type="petition" />
              </div>
              <h1 class="mb-2 break-words text-3xl font-extrabold">{p().title}</h1>
              <Show when={p().summary}>
                <div class="petition-summary mb-4 text-muted-foreground" innerHTML={p().summary} />
              </Show>
              <p class="mb-1 text-muted-foreground">
                To:{' '}
                <Show when={p().recipientDescription} fallback={<strong>{p().recipientName}</strong>}>
                  {' '}
                  <HoverCard openDelay={150} closeDelay={100}>
                    <HoverCardTrigger
                      as="button"
                      type="button"
                      class="inline-flex items-center rounded-sm underline decoration-dotted underline-offset-4 hover:text-foreground"
                    >
                      <strong>{p().recipientName}</strong>
                    </HoverCardTrigger>
                    <HoverCardContent class="w-80">
                      <div class="petition-body text-sm text-foreground" innerHTML={p().recipientDescription!} />
                    </HoverCardContent>
                  </HoverCard>
                </Show>
              </p>
              <p class="text-sm text-muted-foreground mb-4">
                {p().signatureCount.toLocaleString()} signatures
                <Show when={p().goalCount}> of {p().goalCount?.toLocaleString()} goal</Show>
              </p>

              <Show when={p().goalCount}>
                <Progress
                  value={Math.min(100, Math.round((p().signatureCount / (p().goalCount ?? 1)) * 100))}
                  class="mb-6"
                />
              </Show>

              <div
                class="petition-body mb-8 leading-relaxed"
                innerHTML={p().body}
              />

              <Show when={!updates.loading}>
                <section class="mb-8">
                  <h2 class="text-lg font-bold mb-3">Updates</h2>
                  <Show
                    when={(updates()?.updates.length ?? 0) > 0}
                    fallback={<p class="text-sm text-muted-foreground">No updates published yet.</p>}
                  >
                    <div class="space-y-4">
                      <For each={updates()?.updates}>
                        {(update) => (
                          <Card>
                            <button
                              type="button"
                              class="w-full px-4 py-3 text-left"
                              onClick={() => toggleExpanded(update.id)}
                            >
                              <div class="flex items-center justify-between gap-3">
                                <div class="text-base font-semibold">
                                  {update.isDeleted ? 'Deleted update' : (update.latestVersion?.title ?? 'Published update')}
                                </div>
                                <div class="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(update.latestVersion?.publishedAt ?? update.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </button>
                            <Show when={expandedUpdates().has(update.id)}>
                              <CardContent class="space-y-3 pt-0">
                                <Show when={!update.isDeleted && update.latestVersion}>
                                  <div class="petition-body" innerHTML={update.latestVersion!.content} />
                                </Show>
                                <Show when={update.isDeleted}>
                                  <p class="text-sm text-muted-foreground">
                                    This update was deleted.
                                  </p>
                                  <Show when={update.latestVersion}>
                                    <div class="rounded border p-3">
                                      <div class="text-sm font-medium">
                                        Latest published: {update.latestVersion?.title}
                                      </div>
                                      <p class="text-xs text-muted-foreground mt-1">
                                        Published {new Date(update.latestVersion!.publishedAt).toLocaleString()}
                                      </p>
                                      <div class="petition-body mt-2 text-sm" innerHTML={update.latestVersion!.content} />
                                    </div>
                                  </Show>
                                </Show>

                                <Show when={(update.versions?.length ?? 0) > 1}>
                                  <div class="border-t pt-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleHistory(update.id)}
                                    >
                                      {historyShownUpdates().has(update.id) ? 'Hide version history' : 'Show version history'}
                                    </Button>
                                  </div>
                                </Show>

                                <Show when={historyShownUpdates().has(update.id) && update.versions && update.versions!.length > 1}>
                                  <div class="space-y-3">
                                    <h3 class="text-sm font-semibold">Version history</h3>
                                    <For each={update.versions!.slice(1)}>
                                      {(version) => (
                                        <div class="rounded border p-3">
                                          <div class="text-sm font-medium">
                                            v{version.versionNumber}: {version.title}
                                          </div>
                                          <p class="text-xs text-muted-foreground mt-1">
                                            Published {new Date(version.publishedAt).toLocaleString()}
                                          </p>
                                          <div class="petition-body mt-2 text-sm" innerHTML={version.content} />
                                        </div>
                                      )}
                                    </For>
                                  </div>
                                </Show>
                              </CardContent>
                            </Show>
                          </Card>
                        )}
                      </For>
                    </div>
                  </Show>
                </section>
              </Show>

              <Show when={p().allowPublicNames && p().signatures && p().signatures!.length > 0}>
                <h2 class="text-lg font-bold mb-4">Recent signers</h2>
                <div class="flex flex-col gap-3 mb-8">
                  <For each={p().signatures}>
                    {(sig) => (
                      <Card>
                        <CardContent class="py-3">
                          <strong>{sig.fullName}</strong>
                          <Show when={sig.city || sig.country}>
                            <span class="text-muted-foreground text-sm ml-2">
                              {[sig.city, sig.country].filter(Boolean).join(', ')}
                            </span>
                          </Show>
                          <Show when={sig.comment}>
                            <p class="mt-1 text-sm text-muted-foreground">"{sig.comment}"</p>
                          </Show>
                        </CardContent>
                      </Card>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Signature form */}
            <aside class="min-w-0">
              <Card class="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
                <CardHeader>
                  <CardTitle>Sign this petition</CardTitle>
                </CardHeader>
                <CardContent>
                  <Show when={error()}>
                    <Alert variant="destructive" class="mb-4">
                      <AlertDescription>{error()}</AlertDescription>
                    </Alert>
                  </Show>

                  <Show
                    when={p().status === 'active'}
                    fallback={
                      <Alert>
                        <AlertDescription>
                          This petition is currently {p().status} and not accepting new signatures.
                        </AlertDescription>
                      </Alert>
                    }
                  >
                    <form onSubmit={handleSubmit} class="space-y-4">
                      <TextField>
                        <TextFieldLabel>Full name *</TextFieldLabel>
                        <TextFieldInput
                          type="text"
                          required
                          value={form().fullName}
                          onInput={(e) => update('fullName', e.currentTarget.value)}
                        />
                      </TextField>

                      <TextField>
                        <TextFieldLabel>Email address *</TextFieldLabel>
                        <TextFieldInput
                          type="email"
                          required
                          value={form().email}
                          onInput={(e) => update('email', e.currentTarget.value)}
                        />
                      </TextField>

                      <div class="grid grid-cols-2 gap-3">
                        <TextField>
                          <TextFieldLabel>City</TextFieldLabel>
                          <TextFieldInput
                            type="text"
                            value={form().city ?? ''}
                            onInput={(e) => update('city', e.currentTarget.value)}
                          />
                        </TextField>
                        <TextField>
                          <TextFieldLabel>Country</TextFieldLabel>
                          <TextFieldInput
                            type="text"
                            value={form().country ?? ''}
                            onInput={(e) => update('country', e.currentTarget.value)}
                          />
                        </TextField>
                      </div>

                      <Show when={p().allowComments}>
                        <TextField>
                          <TextFieldLabel>Comment (optional)</TextFieldLabel>
                          <TextFieldTextArea
                            rows={3}
                            maxLength={1000}
                            value={form().comment ?? ''}
                            onInput={(e) => update('comment', e.currentTarget.value)}
                          />
                        </TextField>
                      </Show>

                      <div class="flex flex-col gap-2">
                        <Show when={p().allowPublicNames}>
                          <label class="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox
                              checked={form().publicOptIn}
                              onChange={(checked) => update('publicOptIn', checked)}
                            />
                            Display my name publicly
                          </label>
                        </Show>
                        <label class="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={form().updatesOptIn}
                            onChange={(checked) => update('updatesOptIn', checked)}
                          />
                          Send me updates about this petition
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={form().recipientShareOptIn}
                            onChange={(checked) => update('recipientShareOptIn', checked)}
                          />
                          Share my signature with the recipient
                        </label>
                      </div>

                      <p class="text-xs text-muted-foreground">
                        By signing, you agree to our{' '}
                        <a href="/privacy" target="_blank" class="underline">Privacy Policy</a>.
                        {p().requireVerification && ' You will receive a confirmation email.'}
                      </p>

                      <Button type="submit" class="w-full" disabled={submitting()}>
                        {submitting() ? 'Submitting…' : 'Sign petition'}
                      </Button>
                    </form>
                  </Show>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </Show>
    </div>
  )
}
