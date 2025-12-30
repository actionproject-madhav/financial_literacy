/**
 * Language Selector Component
 * 
 * Dropdown to switch between supported languages
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n/config'

export const LanguageSelector = () => {
  const { language, setLanguage, languageConfig } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
        aria-label="Select language"
      >
        <img
          src={languageConfig.flag}
          alt={languageConfig.name}
          className="w-6 h-4 rounded object-cover shadow-sm"
        />
        <span className="text-sm font-bold text-gray-700 hidden sm:inline">
          {languageConfig.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden z-[100]"
          >
            {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all border-b border-gray-100 last:border-b-0 ${
                  language === lang.code ? 'bg-green-50 hover:bg-green-100' : ''
                }`}
                aria-label={`Switch to ${lang.name}`}
              >
                <img
                  src={lang.flag}
                  alt={lang.name}
                  className="w-7 h-5 rounded object-cover shadow-sm"
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-gray-800">{lang.nativeName}</div>
                  <div className="text-xs text-gray-500">{lang.name}</div>
                </div>
                {language === lang.code && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

