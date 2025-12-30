/**
 * Language Context for FinLit
 * 
 * Provides language state and translation function to all components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LanguageCode, SUPPORTED_LANGUAGES, getInitialLanguage, saveLanguagePreference } from '../i18n/config'
import { t as translate } from '../i18n/translations'

interface LanguageContextType {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  t: (key: string) => string
  languageConfig: typeof SUPPORTED_LANGUAGES[LanguageCode]
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage())

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang)
    saveLanguagePreference(lang)
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang
    document.documentElement.dir = SUPPORTED_LANGUAGES[lang].direction
  }

  const t = (key: string) => translate(key, language)

  const languageConfig = SUPPORTED_LANGUAGES[language]

  // Set initial HTML attributes
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = languageConfig.direction
  }, [language, languageConfig.direction])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageConfig }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

