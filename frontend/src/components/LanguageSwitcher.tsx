import { Match, Show, Switch, createMemo, createSignal } from 'solid-js'
import { Languages } from 'lucide-solid'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Locale, getAvailableLocales, isSupportedLocale, locale, setLocale, t } from '@/lib/i18n'
import { Toggle } from "~/components/ui/toggle"

interface LocaleOption {
  value: Locale
  label: string
}

function getLocaleLabel(nextLocale: Locale): string {
  if (nextLocale === 'en') return t('app.english')
  if (nextLocale === 'de') return t('app.german')

  try {
    const displayNames = new Intl.DisplayNames([locale()], { type: 'language' })
    return displayNames.of(nextLocale) ?? nextLocale.toUpperCase()
  } catch {
    return nextLocale.toUpperCase()
  }
}

interface IndexedLocaleOption extends LocaleOption {
  index: number
}

function ToggleLanguageButton() {
  const localeOptions = createMemo<LocaleOption[]>(() =>
    getAvailableLocales().map((value) => ({ value, label: getLocaleLabel(value) })),
  )
  const selectedLocaleOption = createMemo<IndexedLocaleOption | undefined>(() => {
    return {
      ...(localeOptions().find((option) => option.value === locale()) as LocaleOption),
      index: localeOptions().findIndex((option) => option.value === locale()),
    }
  })
  const selectedIndex = createMemo(() => {
    const index = selectedLocaleOption()?.index
    return typeof index === 'number' && index >= 0 ? index : 0
  })
  const nextIndex = createMemo(() => (selectedIndex() + 1) % localeOptions().length)

  const _setNextLocale = () => {
    const nextLocale = localeOptions().at(nextIndex())
    if (nextLocale?.value) setLocale(nextLocale.value)
  }

  return (
    <Button variant="ghost" size="sm" class="ml-1" onClick={() => _setNextLocale()}>
      {localeOptions().at(nextIndex())?.label}
    </Button>
  )
}

export function LanguageSwitcher() {
  const localeOptions = createMemo<LocaleOption[]>(() =>
    getAvailableLocales().map((value) => ({ value, label: getLocaleLabel(value) })),
  )

  const selectedLocaleOption = createMemo<LocaleOption | undefined>(() =>
    localeOptions().find((option) => option.value === locale()),
  )

  return (
    <div class="flex items-center gap-0">
      <Languages strokeWidth={1} size={18} aria-hidden="true" />
      <Switch>
        <Match when={localeOptions().length > 2}>
          <Select<LocaleOption>
            class="w-[150px]"
            options={localeOptions()}
            value={selectedLocaleOption()}
            onChange={(next) => next && setLocale(next.value)}
            optionValue="value"
            optionTextValue="label"
            itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
          >
            <SelectTrigger class="h-8 w-[150px] text-xs">
              <SelectValue<LocaleOption>>{(state) => state.selectedOption()?.label ?? ''}</SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Match>

        <Match when={localeOptions().length === 2}>
          <ToggleLanguageButton />
        </Match>
      </Switch>
    </div>
  )
}
