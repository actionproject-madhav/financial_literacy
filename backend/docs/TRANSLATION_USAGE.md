# 🌍 How to Use Cached Translations

## Overview

The translation cache stores **all question content** in Spanish and Nepali:
- ✅ Question stem (the question text)
- ✅ **Answer choices (all options)**
- ✅ Explanation text

## Backend Usage

### Get Translated Choices

```python
from services.translation_cached import CachedTranslationService
from blueprints.translate import translate_content

# Initialize
translate_client = SimpleTranslateClient()  # Your translation client
cached_translation = CachedTranslationService(translate_client)

# Get translated choices
item_id = "507f1f77bcf86cd799439011"
language = "ne"  # or "es"

# Method 1: Get all choices at once
translated_choices = cached_translation.get_translation_for_item(
    item_id, 
    language=language, 
    field='choices'
)
# Returns: ["एक वित्तीय संस्था", "पैसा राख्ने ठाउँ", ...]

# Method 2: Get individual choice (access from cached array)
all_choices = cached_translation.get_translation_for_item(item_id, language, 'choices')
choice_0 = all_choices[0]  # First choice
choice_1 = all_choices[1]  # Second choice
```

### Pre-translate Everything

```python
# Pre-translate an item (includes choices automatically)
cached_translation.pre_translate_item(item_id, languages=['es', 'ne'])

# This translates:
# - stem
# - choices (all 4 options)
# - explanation
```

## Frontend Usage

### In LessonPage.tsx

The frontend should use the cached translations like this:

```typescript
// Get translated choices from cache
const getTranslatedChoices = async (itemId: string, language: string) => {
  const response = await fetch(
    `${API_BASE}/api/translate/item/${itemId}?language=${language}&field=choices`
  );
  const data = await response.json();
  return data.translated; // Returns array of translated choices
};

// Use in component
const translatedChoices = await getTranslatedChoices(step.itemId, 'ne');
// ["एक वित्तीय संस्था", "पैसा राख्ने ठाउँ", ...]
```

## API Endpoint (To Be Created)

You'll need to add this endpoint to `blueprints/translate.py`:

```python
@translate_bp.route('/item/<item_id>', methods=['GET'])
def get_item_translation(item_id):
    """Get cached translation for a learning item"""
    from services.translation_cached import CachedTranslationService
    from blueprints.translate import translate_content
    
    language = request.args.get('language', 'es')
    field = request.args.get('field', 'stem')  # 'stem', 'choices', 'explanation'
    
    # Simple translate client wrapper
    class SimpleTranslateClient:
        def translate(self, text, target_language, context=''):
            # Use existing translate_content function
            with app.app_context():
                result = translate_content()
                return result['translated']
    
    translate_client = SimpleTranslateClient()
    cached_translation = CachedTranslationService(translate_client)
    
    if field == 'choices':
        translated = cached_translation.get_translation_for_item(item_id, language, 'choices')
    else:
        translated = cached_translation.get_translation_for_item(item_id, language, field)
    
    if translated:
        return jsonify({
            'translated': translated,
            'cached': True,
            'field': field,
            'language': language
        })
    
    return jsonify({'error': 'Translation not found'}), 404
```

## Database Structure

```javascript
{
  "_id": "...",
  "content": {
    "stem": "What is a bank?",
    "choices": [
      "A financial institution",
      "A place to store money",
      "A type of loan",
      "A credit card"
    ],
    "explanation": "..."
  },
  "translations": {
    "es": {
      "stem": "¿Qué es un banco?",
      "choices": [  // ← All choices are translated and cached!
        "Una institución financiera",
        "Un lugar para guardar dinero",
        "Un tipo de préstamo",
        "Una tarjeta de crédito"
      ],
      "explanation": "..."
    },
    "ne": {
      "stem": "बैंक भनेको के हो?",
      "choices": [  // ← All choices are translated and cached!
        "एक वित्तीय संस्था",
        "पैसा राख्ने ठाउँ",
        "एक प्रकारको ऋण",
        "क्रेडिट कार्ड"
      ],
      "explanation": "..."
    }
  }
}
```

## Summary

✅ **Answer choices ARE translated and cached**  
✅ **Stored in**: `translations[language].choices` (array)  
✅ **Access via**: `get_translation_for_item(item_id, language, 'choices')`  
✅ **Pre-generated**: Automatically when running `pre_translate_item()`  

The system is already set up correctly - answer choices are fully translated and cached! 🎉

