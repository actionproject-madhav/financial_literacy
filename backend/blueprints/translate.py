"""
Content Translation API
Translates learning content (questions, descriptions, etc.) to target language
"""

from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

translate_bp = Blueprint('translate', __name__, url_prefix='/api/translate')

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Translation cache (in-memory for MVP, move to Redis/DB for production)
translation_cache = {}

def get_cache_key(text: str, target_lang: str) -> str:
    """Generate cache key for translation"""
    return f"{target_lang}:{hash(text)}"

@translate_bp.route('/content', methods=['POST'])
def translate_content():
    """
    Translate content to target language
    
    Request:
    {
        "text": "What is a bank?",
        "target_language": "ne",  // 'en', 'es', 'ne'
        "context": "financial_literacy",  // optional
        "preserve_terms": ["APR", "FDIC"]  // optional
    }
    
    Response:
    {
        "translated": "बैंक भनेको के हो?",
        "source_language": "en",
        "target_language": "ne",
        "cached": false
    }
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        target_lang = data.get('target_language', 'en')
        context = data.get('context', 'financial_literacy')
        preserve_terms = data.get('preserve_terms', [])
        
        # If already in English, return as-is
        if target_lang == 'en':
            return jsonify({
                'translated': text,
                'source_language': 'en',
                'target_language': 'en',
                'cached': False
            })
        
        # Check cache
        cache_key = get_cache_key(text, target_lang)
        if cache_key in translation_cache:
            return jsonify({
                'translated': translation_cache[cache_key],
                'source_language': 'en',
                'target_language': target_lang,
                'cached': True
            })
        
        # Map language codes to full names
        lang_map = {
            'es': 'Spanish',
            'ne': 'Nepali',
            'hi': 'Hindi'
        }
        target_language_name = lang_map.get(target_lang, target_lang)
        
        # Build prompt
        preserve_instruction = ""
        if preserve_terms:
            preserve_instruction = f"\n- Keep these terms in English: {', '.join(preserve_terms)}"
        
        prompt = f"""Translate the following {context} content from English to {target_language_name}.

Rules:
- Maintain the tone and meaning
- Use natural, conversational language
- Keep financial terms accurate{preserve_instruction}
- If translating questions, keep the structure clear

Text to translate:
{text}

Translation:"""
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Cheapest model
            messages=[
                {"role": "system", "content": f"You are a professional translator specializing in financial literacy content. Translate accurately to {target_language_name}."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        translated = response.choices[0].message.content.strip()
        
        # Cache the translation
        translation_cache[cache_key] = translated
        
        return jsonify({
            'translated': translated,
            'source_language': 'en',
            'target_language': target_lang,
            'cached': False
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@translate_bp.route('/batch', methods=['POST'])
def translate_batch():
    """
    Translate multiple texts at once
    
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
        
        translations = []
        for text in texts:
            # Check cache first
            cache_key = get_cache_key(text, target_lang)
            if cache_key in translation_cache:
                translations.append(translation_cache[cache_key])
            else:
                # Translate individually (could be optimized to batch API call)
                result = translate_single(text, target_lang)
                translations.append(result)
                translation_cache[cache_key] = result
        
        return jsonify({
            'translations': translations,
            'target_language': target_lang
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def translate_single(text: str, target_lang: str) -> str:
    """Helper function to translate a single text"""
    lang_map = {
        'es': 'Spanish',
        'ne': 'Nepali',
        'hi': 'Hindi'
    }
    target_language_name = lang_map.get(target_lang, target_lang)
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"Translate to {target_language_name}. Be concise."},
            {"role": "user", "content": text}
        ],
        temperature=0.3,
        max_tokens=300
    )
    
    return response.choices[0].message.content.strip()

