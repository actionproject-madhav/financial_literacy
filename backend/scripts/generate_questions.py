"""
FinLit Question Generation & Import System
==========================================

This script provides:
1. Import seed questions from JSON into MongoDB
2. Generate additional questions using Claude API
3. Validate and review workflow
4. Export questions for review

Usage:
    python question_generator.py import-seed          # Import seed questions
    python question_generator.py generate --skill checking-accounts --count 10
    python question_generator.py generate-all --count-per-skill 15
    python question_generator.py export-for-review    # Export to CSV for expert review
    python question_generator.py stats                # Show question statistics
"""

import json
import os
import sys
import csv
import argparse
from datetime import datetime
from typing import List, Dict, Optional
import hashlib

# You'll need to install these:
# pip install anthropic pymongo python-dotenv

try:
    from anthropic import Anthropic
    from pymongo import MongoClient
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Install with: pip install anthropic pymongo python-dotenv")
    sys.exit(1)

load_dotenv()

# Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SEED_FILE = os.path.join(os.path.dirname(__file__), "seed_questions.json")

# Initialize clients
db = None
anthropic_client = None


def init_database():
    """Initialize database connection using existing Database class."""
    global db
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from database import Database
    
    db = Database()
    if not db.is_connected:
        print("Error: Cannot connect to database. Check your MONGO_URI in .env")
        sys.exit(1)
    print("Database connected")


def init_anthropic():
    """Initialize Anthropic client if API key is available."""
    global anthropic_client
    if ANTHROPIC_API_KEY:
        anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
        print("Anthropic client initialized")
    else:
        print("Warning: ANTHROPIC_API_KEY not set. Generation features disabled.")


def load_seed_data() -> Dict:
    """Load seed questions from JSON file."""
    if not os.path.exists(SEED_FILE):
        print(f"❌ Error: Seed file not found at {SEED_FILE}")
        print(f"   Please create the file with your questions.")
        sys.exit(1)
    
    # Check if file is empty
    file_size = os.path.getsize(SEED_FILE)
    if file_size == 0:
        print(f"❌ Error: Seed file is empty: {SEED_FILE}")
        print(f"   Please add your questions to the file.")
        print(f"   See docs/question_generation.md for the expected format.")
        sys.exit(1)
    
    try:
        with open(SEED_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Validate structure
        if not isinstance(data, dict):
            print(f"❌ Error: Seed file must contain a JSON object")
            sys.exit(1)
        
        if 'knowledge_components' not in data:
            print(f"⚠️  Warning: No 'knowledge_components' found in seed file")
        
        if 'questions' not in data:
            print(f"⚠️  Warning: No 'questions' found in seed file")
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in seed file: {e}")
        print(f"   File: {SEED_FILE}")
        print(f"   Line {e.lineno}, Column {e.colno}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading seed file: {e}")
        sys.exit(1)


def import_knowledge_components(kcs: List[Dict]) -> Dict[str, str]:
    """Import knowledge components and return slug -> id mapping."""
    collections = db.collections
    slug_to_id = {}
    
    print(f"\nImporting {len(kcs)} knowledge components...")
    
    for kc in kcs:
        try:
            # Check if already exists
            existing = collections.knowledge_components.find_one({"slug": kc["slug"]})
            if existing:
                slug_to_id[kc["slug"]] = str(existing["_id"])
                # Update existing KC with new data
                collections.knowledge_components.update_one(
                    {"slug": kc["slug"]},
                    {"$set": {
                        "name": kc.get("name"),
                        "description": kc.get("description"),
                        "domain": kc.get("domain"),
                        "difficulty_tier": kc.get("difficulty_tier", 1),
                        "bloom_level": kc.get("bloom_level"),
                        "estimated_minutes": kc.get("estimated_minutes", 15),
                        "updated_at": datetime.utcnow()
                    }}
                )
            else:
                # Create new KC using existing method
                kc_id = collections.create_knowledge_component(
                    slug=kc["slug"],
                    name=kc["name"],
                    domain=kc["domain"],
                    description=kc.get("description"),
                    difficulty_tier=kc.get("difficulty_tier", 1),
                    bloom_level=kc.get("bloom_level"),
                    estimated_minutes=kc.get("estimated_minutes", 15),
                    icon_url=kc.get("icon_url")
                )
                slug_to_id[kc["slug"]] = kc_id
            
        except Exception as e:
            print(f"  Error with KC {kc.get('slug', 'unknown')}: {e}")
    
    print(f"  Processed {len(slug_to_id)} knowledge components")
    return slug_to_id


def generate_question_hash(content: Dict) -> str:
    """Generate a hash for deduplication based on question stem."""
    stem = content.get("stem", "").lower().strip()
    return hashlib.md5(stem.encode()).hexdigest()


def import_questions(questions: List[Dict], slug_to_id: Dict[str, str]) -> Dict:
    """Import questions and create KC mappings."""
    collections = db.collections
    
    stats = {"imported": 0, "skipped": 0, "errors": 0}
    
    for q in questions:
        try:
            skill_slug = q.get("skill_slug")
            if not skill_slug or skill_slug not in slug_to_id:
                print(f"  Warning: Unknown skill slug '{skill_slug}', skipping")
                stats["errors"] += 1
                continue
            
            # Check for duplicate by exact stem match (case-insensitive)
            stem = q["content"].get("stem", "").strip()
            stem_lower = stem.lower()
            
            # Use exact match instead of regex to avoid special character issues
            existing_items = list(collections.learning_items.find({
                "content.stem": {"$exists": True}
            }))
            
            # Check if exact duplicate exists (case-insensitive)
            is_duplicate = False
            for existing in existing_items:
                existing_stem = existing.get("content", {}).get("stem", "").strip().lower()
                if existing_stem == stem_lower:
                    is_duplicate = True
                    break
            
            if is_duplicate:
                print(f"  Duplicate found, skipping: {q['content']['stem'][:50]}...")
                stats["skipped"] += 1
                continue
            
            # Create learning item using existing method
            item_id = collections.create_learning_item(
                item_type=q.get("item_type", "multiple_choice"),
                content=q["content"],
                difficulty=q.get("difficulty", 0.5),
                discrimination=q.get("discrimination", 1.0),
                media_type=q.get("media_type"),
                media_url=q.get("media_url"),
                allows_llm_personalization=q.get("allows_llm_personalization", True)
            )
            
            # Create KC mapping using existing method
            kc_id = slug_to_id[skill_slug]
            collections.create_item_kc_mapping(
                item_id=item_id,
                kc_id=kc_id,
                weight=1.0
            )
            
            stats["imported"] += 1
            
            if stats["imported"] % 10 == 0:
                print(f"  Imported {stats['imported']} questions...")
            
        except Exception as e:
            print(f"  Error importing question: {e}")
            import traceback
            traceback.print_exc()
            stats["errors"] += 1
    
    return stats


def import_seed_questions():
    """Import all seed questions from JSON file."""
    print("=" * 60)
    print("IMPORTING SEED QUESTIONS")
    print("=" * 60)
    
    print(f"\nLoading seed data from {SEED_FILE}...")
    data = load_seed_data()
    
    print(f"\nFound {len(data.get('knowledge_components', []))} knowledge components")
    print(f"Found {len(data.get('questions', []))} questions")
    
    # Import knowledge components
    slug_to_id = import_knowledge_components(data.get("knowledge_components", []))
    
    # Import questions
    print(f"\nImporting {len(data.get('questions', []))} questions...")
    stats = import_questions(data.get("questions", []), slug_to_id)
    
    print(f"\n{'=' * 60}")
    print("IMPORT COMPLETE!")
    print(f"{'=' * 60}")
    print(f"  Imported: {stats['imported']}")
    print(f"  Skipped (duplicates): {stats['skipped']}")
    print(f"  Errors: {stats['errors']}")
    print(f"{'=' * 60}\n")


# ============ QUESTION GENERATION WITH CLAUDE API ============

GENERATION_PROMPT = """You are an expert financial literacy educator creating questions for immigrants and international students in the United States.

Generate {count} multiple-choice questions for the skill: "{skill_name}" ({skill_slug})

Skill Description: {skill_description}

## Requirements:
1. Questions should be clear and use simple language (avoid idioms)
2. Each question must have exactly 4 choices
3. Include a 2-3 sentence explanation for each answer
4. Distribute difficulty: ~40% easy (0.3), ~40% medium (0.5), ~20% hard (0.7)
5. Include visa_variants where relevant (F1, H1B context)
6. Make questions practical and actionable
7. DO NOT duplicate these existing questions for this skill:
{existing_stems}

## Output Format (JSON array):
```json
[
  {{
    "stem": "Question text here?",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Clear explanation of why this answer is correct.",
    "difficulty": 0.5,
    "visa_variants": {{
      "F1": {{"additional_context": "F1-specific context if relevant"}},
      "H1B": {{"additional_context": "H1B-specific context if relevant"}}
    }}
  }}
]
```

Generate exactly {count} unique, high-quality questions. Output ONLY valid JSON, no other text."""


def get_existing_stems(skill_slug: str) -> List[str]:
    """Get existing question stems for a skill to avoid duplicates."""
    collections = db.collections
    
    # Get KC
    kc = collections.knowledge_components.find_one({"slug": skill_slug})
    if not kc:
        return []
    
    # Get all items for this KC
    items = collections.get_items_for_kc(str(kc["_id"]))
    return [item["content"]["stem"] for item in items if "content" in item and "stem" in item["content"]]


def generate_questions_for_skill(skill_slug: str, count: int = 10) -> List[Dict]:
    """Generate questions for a specific skill using Claude API."""
    if not anthropic_client:
        print("Error: ANTHROPIC_API_KEY not configured")
        return []
    
    # Get skill info
    collections = db.collections
    kc = collections.knowledge_components.find_one({"slug": skill_slug})
    if not kc:
        print(f"Error: Skill '{skill_slug}' not found")
        return []
    
    # Get existing stems to avoid duplicates
    existing_stems = get_existing_stems(skill_slug)
    existing_stems_text = "\n".join([f"- {s[:100]}" for s in existing_stems[:20]])
    if not existing_stems_text:
        existing_stems_text = "(No existing questions)"
    
    # Build prompt
    prompt = GENERATION_PROMPT.format(
        count=count,
        skill_name=kc.get("name", skill_slug),
        skill_slug=skill_slug,
        skill_description=kc.get("description", "No description available"),
        existing_stems=existing_stems_text
    )
    
    print(f"Generating {count} questions for '{skill_slug}'...")
    
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        # Parse response
        content = response.content[0].text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        questions = json.loads(content)
        
        # Add metadata
        for q in questions:
            q["skill_slug"] = skill_slug
            q["source"] = "claude_generated"
            q["needs_review"] = True  # Mark for expert review
            q["item_type"] = "multiple_choice"
            
            # Ensure content structure
            q["content"] = {
                "stem": q.pop("stem"),
                "choices": q.pop("choices"),
                "correct_answer": q.pop("correct_answer"),
                "explanation": q.pop("explanation"),
                "visa_variants": q.pop("visa_variants", {})
            }
        
        print(f"  Generated {len(questions)} questions")
        return questions
        
    except json.JSONDecodeError as e:
        print(f"  Error parsing JSON response: {e}")
        print(f"  Response was: {content[:500]}...")
        return []
    except Exception as e:
        print(f"  Error generating questions: {e}")
        return []


def generate_and_import(skill_slug: str, count: int = 10):
    """Generate questions and import them into the database."""
    questions = generate_questions_for_skill(skill_slug, count)
    
    if not questions:
        print("No questions generated")
        return
    
    # Get slug to ID mapping
    collections = db.collections
    kc = collections.knowledge_components.find_one({"slug": skill_slug})
    if not kc:
        print(f"Error: Skill '{skill_slug}' not found")
        return
    
    slug_to_id = {skill_slug: str(kc["_id"])}
    
    # Import questions
    stats = import_questions(questions, slug_to_id)
    print(f"\n✅ Generation complete!")
    print(f"   Imported: {stats['imported']}")
    print(f"   Skipped: {stats['skipped']}")
    print(f"   Errors: {stats['errors']}")


def generate_all(count_per_skill: int = 10):
    """Generate questions for all skills."""
    collections = db.collections
    kcs = list(collections.knowledge_components.find({"is_active": True}))
    
    print(f"Generating {count_per_skill} questions for {len(kcs)} skills...")
    total_stats = {"imported": 0, "skipped": 0, "errors": 0}
    
    for kc in kcs:
        slug = kc["slug"]
        questions = generate_questions_for_skill(slug, count_per_skill)
        
        if questions:
            slug_to_id = {slug: str(kc["_id"])}
            stats = import_questions(questions, slug_to_id)
            total_stats["imported"] += stats["imported"]
            total_stats["skipped"] += stats["skipped"]
            total_stats["errors"] += stats["errors"]
        
        # Small delay to avoid rate limits
        import time
        time.sleep(1)
    
    print(f"\n✅ Bulk generation complete!")
    print(f"   Total imported: {total_stats['imported']}")
    print(f"   Total skipped: {total_stats['skipped']}")
    print(f"   Total errors: {total_stats['errors']}")


# ============ EXPORT & REVIEW ============

def export_for_review(output_file: str = "questions_for_review.csv"):
    """Export questions that need review to CSV."""
    items_collection = db.learning_items
    
    # Get questions needing review
    questions = list(items_collection.find({
        "$or": [
            {"needs_review": True},
            {"source": "claude_generated"}
        ]
    }))
    
    if not questions:
        print("No questions need review")
        return
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'ID', 'Skill', 'Difficulty', 'Stem', 
            'Choice A', 'Choice B', 'Choice C', 'Choice D',
            'Correct Answer (0-3)', 'Explanation',
            'Source', 'Approved (Y/N)', 'Notes'
        ])
        
        for q in questions:
            content = q.get("content", {})
            choices = content.get("choices", ["", "", "", ""])
            
            # Get skill slug from mapping
            mapping = db.item_kc_mappings.find_one({"item_id": q["_id"]})
            skill_slug = ""
            if mapping:
                kc = db.knowledge_components.find_one({"_id": mapping["kc_id"]})
                skill_slug = kc.get("slug", "") if kc else ""
            
            writer.writerow([
                str(q["_id"]),
                skill_slug,
                q.get("difficulty", 0.5),
                content.get("stem", ""),
                choices[0] if len(choices) > 0 else "",
                choices[1] if len(choices) > 1 else "",
                choices[2] if len(choices) > 2 else "",
                choices[3] if len(choices) > 3 else "",
                content.get("correct_answer", 0),
                content.get("explanation", ""),
                q.get("source", "unknown"),
                "",  # Approved column for reviewer
                ""   # Notes column for reviewer
            ])
    
    print(f"✅ Exported {len(questions)} questions to {output_file}")
    print("Review the CSV, mark 'Y' or 'N' in Approved column, then import back")


def import_reviewed(input_file: str = "questions_reviewed.csv"):
    """Import reviewed questions, updating approval status."""
    collections = db.collections
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        approved = 0
        rejected = 0
        
        for row in reader:
            item_id = row.get('ID')
            status = row.get('Approved (Y/N)', '').strip().upper()
            
            if not item_id:
                continue
            
            from bson import ObjectId
            
            if status == 'Y':
                collections.learning_items.update_one(
                    {"_id": ObjectId(item_id)},
                    {"$set": {
                        "is_active": True,
                        "updated_at": datetime.utcnow()
                    }}
                )
                approved += 1
            elif status == 'N':
                collections.learning_items.update_one(
                    {"_id": ObjectId(item_id)},
                    {"$set": {
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }}
                )
                rejected += 1
    
    print(f"✅ Review import complete!")
    print(f"   Approved: {approved}")
    print(f"   Rejected: {rejected}")


# ============ STATISTICS ============

def show_stats():
    """Show question statistics."""
    collections = db.collections
    
    print("\n📊 Question Statistics")
    print("=" * 50)
    
    # Total questions
    total = collections.learning_items.count_documents({})
    active = collections.learning_items.count_documents({"is_active": True})
    
    print(f"\nTotal Questions: {total}")
    print(f"Active Questions: {active}")
    
    # By difficulty
    print("\nBy Difficulty:")
    pipeline = [
        {"$bucket": {
            "groupBy": "$difficulty",
            "boundaries": [0, 0.35, 0.55, 1.0],
            "default": "unknown",
            "output": {"count": {"$sum": 1}}
        }}
    ]
    difficulties = list(collections.learning_items.aggregate(pipeline))
    labels = {0: "Easy (0-0.35)", 0.35: "Medium (0.35-0.55)", 0.55: "Hard (0.55-1.0)"}
    for d in difficulties:
        label = labels.get(d['_id'], str(d['_id']))
        print(f"  {label}: {d['count']}")
    
    # By skill
    print("\nBy Skill:")
    kcs = list(collections.knowledge_components.find({"is_active": True}).sort("domain", 1))
    current_domain = None
    
    for kc in kcs:
        if kc.get("domain") != current_domain:
            current_domain = kc.get("domain")
            print(f"\n  [{current_domain.upper()}]")
        
        count = collections.item_kc_mappings.count_documents({"kc_id": kc["_id"]})
        status = "✅" if count >= 10 else "⚠️" if count >= 5 else "❌"
        print(f"    {status} {kc['slug']}: {count} questions")
    
    print("\n" + "=" * 50)


# ============ MAIN ============

def main():
    parser = argparse.ArgumentParser(description="FinLit Question Management")
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Import seed
    subparsers.add_parser("import-seed", help="Import seed questions from JSON")
    
    # Generate for skill
    gen_parser = subparsers.add_parser("generate", help="Generate questions for a skill")
    gen_parser.add_argument("--skill", required=True, help="Skill slug")
    gen_parser.add_argument("--count", type=int, default=10, help="Number of questions")
    
    # Generate all
    gen_all_parser = subparsers.add_parser("generate-all", help="Generate for all skills")
    gen_all_parser.add_argument("--count-per-skill", type=int, default=10, help="Questions per skill")
    
    # Export for review
    export_parser = subparsers.add_parser("export-for-review", help="Export questions to CSV")
    export_parser.add_argument("--output", default="questions_for_review.csv", help="Output file")
    
    # Import reviewed
    import_parser = subparsers.add_parser("import-reviewed", help="Import reviewed CSV")
    import_parser.add_argument("--input", default="questions_reviewed.csv", help="Input file")
    
    # Stats
    subparsers.add_parser("stats", help="Show question statistics")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize database
    init_database()
    
    # Initialize Anthropic if needed
    if args.command in ["generate", "generate-all"]:
        init_anthropic()
    
    if args.command == "import-seed":
        import_seed_questions()
    elif args.command == "generate":
        generate_and_import(args.skill, args.count)
    elif args.command == "generate-all":
        generate_all(args.count_per_skill)
    elif args.command == "export-for-review":
        export_for_review(args.output)
    elif args.command == "import-reviewed":
        import_reviewed(args.input)
    elif args.command == "stats":
        show_stats()


if __name__ == "__main__":
    main()