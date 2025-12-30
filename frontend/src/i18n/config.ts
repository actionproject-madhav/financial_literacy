/**
 * i18n Configuration for FinLit
 * 
 * MVP: English, Spanish, Nepali
 * Scalable to 29+ languages via ElevenLabs
 */

export type LanguageCode = 'en' | 'es' | 'ne'

export interface LanguageConfig {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
  elevenLabsCode: string  // ElevenLabs API code
  direction: 'ltr' | 'rtl'
}

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'https://flagcdn.com/w40/us.png',
    elevenLabsCode: 'eng',
    direction: 'ltr'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: 'https://flagcdn.com/w40/es.png',
    elevenLabsCode: 'spa',
    direction: 'ltr'
  },
  ne: {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    flag: 'https://flagcdn.com/w40/np.png',
    elevenLabsCode: 'nep',
    direction: 'ltr'
  }
}

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

// Get browser language or default
export const getInitialLanguage = (): LanguageCode => {
  const stored = localStorage.getItem('finlit_language') as LanguageCode
  if (stored && SUPPORTED_LANGUAGES[stored]) {
    return stored
  }

  const browserLang = navigator.language.split('-')[0] as LanguageCode
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang
  }

  return DEFAULT_LANGUAGE
}

// Save language preference
export const saveLanguagePreference = (lang: LanguageCode) => {
  localStorage.setItem('finlit_language', lang)
}

