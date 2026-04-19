import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { StatusBadge, type PetitionStatus } from '@/components/StatusBadge'

type StatusOpt = { label: string; value: string }
const STATUS_OPTIONS: StatusOpt[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function PetitionsPage() {
  const token = getToken() ?? ''
  const [page, setPage] = createSignal(1)
  const [statusFilter, setStatusFilter] = createSignal('')
  const [archiveTarget, setArchiveTarget] = createSignal<AdminPetition | null>(null)
  const [archiveError, setArchiveError] = createSignal<string | null>(null)

  const [data, { refetch }] = createResource(
    () => ({ page: page(), status: statusFilter() }),
    (params) => adminApi.getPetitions(token, params),
  )

  async function handleArchive() {
    const p = archiveTarget()
    if (!p) return
    setArchiveError(null)
    try {
      await adminApi.archivePetition(token, p.id)
      refetch()
    } catch (e: unknown) {
      setArchiveError(e instanceof Error ? e.message : 'Failed to archive petition')
    }
  }

  return (
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Petitions</h1>
        <Button as={A} href="/admin/petitions/new">+ New petition</Button>
      </div>

      <Show when={archiveError()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{archiveError()}</AlertDescription>
        </Alert>
      </Show>

      <div class="flex gap-3 mb-5">
        <Select
          options={STATUS_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={STATUS_OPTIONS.find(o => o.value === statusFilter()) ?? null}
          onChange={(opt) => { setStatusFilter(opt?.value ?? ''); setPage(1) }}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-[180px]">
            <SelectValue<StatusOpt>>{(state) => state.selectedOption()?.label ?? 'All statuses'}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <Show when={data.loading}>
        <Skeleton class="h-64 w-full rounded-lg" animate />
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load petitions.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Show
                  when={d().petitions.length > 0}
                  fallback={
                    <TableRow>
                      <TableCell colspan={5} class="text-center text-muted-foreground py-8">
                        No petitions found
                      </TableCell>
                    </TableRow>
                  }
                >
                  <For each={d().petitions}>
                    {(p: AdminPetition) => (
                      <TableRow>
                        <TableCell>
                          <div class="font-semibold text-sm">{p.title}</div>
                          <div class="text-xs text-muted-foreground">/{p.slug}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status as PetitionStatus} type="petition" />
                        </TableCell>
                        <TableCell class="text-sm">
                          {(p.signatureCount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-1.5">
                            <Button as={A} href={`/admin/petitions/${p.id}/edit`} variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button as={A} href={`/admin/petitions/${p.id}/updates`} variant="outline" size="sm">
                              Updates
                            </Button>
                            <Button as={A} href={`/admin/petitions/${p.id}/signatures`} variant="outline" size="sm">
                              Signatures
                            </Button>
                            <Show when={p.status !== 'archived'}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setArchiveTarget(p)}
                              >
                                Archive
                              </Button>
                            </Show>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </Show>
              </TableBody>
            </Table>

            <PaginationControls
              page={page()}
              totalPages={d().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>

      <ConfirmDialog
        open={archiveTarget() !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title="Archive petition"
        description={`Archive "${archiveTarget()?.title}"? It will no longer accept signatures.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchive}
      />
    </div>
  )
}
