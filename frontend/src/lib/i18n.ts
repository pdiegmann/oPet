import { createMemo, createSignal } from 'solid-js'
import { resolveTemplate, translator } from '@solid-primitives/i18n'
import translations from '../../../i18n/translations.json'

type Dictionaries = Record<string, Record<string, string>>
const dictionaries = translations as Dictionaries
const supportedLocales = Object.keys(dictionaries)

export type Locale = (typeof supportedLocales)[number]

type Params = Record<string, string | number | boolean>

const STORAGE_KEY = 'opet.locale'
const FALLBACK_LOCALE = (supportedLocales.includes('en') ? 'en' : supportedLocales[0]) as Locale

export function isSupportedLocale(value: string): value is Locale {
  return supportedLocales.includes(value)
}

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return FALLBACK_LOCALE

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored

  const navLang = window.navigator.language.toLowerCase()
  if (navLang.startsWith('de') && isSupportedLocale('de')) {
    return 'de'
  }
  if (isSupportedLocale('en')) {
    return 'en'
  }

  return FALLBACK_LOCALE
}

const [localeSignal, setLocaleSignal] = createSignal<Locale>(detectInitialLocale())
const dictionary = createMemo(() => dictionaries[localeSignal()] ?? dictionaries[FALLBACK_LOCALE])
const translate = translator(dictionary as never, resolveTemplate as never) as (
  key: string,
  params?: Params,
) => string | undefined

function applyLocaleSideEffects(nextLocale: Locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLocale
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  }
}

applyLocaleSideEffects(localeSignal())

export function setLocale(nextLocale: Locale) {
  if (!isSupportedLocale(nextLocale)) return
  setLocaleSignal(nextLocale)
  applyLocaleSideEffects(nextLocale)
}

export function locale() {
  return localeSignal()
}

export function getCurrentLocale(): Locale {
  return localeSignal()
}

export function getAvailableLocales(): Locale[] {
  return [...supportedLocales] as Locale[]
}

export function t(key: string, params?: Params): string {
  return translate(key, params) ?? key
}
