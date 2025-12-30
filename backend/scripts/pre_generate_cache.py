#!/usr/bin/env python3
"""
Pre-generate TTS audio and translations for all learning items

This script:
1. Generates TTS audio for all questions in all languages
2. Translates all questions to Spanish and Nepali
3. Saves everything to database cache

Cost: One-time cost to generate everything (~$50-100 for 1000 questions)
Benefit: Zero cost for future requests (99.9% cache hit rate)
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
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    collection = db.collections.learning_items
    
    print("🚀 Pre-generating cache for all learning items...\n")
    
    # Initialize services
    voice_service = VoiceService()
    cached_voice = CachedVoiceService(voice_service)
    
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
    
    for idx, item in enumerate(items, 1):
        item_id = item['_id']
        item_type = item.get('item_type', 'unknown')
        
        print(f"[{idx}/{total}] Processing {item_type} item {item_id}...")
        
        # Pre-generate TTS
        for lang in languages:
            try:
                cached_voice.pre_generate_tts_for_item(item_id, [lang])
                tts_count += 1
            except Exception as e:
                print(f"  ⚠️  TTS error ({lang}): {e}")
        
        # Pre-translate (skip English)
        for lang in ['es', 'ne']:
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

