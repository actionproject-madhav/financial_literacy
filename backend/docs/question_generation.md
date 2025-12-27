# Question Generation & Import System

Complete system for importing and managing financial literacy questions in the FinLit database.

## Quick Start

### 1. Prepare Your Seed Questions File

Place your questions in `backend/scripts/seed_questions.json` with this structure:

```json
{
  "metadata": {
    "version": "1.0.0",
    "total_questions": 154,
    "domains": ["banking", "credit", "money-management", "investing", "retirement", "taxes", "cryptocurrency"]
  },
  "knowledge_components": [
    {
      "slug": "checking-accounts",
      "name": "Checking Accounts",
      "domain": "banking",
      "difficulty_tier": 1,
      "bloom_level": "understand",
      "estimated_minutes": 15,
      "description": "Understanding checking accounts for daily transactions"
    }
  ],
  "questions": [
    {
      "skill_slug": "checking-accounts",
      "item_type": "multiple_choice",
      "content": {
        "stem": "What is the main purpose of a checking account?",
        "choices": [
          "To earn high interest on savings",
          "To manage daily transactions and pay bills",
          "To invest in the stock market",
          "To build credit history"
        ],
        "correct_answer": 1,
        "explanation": "A checking account is designed for managing day-to-day transactions like deposits, withdrawals, and bill payments.",
        "visa_variants": {
          "F1": {
            "additional_context": "As an F1 student, you can open a checking account with your passport and I-20 form."
          }
        }
      },
      "difficulty": 0.3,
      "discrimination": 1.0,
      "media_type": null,
      "media_url": null,
      "allows_llm_personalization": true,
      "is_active": true
    }
  ]
}
```

### 2. Import Questions into Database

```bash
cd financial_literacy/backend
python3 scripts/generate_questions.py import-seed
```

This will:
- Import all knowledge components from the JSON file
- Import all questions
- Create proper item-KC mappings
- Skip duplicates automatically

### 3. Check Statistics

```bash
python3 scripts/generate_questions.py stats
```

## Commands

### `import-seed`
Import all questions from `seed_questions.json`:
```bash
python3 scripts/generate_questions.py import-seed
```

### `stats`
Show question statistics by skill, difficulty, etc.:
```bash
python3 scripts/generate_questions.py stats
```

### `clean` (optional)
Remove all existing questions before importing:
```bash
python3 scripts/generate_questions.py clean --yes
```

### `generate` (optional - requires Anthropic API)
Generate additional questions for a specific skill:
```bash
python3 scripts/generate_questions.py generate --skill checking-accounts --count 10
```

### `generate-all` (optional - requires Anthropic API)
Generate questions for all skills:
```bash
python3 scripts/generate_questions.py generate-all --count-per-skill 15
```

### `export-for-review`
Export all questions to CSV for expert review:
```bash
python3 scripts/generate_questions.py export-for-review --output questions_reviewed.csv
```

### `import-reviewed`
Import reviewed CSV with approval status:
```bash
python3 scripts/generate_questions.py import-reviewed --input questions_reviewed.csv
```

## Question Format

Each question in `seed_questions.json` must have:

- **skill_slug**: Links question to a knowledge component
- **item_type**: Currently only "multiple_choice"
- **content**: Object containing:
  - **stem**: Question text
  - **choices**: Array of exactly 4 options
  - **correct_answer**: Index (0-3) of correct choice
  - **explanation**: 2-3 sentence explanation
  - **visa_variants**: (optional) F1/H1B specific context
- **difficulty**: 0.0 (easy) to 1.0 (hard)
- **discrimination**: IRT parameter (default: 1.0)
- **is_active**: true/false

## Database Structure

After import, questions are stored in:

- **learning_items** collection: All questions
- **item_kc_mappings** collection: Links questions to skills
- **knowledge_components** collection: Skills/topics

## Troubleshooting

### "Seed file not found"
Make sure `seed_questions.json` is in `backend/scripts/` directory.

### "Unknown skill slug"
The skill must exist in the `knowledge_components` array of your JSON file, or be imported first.

### "Duplicate found"
The system automatically skips questions with identical stems (case-insensitive).

### Import errors
Check that:
- JSON file is valid
- All required fields are present
- Database connection is working
- Knowledge components are imported first

## Next Steps

1. Add your questions to `seed_questions.json`
2. Run `import-seed` to import into database
3. Verify with `stats` command
4. Test your application with the imported questions
