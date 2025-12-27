#!/usr/bin/env python3
"""
Import curriculum from curriculum.json to MongoDB
"""

import json
import os
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def import_curriculum():
    """Import curriculum from curriculum.json to MongoDB."""

    # Load curriculum.json
    print("Loading curriculum.json...")
    with open('curriculum.json', 'r', encoding='utf-8') as f:
        curriculum = json.load(f)

    # Connect to MongoDB
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "finlit")

    client = MongoClient(mongo_uri)
    db = client[db_name]

    print(f"\nConnecting to MongoDB: {mongo_uri}")
    print(f"Database: {db_name}")

    # Print stats
    stats = curriculum["metadata"]["statistics"]
    print("\n" + "=" * 50)
    print("CURRICULUM TO IMPORT:")
    print("=" * 50)
    print(f"Total Modules: {stats['total_modules']}")
    print(f"Total Lessons: {stats['total_lessons']}")
    print(f"Total Content Blocks: {stats['total_content_blocks']}")
    print(f"Estimated Time: {stats['total_estimated_hours']} hours")
    print(f"Total XP: {stats['total_xp_available']}")

    # Import modules
    print("\n" + "=" * 50)
    print("IMPORTING MODULES...")
    print("=" * 50)
    modules_collection = db.curriculum_modules

    for module in curriculum["modules"]:
        module_doc = {
            "module_id": module["id"],
            "name": module["name"],
            "description": module.get("description", ""),
            "color": module.get("color", "#1CB0F6"),
            "estimated_minutes": module.get("estimated_minutes", 60),
            "order": module.get("order", 0),
            "prerequisites": module.get("prerequisites", []),
            "lesson_count": len(module.get("lessons", [])),
            "is_active": True,
            "updated_at": datetime.utcnow()
        }

        result = modules_collection.update_one(
            {"module_id": module["id"]},
            {"$set": module_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )
        status = "✓ updated" if result.matched_count else "✓ created"
        print(f"  {module['name']}: {status}")

    # Import lessons
    print("\n" + "=" * 50)
    print("IMPORTING LESSONS...")
    print("=" * 50)
    lessons_collection = db.curriculum_lessons
    lesson_count = 0
    created_count = 0
    updated_count = 0

    for module in curriculum["modules"]:
        print(f"\n  {module['name']}:")
        for lesson in module.get("lessons", []):
            lesson_doc = {
                "lesson_id": lesson["id"],
                "module_id": module["id"],
                "skill_slug": lesson.get("skill_slug"),
                "title": lesson["title"],
                "order": lesson.get("order", 0),
                "estimated_minutes": lesson.get("estimated_minutes", 10),
                "xp_reward": lesson.get("xp_reward", 10),
                "learning_objectives": lesson.get("learning_objectives", []),
                "content_blocks": lesson.get("content_blocks", []),
                "is_active": True,
                "updated_at": datetime.utcnow()
            }

            result = lessons_collection.update_one(
                {"lesson_id": lesson["id"]},
                {"$set": lesson_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
                upsert=True
            )

            if result.matched_count:
                updated_count += 1
                status = "updated"
            else:
                created_count += 1
                status = "created"

            print(f"    - {lesson['title']}: {status}")
            lesson_count += 1

    print("\n" + "=" * 50)
    print("CREATING INDEXES...")
    print("=" * 50)
    modules_collection.create_index("module_id", unique=True)
    modules_collection.create_index("order")
    lessons_collection.create_index("lesson_id", unique=True)
    lessons_collection.create_index("module_id")
    lessons_collection.create_index("skill_slug")
    lessons_collection.create_index([("module_id", 1), ("order", 1)])
    print("  ✓ Indexes created")

    print("\n" + "=" * 50)
    print("IMPORT COMPLETE!")
    print("=" * 50)
    print(f"  Total lessons: {lesson_count}")
    print(f"  Created: {created_count}")
    print(f"  Updated: {updated_count}")
    print("=" * 50)

if __name__ == "__main__":
    import_curriculum()
