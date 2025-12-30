/**
 * Hook to translate content dynamically
 * Translates questions, descriptions, and other content to user's selected language
 */

import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')

// In-memory cache
const translationCache: Record<string, string> = {}

export const useTranslateContent = (text: string | undefined, context?: string) => {
  const { language } = useLanguage()
  const [translated, setTranslated] = useState(text || '')
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!text) {
      setTranslated('')
      return
    }

    // If English, return as-is
    if (language === 'en') {
      setTranslated(text)
      return
    }

    // Check cache
    const cacheKey = `${language}:${text}`
    if (translationCache[cacheKey]) {
      setTranslated(translationCache[cacheKey])
      return
    }

    // Translate
    const translateText = async () => {
      setIsTranslating(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/translate/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            target_language: language,
            context: context || 'financial_literacy'
          })
        })

        if (response.ok) {
          const data = await response.json()
          translationCache[cacheKey] = data.translated
          setTranslated(data.translated)
        } else {
          // Fallback to original text
          setTranslated(text)
        }
      } catch (error) {
        console.error('Translation error:', error)
        setTranslated(text)
      } finally {
        setIsTranslating(false)
      }
    }

    translateText()
  }, [text, language, context])

  return { translated, isTranslating }
}

// Hook for translating arrays of text
export const useTranslateBatch = (texts: string[], context?: string) => {
  const { language } = useLanguage()
  const [translations, setTranslations] = useState<string[]>(texts)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!texts || texts.length === 0) {
      setTranslations([])
      return
    }

    // If English, return as-is
    if (language === 'en') {
      setTranslations(texts)
      return
    }

    // Translate batch
    const translateBatch = async () => {
      setIsTranslating(true)
      try {
        const response = await fetch(`${API_BASE_URL}/api/translate/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts,
            target_language: language,
            context: context || 'financial_literacy'
          })
        })

        if (response.ok) {
          const data = await response.json()
          setTranslations(data.translations)
        } else {
          setTranslations(texts)
        }
      } catch (error) {
        console.error('Batch translation error:', error)
        setTranslations(texts)
      } finally {
        setIsTranslating(false)
      }
    }

    translateBatch()
  }, [texts, language, context])

  return { translations, isTranslating }
}

