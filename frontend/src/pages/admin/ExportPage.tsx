import { createResource, createSignal, Show } from 'solid-js'
import { adminApi, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

type FormatOption = { value: 'csv' | 'json'; label: string }
const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

type FilterOption = { value: string; label: string }
const VERIFIED_OPTIONS: FilterOption[] = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Verified only' },
  { value: 'false', label: 'Unverified only' },
]
const WITHDRAWN_OPTIONS: FilterOption[] = [
  { value: 'false', label: 'Active only' },
  { value: 'true', label: 'Withdrawn only' },
  { value: '', label: 'All' },
]

type PetitionOption = { value: string; label: string }

export default function ExportPage() {
  const token = getToken() ?? ''

  const [petitions] = createResource(() => adminApi.getPetitions(token, { page: 1 }))

  const [formatOpt, setFormatOpt] = createSignal<FormatOption>(FORMAT_OPTIONS[0])
  const [petitionOpt, setPetitionOpt] = createSignal<PetitionOption>({ value: '', label: 'All petitions' })
  const [verifiedOpt, setVerifiedOpt] = createSignal<FilterOption>(VERIFIED_OPTIONS[0])
  const [withdrawnOpt, setWithdrawnOpt] = createSignal<FilterOption>(WITHDRAWN_OPTIONS[0])
  const [country, setCountry] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const petitionOptions = (): PetitionOption[] => [
    { value: '', label: 'All petitions' },
    ...(petitions()?.petitions ?? []).map((p: AdminPetition) => ({ value: p.id, label: p.title })),
  ]

  async function handleExport(e: Event) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await adminApi.exportSignatures(token, formatOpt().value, {
        petitionId: petitionOpt().value || undefined,
        verified: verifiedOpt().value !== '' ? verifiedOpt().value === 'true' : undefined,
        withdrawn: withdrawnOpt().value !== '' ? withdrawnOpt().value === 'true' : undefined,
        country: country() || undefined,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card class="max-w-lg">
      <CardHeader>
        <CardTitle>Export signatures</CardTitle>
      </CardHeader>
      <CardContent>
        <Show when={error()}>
          <Alert variant="destructive" class="mb-4">
            <AlertDescription>{error()}</AlertDescription>
          </Alert>
        </Show>

        <form onSubmit={handleExport}>
          <div class="space-y-4">
            <div class="space-y-1">
              <label class="text-sm font-medium">Format</label>
              <Select
                options={FORMAT_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={formatOpt()}
                onChange={(opt) => { if (opt) setFormatOpt(opt) }}
                itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
              >
                <SelectTrigger>
                  <SelectValue<FormatOption>>{(s) => s.selectedOption().label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">Petition (optional)</label>
              <Show when={!petitions.loading} fallback={<p class="text-sm text-muted-foreground">Loading petitions…</p>}>
                <Select
                  options={petitionOptions()}
                  optionValue="value"
                  optionTextValue="label"
                  value={petitionOpt()}
                  onChange={(opt) => { if (opt) setPetitionOpt(opt) }}
                  itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<PetitionOption>>{(s) => s.selectedOption().label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </Show>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-sm font-medium">Verification status</label>
                <Select
                  options={VERIFIED_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={verifiedOpt()}
                  onChange={(opt) => { if (opt) setVerifiedOpt(opt) }}
                  itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<FilterOption>>{(s) => s.selectedOption().label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium">Withdrawal status</label>
                <Select
                  options={WITHDRAWN_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={withdrawnOpt()}
                  onChange={(opt) => { if (opt) setWithdrawnOpt(opt) }}
                  itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<FilterOption>>{(s) => s.selectedOption().label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </div>

            <TextField>
              <TextFieldLabel>Filter by country (optional)</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="e.g. Germany"
                value={country()}
                onInput={(e) => setCountry(e.currentTarget.value)}
              />
            </TextField>

            <Button type="submit" class="w-full" disabled={loading()}>
              {loading() ? 'Preparing export…' : `Export as ${formatOpt().value.toUpperCase()}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
