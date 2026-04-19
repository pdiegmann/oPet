import i18next from 'i18next'
import type { Context } from 'hono'
import translations from '../../../i18n/translations.json'

export type Locale = 'en' | 'de'
type Params = Record<string, string | number | boolean | null | undefined>

void i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: (translations as { en: Record<string, string> }).en },
    de: { translation: (translations as { de: Record<string, string> }).de },
  },
  interpolation: {
    escapeValue: false,
  },
})

export function resolveLocaleFromHeader(acceptLanguage?: string | null): Locale {
  const value = (acceptLanguage ?? '').toLowerCase()
  return value.startsWith('de') ? 'de' : 'en'
}

export function getLocale(c: Context): Locale {
  return resolveLocaleFromHeader(c.req.header('Accept-Language'))
}

export function translate(locale: Locale, key: string, params?: Params): string {
  return i18next.getFixedT(locale)(key, params as Record<string, unknown>)
}

export function t(c: Context, key: string, params?: Params): string {
  return translate(getLocale(c), key, params)
}
