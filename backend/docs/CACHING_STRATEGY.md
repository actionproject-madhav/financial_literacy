# 💾 Database Caching Strategy for TTS & Translations

## Overview

Both **Text-to-Speech (TTS)** and **Translation** use **paid APIs**:
- **ElevenLabs TTS**: $0.30 per 1,000 characters
- **OpenAI Translation**: ~$0.15 per 1M tokens

**Without caching**, costs scale linearly with users. **With database caching**, we generate once and reuse forever.

## Current Setup

### APIs Used

1. **ElevenLabs TTS** (`services/voice.py`)
   - Cost: $0.30 per 1K characters
   - Example: "What is a bank?" (18 chars) = $0.0054 per request
   - 1000 users × 10 questions = $54/day without cache

2. **OpenAI GPT-4o-mini Translation** (`blueprints/translate.py`)
   - Cost: ~$0.15 per 1M tokens
   - Example: Translating a question (~50 tokens) = $0.0000075 per request
   - 1000 users × 10 questions × 3 languages = $0.225/day without cache

## Database Schema Changes

### Added Fields to `learning_items`

```javascript
{
  "_id": ObjectId("..."),
  "content": {
    "stem": "What is a bank?",
    "choices": ["A financial institution", ...],
    "explanation": "..."
  },
  
  // NEW: TTS Audio Cache
  "tts_cache": {
    "en": "data:audio/mp3;base64,iVBORw0KG...",  // English audio
    "es": "data:audio/mp3;base64,iVBORw0KG...",  // Spanish audio
    "ne": "data:audio/mp3;base64,iVBORw0KG..."   // Nepali audio
  },
  
  // NEW: Translation Cache
  "translations": {
    "es": {
      "stem": "¿Qué es un banco?",
      "choices": ["Una institución financiera", ...],
      "explanation": "..."
    },
    "ne": {
      "stem": "बैंक भनेको के हो?",
      "choices": ["एक वित्तीय संस्था", ...],
      "explanation": "..."
    }
  }
}
```

## Implementation

### 1. Migration Script

```bash
cd backend
python3 scripts/add_audio_cache_fields.py
```

This adds `tts_cache` and `translations` fields to all existing items.

### 2. Cached Services

**TTS Caching** (`services/voice_cached.py`):
```python
from services.voice_cached import CachedVoiceService
from services.voice import VoiceService

voice_service = VoiceService()
cached_voice = CachedVoiceService(voice_service)

# Get TTS (checks cache first)
audio = cached_voice.get_tts_for_item(item_id, language='ne')
```

**Translation Caching** (`services/translation_cached.py`):
```python
from services.translation_cached import CachedTranslationService

cached_translation = CachedTranslationService(translate_client)

# Get translation (checks cache first)
translated_stem = cached_translation.get_translation_for_item(
    item_id, language='ne', field='stem'
)
```

### 3. Pre-generation Script

Generate all TTS and translations upfront:

```bash
cd backend
python3 scripts/pre_generate_cache.py
```

This will:
- Generate TTS for all questions in all languages
- Translate all questions to Spanish and Nepali
- Save everything to database
- **One-time cost**: ~$50-100 for 1000 questions
- **Future cost**: $0 (100% cache hit)

## Cost Comparison

### Without Caching

| Scenario | TTS Cost/Day | Translation Cost/Day | Total/Day |
|----------|--------------|---------------------|-----------|
| 100 users, 5 questions | $0.27 | $0.001 | $0.27 |
| 1,000 users, 10 questions | $54.00 | $0.225 | $54.23 |
| 10,000 users, 10 questions | $540.00 | $2.25 | $542.25 |

### With Caching (After Pre-generation)

| Scenario | TTS Cost/Day | Translation Cost/Day | Total/Day |
|----------|--------------|---------------------|-----------|
| 100 users, 5 questions | $0 | $0 | **$0** |
| 1,000 users, 10 questions | $0 | $0 | **$0** |
| 10,000 users, 10 questions | $0 | $0 | **$0** |

**Savings**: 100% after initial generation!

## Usage in API Endpoints

### Update TTS Endpoint

```python
# In blueprints/adaptive.py
from services.voice_cached import CachedVoiceService
from services.voice import VoiceService

@adaptive_bp.route('/voice/tts/<item_id>', methods=['GET'])
def get_tts_for_item(item_id):
    voice_service = VoiceService()
    cached_voice = CachedVoiceService(voice_service)
    
    language = request.args.get('language', 'en')
    audio = cached_voice.get_tts_for_item(item_id, language)
    
    if audio:
        return jsonify({
            'audio_base64': audio,
            'cached': True  # Always cached after pre-generation
        })
    return jsonify({'error': 'Failed to generate audio'}), 500
```

### Update Translation Endpoint

```python
# In blueprints/translate.py
from services.translation_cached import CachedTranslationService

@translate_bp.route('/item/<item_id>', methods=['GET'])
def get_item_translation(item_id):
    cached_translation = CachedTranslationService(translate_client)
    
    language = request.args.get('language', 'es')
    field = request.args.get('field', 'stem')
    
    translated = cached_translation.get_translation_for_item(
        item_id, language, field
    )
    
    if translated:
        return jsonify({
            'translated': translated,
            'cached': True
        })
    return jsonify({'error': 'Translation not found'}), 404
```

## Cache Management

### Check Cache Stats

```python
from services.voice_cached import CachedVoiceService
from services.translation_cached import CachedTranslationService

voice_service = VoiceService()
cached_voice = CachedVoiceService(voice_service)
cached_translation = CachedTranslationService(translate_client)

# Get stats
voice_stats = cached_voice.get_cache_stats()
trans_stats = cached_translation.get_cache_stats()

print(voice_stats)
# {
#   'total_items': 1000,
#   'cached_en': 1000,
#   'cached_es': 1000,
#   'cached_ne': 1000,
#   'cache_coverage': {'en': '100.0%', 'es': '100.0%', 'ne': '100.0%'}
# }
```

### Pre-generate for New Items

When adding new questions, automatically pre-generate:

```python
# After creating a new learning item
item_id = db.collections.create_learning_item(...)

# Pre-generate cache
cached_voice.pre_generate_tts_for_item(item_id, ['en', 'es', 'ne'])
cached_translation.pre_translate_item(item_id, ['es', 'ne'])
```

## Storage Considerations

### Database Size

- **TTS Audio**: ~3-5KB per question per language (base64 encoded)
- **Translations**: ~0.5KB per question per language
- **Total per question**: ~10-15KB (all languages)

For 1000 questions:
- TTS: ~15MB
- Translations: ~1MB
- **Total**: ~16MB (negligible)

### MongoDB Limits

- Document size limit: 16MB
- With 1000 questions, each item is well under limit
- If needed, can use GridFS for very large audio files

## Migration Steps

1. **Add cache fields**:
   ```bash
   python3 scripts/add_audio_cache_fields.py
   ```

2. **Pre-generate cache** (one-time):
   ```bash
   python3 scripts/pre_generate_cache.py
   ```
   ⚠️ This will cost ~$50-100 in API calls

3. **Update API endpoints** to use cached services

4. **Monitor cache hit rate**:
   - Should be 99.9%+ after pre-generation
   - Any misses will auto-cache for future requests

## Benefits

✅ **Zero ongoing costs** for cached content  
✅ **Faster response times** (no API calls)  
✅ **Consistent audio** (same voice for same question)  
✅ **Offline capability** (can serve from cache)  
✅ **Scalable** (cost doesn't increase with users)  

## Future Enhancements

1. **Incremental updates**: Only cache new/changed items
2. **Version control**: Track cache versions
3. **CDN integration**: Serve audio from CDN
4. **Compression**: Compress audio before storing
5. **Lazy loading**: Generate on-demand, cache for future

---

**Status**: ✅ Implemented  
**Cost Savings**: 100% after pre-generation  
**Recommended**: Run pre-generation script before launch

