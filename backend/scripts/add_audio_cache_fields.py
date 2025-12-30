#!/usr/bin/env python3
"""
Add audio cache and translation cache fields to learning_items collection

This script adds:
- tts_cache: { language: base64_audio } - Cached TTS audio per language
- translations: { language: { stem, choices, explanation } } - Cached translations
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database
from pymongo import UpdateOne

def add_cache_fields():
    """Add tts_cache and translations fields to all learning_items"""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database. Check your MONGO_URI in .env")
        return
    collection = db.collections.learning_items
    
    print("🔄 Adding cache fields to learning_items...")
    
    # Get all items
    items = list(collection.find({}))
    print(f"📦 Found {len(items)} learning items")
    
    updates = []
    for item in items:
        update_doc = {}
        
        # Add tts_cache if it doesn't exist
        if 'tts_cache' not in item:
            update_doc['tts_cache'] = {}
        
        # Add translations if it doesn't exist
        if 'translations' not in item:
            update_doc['translations'] = {}
        
        if update_doc:
            updates.append(
                UpdateOne(
                    {'_id': item['_id']},
                    {'$set': update_doc}
                )
            )
    
    if updates:
        result = collection.bulk_write(updates)
        print(f"✅ Updated {result.modified_count} items")
    else:
        print("✅ All items already have cache fields")
    
    # Create indexes for faster lookups
    print("\n📊 Creating indexes...")
    try:
        collection.create_index([('tts_cache', 1)])
        collection.create_index([('translations', 1)])
        print("✅ Indexes created")
    except Exception as e:
        print(f"⚠️  Index creation: {e}")

if __name__ == '__main__':
    add_cache_fields()
    print("\n🎉 Done!")

