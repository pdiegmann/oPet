import { createResource, createSignal, Show } from 'solid-js'
import { adminApi, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { t } from '@/lib/i18n'

type FormatOption = { value: 'csv' | 'json'; label: string }
const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'csv', label: 'app.format_csv' },
  { value: 'json', label: 'app.format_json' },
]

type FilterOption = { value: string; label: string }
const VERIFIED_OPTIONS: FilterOption[] = [
  { value: '', label: 'app.filter_all' },
  { value: 'true', label: 'app.filter_verified_only' },
  { value: 'false', label: 'app.filter_unverified_only' },
]
const WITHDRAWN_OPTIONS: FilterOption[] = [
  { value: 'false', label: 'app.filter_active_only' },
  { value: 'true', label: 'app.filter_withdrawn_only' },
  { value: '', label: 'app.filter_all' },
]

type PetitionOption = { value: string; label: string }

export default function ExportPage() {
  const token = getToken() ?? ''

  const [petitions] = createResource(() => adminApi.getPetitions(token, { page: 1 }))

  const [formatOpt, setFormatOpt] = createSignal<FormatOption>(FORMAT_OPTIONS[0])
  const [petitionOpt, setPetitionOpt] = createSignal<PetitionOption>({ value: '', label: 'app.all_petitions' })
  const [verifiedOpt, setVerifiedOpt] = createSignal<FilterOption>(VERIFIED_OPTIONS[0])
  const [withdrawnOpt, setWithdrawnOpt] = createSignal<FilterOption>(WITHDRAWN_OPTIONS[0])
  const [country, setCountry] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  const petitionOptions = (): PetitionOption[] => [
    { value: '', label: 'app.all_petitions' },
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
      setError(err instanceof Error ? err.message : t('app.export_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card class="max-w-lg">
      <CardHeader>
        <CardTitle>{t('app.export_signatures')}</CardTitle>
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
              <label class="text-sm font-medium">{t('app.format')}</label>
              <Select
                options={FORMAT_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={formatOpt()}
                onChange={(opt) => { if (opt) setFormatOpt(opt) }}
                itemComponent={(p) => <SelectItem item={p.item}>{t(p.item.rawValue.label)}</SelectItem>}
              >
                <SelectTrigger>
                  <SelectValue<FormatOption>>{(s) => t(s.selectedOption().label)}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">{t('app.petition_optional')}</label>
              <Show when={!petitions.loading} fallback={<p class="text-sm text-muted-foreground">{t('app.loading_petitions')}</p>}>
                <Select
                  options={petitionOptions()}
                  optionValue="value"
                  optionTextValue="label"
                  value={petitionOpt()}
                  onChange={(opt) => { if (opt) setPetitionOpt(opt) }}
                  itemComponent={(p) => (
                    <SelectItem item={p.item}>
                      {p.item.rawValue.label.startsWith('app.') ? t(p.item.rawValue.label) : p.item.rawValue.label}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<PetitionOption>>{(s) => {
                      const label = s.selectedOption().label
                      return label.startsWith('app.') ? t(label) : label
                    }}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </Show>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-sm font-medium">{t('app.verification_status')}</label>
                <Select
                  options={VERIFIED_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={verifiedOpt()}
                  onChange={(opt) => { if (opt) setVerifiedOpt(opt) }}
                  itemComponent={(p) => <SelectItem item={p.item}>{t(p.item.rawValue.label)}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<FilterOption>>{(s) => t(s.selectedOption().label)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-sm font-medium">{t('app.withdrawal_status')}</label>
                <Select
                  options={WITHDRAWN_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={withdrawnOpt()}
                  onChange={(opt) => { if (opt) setWithdrawnOpt(opt) }}
                  itemComponent={(p) => <SelectItem item={p.item}>{t(p.item.rawValue.label)}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<FilterOption>>{(s) => t(s.selectedOption().label)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </div>

            <TextField>
              <TextFieldLabel>{t('app.filter_by_country_optional')}</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder={t('app.e_g_germany')}
                value={country()}
                onInput={(e) => setCountry(e.currentTarget.value)}
              />
            </TextField>

            <Button type="submit" class="w-full" disabled={loading()}>
              {loading() ? t('app.preparing_export') : t('app.export_as_var', { format: formatOpt().value.toUpperCase() })}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
