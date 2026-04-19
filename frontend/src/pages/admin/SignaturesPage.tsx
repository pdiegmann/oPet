import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { adminApi, Signature } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const VERIFIED_OPTIONS = [
  { value: '', label: 'All (verified & unverified)' },
  { value: 'true', label: 'Verified only' },
  { value: 'false', label: 'Unverified only' },
]

const WITHDRAWN_OPTIONS = [
  { value: 'false', label: 'Active only' },
  { value: 'true', label: 'Withdrawn only' },
  { value: '', label: 'All' },
]

type FilterOption = { value: string; label: string }

export default function SignaturesPage() {
  const token = getToken() ?? ''
  const params = useParams<{ id: string }>()

  const [page, setPage] = createSignal(1)
  const [verifiedFilter, setVerifiedFilter] = createSignal<FilterOption>(VERIFIED_OPTIONS[0])
  const [withdrawnFilter, setWithdrawnFilter] = createSignal<FilterOption>(WITHDRAWN_OPTIONS[0])
  const [removeTarget, setRemoveTarget] = createSignal<Signature | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  const [data, { refetch }] = createResource(
    () => ({
      page: page(),
      verified: verifiedFilter().value !== '' ? verifiedFilter().value === 'true' : undefined,
      withdrawn: withdrawnFilter().value !== '' ? withdrawnFilter().value === 'true' : undefined,
    }),
    (filters) => adminApi.getSignatures(token, params.id, filters),
  )

  function deriveSigStatus(sig: Signature): 'withdrawn' | 'verified' | 'pending' {
    if (sig.withdrawn) return 'withdrawn'
    if (sig.verified) return 'verified'
    return 'pending'
  }

  return (
    <div>
      <h1 class="page-title">Signatures</h1>

      {/* Filters */}
      <div class="flex gap-3 mb-5">
        <Select<FilterOption>
          options={VERIFIED_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={verifiedFilter()}
          onChange={(opt) => { if (opt) { setVerifiedFilter(opt); setPage(1) } }}
          itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
        >
          <SelectTrigger>
            <SelectValue<FilterOption>>{(s) => s.selectedOption().label}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select<FilterOption>
          options={WITHDRAWN_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={withdrawnFilter()}
          onChange={(opt) => { if (opt) { setWithdrawnFilter(opt); setPage(1) } }}
          itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
        >
          <SelectTrigger>
            <SelectValue<FilterOption>>{(s) => s.selectedOption().label}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <Show when={data.loading}>
        <div class="space-y-2 mb-4">
          <Skeleton class="h-8 w-full rounded" animate />
          <Skeleton class="h-8 w-full rounded" animate />
          <Skeleton class="h-8 w-full rounded" animate />
        </div>
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load signatures.</AlertDescription>
        </Alert>
      </Show>

      <Show when={error()}>
        {(msg) => (
          <Alert variant="destructive" class="mb-4">
            <AlertDescription>{msg()}</AlertDescription>
          </Alert>
        )}
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <p class="text-sm text-muted-foreground mb-3">
              {d().total.toLocaleString()} signature(s) found
            </p>

            <Card class="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <Show
                    when={d().signatures.length > 0}
                    fallback={
                      <TableRow>
                        <TableCell colspan={6} class="text-center text-muted-foreground">
                          No signatures found
                        </TableCell>
                      </TableRow>
                    }
                  >
                    <For each={d().signatures}>
                      {(sig) => (
                        <TableRow>
                          <TableCell class="font-medium">{sig.fullName}</TableCell>
                          <TableCell class="text-sm">{sig.email}</TableCell>
                          <TableCell class="text-sm text-muted-foreground">
                            {[sig.city, sig.country].filter(Boolean).join(', ') || '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={deriveSigStatus(sig)} type="signature" />
                          </TableCell>
                          <TableCell class="text-sm text-muted-foreground">
                            {new Date(sig.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Show when={!sig.withdrawn}>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRemoveTarget(sig)}
                              >
                                Remove
                              </Button>
                            </Show>
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </Show>
                </TableBody>
              </Table>
            </Card>

            <PaginationControls
              page={page()}
              totalPages={d().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>

      <ConfirmDialog
        open={removeTarget() !== null}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}
        title="Remove signature"
        description={`Remove signature from ${removeTarget()?.fullName ?? ''}?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={async () => {
          const sig = removeTarget()
          if (!sig) return
          try {
            await adminApi.removeSignature(token, sig.id)
            refetch()
          } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to remove signature')
          }
        }}
      />
    </div>
  )
}
