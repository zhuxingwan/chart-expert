'use client'

import * as React from 'react'

// ---- Supported locales ----
export const SUPPORTED_LOCALES = [
  'en', 'zh', 'es', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'pa',
  'de', 'ms', 'vi', 'ko', 'fr', 'mr', 'ta', 'ur', 'tr', 'it',
  'th', 'gu', 'fa', 'pl', 'kn', 'my', 'nl', 'uk', 'ro', 'el',
  'cs', 'sv', 'hu', 'he', 'id', 'fil', 'sw', 'sr', 'sk',
  'zh-CN', 'zh-TW', 'pt-PT', 'pt-BR',
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  ar: 'العربية',
  pt: 'Português',
  bn: 'বাংলা',
  ru: 'Русский',
  ja: '日本語',
  pa: 'ਪੰਜਾਬੀ',
  de: 'Deutsch',
  ms: 'Melayu',
  vi: 'Tiếng Việt',
  ko: '한국어',
  fr: 'Français',
  mr: 'मराठी',
  ta: 'தமிழ்',
  ur: 'اردو',
  tr: 'Türkçe',
  it: 'Italiano',
  th: 'ไทย',
  gu: 'ગુજરાતી',
  fa: 'فارسی',
  pl: 'Polski',
  kn: 'ಕನ್ನಡ',
  my: 'မြန်မာ',
  nl: 'Nederlands',
  uk: 'Українська',
  ro: 'Română',
  el: 'Ελληνικά',
  cs: 'Čeština',
  sv: 'Svenska',
  hu: 'Magyar',
  he: 'עברית',
  id: 'Indonesia',
  fil: 'Filipino',
  sw: 'Kiswahili',
  sr: 'Српски',
  sk: 'Slovenčina',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'pt-PT': 'Português (Portugal)',
  'pt-BR': 'Português (Brasil)',
}

const DEFAULT_LOCALE: Locale = 'en'
const STORAGE_KEY = 'chart-workshop-locale'

// ---- Translation message type ----
type Messages = Record<string, unknown>

// ---- Cache loaded messages ----
const messageCache = new Map<string, Messages>()

async function loadMessages(locale: string): Promise<Messages> {
  if (messageCache.has(locale)) return messageCache.get(locale)!
  try {
    // Dynamic import so webpack code-splits per locale
    const mod = await import(`./locales/${locale}.json`)
    const msgs = mod.default as Messages
    messageCache.set(locale, msgs)
    return msgs
  } catch {
    // Fall back to base language (e.g. 'zh-CN' → 'zh', 'pt-BR' → 'pt')
    const base = locale.split('-')[0]
    if (base !== locale && messageCache.has(base)) return messageCache.get(base)!
    if (base !== locale) {
      try {
        const mod = await import(`./locales/${base}.json`)
        const msgs = mod.default as Messages
        messageCache.set(base, msgs)
        return msgs
      } catch {
        // fall through to default
      }
    }
    // Fall back to English
    if (!messageCache.has(DEFAULT_LOCALE)) {
      const mod = await import(`./locales/${DEFAULT_LOCALE}.json`)
      messageCache.set(DEFAULT_LOCALE, mod.default as Messages)
    }
    return messageCache.get(DEFAULT_LOCALE)!
  }
}

// ---- Resolve a dotted key path in the messages object ----
function resolveKey(messages: Messages, key: string): string | undefined {
  const parts = key.split('.')
  let cur: unknown = messages
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return typeof cur === 'string' ? cur : undefined
}

// ---- Interpolate {placeholder} values ----
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

// ---- Context ----
interface I18nContextValue {
  locale: string
  messages: Messages
  loading: boolean
  setLocale: (locale: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  messages: {},
  loading: true,
  setLocale: () => {},
  t: (key) => key,
})

/** Detect the best matching locale from the browser. */
function detectBrowserLocale(): string {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const langs = navigator.languages ?? [navigator.language]
  for (const lang of langs) {
    const lower = lang.toLowerCase()
    // Exact match (e.g. 'zh-cn', 'pt-br')
    if (SUPPORTED_LOCALES.includes(lower as Locale)) return lower
    // Try base language (e.g. 'zh' from 'zh-CN')
    const base = lower.split('-')[0]
    if (SUPPORTED_LOCALES.includes(base as Locale)) return base
  }
  return DEFAULT_LOCALE
}

/** Read the `?lang=` query param. Returns the locale string or null. */
function getLangFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const lang = params.get('lang')
  if (!lang) return null
  const lower = lang.toLowerCase()
  if (SUPPORTED_LOCALES.includes(lower as Locale)) return lower
  const base = lower.split('-')[0]
  if (SUPPORTED_LOCALES.includes(base as Locale)) return base
  return null
}

/** Update the URL's `?lang=` param without triggering a navigation/reload. */
function updateUrlLang(locale: string) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('lang', locale)
  window.history.replaceState(window.history.state, '', url.toString())
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<string>(DEFAULT_LOCALE)
  const [messages, setMessages] = React.useState<Messages>({})
  const [loading, setLoading] = React.useState(true)

  // Initial load — priority: URL ?lang= param > stored preference > browser detection
  React.useEffect(() => {
    const urlLang = getLangFromUrl()
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const initial = urlLang ?? stored ?? detectBrowserLocale()
    setLocaleState(initial)
    // If URL had no ?lang=, add it for shareability
    if (!urlLang) {
      updateUrlLang(initial)
    }
  }, [])

  // Load messages whenever locale changes
  React.useEffect(() => {
    if (!locale) return
    let cancelled = false
    setLoading(true)
    loadMessages(locale).then((msgs) => {
      if (cancelled) return
      setMessages(msgs)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [locale])

  // Sync URL ?lang= whenever locale changes
  React.useEffect(() => {
    if (locale && locale !== DEFAULT_LOCALE) {
      updateUrlLang(locale)
    }
  }, [locale])

  // Listen for browser back/forward to update locale from URL
  React.useEffect(() => {
    const handlePopState = () => {
      const urlLang = getLangFromUrl()
      if (urlLang && urlLang !== locale) {
        setLocaleState(urlLang)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [locale])

  const setLocale = React.useCallback((newLocale: string) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // ignore
    }
    updateUrlLang(newLocale)
  }, [])

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const template = resolveKey(messages, key)
      if (template === undefined) {
        // Fall back to English cache if available
        const enMsgs = messageCache.get(DEFAULT_LOCALE)
        if (enMsgs) {
          const fallback = resolveKey(enMsgs, key)
          if (fallback !== undefined) return interpolate(fallback, params)
        }
        return key
      }
      return interpolate(template, params)
    },
    [messages],
  )

  const value: I18nContextValue = {
    locale,
    messages,
    loading,
    setLocale,
    t,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Hook to access the i18n context. */
export function useI18n() {
  return React.useContext(I18nContext)
}

/** Convenience hook that returns just the `t` function. */
export function useT() {
  return React.useContext(I18nContext).t
}
