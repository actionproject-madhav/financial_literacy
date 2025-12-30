"""
Cached Translation Service - Translations with database caching

Checks database cache first before calling OpenAI API
Saves translations to database for future use
"""

from typing import Optional, Dict
from database import Database
from datetime import datetime
from bson import ObjectId


class CachedTranslationService:
    """
    Translation service with database caching
    
    Cost savings:
    - Without cache: ~$0.15 per 1M tokens per request
    - With cache: ~$0.15 per 1M tokens (first time only)
    - Example: 1000 users × 10 questions × 3 languages = 30K translations
      - No cache: $4.50 per day
      - With cache: $0.0045 per day (after initial generation)
    """
    
    def __init__(self, translate_client):
        """
        Args:
            translate_client: Translation client (from translate.py)
        """
        self.translate_client = translate_client
        self._db = None
    
    @property
    def db(self):
        """Lazy database connection"""
        if self._db is None:
            self._db = Database()
            if not self._db.is_connected:
                raise RuntimeError("Cannot connect to database. Check MONGO_URI in .env")
        return self._db
    
    def get_translation_for_item(
        self,
        item_id: str,
        language: str = 'es',
        field: str = 'stem'  # 'stem', 'choices', 'explanation'
    ) -> Optional[str]:
        """
        Get translation for a learning item field (cached)
        
        Args:
            item_id: Learning item ID (string or ObjectId)
            language: Target language (es, ne)
            field: Field to translate ('stem', 'choices', 'explanation')
        
        Returns:
            Translated text or None
        """
        # Convert string ID to ObjectId if needed
        item_id_obj = ObjectId(item_id) if isinstance(item_id, str) else item_id
        
        # Get item from database
        item = self.db.collections.learning_items.find_one({'_id': item_id_obj})
        if not item:
            return None
        
        # Check cache
        translations = item.get('translations', {})
        if language in translations:
            lang_translations = translations[language]
            if field in lang_translations:
                print(f"✅ Translation cache hit: {item_id} ({language}.{field})")
                return lang_translations[field]
        
        # Cache miss - translate
        print(f"🔄 Translation cache miss: {item_id} ({language}.{field}) - translating...")
        
        # Get original text
        content = item.get('content', {})
        if field == 'stem':
            original_text = content.get('stem', '')
        elif field == 'explanation':
            original_text = content.get('explanation', '')
        elif field == 'choices':
            # Choices are an array - handle separately
            return self._translate_choices(item_id, language, content.get('choices', []))
        else:
            return None
        
        if not original_text:
            return None
        
        # Translate using client
        try:
            translated_text = self.translate_client.translate(
                original_text,
                target_language=language,
                context=f'financial literacy {field}'
            )
            
            if translated_text:
                # Save to cache
                self._save_to_cache(item_id, language, field, translated_text)
                return translated_text
        except Exception as e:
            print(f"⚠️  Translation error: {e}")
        
        return None
    
    def _translate_choices(self, item_id: str, language: str, choices: list) -> Optional[list]:
        """Translate all choices for an item"""
        item = self.db.collections.learning_items.find_one({'_id': item_id})
        if not item:
            return None
        
        # Check if all choices are cached
        translations = item.get('translations', {})
        if language in translations and 'choices' in translations[language]:
            cached_choices = translations[language]['choices']
            if len(cached_choices) == len(choices):
                print(f"✅ Translation cache hit: {item_id} ({language}.choices)")
                return cached_choices
        
        # Translate choices
        translated_choices = []
        for idx, choice in enumerate(choices):
            try:
                translated = self.translate_client.translate(
                    choice,
                    target_language=language,
                    context=f'answer choice {idx + 1}'
                )
                translated_choices.append(translated or choice)
            except Exception as e:
                print(f"⚠️  Error translating choice {idx}: {e}")
                translated_choices.append(choice)
        
        # Save to cache
        self._save_to_cache(item_id, language, 'choices', translated_choices)
        
        return translated_choices
    
    def _save_to_cache(self, item_id: str, language: str, field: str, translated: str | list):
        """Save translation to database cache"""
        try:
            update_doc = {
                f'translations.{language}.{field}': translated,
                'updated_at': datetime.utcnow()
            }
            
            self.db.collections.learning_items.update_one(
                {'_id': item_id},
                {'$set': update_doc}
            )
            print(f"💾 Saved translation to cache: {item_id} ({language}.{field})")
        except Exception as e:
            print(f"⚠️  Failed to save translation cache: {e}")
    
    def pre_translate_item(self, item_id: str, languages: list = ['es', 'ne']):
        """
        Pre-translate an item in multiple languages
        
        Useful for:
        - Batch processing after adding new questions
        - Reducing latency for users
        - Cost optimization (translate once, use many times)
        """
        item = self.db.collections.learning_items.find_one({'_id': item_id})
        if not item:
            return
        
        content = item.get('content', {})
        
        for lang in languages:
            # Translate stem
            if content.get('stem'):
                self.get_translation_for_item(item_id, lang, 'stem')
            
            # Translate choices
            if content.get('choices'):
                self._translate_choices(item_id, lang, content['choices'])
            
            # Translate explanation
            if content.get('explanation'):
                self.get_translation_for_item(item_id, lang, 'explanation')
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        collection = self.db.collections.learning_items
        
        total_items = collection.count_documents({})
        items_with_es = collection.count_documents({'translations.es': {'$exists': True}})
        items_with_ne = collection.count_documents({'translations.ne': {'$exists': True}})
        
        return {
            'total_items': total_items,
            'translated_es': items_with_es,
            'translated_ne': items_with_ne,
            'translation_coverage': {
                'es': f"{(items_with_es / total_items * 100):.1f}%" if total_items > 0 else "0%",
                'ne': f"{(items_with_ne / total_items * 100):.1f}%" if total_items > 0 else "0%"
            }
        }

