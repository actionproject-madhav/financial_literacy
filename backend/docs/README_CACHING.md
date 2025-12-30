# TTS Audio Caching Guide

## Quick Start

### Step 1: One-Time Database Setup (Run Once)
```bash
cd financial_literacy/backend
python3 scripts/add_audio_cache_fields.py
```
**What it does:** Adds `tts_cache` and `translations` fields to your database schema.  
**When to run:** Only once, before you start caching audio.

### Step 2: Generate & Cache Audio (Run This for ElevenLabs)
```bash
cd financial_literacy/backend
python3 scripts/pre_generate_cache.py
```
**What it does:** 
- Generates TTS audio using **ElevenLabs** for all questions
- Caches audio in database (skips already cached items)
- Translates text using OpenAI GPT-4o-mini

**When to run:** 
- First time: To generate all audio
- After adding new questions: To cache new questions
- After quota runs out: Run again with new API key (skips cached items)

---

## Scripts Explained

### `add_audio_cache_fields.py` 
- **Purpose:** Database schema setup (one-time)
- **Does NOT generate audio**
- **Run once** before caching

### `pre_generate_cache.py` ⭐ **USE THIS FOR ELEVENLABS**
- **Purpose:** Generate and cache TTS audio
- **Uses ElevenLabs** for TTS
- **Uses OpenAI** for translations
- **Skips already cached items** (safe to run multiple times)

---

## Workflow Example

```bash
# 1. First time setup (one-time)
python3 scripts/add_audio_cache_fields.py

# 2. Generate audio (uses ElevenLabs credits)
python3 scripts/pre_generate_cache.py
# ... runs out of credits at item 15/94 ...

# 3. Update API key in .env
# Edit .env: ELEVENLABS_API_KEY=sk-new-key...

# 4. Run again (skips items 1-15, continues from 16)
python3 scripts/pre_generate_cache.py
```

---

## What Gets Cached?

- **TTS Audio (ElevenLabs):**
  - Question stem in 3 languages (en, es, ne)
  - Answer choices in 3 languages
  - Stored in `tts_cache` field

- **Translations (OpenAI):**
  - Question stem → Spanish, Nepali
  - Answer choices → Spanish, Nepali
  - Explanations → Spanish, Nepali
  - Stored in `translations` field

---

## Cost Savings

- **First run:** ~$50-100 for 1000 questions (one-time)
- **Future requests:** $0 (100% cache hit rate)
- **After caching:** Users get instant audio with zero API costs

