"""
Generate comprehensive question bank using LLM assistance.

This script helps generate questions for all skills using LLM (GPT/Claude/Gemini).
The questions are generated in batches, allowing for manual review before insertion.

Usage:
    python scripts/generate_all_content.py --skill checking-accounts --count 15
    python scripts/generate_all_content.py --batch banking --count 10
    python scripts/generate_all_content.py --all
"""

import argparse
import sys
import os
import json
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import Database
from services.llm_service import LLMService


# Skills organized by domain
SKILLS_BY_DOMAIN = {
    'banking': [
        'understanding-us-currency',
        'checking-accounts',
        'savings-accounts',
        'debit-cards',
        'online-banking',
        'atm-usage',
        'wire-transfers'
    ],
    'credit': [
        'what-is-credit',
        'credit-score-basics',
        'credit-score-factors',
        'building-credit',
        'credit-cards',
        'secured-vs-unsecured-credit'
    ],
    'money-management': [
        'budgeting-basics',
        'emergency-funds',
        'debt-management',
        'saving-strategies',
        'tracking-expenses'
    ],
    'investing': [
        'what-is-investing',
        'stocks-basics',
        'bonds-basics',
        'mutual-funds',
        '401k-plans',
        'ira-accounts',
        'diversification'
    ],
    'retirement': [
        'retirement-planning',
        'social-security',
        'employer-sponsored-plans',
        'roth-vs-traditional',
        'retirement-calculators'
    ],
    'taxes': [
        'us-tax-system',
        'filing-taxes',
        'w2-vs-1099',
        'tax-deductions',
        'itin-vs-ssn',
        'state-vs-federal-taxes'
    ],
    'cryptocurrency': [
        'what-is-crypto',
        'blockchain-basics',
        'crypto-wallets',
        'crypto-taxes'
    ]
}


LLM_PROMPT_TEMPLATE = """Generate {count} multiple-choice questions for the financial literacy skill: "{skill_name}"

TARGET AUDIENCE:
- Immigrants and international students learning the US financial system
- Native language may not be English
- May have limited prior knowledge of US financial concepts
- Common visa types: F1 (student), H1B (work), J1 (exchange)

SKILL CONTEXT:
{skill_description}

REQUIREMENTS:
1. Mix difficulty levels:
   - Easy (difficulty: 0.3): 40% - Basic definitions and concepts
   - Medium (difficulty: 0.5): 40% - Application and understanding
   - Hard (difficulty: 0.7): 20% - Analysis and comparison

2. Each question must have:
   - stem: Clear, concise question text
   - choices: Exactly 4 options (a, b, c, d)
   - correct_answer: Index of correct choice (0-3)
   - explanation: 2-3 sentences explaining the correct answer
   - difficulty: 0.3, 0.5, or 0.7
   - visa_variants: (optional) Object with F1 or H1B specific notes

3. Question style:
   - Use simple, clear language
   - Avoid idioms or cultural references
   - Include practical, real-world scenarios
   - Reference visa-specific situations when relevant

4. Cultural sensitivity:
   - Acknowledge differences from other countries' systems
   - Don't assume prior knowledge of US systems
   - Include helpful context where needed

OUTPUT FORMAT:
Return a JSON array of question objects. Example:

[
  {{
    "stem": "What is the main purpose of a checking account?",
    "choices": [
      "To earn high interest on savings",
      "To manage daily transactions and pay bills",
      "To invest in the stock market",
      "To build credit history"
    ],
    "correct_answer": 1,
    "explanation": "A checking account is designed for managing day-to-day transactions like deposits, withdrawals, and bill payments. While savings accounts focus on earning interest, checking accounts prioritize easy access to your money.",
    "difficulty": 0.3,
    "visa_variants": {{
      "F1": {{
        "additional_context": "As an F1 student, you can open a checking account with your passport and I-20 form."
      }}
    }}
  }}
]

Generate {count} questions following this format:"""


def get_skill_info(db, skill_slug):
    """Get skill information from database."""
    skill = db.collections.knowledge_components.find_one({'slug': skill_slug})
    if not skill:
        return None

    return {
        'slug': skill_slug,
        'name': skill.get('name', skill_slug),
        'description': skill.get('description', ''),
        'domain': skill.get('domain', ''),
        'difficulty_tier': skill.get('difficulty_tier', 1),
        'bloom_level': skill.get('bloom_level', 'remember')
    }


def generate_questions_for_skill(skill_slug, count=10, llm_provider=None):
    """Generate questions for a specific skill using LLM."""
    print(f"\n{'=' * 60}")
    print(f"GENERATING QUESTIONS: {skill_slug}")
    print(f"{'=' * 60}")

    db = Database()
    if not db.is_connected:
        print("❌ Database not connected")
        return None

    # Get skill info
    skill_info = get_skill_info(db, skill_slug)
    if not skill_info:
        print(f"❌ Skill not found: {skill_slug}")
        return None

    print(f"\n📚 Skill: {skill_info['name']}")
    print(f"   Domain: {skill_info['domain']}")
    print(f"   Tier: {skill_info['difficulty_tier']}")
    print(f"   Generating: {count} questions")

    # Prepare prompt
    prompt = LLM_PROMPT_TEMPLATE.format(
        count=count,
        skill_name=skill_info['name'],
        skill_description=skill_info.get('description', f"Financial literacy concept: {skill_info['name']}")
    )

    # Generate using LLM
    print(f"\n🤖 Generating questions using {llm_provider or 'default'} LLM...")

    try:
        llm = LLMService(provider=llm_provider)
        response = llm.generate_content(
            prompt,
            max_tokens=4000,
            temperature=0.7
        )

        # Parse JSON response
        # Try to extract JSON from markdown code blocks if present
        if '```json' in response:
            response = response.split('```json')[1].split('```')[0].strip()
        elif '```' in response:
            response = response.split('```')[1].split('```')[0].strip()

        questions = json.loads(response)

        print(f"✅ Generated {len(questions)} questions")

        # Validate questions
        validated = []
        for i, q in enumerate(questions, 1):
            if validate_question(q):
                validated.append(q)
            else:
                print(f"⚠️  Question {i} failed validation")

        print(f"✅ Validated {len(validated)}/{len(questions)} questions")

        return {
            'skill': skill_info,
            'questions': validated,
            'generated_at': datetime.utcnow().isoformat()
        }

    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse LLM response as JSON: {e}")
        print(f"\nRaw response:\n{response[:500]}...")
        return None
    except Exception as e:
        print(f"❌ Error generating questions: {e}")
        return None


def validate_question(question):
    """Validate question format."""
    required_fields = ['stem', 'choices', 'correct_answer', 'explanation', 'difficulty']

    for field in required_fields:
        if field not in question:
            return False

    # Validate choices
    if not isinstance(question['choices'], list) or len(question['choices']) != 4:
        return False

    # Validate correct_answer
    if not isinstance(question['correct_answer'], int) or question['correct_answer'] not in range(4):
        return False

    # Validate difficulty
    if question['difficulty'] not in [0.3, 0.5, 0.7]:
        return False

    return True


def save_questions_to_file(result, output_dir='generated_questions'):
    """Save generated questions to a JSON file for review."""
    os.makedirs(output_dir, exist_ok=True)

    filename = f"{result['skill']['slug']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\n💾 Saved to: {filepath}")
    return filepath


def insert_questions_to_db(filepath):
    """Insert reviewed questions into database."""
    print(f"\n{'=' * 60}")
    print(f"INSERTING QUESTIONS FROM: {filepath}")
    print(f"{'=' * 60}")

    with open(filepath, 'r') as f:
        data = json.load(f)

    db = Database()
    if not db.is_connected:
        print("❌ Database not connected")
        return

    skill_slug = data['skill']['slug']
    questions = data['questions']

    # Get skill
    skill = db.collections.knowledge_components.find_one({'slug': skill_slug})
    if not skill:
        print(f"❌ Skill not found: {skill_slug}")
        return

    kc_id = str(skill['_id'])

    print(f"\n📚 Skill: {data['skill']['name']}")
    print(f"   Inserting {len(questions)} questions...")

    inserted = 0
    for q in questions:
        try:
            # Create learning item
            item_id = db.collections.create_learning_item(
                item_type='multiple_choice',
                content={
                    'stem': q['stem'],
                    'choices': q['choices'],
                    'correct_answer': q['correct_answer'],
                    'explanation': q['explanation'],
                    'visa_variants': q.get('visa_variants', {})
                },
                difficulty=q['difficulty'],
                discrimination=1.0,  # Default, will be calibrated later
                media_url=q.get('media_url')
            )

            # Map to KC
            db.collections.create_item_kc_mapping(
                item_id=item_id,
                kc_id=kc_id,
                weight=1.0
            )

            inserted += 1
        except Exception as e:
            print(f"⚠️  Error inserting question: {e}")

    print(f"\n✅ Inserted {inserted}/{len(questions)} questions")


def generate_batch(domain, count_per_skill=10, llm_provider=None):
    """Generate questions for all skills in a domain."""
    if domain not in SKILLS_BY_DOMAIN:
        print(f"❌ Unknown domain: {domain}")
        print(f"   Available: {', '.join(SKILLS_BY_DOMAIN.keys())}")
        return

    skills = SKILLS_BY_DOMAIN[domain]
    print(f"\n{'=' * 60}")
    print(f"BATCH GENERATION: {domain.upper()}")
    print(f"{'=' * 60}")
    print(f"\nGenerating {count_per_skill} questions for {len(skills)} skills")
    print(f"Total questions: {len(skills) * count_per_skill}")

    results = []

    for i, skill_slug in enumerate(skills, 1):
        print(f"\n[{i}/{len(skills)}]")
        result = generate_questions_for_skill(skill_slug, count_per_skill, llm_provider)

        if result:
            filepath = save_questions_to_file(result)
            results.append(filepath)
        else:
            print(f"⚠️  Skipping {skill_slug}")

    print(f"\n{'=' * 60}")
    print(f"BATCH COMPLETE")
    print(f"{'=' * 60}")
    print(f"\n✅ Generated {len(results)}/{len(skills)} skill question sets")
    print(f"\n📁 Review files in: generated_questions/")
    print(f"\n💡 To insert into database after review:")
    for filepath in results:
        print(f"   python scripts/generate_all_content.py --insert {filepath}")


def main():
    """Main CLI."""
    parser = argparse.ArgumentParser(description='Generate questions using LLM')

    parser.add_argument('--skill', help='Skill slug to generate questions for')
    parser.add_argument('--count', type=int, default=10, help='Number of questions')
    parser.add_argument('--batch', help='Generate for all skills in domain')
    parser.add_argument('--all', action='store_true', help='Generate for all domains')
    parser.add_argument('--insert', help='Insert questions from JSON file')
    parser.add_argument('--llm', choices=['openai', 'gemini', 'anthropic'],
                        help='LLM provider to use')

    args = parser.parse_args()

    if args.insert:
        insert_questions_to_db(args.insert)
    elif args.all:
        for domain in SKILLS_BY_DOMAIN.keys():
            generate_batch(domain, args.count, args.llm)
    elif args.batch:
        generate_batch(args.batch, args.count, args.llm)
    elif args.skill:
        result = generate_questions_for_skill(args.skill, args.count, args.llm)
        if result:
            save_questions_to_file(result)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
