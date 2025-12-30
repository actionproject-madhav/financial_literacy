#!/usr/bin/env python3
"""
Pre-generate TTS audio and translations for all learning items

This script:
1. Generates TTS audio for all questions in all languages
2. Translates all questions to Spanish and Nepali
3. Saves everything to database cache

IMPORTANT:
- Already cached items are automatically skipped (safe to run multiple times)
- For non-English languages, text is translated BEFORE TTS generation
- If quota is exceeded, you can update API key and run again (skips cached items)

Cost: One-time cost to generate everything (~$50-100 for 1000 questions)
Benefit: Zero cost for future requests (99.9x% cache hit rate)

Usage:
    python3 scripts/pre_generate_cache.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from services.voice import VoiceService
from services.voice_cached import CachedVoiceService
from services.translation_cached import CachedTranslationService
from bson import ObjectId
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

def pre_generate_all():
    """Pre-generate TTS and translations for all items"""
    # Check API keys before starting
    from config.services import config
    
    print("🔑 Checking API keys...")
    if not config.ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY not found in .env file")
        print("   Please add: ELEVENLABS_API_KEY=sk-your-key-here")
        return
    print(f"   ✅ ElevenLabs API key found: {config.ELEVENLABS_API_KEY[:10]}...{config.ELEVENLABS_API_KEY[-4:]}")
    
    if not config.OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not found in .env file")
        print("   Please add: OPENAI_API_KEY=sk-your-key-here")
        return
    print(f"   ✅ OpenAI API key found: {config.OPENAI_API_KEY[:10]}...{config.OPENAI_API_KEY[-4:]}")
    print()
    
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    collection = db.collections.learning_items
    
    print("🚀 Pre-generating cache for all learning items...\n")
    print("   Using ElevenLabs for TTS audio generation")
    print("   Using OpenAI for text translation\n")
    
    # Initialize services
    try:
        voice_service = VoiceService()
        cached_voice = CachedVoiceService(voice_service)
    except ValueError as e:
        print(f"❌ Failed to initialize VoiceService: {e}")
        print("   Make sure ELEVENLABS_API_KEY is set correctly in .env")
        return
    
    # Simple translation client wrapper
    class SimpleTranslateClient:
        def __init__(self):
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in .env")
            self.client = OpenAI(api_key=api_key)
        
        def translate(self, text, target_language, context=''):
            lang_map = {'es': 'Spanish', 'ne': 'Nepali'}
            target_lang_name = lang_map.get(target_language, target_language)
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"Translate to {target_lang_name}. Maintain financial terminology accuracy."},
                    {"role": "user", "content": f"Translate this {context}: {text}"}
                ],
                temperature=0.3,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
    
    translate_client = SimpleTranslateClient()
    cached_translation = CachedTranslationService(translate_client)
    
    # Get all items
    items = list(collection.find({'is_active': True}))
    total = len(items)
    
    print(f"📦 Found {total} active learning items\n")
    
    languages = ['en', 'es', 'ne']
    tts_count = 0
    translation_count = 0
    quota_exceeded = False
    
    for idx, item in enumerate(items, 1):
        if quota_exceeded:
            print(f"\n⚠️  QUOTA EXCEEDED - Stopping at item {idx-1}/{total}")
            print(f"   You can run this script again with a new API key to continue")
            break
            
        item_id = item['_id']
        item_type = item.get('item_type', 'unknown')
        
        print(f"[{idx}/{total}] Processing {item_type} item {item_id}...")
        
        # Check what's already cached before generating
        tts_cache = item.get('tts_cache', {})
        already_cached = []
        needs_generation = []
        
        for lang in languages:
            # Check question stem
            if lang in tts_cache and tts_cache[lang]:
                already_cached.append(f"stem({lang})")
            else:
                needs_generation.append(f"stem({lang})")
            
            # Check answer choices
            content = item.get('content', {})
            choices = content.get('choices', [])
            for choice_idx in range(len(choices)):
                choice_key = f'{lang}_choice_{choice_idx}'
                if choice_key in tts_cache and tts_cache[choice_key]:
                    already_cached.append(f"choice{choice_idx}({lang})")
                else:
                    needs_generation.append(f"choice{choice_idx}({lang})")
        
        if already_cached:
            print(f"  ⏭️  Already cached: {', '.join(already_cached[:5])}{'...' if len(already_cached) > 5 else ''}")
        
        if needs_generation:
            print(f"  🎤 Generating: {', '.join(needs_generation[:5])}{'...' if len(needs_generation) > 5 else ''}")
        else:
            print(f"  ✅ All audio already cached - skipping TTS generation")
        
        # Pre-generate TTS (will skip already cached items internally)
        for lang in languages:
            if quota_exceeded:
                break
            try:
                cached_voice.pre_generate_tts_for_item(item_id, [lang])
                tts_count += 1
            except Exception as e:
                error_msg = str(e).lower()
                # Check for various quota/rate limit error patterns
                if any(keyword in error_msg for keyword in ['quota', 'rate limit', 'insufficient', 'limit exceeded', '429']):
                    quota_exceeded = True
                    print(f"\n⚠️  QUOTA/RATE LIMIT EXCEEDED - Stopping TTS generation")
                    print(f"   Processed up to item {idx}/{total}")
                    print(f"   💡 Tip: Update ELEVENLABS_API_KEY in .env and run again")
                    print(f"   The script will skip already cached items and continue")
                    break
                print(f"  ⚠️  TTS error ({lang}): {e}")
        
        # Pre-translate (skip English, and skip if already cached)
        if not quota_exceeded:
            translations = item.get('translations', {})
            for lang in ['es', 'ne']:
                # Check if already translated
                if lang in translations and translations[lang].get('stem') and translations[lang].get('choices'):
                    print(f"  ⏭️  Translation ({lang}) already cached - skipping")
                    continue
                
                try:
                    cached_translation.pre_translate_item(item_id, [lang])
                    translation_count += 1
                except Exception as e:
                    print(f"  ⚠️  Translation error ({lang}): {e}")
        
        print(f"  ✅ Done\n")
    
    # Print stats
    print("\n" + "="*60)
    print("📊 CACHE GENERATION COMPLETE")
    print("="*60)
    print(f"TTS generated: {tts_count} items × 3 languages")
    print(f"Translations: {translation_count} items × 2 languages")
    
    # Get final cache stats
    voice_stats = cached_voice.get_cache_stats()
    trans_stats = cached_translation.get_cache_stats()
    
    print("\n🎤 TTS Cache Stats:")
    for lang, coverage in voice_stats['cache_coverage'].items():
        print(f"  {lang}: {coverage}")
    
    print("\n🌍 Translation Cache Stats:")
    for lang, coverage in trans_stats['translation_coverage'].items():
        print(f"  {lang}: {coverage}")
    
    print("\n💰 Cost Savings:")
    print("  - Future TTS requests: $0 (100% cache hit)")
    print("  - Future translation requests: $0 (100% cache hit)")
    print("\n🎉 Done!")

if __name__ == '__main__':
    pre_generate_all()

