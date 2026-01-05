# Content Integration Plan

## Goal
Add educational content pages alongside quiz questions in existing modules, using the same UI/UX as quiz pages.

## Current State
- ✅ 33 lessons with 117 content blocks in database
- ✅ 106 multiple-choice questions in database
- ✅ LessonPage.tsx already has `ContentStep` and `QuizStep` types defined
- ✅ Beautiful quiz UI with voice support, animations, etc.

## Implementation Steps

### Step 1: Link Questions to Lessons (Backend)
Create a script to:
1. Map each question to its corresponding lesson based on skill_slug
2. Add `questions` array to each lesson document
3. Interleave content_blocks and questions for optimal learning flow

### Step 2: Update API Endpoint (Backend)
Modify `/api/curriculum/lessons/<lesson_id>` to return:
```json
{
  "lesson": {...},
  "steps": [
    {"type": "content", "content_block": {...}},
    {"type": "quiz", "question": {...}},
    {"type": "content", "content_block": {...}},
    {"type": "quiz", "question": {...}}
  ]
}
```

### Step 3: Update LessonPage Component (Frontend)
1. Render ContentStep with same styling as quiz
2. Show "Next" button instead of "Check" for content
3. Support all content block types:
   - `concept`: Text with key facts
   - `reference_table`: Tables
   - `example`: Real-world examples
   - `tip`: Helpful tips
   - `warning`: Important warnings

### Step 4: Prepare for Media Assets
Ensure content blocks can reference media:
- Images
- Animations (Lottie)
- Videos
- Interactive calculators

## Content Block Types to Support

1. **Concept** - Educational text with key facts
2. **Reference Table** - Data tables (currency, fees, etc.)
3. **Example** - Real-world scenarios
4. **Tip** - Helpful advice
5. **Warning** - Important cautions
6. **Media** - Images, animations, videos (future)

## UI Design
- Same card layout as quiz
- Same progress bar at top
- Same "Next" button styling (green, bold)
- Same animations and transitions
- Voice support for reading content aloud
- Translation support for all content

## Next Actions
1. Create script to link questions to lessons
2. Update curriculum API endpoint
3. Update LessonPage to render content steps
4. Test with one module first
5. Roll out to all modules

