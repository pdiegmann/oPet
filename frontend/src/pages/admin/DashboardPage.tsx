import { createResource, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, Signature, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/StatCard'
import { StatusBadge, type PetitionStatus } from '@/components/StatusBadge'
import { t } from '@/lib/i18n'

type SigWithPetition = Signature & { petition?: { title: string; slug: string } }

export default function DashboardPage() {
  const token = getToken() ?? ''
  const [data] = createResource(() => adminApi.getDashboard(token))

  return (
    <div>
      <h1 class="text-2xl font-bold mb-6">{t('app.dashboard')}</h1>

      <Show when={data.loading}>
        <div class="grid grid-cols-4 gap-4 mb-8">
          <For each={[1, 2, 3, 4]}>{() => <Skeleton class="h-28 rounded-lg" animate />}</For>
        </div>
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>{t('app.failed_to_load_dashboard_data')}</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <div class="grid grid-cols-4 gap-4 mb-8">
              <StatCard title={t('app.total_petitions')} value={d().stats.totalPetitions} />
              <StatCard title={t('app.active_petitions')} value={d().stats.activePetitions} />
              <StatCard title={t('app.total_signatures')} value={d().stats.totalSignatures} />
              <StatCard title={t('app.verified_signatures')} value={d().stats.verifiedSignatures} />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <div class="flex justify-between items-center mb-3">
                  <h2 class="font-bold">{t('app.recent_petitions')}</h2>
                  <A href="/admin/petitions" class="text-sm text-primary hover:underline">
                    {t('app.view_all')} →
                  </A>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('app.title')}</TableHead>
                      <TableHead>{t('app.status_2')}</TableHead>
                      <TableHead>{t('app.signatures')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={d().recentPetitions}>
                      {(p: AdminPetition) => (
                        <TableRow>
                          <TableCell>
                            <A
                              href={`/admin/petitions/${p.id}/signatures`}
                              class="text-sm hover:underline"
                            >
                              {p.title}
                            </A>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status as PetitionStatus} type="petition" />
                          </TableCell>
                          <TableCell class="text-sm">
                            {(p.signatureCount ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h2 class="font-bold mb-3">{t('app.recent_signatures')}</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('app.name')}</TableHead>
                      <TableHead>{t('app.petition')}</TableHead>
                      <TableHead>{t('app.status_2')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={d().recentSignatures}>
                      {(s: SigWithPetition) => (
                        <TableRow>
                          <TableCell class="text-sm font-medium">{s.fullName}</TableCell>
                          <TableCell class="text-sm text-muted-foreground">
                            {s.petition?.title ?? t('app.text')}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={s.verified ? 'verified' : 'pending'}
                              type="signature"
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
