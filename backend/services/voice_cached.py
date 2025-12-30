"""
Cached Voice Service - TTS with database caching

Checks database cache first before calling ElevenLabs API
Saves generated audio to database for future use
"""

import base64
from typing import Optional, Dict
from datetime import datetime
from database import Database
from bson import ObjectId


class CachedVoiceService:
    """
    Voice service with database caching
    
    Cost savings:
    - Without cache: $0.30 per 1K characters per request
    - With cache: $0.30 per 1K characters (first time only)
    - Example: 1000 users × 10 questions × 50 chars = 500K chars
      - No cache: $150 per day
      - With cache: $0.15 per day (after initial generation)
    """
    
    def __init__(self, voice_service):
        """
        Args:
            voice_service: Base VoiceService instance (for API calls)
        """
        self.voice_service = voice_service
        self._db = None
    
    @property
    def db(self):
        """Lazy database connection"""
        if self._db is None:
            self._db = Database()
            if not self._db.is_connected:
                raise RuntimeError("Cannot connect to database. Check MONGO_URI in .env")
        return self._db
    
    def get_tts_for_choice(
        self,
        item_id: str,
        choice_index: int,
        language: str = 'en'
    ) -> Optional[str]:
        """
        Get TTS audio for a specific answer choice (cached)
        
        Args:
            item_id: Learning item ID
            choice_index: Index of the choice (0, 1, 2, 3)
            language: Language code (en, es, ne)
        
        Returns:
            Base64 encoded audio or None
        """
        item_id_obj = ObjectId(item_id) if isinstance(item_id, str) else item_id
        item = self.db.collections.learning_items.find_one({'_id': item_id_obj})
        if not item:
            return None
        
        # Check cache for this specific choice
        tts_cache = item.get('tts_cache', {})
        choice_key = f'{language}_choice_{choice_index}'
        
        if choice_key in tts_cache and tts_cache[choice_key]:
            print(f"✅ TTS cache hit: {item_id} choice {choice_index} ({language})")
            return tts_cache[choice_key]
        
        # Cache miss - generate audio
        print(f"🔄 TTS cache miss: {item_id} choice {choice_index} ({language}) - generating...")
        
        # Get choice text
        content = item.get('content', {})
        choices = content.get('choices', [])
        if choice_index >= len(choices):
            return None
        
        choice_text = choices[choice_index]
        
        # Translate choice text if language is not English
        if language != 'en':
            try:
                from services.translation_cached import CachedTranslationService
                from blueprints.translate import SimpleTranslateClient
                translate_client = SimpleTranslateClient()
                translation_service = CachedTranslationService(translate_client)
                translated_text = translation_service.get_translation_for_text(
                    item_id=str(item_id_obj),
                    text=choice_text,
                    language=language
                )
                if translated_text:
                    choice_text = translated_text
                    print(f"✅ Translated choice to {language}: {choice_text[:50]}...")
            except Exception as e:
                print(f"⚠️  Translation failed for choice, using original text: {e}")
        
        # Generate TTS
        audio_base64 = self.voice_service.generate_tts(choice_text, language)
        
        if audio_base64:
            # Save to cache
            self._save_choice_to_cache(item_id_obj, language, choice_index, audio_base64)
            return audio_base64
        
        return None
    
    def get_tts_for_item(
        self,
        item_id: str,
        language: str = 'en',
        text: Optional[str] = None
    ) -> Optional[str]:
        """
        Get TTS audio for a learning item (cached)
        
        Args:
            item_id: Learning item ID (string or ObjectId)
            language: Language code (en, es, ne)
            text: Optional text to use (if different from item content)
        
        Returns:
            Base64 encoded audio or None
        """
        # Convert string ID to ObjectId if needed
        item_id_obj = ObjectId(item_id) if isinstance(item_id, str) else item_id
        
        # Get item from database
        item = self.db.collections.learning_items.find_one({'_id': item_id_obj})
        if not item:
            return None
        
        # Check cache
        tts_cache = item.get('tts_cache', {})
        if language in tts_cache and tts_cache[language]:
            print(f"✅ TTS cache hit: {item_id} ({language})")
            return tts_cache[language]
        
        # Cache miss - generate audio
        print(f"🔄 TTS cache miss: {item_id} ({language}) - generating...")
        
        # Get text to speak
        if not text:
            content = item.get('content', {})
            if item.get('item_type') == 'multiple_choice':
                text = content.get('stem', '')
            else:
                text = str(content)
        
        if not text:
            return None
        
        # Translate text if language is not English
        if language != 'en':
            try:
                from services.translation_cached import CachedTranslationService
                from blueprints.translate import SimpleTranslateClient
                translate_client = SimpleTranslateClient()
                translation_service = CachedTranslationService(translate_client)
                translated_text = translation_service.get_translation_for_text(
                    item_id=str(item_id_obj),
                    text=text,
                    language=language
                )
                if translated_text:
                    text = translated_text
                    print(f"✅ Translated question to {language}: {text[:50]}...")
            except Exception as e:
                print(f"⚠️  Translation failed, using original text: {e}")
        
        # Generate TTS using base service
        audio_base64 = self.voice_service.generate_tts(text, language)
        
        if audio_base64:
            # Save to cache
            self._save_to_cache(item_id_obj, language, audio_base64)
            return audio_base64
        
        return None
    
    def _save_to_cache(self, item_id: str, language: str, audio_base64: str):
        """Save audio to database cache"""
        try:
            self.db.collections.learning_items.update_one(
                {'_id': item_id},
                {
                    '$set': {
                        f'tts_cache.{language}': audio_base64,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            print(f"💾 Saved TTS to cache: {item_id} ({language})")
        except Exception as e:
            print(f"⚠️  Failed to save TTS cache: {e}")
    
    def _save_choice_to_cache(self, item_id: str, language: str, choice_index: int, audio_base64: str):
        """Save answer choice audio to database cache"""
        try:
            choice_key = f'{language}_choice_{choice_index}'
            self.db.collections.learning_items.update_one(
                {'_id': item_id},
                {
                    '$set': {
                        f'tts_cache.{choice_key}': audio_base64,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            print(f"💾 Saved choice TTS to cache: {item_id} choice {choice_index} ({language})")
        except Exception as e:
            print(f"⚠️  Failed to save choice TTS cache: {e}")
    
    def pre_generate_tts_for_item(self, item_id: str, languages: list = ['en', 'es', 'ne']):
        """
        Pre-generate TTS for an item in multiple languages
        Includes: question stem + all answer choices
        
        Useful for:
        - Batch processing after adding new questions
        - Reducing latency for users
        - Cost optimization (generate once, use many times)
        """
        item_id_obj = ObjectId(item_id) if isinstance(item_id, str) else item_id
        item = self.db.collections.learning_items.find_one({'_id': item_id_obj})
        if not item:
            return
        
        content = item.get('content', {})
        
        # Generate TTS for question stem
        if item.get('item_type') == 'multiple_choice':
            stem_text = content.get('stem', '')
            choices = content.get('choices', [])
        else:
            stem_text = str(content)
            choices = []
        
        # Generate TTS for question stem
        for lang in languages:
            # Check if already cached
            tts_cache = item.get('tts_cache', {})
            if lang in tts_cache and tts_cache[lang]:
                print(f"⏭️  Skipping {item_id} stem ({lang}) - already cached")
            else:
                # Generate and cache question stem
                if stem_text:
                    print(f"🎤 Generating TTS: {item_id} stem ({lang})...")
                    
                    # Translate text if language is not English
                    text_to_speak = stem_text
                    if lang != 'en':
                        try:
                            from services.translation_cached import CachedTranslationService
                            from blueprints.translate import SimpleTranslateClient
                            translate_client = SimpleTranslateClient()
                            translation_service = CachedTranslationService(translate_client)
                            translated_text = translation_service.get_translation_for_text(
                                item_id=str(item_id_obj),
                                text=stem_text,
                                language=lang
                            )
                            if translated_text:
                                text_to_speak = translated_text
                                print(f"   ✅ Translated to {lang}: {text_to_speak[:50]}...")
                        except Exception as e:
                            print(f"   ⚠️  Translation failed, using original text: {e}")
                    
                    audio = self.voice_service.generate_tts(text_to_speak, lang)
                    if audio:
                        self._save_to_cache(item_id_obj, lang, audio)
            
            # Generate TTS for each answer choice
            for choice_idx, choice_text in enumerate(choices):
                choice_key = f'{lang}_choice_{choice_idx}'
                if choice_key in tts_cache and tts_cache[choice_key]:
                    print(f"⏭️  Skipping {item_id} choice {choice_idx} ({lang}) - already cached")
                else:
                    print(f"🎤 Generating TTS: {item_id} choice {choice_idx} ({lang})...")
                    
                    # Translate text if language is not English
                    text_to_speak = choice_text
                    if lang != 'en':
                        try:
                            from services.translation_cached import CachedTranslationService
                            from blueprints.translate import SimpleTranslateClient
                            translate_client = SimpleTranslateClient()
                            translation_service = CachedTranslationService(translate_client)
                            translated_text = translation_service.get_translation_for_text(
                                item_id=str(item_id_obj),
                                text=choice_text,
                                language=lang
                            )
                            if translated_text:
                                text_to_speak = translated_text
                                print(f"   ✅ Translated to {lang}: {text_to_speak[:50]}...")
                        except Exception as e:
                            print(f"   ⚠️  Translation failed, using original text: {e}")
                    
                    audio = self.voice_service.generate_tts(text_to_speak, lang)
                    if audio:
                        self._save_choice_to_cache(item_id_obj, lang, choice_idx, audio)
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        collection = self.db.collections.learning_items
        
        total_items = collection.count_documents({})
        items_with_en = collection.count_documents({'tts_cache.en': {'$exists': True}})
        items_with_es = collection.count_documents({'tts_cache.es': {'$exists': True}})
        items_with_ne = collection.count_documents({'tts_cache.ne': {'$exists': True}})
        
        # Count choice caches (sample first item to see structure)
        sample = collection.find_one({'tts_cache': {'$exists': True}})
        choice_count = 0
        if sample and 'tts_cache' in sample:
            for key in sample['tts_cache'].keys():
                if '_choice_' in key:
                    choice_count += 1
        
        return {
            'total_items': total_items,
            'cached_stems': {
                'en': items_with_en,
                'es': items_with_es,
                'ne': items_with_ne
            },
            'cached_choices': choice_count,
            'cache_coverage': {
                'en': f"{(items_with_en / total_items * 100):.1f}%" if total_items > 0 else "0%",
                'es': f"{(items_with_es / total_items * 100):.1f}%" if total_items > 0 else "0%",
                'ne': f"{(items_with_ne / total_items * 100):.1f}%" if total_items > 0 else "0%"
            }
        }

