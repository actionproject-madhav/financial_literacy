#!/usr/bin/env python3
"""
Clear all Nepali TTS cache entries from the database

This removes all cached Nepali audio (stem and choices) so they can be regenerated
with proper Nepali translations.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from bson import ObjectId

def clear_nepali_tts_cache():
    """Remove all Nepali TTS cache entries"""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    
    collection = db.collections.learning_items
    
    print("🗑️  Clearing Nepali TTS cache...\n")
    
    # Find all items with Nepali TTS cache
    items_with_ne = list(collection.find({
        '$or': [
            {'tts_cache.ne': {'$exists': True}},
            {'tts_cache.ne_choice_0': {'$exists': True}},
            {'tts_cache.ne_choice_1': {'$exists': True}},
            {'tts_cache.ne_choice_2': {'$exists': True}},
            {'tts_cache.ne_choice_3': {'$exists': True}},
            {'tts_cache.ne_choice_4': {'$exists': True}},
        ]
    }))
    
    total = len(items_with_ne)
    print(f"📦 Found {total} items with Nepali TTS cache\n")
    
    if total == 0:
        print("✅ No Nepali TTS cache found. Nothing to clear.")
        return
    
    # Clear Nepali TTS cache fields
    cleared_count = 0
    for item in items_with_ne:
        item_id = item['_id']
        tts_cache = item.get('tts_cache', {})
        
        # Find all Nepali cache keys
        # Matches: 'ne', 'ne_choice_0', 'ne_choice_1', etc.
        ne_keys = [k for k in tts_cache.keys() if k == 'ne' or k.startswith('ne_choice_')]
        
        if ne_keys:
            # Unset all Nepali TTS cache fields
            unset_dict = {}
            for key in ne_keys:
                unset_dict[f'tts_cache.{key}'] = ""
            
            collection.update_one(
                {'_id': item_id},
                {'$unset': unset_dict}
            )
            cleared_count += 1
            print(f"  ✅ Cleared {len(ne_keys)} Nepali cache entries for item {item_id}")
    
    print(f"\n✅ Cleared Nepali TTS cache from {cleared_count} items")
    print("   💡 You can now run pre_generate_cache.py to regenerate with proper translations")

if __name__ == '__main__':
    clear_nepali_tts_cache()

