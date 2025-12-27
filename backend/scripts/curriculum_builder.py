#!/usr/bin/env python3
"""
FinLit Curriculum Builder
=========================

Combines individual module JSON files into a complete curriculum.
Also provides import functionality for MongoDB.

Usage:
    python curriculum_builder.py build        # Combine files into finlit_curriculum.json
    python curriculum_builder.py import       # Import to MongoDB
    python curriculum_builder.py stats        # Show curriculum statistics
    python curriculum_builder.py validate     # Validate curriculum structure
"""

import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

try:
    from pymongo import MongoClient
    from dotenv import load_dotenv
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

CURRICULUM_DIR = Path(__file__).parent / "curriculum"
OUTPUT_FILE = "finlit_curriculum.json"


def load_module_files() -> List[Dict]:
    """Load all module JSON files from curriculum directory."""
    modules = []
    
    if not CURRICULUM_DIR.exists():
        print(f"Error: Curriculum directory not found: {CURRICULUM_DIR}")
        return modules
    
    json_files = sorted(CURRICULUM_DIR.glob("*.json"))
    
    for filepath in json_files:
        print(f"Loading {filepath.name}...")
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Handle different file structures
            if "module" in data:
                modules.append(data["module"])
            elif "modules" in data:
                modules.extend(data["modules"])
    
    return modules


def build_curriculum() -> Dict:
    """Build complete curriculum from module files."""
    modules = load_module_files()
    
    # Sort by order
    modules.sort(key=lambda m: m.get("order", 999))
    
    # Count lessons and content blocks
    total_lessons = sum(len(m.get("lessons", [])) for m in modules)
    total_blocks = sum(
        len(lesson.get("content_blocks", []))
        for m in modules
        for lesson in m.get("lessons", [])
    )
    total_minutes = sum(m.get("estimated_minutes", 0) for m in modules)
    total_xp = sum(
        lesson.get("xp_reward", 0)
        for m in modules
        for lesson in m.get("lessons", [])
    )
    
    curriculum = {
        "metadata": {
            "version": "1.0.0",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "content_type": "baseline_curriculum",
            "personalization_note": "This is base content. LLM personalization layer adds visa-specific context, cultural bridges, and localized examples at runtime.",
            "statistics": {
                "total_modules": len(modules),
                "total_lessons": total_lessons,
                "total_content_blocks": total_blocks,
                "total_estimated_minutes": total_minutes,
                "total_estimated_hours": round(total_minutes / 60, 1),
                "total_xp_available": total_xp
            }
        },
        "modules": modules
    }
    
    return curriculum


def validate_curriculum(curriculum: Dict) -> List[str]:
    """Validate curriculum structure and return list of issues."""
    issues = []
    
    for module in curriculum.get("modules", []):
        module_id = module.get("id", "UNKNOWN")
        
        if not module.get("name"):
            issues.append(f"Module {module_id}: Missing name")
        
        if not module.get("lessons"):
            issues.append(f"Module {module_id}: No lessons")
            continue
        
        for lesson in module.get("lessons", []):
            lesson_id = lesson.get("id", "UNKNOWN")
            
            if not lesson.get("title"):
                issues.append(f"Lesson {lesson_id}: Missing title")
            
            if not lesson.get("skill_slug"):
                issues.append(f"Lesson {lesson_id}: Missing skill_slug")
            
            if not lesson.get("learning_objectives"):
                issues.append(f"Lesson {lesson_id}: Missing learning_objectives")
            
            if not lesson.get("content_blocks"):
                issues.append(f"Lesson {lesson_id}: No content_blocks")
            
            for i, block in enumerate(lesson.get("content_blocks", [])):
                if not block.get("type"):
                    issues.append(f"Lesson {lesson_id}, block {i}: Missing type")
                if not block.get("id"):
                    issues.append(f"Lesson {lesson_id}, block {i}: Missing id")
    
    return issues


def print_stats(curriculum: Dict):
    """Print curriculum statistics."""
    stats = curriculum["metadata"]["statistics"]
    
    print("\n" + "=" * 50)
    print("FINLIT CURRICULUM STATISTICS")
    print("=" * 50)
    print(f"\nTotal Modules: {stats['total_modules']}")
    print(f"Total Lessons: {stats['total_lessons']}")
    print(f"Total Content Blocks: {stats['total_content_blocks']}")
    print(f"Estimated Time: {stats['total_estimated_hours']} hours ({stats['total_estimated_minutes']} minutes)")
    print(f"Total XP Available: {stats['total_xp_available']}")
    
    print("\n" + "-" * 50)
    print("BY MODULE:")
    print("-" * 50)
    
    for module in curriculum["modules"]:
        lesson_count = len(module.get("lessons", []))
        minutes = module.get("estimated_minutes", 0)
        print(f"\n{module['name']}")
        print(f"  ID: {module['id']}")
        print(f"  Lessons: {lesson_count}")
        print(f"  Time: ~{minutes} minutes")
        if module.get("prerequisites"):
            print(f"  Prerequisites: {', '.join(module['prerequisites'])}")
    
    print("\n" + "-" * 50)
    print("CONTENT BLOCK TYPES:")
    print("-" * 50)
    
    block_types = {}
    for module in curriculum["modules"]:
        for lesson in module.get("lessons", []):
            for block in lesson.get("content_blocks", []):
                block_type = block.get("type", "unknown")
                block_types[block_type] = block_types.get(block_type, 0) + 1
    
    for block_type, count in sorted(block_types.items(), key=lambda x: -x[1]):
        print(f"  {block_type}: {count}")


def import_to_mongodb(curriculum: Dict):
    """Import curriculum to MongoDB."""
    if not MONGO_AVAILABLE:
        print("Error: pymongo not installed. Run: pip install pymongo python-dotenv")
        return
    
    load_dotenv()
    
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "finlit")
    
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    print(f"\nConnecting to MongoDB: {mongo_uri}")
    print(f"Database: {db_name}")
    
    # Import modules
    print("\nImporting modules...")
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
        status = "updated" if result.matched_count else "created"
        print(f"  {module['name']}: {status}")
    
    # Import lessons
    print("\nImporting lessons...")
    lessons_collection = db.curriculum_lessons
    lesson_count = 0
    
    for module in curriculum["modules"]:
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
            
            lessons_collection.update_one(
                {"lesson_id": lesson["id"]},
                {"$set": lesson_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
                upsert=True
            )
            lesson_count += 1
    
    print(f"  Imported {lesson_count} lessons")
    
    # Create indexes
    print("\nCreating indexes...")
    modules_collection.create_index("module_id", unique=True)
    modules_collection.create_index("order")
    lessons_collection.create_index("lesson_id", unique=True)
    lessons_collection.create_index("module_id")
    lessons_collection.create_index("skill_slug")
    lessons_collection.create_index([("module_id", 1), ("order", 1)])
    
    print("\nImport complete!")


def main():
    parser = argparse.ArgumentParser(description="FinLit Curriculum Builder")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    subparsers.add_parser("build", help="Build curriculum from module files")
    subparsers.add_parser("import", help="Import curriculum to MongoDB")
    subparsers.add_parser("stats", help="Show curriculum statistics")
    subparsers.add_parser("validate", help="Validate curriculum structure")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Build curriculum for all commands
    print("Building curriculum from module files...")
    curriculum = build_curriculum()
    
    if args.command == "build":
        # Write to file
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(curriculum, f, indent=2, ensure_ascii=False)
        
        print(f"\nCurriculum saved to {OUTPUT_FILE}")
        print_stats(curriculum)
    
    elif args.command == "validate":
        issues = validate_curriculum(curriculum)
        if issues:
            print(f"\nFound {len(issues)} issues:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print("\nNo validation issues found!")
        print_stats(curriculum)
    
    elif args.command == "stats":
        print_stats(curriculum)
    
    elif args.command == "import":
        print_stats(curriculum)
        import_to_mongodb(curriculum)


if __name__ == "__main__":
    main()