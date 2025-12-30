# 🇳🇵 Nepali Voice Support Documentation

## Overview

FinLit fully supports Nepali language for both **Speech-to-Text (STT)** and **Text-to-Speech (TTS)** through ElevenLabs API.

## Language Codes

| Frontend | Backend | ElevenLabs API | Description |
|----------|---------|----------------|-------------|
| `ne` | `ne` / `nep` | `nep` | Nepali language |
| `en` | `en` / `eng` | `eng` | English |
| `es` | `es` / `spa` | `spa` | Spanish |

## Frontend Configuration

### Language Config (`src/i18n/config.ts`)

```typescript
ne: {
  code: 'ne',
  name: 'Nepali',
  nativeName: 'नेपाली',
  flag: 'https://flagcdn.com/w40/np.png',
  elevenLabsCode: 'nep',  // ← Used for voice APIs
  direction: 'ltr'
}
```

### Usage in LessonPage

```typescript
// Language configuration
const languages = {
  ne: { 
    name: 'Nepali', 
    nativeName: 'नेपाली', 
    flag: '🇳🇵',
    apiCode: 'nep'  // ← Sent to backend
  }
}

// Transcription
const result = await voiceApi.transcribe(audioBase64, currentLang.apiCode)
// Sends: { audio_base64: "...", language_hint: "nep" }

// TTS
const audio = await voiceApi.generateTTS(text, currentLang.apiCode)
// Sends: { text: "...", language: "nep" }
```

## Backend Configuration

### Voice Service (`services/voice.py`)

```python
class VoiceService:
    SUPPORTED_LANGUAGES = [
        'en', 'es', 'zh', 'hi', 'ne',  # ← Nepali included
        'ko', 'ja', 'ar', 'fr', 'pt'
    ]
    
    def transcribe(self, audio_base64: str, language_hint: str = None):
        """
        Transcribe audio with language hint
        
        Args:
            audio_base64: Base64 encoded audio
            language_hint: 'eng', 'spa', 'nep', etc.
        """
        result = transcribe_audio(
            audio_bytes=audio_bytes,
            language_code=language_hint or 'en'  # ← Passed to ElevenLabs
        )
```

### ElevenLabs Client (`services/elevenlabs_client.py`)

```python
# Voice mapping - Nepali uses multi-lingual voice
VOICE_MAP = {
    'en': '21m00Tcm4TlvDq8ikWAM',        # Rachel (US English)
    'es': 'XrExE9yKIg1WjnnlVkGX',        # Matilda (Multi-lingual)
    'ne': 'XrExE9yKIg1WjnnlVkGX',        # Matilda (Nepali) ← Same voice
    # ... other languages
}

def generate_speech(text: str, language: str = 'en'):
    """Generate speech in any supported language"""
    voice_id = VOICE_MAP.get(language, VOICE_MAP['en'])
    # ElevenLabs automatically detects language from text
    # Nepali text (नेपाली) → Nepali pronunciation
```

## API Endpoints

### 1. Transcribe Audio (STT)

**Endpoint:** `POST /api/adaptive/voice/transcribe`

**Request:**
```json
{
  "audio_base64": "base64_encoded_audio",
  "language_hint": "nep"
}
```

**Response:**
```json
{
  "transcription": "बैंकिङ मूल बातें",
  "confidence": 0.95,
  "detected_language": "nep",
  "duration_ms": 2500
}
```

### 2. Generate Speech (TTS)

**Endpoint:** `POST /api/adaptive/voice/tts`

**Request:**
```json
{
  "text": "नमस्ते! तपाईंलाई कस्तो छ?",
  "language": "nep",
  "voice": "XrExE9yKIg1WjnnlVkGX"
}
```

**Response:**
```json
{
  "audio_base64": "base64_encoded_mp3"
}
```

### 3. Voice Answer Submission

**Endpoint:** `POST /api/adaptive/interactions/voice`

**Request:**
```json
{
  "learner_id": "507f...",
  "item_id": "507f...",
  "session_id": "uuid",
  "audio_base64": "base64_audio",
  "language_hint": "nep"
}
```

**Response:**
```json
{
  "success": true,
  "is_correct": true,
  "transcription": "क्रेडिट स्कोर",
  "matched_choice": 2,
  "confidence": {
    "transcription": 0.95,
    "semantic_match": 0.92,
    "voice": 0.85
  }
}
```

## Testing

### Run Test Suite

```bash
cd backend
python3 scripts/test_nepali_voice.py
```

### Expected Output

```
🇳🇵 NEPALI VOICE SUPPORT TEST SUITE 🇳🇵

TEST 1: Nepali Text-to-Speech (TTS)
✅ TTS Success!
   Audio size: 45678 bytes
   Voice used: XrExE9yKIg1WjnnlVkGX

TEST 2: Nepali Speech-to-Text (STT)
✅ STT Success!
   Transcription: बैंकिङ मूल बातें
   Confidence: 0.95
   Detected language: nep

TEST 3: Language Code Support
✅ eng: 34567 bytes
✅ spa: 38901 bytes
✅ nep: 42345 bytes

TEST 4: VoiceService Integration
✅ Nepali ('ne') is supported
✅ Generated 61234 chars of base64 audio

🎉 ALL TESTS PASSED! Nepali voice support is working!
```

## User Flow

### 1. User Selects Nepali

```
User clicks language selector → Selects "नेपाली 🇳🇵"
  ↓
Frontend: selectedLanguage = 'ne'
  ↓
UI translates instantly (from translations.ts)
  ↓
Content translates via API (from translate.py)
```

### 2. Voice Recording

```
User clicks "RECORD" button
  ↓
Browser captures audio (Web Speech API)
  ↓
Frontend sends: { audio_base64: "...", language_hint: "nep" }
  ↓
Backend: VoiceService.transcribe(audio, language_hint='nep')
  ↓
ElevenLabs Scribe: Transcribes Nepali audio → "बैंकिङ मूल बातें"
  ↓
Backend: Semantic matching against correct answer
  ↓
Response: { is_correct: true, transcription: "..." }
```

### 3. Text-to-Speech

```
User clicks "Listen" button
  ↓
Frontend: voiceApi.generateTTS(text, 'nep')
  ↓
Backend: VoiceService.generate_speech(text, language='ne')
  ↓
ElevenLabs: Detects Nepali text → Uses Nepali pronunciation
  ↓
Response: { audio_base64: "..." }
  ↓
Frontend: Plays audio through <audio> element
```

## Cost Estimation

### ElevenLabs Pricing (as of 2024)

| Operation | Cost | Notes |
|-----------|------|-------|
| TTS | $0.30 per 1K characters | Nepali characters count as 1 char each |
| STT | $0.10 per minute | Real-time transcription |

### Example Usage

- **1000 users** × **10 voice questions/day** × **30 days**
  - TTS: 300K questions × 50 chars avg = 15M chars = **$4,500/month**
  - STT: 300K answers × 3 sec avg = 15K minutes = **$1,500/month**
  - **Total: ~$6,000/month**

### Optimization

- Cache TTS audio for common questions
- Use batch STT (`scribe_v1`) instead of real-time (`scribe_v2_realtime`)
- Implement rate limiting per user

## Troubleshooting

### Issue: "Invalid language code received: 'Nepali'"

**Cause:** Frontend sending language name instead of code

**Fix:** Use `currentLang.apiCode` instead of `currentLang.name`

```typescript
// ❌ Wrong
await voiceApi.transcribe(audio, currentLang.name)  // "Nepali"

// ✅ Correct
await voiceApi.transcribe(audio, currentLang.apiCode)  // "nep"
```

### Issue: Voice answer marked wrong despite correct Nepali answer

**Cause:** Semantic matching may struggle with Nepali embeddings

**Fix:** Ensure OpenAI embeddings support Nepali (they do!)

```python
# Backend: services/semantic_matcher.py
# OpenAI text-embedding-3-small supports 100+ languages including Nepali
embeddings = openai_client.embeddings.create(
    input=[nepali_text],
    model="text-embedding-3-small"
)
```

### Issue: Poor audio quality for Nepali

**Cause:** Voice settings not optimized

**Fix:** Adjust voice parameters in `elevenlabs_client.py`

```python
generate_speech(
    text=nepali_text,
    language='ne',
    stability=0.6,        # ← Increase for clearer pronunciation
    similarity_boost=0.8, # ← Increase for better quality
    style=0.2             # ← Reduce for more neutral tone
)
```

## Future Enhancements

1. **Native Nepali Voice**
   - Currently using multi-lingual voice (Matilda)
   - Consider cloning a native Nepali speaker's voice

2. **Dialect Support**
   - Add support for different Nepali dialects
   - Kathmandu vs. regional variations

3. **Code-Switching**
   - Handle Nepali-English mixed speech
   - Common in financial contexts

4. **Offline Support**
   - Cache common phrases
   - Implement on-device STT for basic commands

## References

- [ElevenLabs Language Support](https://elevenlabs.io/languages)
- [ElevenLabs Scribe Documentation](https://elevenlabs.io/docs/speech-to-text)
- [OpenAI Embeddings Multilingual](https://platform.openai.com/docs/guides/embeddings)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

**Last Updated:** December 29, 2025  
**Status:** ✅ Fully Implemented and Tested

