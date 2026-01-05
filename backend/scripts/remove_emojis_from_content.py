#!/usr/bin/env python3
"""
Remove all emojis from curriculum content in the database.
"""

import sys
import os
import re
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import Database

def remove_emojis(text):
    """Remove emojis from text using regex."""
    if not isinstance(text, str):
        return text
    
    # Comprehensive emoji pattern
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
        "\U0001FA00-\U0001FAFF"  # Chess Symbols
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub('', text).strip()

def clean_content_recursive(obj):
    """Recursively clean emojis from nested structures."""
    if isinstance(obj, str):
        return remove_emojis(obj)
    elif isinstance(obj, list):
        return [clean_content_recursive(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: clean_content_recursive(value) for key, value in obj.items()}
    else:
        return obj

def remove_emojis_from_curriculum():
    """Remove emojis from all curriculum content."""
    db = Database()
    if not db.is_connected:
        print("❌ Cannot connect to database")
        return False
    
    print("=" * 70)
    print("🧹 REMOVING EMOJIS FROM CURRICULUM CONTENT")
    print("=" * 70)
    
    lessons_collection = db.collections.curriculum_lessons
    lessons = list(lessons_collection.find({}))
    
    total_lessons = len(lessons)
    updated_lessons = 0
    total_blocks_cleaned = 0
    
    for lesson in lessons:
        lesson_id = lesson['_id']
        lesson_slug = lesson.get('lesson_id', 'unknown')
        content_blocks = lesson.get('content_blocks', [])
        
        if not content_blocks:
            continue
        
        print(f"\n📚 {lesson_slug}: {lesson.get('title')}")
        
        cleaned_blocks = []
        blocks_changed = 0
        
        for block in content_blocks:
            original_block = str(block)
            cleaned_block = clean_content_recursive(block)
            
            if str(cleaned_block) != original_block:
                blocks_changed += 1
            
            cleaned_blocks.append(cleaned_block)
        
        if blocks_changed > 0:
            # Update the lesson with cleaned content
            lessons_collection.update_one(
                {'_id': lesson_id},
                {'$set': {'content_blocks': cleaned_blocks}}
            )
            print(f"   ✅ Cleaned {blocks_changed} content blocks")
            updated_lessons += 1
            total_blocks_cleaned += blocks_changed
        else:
            print(f"   ⏭️  No emojis found")
    
    print("\n" + "=" * 70)
    print("✅ EMOJI REMOVAL COMPLETE")
    print("=" * 70)
    print(f"Lessons processed: {total_lessons}")
    print(f"Lessons updated: {updated_lessons}")
    print(f"Content blocks cleaned: {total_blocks_cleaned}")
    print("=" * 70)
    
    return True

if __name__ == '__main__':
    success = remove_emojis_from_curriculum()
    sys.exit(0 if success else 1)

