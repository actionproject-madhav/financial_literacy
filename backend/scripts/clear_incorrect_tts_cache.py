"""
Clear Incorrect TTS Cache

This script removes Nepali and Spanish TTS cache that was generated
from English text (before translation was implemented).

Usage:
    python3 scripts/clear_incorrect_tts_cache.py [--languages ne,es]
"""

import os
import sys
from bson import ObjectId

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database


def clear_tts_cache(languages=['ne', 'es']):
    """Clear TTS cache for specified languages"""
    db = Database()
    
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return
    
    print(f"🧹 Clearing TTS cache for languages: {', '.join(languages)}")
    print()
    
    # Get all active items
    all_items = list(db.collections.learning_items.find({'is_active': True}))
    total_items = len(all_items)
    
    cleared_count = 0
    cleared_questions = 0
    cleared_choices = 0
    
    for item in all_items:
        item_id = item['_id']
        tts_cache = item.get('tts_cache', {})
        
        # Build update to remove cache for specified languages
        unset_fields = {}
        has_changes = False
        
        for lang in languages:
            # Remove question stem cache
            if lang in tts_cache:
                unset_fields[f'tts_cache.{lang}'] = ""
                cleared_questions += 1
                has_changes = True
            
            # Remove choice caches
            for i in range(4):
                choice_key = f'{lang}_choice_{i}'
                if choice_key in tts_cache:
                    unset_fields[f'tts_cache.{choice_key}'] = ""
                    cleared_choices += 1
                    has_changes = True
        
        if has_changes:
            # Remove the cache fields
            db.collections.learning_items.update_one(
                {'_id': item_id},
                {'$unset': unset_fields}
            )
            cleared_count += 1
    
    print(f"✅ Cleared cache for {cleared_count} items")
    print(f"   - Question stems: {cleared_questions}")
    print(f"   - Answer choices: {cleared_choices}")
    print()
    print(f"📝 Next step: Run 'python3 scripts/pre_generate_cache.py' to regenerate")
    print(f"   with proper translation before TTS generation.")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Clear incorrect TTS cache')
    parser.add_argument(
        '--languages',
        default='ne,es',
        help='Comma-separated list of language codes to clear (default: ne,es)'
    )
    
    args = parser.parse_args()
    languages = [lang.strip() for lang in args.languages.split(',')]
    
    print("=" * 60)
    print("CLEAR INCORRECT TTS CACHE")
    print("=" * 60)
    print()
    print("This will remove TTS cache for:", ', '.join(languages))
    print("These caches were generated from English text (incorrect).")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response in ['yes', 'y']:
        clear_tts_cache(languages)
    else:
        print("❌ Cancelled")

