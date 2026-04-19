import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { api, Petition } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TextField, TextFieldInput } from '@/components/ui/text-field'
import { StatusBadge, type PetitionStatus } from '@/components/StatusBadge'
import { PaginationControls } from '@/components/PaginationControls'

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

  function signaturePct(p: Petition) {
    return p.goalCount ? Math.min(100, Math.round((p.signatureCount / p.goalCount) * 100)) : null
  }

  return (
    <div>
      <section class="text-center py-12 pb-8">
        <h1 class="text-4xl font-extrabold mb-3">Make your voice heard</h1>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Browse active petitions and add your signature to causes that matter.
        </p>
        <form onSubmit={handleSearch} class="max-w-lg mx-auto flex gap-2">
          <TextField class="flex-1">
            <TextFieldInput
              type="search"
              placeholder="Search petitions…"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </TextField>
          <Button type="submit">Search</Button>
        </form>
      </section>

      <Show when={data.loading}>
        <div class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
          <For each={[1, 2, 3]}>{() => (
            <Card>
              <CardHeader>
                <Skeleton class="h-5 w-3/4 rounded" animate />
              </CardHeader>
              <CardContent class="space-y-2">
                <Skeleton class="h-4 w-full rounded" animate />
                <Skeleton class="h-4 w-5/6 rounded" animate />
              </CardContent>
            </Card>
          )}</For>
        </div>
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load petitions. Please try again.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(result) => (
          <>
            <Show when={result().petitions.length === 0}>
              <Alert>
                <AlertDescription>
                  No petitions found{query() ? ` for "${query()}"` : ''}.
                </AlertDescription>
              </Alert>
            </Show>

            <div class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
              <For each={result().petitions}>
                {(petition) => (
                  <A href={`/petition/${petition.slug}`} class="no-underline text-inherit">
                    <Card class="h-full cursor-pointer transition-shadow hover:shadow-md">
                      <CardHeader class="pb-2">
                        <CardTitle class="text-base leading-snug">{petition.title}</CardTitle>
                        <p class="text-sm text-muted-foreground">
                          To: <strong>{petition.recipientName}</strong>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Show when={petition.summary}>
                          <div class="text-sm line-clamp-3 mb-3 text-muted-foreground" innerHTML={petition.summary} />
                        </Show>
                        <Show when={petition.goalCount}>
                          <Progress
                            value={signaturePct(petition) ?? 0}
                            class="mb-2"
                          />
                        </Show>
                      </CardContent>
                      <CardFooter class="flex items-center gap-2 pt-0">
                        <StatusBadge status={petition.status as PetitionStatus} type="petition" />
                        <span class="text-xs text-muted-foreground ml-auto">
                          {petition.goalCount
                            ? `${petition.signatureCount} / ${petition.goalCount}`
                            : `${petition.signatureCount} signatures`}
                        </span>
                      </CardFooter>
                    </Card>
                  </A>
                )}
              </For>
            </div>

            <PaginationControls
              page={page()}
              totalPages={result().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>
    </div>
  )
}
