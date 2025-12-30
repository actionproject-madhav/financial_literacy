# FinLit Internationalization (i18n) Strategy

## Overview

FinLit supports **English, Spanish, and Nepali** with a scalable architecture to add 29+ languages.

## Architecture

### 1. **UI Translations** (Static)
- **What**: Buttons, labels, navigation, error messages
- **How**: Stored in `translations.ts`
- **When**: Loaded instantly, no API calls

### 2. **Content Translation** (Dynamic)
- **What**: Questions, lessons, explanations
- **How**: Translated on-demand via LLM API
- **When**: First request, then cached

### 3. **Voice** (Automatic)
- **What**: Text-to-Speech and Speech-to-Text
- **How**: ElevenLabs handles translation automatically
- **When**: Real-time during lessons

---

## For MVP (Current)

### Content Strategy
✅ **Store content in English only**
- All 154+ questions stay in English
- No duplication needed
- Single source of truth

✅ **Translate UI elements**
- Navigation, buttons, labels → `translations.ts`
- ~100 strings translated manually
- High quality, instant loading

✅ **Voice auto-translates**
- ElevenLabs TTS: Speaks in user's language
- ElevenLabs STT: Understands user's language
- No extra work needed

### Why This Works
1. **Fast MVP launch** - No need to translate 154 questions
2. **Consistent quality** - Professional UI translations
3. **Cost effective** - Only translate when needed
4. **Easy updates** - Change English, all languages update

---

## For Scale (Later)

### Phase 1: LLM Translation (Month 1-3)
```typescript
// When user selects Spanish, translate on-demand
const translatedQuestion = await translateContent({
  text: question.stem,
  from: 'en',
  to: 'es',
  context: 'financial_literacy',
  preserve: ['APR', 'FDIC', 'IRS'] // Don't translate acronyms
})

// Cache in database
await cacheTranslation(question.id, 'es', translatedQuestion)
```

**Cost**: ~$0.50 per 1000 questions (GPT-4o-mini)

### Phase 2: Professional Translation (Month 3-6)
- Hire native speakers for critical content
- Review LLM translations
- Store in database permanently

### Phase 3: Cultural Adaptation (Month 6+)
- Localize examples (e.g., "SSN" → "NIE" for Spain)
- Adjust currency ($ → € → रू)
- Visa-specific content per country

---

## How to Use

### In Components

```typescript
import { useLanguage } from '../contexts/LanguageContext'

function MyComponent() {
  const { t, language, setLanguage } = useLanguage()
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button onClick={() => setLanguage('es')}>
        {t('common.continue')}
      </button>
    </div>
  )
}
```

### Add New Translation

1. **Add to `translations.ts`**:
```typescript
export const translations = {
  en: {
    'my.new.key': 'Hello World'
  },
  es: {
    'my.new.key': 'Hola Mundo'
  },
  ne: {
    'my.new.key': 'नमस्ते संसार'
  }
}
```

2. **Use in component**:
```typescript
const { t } = useLanguage()
<p>{t('my.new.key')}</p>
```

### Add New Language

1. **Update `config.ts`**:
```typescript
export type LanguageCode = 'en' | 'es' | 'ne' | 'hi' // Add 'hi'

export const SUPPORTED_LANGUAGES = {
  // ... existing
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: 'https://flagcdn.com/w40/in.png',
    elevenLabsCode: 'hin',
    direction: 'ltr'
  }
}
```

2. **Add translations in `translations.ts`**:
```typescript
export const translations = {
  // ... existing
  hi: {
    'nav.learn': 'सीखें',
    'nav.practice': 'अभ्यास',
    // ... all keys
  }
}
```

---

## Voice Integration

### ElevenLabs Language Codes

| Language | Code | ElevenLabs |
|----------|------|------------|
| English  | `en` | `eng` |
| Spanish  | `es` | `spa` |
| Nepali   | `ne` | `nep` |
| Hindi    | `hi` | `hin` |
| French   | `fr` | `fra` |
| German   | `de` | `deu` |
| Chinese  | `zh` | `zho` |

**29 languages supported** - see [ElevenLabs docs](https://elevenlabs.io/docs/speech-to-text/supported-languages)

### Usage in Lessons

```typescript
// Automatically uses user's selected language
const { languageConfig } = useLanguage()

// For TTS (text-to-speech)
const audio = await voiceApi.getTTS(itemId, languageConfig.elevenLabsCode)

// For STT (speech-to-text)
const result = await voiceApi.submitVoiceAnswer({
  audio_base64: audioData,
  language_hint: languageConfig.elevenLabsCode
})
```

---

## Content Translation API (Future)

### Backend Endpoint
```python
@app.route('/api/content/translate', methods=['POST'])
def translate_content():
    """
    Translate learning content with context preservation
    
    Request:
    {
        "content_id": "question_123",
        "content_type": "question",
        "target_language": "es",
        "preserve_terms": ["APR", "FDIC"]
    }
    
    Response:
    {
        "translated": {
            "stem": "¿Qué es APR?",
            "choices": ["...", "...", "..."],
            "explanation": "..."
        },
        "cached": false,
        "cost": 0.0005
    }
    """
```

### Caching Strategy
```python
# Cache structure
{
    "content_id": "question_123",
    "language": "es",
    "translated_at": "2025-01-01T00:00:00Z",
    "translated_by": "gpt-4o-mini",
    "reviewed": false,
    "content": {...}
}
```

---

## Cost Analysis

### MVP (Current)
- **UI Translations**: $0 (manual, one-time)
- **Voice**: $0.0043/min (ElevenLabs)
- **Total**: ~$10/month for 100 active users

### Scale (1000 users)
- **UI**: $0 (already done)
- **Content Translation**: $50 one-time (cache all questions)
- **Voice**: $430/month (100 min/user/month)
- **Total**: $480/month

### Optimization
1. **Cache aggressively** - Translate once, serve forever
2. **Batch translations** - Translate all questions overnight
3. **Use local TTS** for common phrases (free)
4. **Lazy load** - Only translate what users access

---

## Testing

### Manual Testing
1. Change language in UI
2. Verify all labels translate
3. Test voice in each language
4. Check RTL support (if adding Arabic/Hebrew)

### Automated Testing
```typescript
describe('i18n', () => {
  it('should translate all keys', () => {
    const keys = Object.keys(translations.en)
    expect(Object.keys(translations.es)).toEqual(keys)
    expect(Object.keys(translations.ne)).toEqual(keys)
  })
  
  it('should persist language preference', () => {
    setLanguage('es')
    expect(localStorage.getItem('finlit_language')).toBe('es')
  })
})
```

---

## Best Practices

### DO ✅
- Keep UI strings in `translations.ts`
- Use semantic keys (`nav.learn` not `learn_button`)
- Test with real native speakers
- Cache translated content
- Preserve financial terms (APR, FDIC, etc.)

### DON'T ❌
- Hardcode strings in components
- Use Google Translate for financial content
- Translate acronyms (SSN, IRS, etc.)
- Forget to update all languages when adding keys
- Ignore RTL languages (if adding Arabic/Hebrew)

---

## Roadmap

### Q1 2025 (MVP)
- ✅ English, Spanish, Nepali UI
- ✅ Voice in all 3 languages
- ✅ Language selector component

### Q2 2025 (Scale)
- [ ] LLM content translation (on-demand)
- [ ] Translation caching
- [ ] Add Hindi, French, Chinese

### Q3 2025 (Polish)
- [ ] Professional translation review
- [ ] Cultural adaptation
- [ ] Add 10 more languages

### Q4 2025 (Global)
- [ ] 29 languages supported
- [ ] Regional variants (es-MX, es-ES)
- [ ] Localized examples per country

---

## Support

For questions or issues:
1. Check this README
2. See `translations.ts` for available keys
3. Test with `LanguageSelector` component
4. Ask in #i18n Slack channel

