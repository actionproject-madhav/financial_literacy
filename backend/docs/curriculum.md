# FinLit Curriculum Content System

Gold-standard baseline curriculum content for the financial literacy platform. This content serves as the foundation that the LLM personalization layer builds upon.

## Content Philosophy

This curriculum follows a **hybrid content approach**:

1. **Baseline Content (This File)**: Comprehensive, professionally-written educational material covering all financial topics. No personalization, no cultural assumptions, no emojis.

2. **LLM Personalization Layer (Runtime)**: The platform's LLM dynamically adds:
   - Visa-specific context (F1, H1B, J1, etc.)
   - Cultural bridges based on user's background
   - Localized examples and comparisons
   - Personalized pacing and explanations

## Curriculum Overview

| Module | Lessons | Time | Prerequisites |
|--------|---------|------|---------------|
| Banking Fundamentals | 5 | 90 min | None |
| Credit Fundamentals | 5 | 120 min | Banking |
| Money Management | 3 | 75 min | Banking |
| US Tax Essentials | 3 | 75 min | None |
| Investing Fundamentals | 3 | 90 min | Money Management |
| Retirement Planning | 3 | 60 min | Investing |
| Insurance Essentials | 3 | 60 min | None |
| Consumer Protection | 2 | 45 min | None |
| Major Purchases | 2 | 45 min | Credit |
| Cryptocurrency Basics | 2 | 30 min | Investing |
| Financial Planning | 2 | 30 min | Money Mgmt, Investing |

**Total: 11 modules, 33 lessons, ~12 hours, 535 XP**

## Content Block Types

Each lesson contains structured content blocks:

| Block Type | Purpose | Count |
|------------|---------|-------|
| `concept` | Core explanations and definitions | 61 |
| `comparison` | Side-by-side comparisons (tables) | 12 |
| `reference_table` | Data tables with structured info | 10 |
| `procedure` | Step-by-step instructions | 9 |
| `calculation` | Math examples and calculations | 8 |
| `reference_list` | Lists of resources or options | 8 |
| `warning` | Critical mistakes to avoid | 4 |
| `definitions` | Key term definitions | 3 |
| `timeline` | Progress/timeline views | 1 |
| `checklist` | Action item checklists | 1 |

## File Structure

```
curriculum/
  01_banking.json          # Banking Fundamentals module
  02_credit.json           # Credit Fundamentals module
  03_money_management.json # Money Management module
  04_taxes.json            # US Tax Essentials module
  05_investing_retirement.json  # Investing + Retirement modules
  06_remaining_modules.json     # Insurance, Consumer, etc.

curriculum_builder.py      # Script to combine and import
finlit_curriculum.json     # Combined output file
```

## Usage

### Build Combined Curriculum
```bash
python curriculum_builder.py build
```
Creates `finlit_curriculum.json` with all modules combined.

### Import to MongoDB
```bash
# Set environment variables
export MONGO_URI=mongodb://localhost:27017
export DB_NAME=finlit

python curriculum_builder.py import
```

### View Statistics
```bash
python curriculum_builder.py stats
```

### Validate Structure
```bash
python curriculum_builder.py validate
```

## MongoDB Schema

### curriculum_modules Collection
```json
{
  "_id": ObjectId,
  "module_id": "banking-fundamentals",
  "name": "Banking Fundamentals",
  "description": "Understanding the US banking system...",
  "color": "#1CB0F6",
  "estimated_minutes": 90,
  "order": 1,
  "prerequisites": [],
  "lesson_count": 5,
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### curriculum_lessons Collection
```json
{
  "_id": ObjectId,
  "lesson_id": "checking-accounts",
  "module_id": "banking-fundamentals",
  "skill_slug": "checking-accounts",
  "title": "Checking Accounts",
  "order": 2,
  "estimated_minutes": 15,
  "xp_reward": 18,
  "learning_objectives": ["...", "..."],
  "content_blocks": [
    {
      "type": "concept",
      "id": "checking-purpose",
      "title": "What is a Checking Account",
      "content": { ... }
    }
  ],
  "is_active": true,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Content Guidelines

### Writing Style
- Clear, professional language
- No jargon without explanation
- Short sentences preferred
- No emojis or informal elements
- Define terms when first introduced

### Structure
- Each lesson has 3-6 content blocks
- Each block has a single, focused purpose
- Learning objectives are measurable
- Examples use realistic numbers

### What NOT to Include (LLM handles these)
- Visa-specific advice (F1, H1B, J1)
- Country-specific comparisons
- Cultural context or bridges
- Personalized recommendations
- Motivational language

## Integration with Question Bank

Lessons are linked to questions via `skill_slug`:

```
Lesson: checking-accounts (skill_slug: "checking-accounts")
  -> Questions with skill_slug: "checking-accounts"
```

The adaptive learning system:
1. Teaches concepts through lesson content
2. Assesses understanding via questions
3. Uses BKT/FSRS/IRT to track mastery
4. Personalizes content delivery via LLM

## Extending the Curriculum

### Adding a New Lesson
1. Create lesson object with required fields
2. Add to appropriate module file in `curriculum/`
3. Run `python curriculum_builder.py build`
4. Run `python curriculum_builder.py import`
5. Add corresponding questions to question bank

### Adding a New Module
1. Create new JSON file in `curriculum/`
2. Include `module` object with all fields
3. Set appropriate `order` value
4. Run build and import

### Content Block Template
```json
{
  "type": "concept",
  "id": "unique-block-id",
  "title": "Block Title",
  "content": {
    "definition": "...",
    "key_points": ["...", "..."],
    "example": { ... }
  }
}
```

## Quality Standards

All content meets these standards:
- Factually accurate as of 2024
- Legally compliant (not financial/legal advice)
- Accessible to non-native English speakers
- Platform-agnostic (works in any UI)
- Testable via question bank

## Version History

- **1.0.0** (2024-12): Initial gold-standard curriculum
  - 11 modules covering core financial literacy
  - 33 lessons with 117 content blocks
  - ~12 hours of educational content