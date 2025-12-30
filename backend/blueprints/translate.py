"""
Content Translation API
Translates learning content (questions, descriptions, etc.) to target language
Uses database cache first, falls back to live translation if cache miss or DB error
"""

from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

translate_bp = Blueprint('translate', __name__, url_prefix='/api/translate')

# Simple translation client for fallback
class SimpleTranslateClient:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in .env")
        self.client = OpenAI(api_key=api_key)
    
    def translate(self, text, target_language, context=''):
        lang_map = {'es': 'Spanish', 'ne': 'Nepali', 'hi': 'Hindi'}
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

# Initialize cached translation service
_cached_translation_service = None

def get_cached_translation_service():
    """Get or create cached translation service"""
    global _cached_translation_service
    if _cached_translation_service is None:
        try:
            from services.translation_cached import CachedTranslationService
            translate_client = SimpleTranslateClient()
            _cached_translation_service = CachedTranslationService(translate_client)
        except Exception as e:
            print(f"⚠️  Could not initialize cached translation service: {e}")
            print("   Falling back to live translation only")
            return None
    return _cached_translation_service

@translate_bp.route('/content', methods=['POST'])
def translate_content():
    """
    Translate content to target language
    Uses database cache first, falls back to live translation
    
    Request:
    {
        "text": "What is a bank?",
        "target_language": "ne",  // 'en', 'es', 'ne'
        "context": "financial_literacy",  // optional
        "item_id": "507f...",  // optional, for database cache lookup
        "preserve_terms": ["APR", "FDIC"]  // optional
    }
    
    Response:
    {
        "translated": "बैंक भनेको के हो?",
        "source_language": "en",
        "target_language": "ne",
        "cached": true/false  // true if from database cache
    }
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        target_lang = data.get('target_language', 'en')
        context = data.get('context', 'financial_literacy')
        item_id = data.get('item_id')  # Optional: for database cache lookup
        preserve_terms = data.get('preserve_terms', [])
        
        # If already in English, return as-is
        if target_lang == 'en':
            return jsonify({
                'translated': text,
                'source_language': 'en',
                'target_language': 'en',
                'cached': False
            })
        
        # Try to use database cache if item_id provided
        if item_id:
            try:
                cached_service = get_cached_translation_service()
                if cached_service:
                    # Try to get from database cache
                    cached_translation = cached_service.get_translation_for_text(item_id, text, target_lang)
                    if cached_translation:
                        print(f"✅ Translation cache hit: {item_id} ({target_lang})")
                        return jsonify({
                            'translated': cached_translation,
                            'source_language': 'en',
                            'target_language': target_lang,
                            'cached': True
                        })
                    else:
                        print(f"🔄 Translation cache miss: {item_id} ({target_lang}) - will translate and cache")
            except Exception as e:
                print(f"⚠️  Database cache error (falling back to live): {e}")
        
        # Fallback to live translation
        print(f"🌐 Translating live: {text[:50]}... ({target_lang})")
        translate_client = SimpleTranslateClient()
        translated = translate_client.translate(text, target_lang, context)
        
        # Try to save to database cache if item_id provided
        if item_id:
            try:
                cached_service = get_cached_translation_service()
                if cached_service:
                    cached_service._save_translation_to_cache(item_id, text, target_lang, translated)
                    print(f"💾 Saved translation to database cache: {item_id} ({target_lang})")
            except Exception as e:
                print(f"⚠️  Could not save to cache (non-critical): {e}")
        
        return jsonify({
            'translated': translated,
            'source_language': 'en',
            'target_language': target_lang,
            'cached': False
        })
        
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return jsonify({'error': str(e)}), 500


@translate_bp.route('/batch', methods=['POST'])
def translate_batch():
    """
    Translate multiple texts at once (uses live translation, no cache)
    
    Request:
    {
        "texts": ["What is a bank?", "A bank is..."],
        "target_language": "ne"
    }
    
    Response:
    {
        "translations": ["बैंक भनेको के हो?", "बैंक भनेको..."],
        "target_language": "ne"
    }
    """
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        target_lang = data.get('target_language', 'en')
        
        if target_lang == 'en':
            return jsonify({
                'translations': texts,
                'target_language': 'en'
            })
        
        # Use live translation for batch (could be optimized)
        translate_client = SimpleTranslateClient()
        translations = []
        for text in texts:
            translated = translate_client.translate(text, target_lang, 'batch translation')
            translations.append(translated)
        
        return jsonify({
            'translations': translations,
            'target_language': target_lang
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

