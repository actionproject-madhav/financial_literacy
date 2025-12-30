/**
 * Hook to translate lesson step content (questions, options, explanations)
 * Automatically translates when language changes
 */

import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5173'

interface QuizStep {
  type: 'quiz'
  question: string
  options: string[]
  correct: number
  explanation: string
  itemId?: string
  kcId?: string
}

interface TranslatedStep extends QuizStep {
  _original?: QuizStep
}

export const useTranslateStep = (originalStep: QuizStep | null): TranslatedStep | null => {
  const { language: selectedLanguage } = useLanguage()
  const [translatedStep, setTranslatedStep] = useState<TranslatedStep | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!originalStep) {
      setTranslatedStep(null)
      return
    }

    // If English, return original
    if (selectedLanguage === 'en') {
      setTranslatedStep(originalStep)
      return
    }

    // Translate to selected language
    const translateStep = async () => {
      setIsTranslating(true)
      
      try {
        // Translate question
        const questionRes = await fetch(`${API_BASE}/api/translate/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: originalStep.question,
            target_language: selectedLanguage,
            context: 'financial literacy question'
          })
        })
        const questionData = await questionRes.json()

        // Translate all options in parallel
        const optionsPromises = originalStep.options.map(async (option, index) => {
          const res = await fetch(`${API_BASE}/api/translate/content`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: option,
              target_language: selectedLanguage,
              context: `answer choice ${index + 1}`
            })
          })
          const data = await res.json()
          return data.translated_text
        })
        const translatedOptions = await Promise.all(optionsPromises)

        // Translate explanation
        const explanationRes = await fetch(`${API_BASE}/api/translate/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: originalStep.explanation,
            target_language: selectedLanguage,
            context: 'question explanation'
          })
        })
        const explanationData = await explanationRes.json()

        // Create translated step
        const translated: TranslatedStep = {
          ...originalStep,
          question: questionData.translated_text,
          options: translatedOptions,
          explanation: explanationData.translated_text,
          _original: originalStep
        }

        setTranslatedStep(translated)
      } catch (error) {
        console.error('Translation error:', error)
        // Fallback to original
        setTranslatedStep(originalStep)
      } finally {
        setIsTranslating(false)
      }
    }

    translateStep()
  }, [originalStep, selectedLanguage])

  return translatedStep
}

