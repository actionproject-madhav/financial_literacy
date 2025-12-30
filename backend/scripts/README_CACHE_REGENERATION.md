# Cache Regeneration Guide

## Problem
The existing Nepali and Spanish TTS cache was generated from **English text** (before translation was implemented). This means the audio is in English, not the target language.

## Solution

### Step 1: Clear Incorrect Cache
```bash
cd backend
python3 scripts/clear_incorrect_tts_cache.py
```

This will:
- Remove Nepali (`ne`) TTS cache
- Remove Spanish (`es`) TTS cache
- Keep English (`en`) cache (it's correct)

**Note:** You'll be prompted to confirm before clearing.

### Step 2: Regenerate Cache with Translation
```bash
python3 scripts/pre_generate_cache.py
```

This will:
- ✅ **Skip already cached items** (safe to run multiple times)
- ✅ **Translate text first** before generating TTS (for non-English languages)
- ✅ **Resume from where it left off** if quota is exceeded (just update API key and run again)

## How It Works

1. **Cache Check**: The script checks if TTS already exists for each item/language
2. **Skip if Cached**: If cache exists, it's skipped (no API calls)
3. **Translate First**: For non-English languages, text is translated before TTS generation
4. **Generate TTS**: ElevenLabs generates audio from the translated text
5. **Save to Cache**: Audio is saved to database for future use

## Safety Features

- ✅ **Idempotent**: Safe to run multiple times (skips cached items)
- ✅ **Resumable**: If quota runs out, update API key and run again
- ✅ **Progress Tracking**: Shows what's cached vs. what needs generation
- ✅ **Error Handling**: Gracefully handles quota/rate limit errors

## Expected Output

```
🔑 Checking API keys...
   ✅ ElevenLabs API key found: sk-xxxxx...xxxx
   ✅ OpenAI API key found: sk-xxxxx...xxxx

🚀 Pre-generating cache for all learning items...

[1/106] Processing multiple_choice item 69504d4f97541cde5eb22c70...
  ⏭️  Already cached: stem(en), choice0(en), choice1(en)...
  🎤 Generating: stem(ne), stem(es), choice0(ne)...
🎤 Generating TTS: 69504d4f97541cde5eb22c70 stem (ne)...
   ✅ Translated to ne: संयुक्त राज्य अमेरिकामा...
💾 Saved TTS to cache: 69504d4f97541cde5eb22c70 (ne)
  ✅ Done
```

## Cost Estimate

For ~106 items × 3 languages × (1 question + 4 choices) = ~1,590 TTS generations
- ElevenLabs: ~$5-10 (depends on text length)
- OpenAI (translation): ~$1-2

**Total: ~$6-12 one-time cost**

After this, all future requests use cache (100% cache hit = $0 cost).

