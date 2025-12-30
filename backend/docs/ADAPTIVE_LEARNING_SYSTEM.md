# Adaptive Learning System

## Overview
The backend includes a complete adaptive learning recommendation system that tracks mastery (ELO-like rating), selects optimal questions, and personalizes the learning experience. Currently, the MVP uses a simple sequential question list, but the adaptive system is fully functional and ready to use.

## Current Implementation Status

### ✅ What's Working Now

1. **Mastery/ELO Tracking (BKT)**
   - Every question answer updates mastery using Bayesian Knowledge Tracing
   - Mastery is stored in `learner_skill_states.p_mastery`
   - Updates happen in real-time via `/api/adaptive/interactions`
   - Frontend calls `adaptiveApi.logInteraction()` for each answer

2. **Spaced Repetition (FSRS)**
   - Tracks when to review content using Free Spaced Repetition Scheduler
   - Calculates optimal review intervals based on performance
   - Stores `next_review_at` in skill states

3. **Item Response Theory (IRT)**
   - Calibrates question difficulty based on learner performance
   - Predicts probability of correct answer
   - Updates item difficulty and discrimination parameters

4. **Interaction Logging**
   - All question answers are logged to `interactions` collection
   - Includes response time, correctness, hints used
   - Used to update all adaptive models

### 📋 Current MVP Behavior

**Question Selection:**
- Uses `/api/curriculum/lessons/<kc_id>/questions` 
- Returns all questions in sequential order
- Simple, predictable for MVP

**Mastery Updates:**
- ✅ Each answer updates mastery via adaptive engine
- ✅ Lesson completion uses existing mastery values
- ✅ Mastery persists across sessions

### 🚀 Future: Adaptive Question Selection

When ready to enable adaptive recommendations, use these endpoints:

#### Option 1: Get Next Item (One at a time)
```javascript
// Get the next optimal question for a learner
const nextItem = await adaptiveApi.getNextItem(learnerId, kcId)
// Returns: item with predicted difficulty, mastery level, etc.
```

#### Option 2: Create Adaptive Session
```javascript
// Create a full adaptive learning session
const session = await adaptiveApi.startSession({
  learner_id: learnerId,
  session_length: 10  // Number of questions
})
// Returns: Array of optimally selected questions
```

## How Mastery/ELO Works

### Bayesian Knowledge Tracing (BKT)
- Tracks probability of mastery: `P(mastery | performance)`
- Updates after each answer using Bayes' rule
- Parameters:
  - `p_init`: Initial mastery probability (0.1)
  - `p_learn`: Learning rate (0.3)
  - `p_guess`: Guess probability (0.2)
  - `p_slip`: Slip probability (0.1)

### Mastery Thresholds
- **Locked**: `p_mastery < 0.1` (not started)
- **Available**: `0.1 <= p_mastery < 0.5` (unlocked, in progress)
- **In Progress**: `0.5 <= p_mastery < 0.95` (actively learning)
- **Mastered**: `p_mastery >= 0.95` (skill mastered)

### Example Flow
1. User answers question correctly → BKT increases `p_mastery`
2. User answers incorrectly → BKT decreases `p_mastery` (but considers guess probability)
3. After multiple correct answers → `p_mastery` approaches 1.0
4. When `p_mastery >= 0.95` → Status changes to "mastered"

## API Endpoints

### Adaptive Learning Endpoints

#### `POST /api/adaptive/interactions`
Log a question answer and update all models.

**Request:**
```json
{
  "learner_id": "...",
  "item_id": "...",
  "kc_id": "...",
  "is_correct": true,
  "response_value": {"selected_choice": 2},
  "response_time_ms": 12000,
  "hint_used": false
}
```

**Response:**
```json
{
  "success": true,
  "skill_state": {
    "kc_id": "...",
    "p_mastery": 0.82,
    "mastery_change": 0.15,
    "status": "in_progress",
    "next_review_at": "2025-01-15T10:00:00Z"
  },
  "xp_earned": 20
}
```

#### `GET /api/adaptive/next-item`
Get the next optimal question (for future adaptive selection).

**Query Params:**
- `learner_id`: Required
- `kc_id`: Optional (specific skill to practice)

**Response:**
```json
{
  "item_id": "...",
  "item_type": "multiple_choice",
  "content": {...},
  "kc_id": "...",
  "predicted_p_correct": 0.65,
  "p_mastery": 0.75,
  "is_review": false
}
```

#### `POST /api/adaptive/sessions/start`
Create an adaptive learning session (for future use).

**Request:**
```json
{
  "learner_id": "...",
  "session_length": 10
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "items": [
    {
      "item_id": "...",
      "predicted_p_correct": 0.65,
      "position": 0
    }
  ]
}
```

## Database Schema

### `learner_skill_states`
Tracks mastery and progress for each skill:
```javascript
{
  learner_id: ObjectId,
  kc_id: ObjectId,
  p_mastery: 0.82,           // Mastery probability (0-1)
  status: "in_progress",     // locked | available | in_progress | mastered
  total_attempts: 15,
  correct_count: 12,
  next_review_at: Date,       // FSRS scheduled review
  last_practiced_at: Date,
  mastered_at: Date
}
```

### `interactions`
Logs all question answers:
```javascript
{
  learner_id: ObjectId,
  item_id: ObjectId,
  kc_id: ObjectId,
  is_correct: true,
  response_time_ms: 12000,
  p_mastery_before: 0.75,
  predicted_p_correct: 0.65,
  created_at: Date
}
```

## Enabling Adaptive Recommendations

To switch from sequential to adaptive question selection:

1. **Update Frontend** (`LessonPage.tsx`):
   ```typescript
   // Instead of:
   const questions = await curriculumApi.getLessonQuestions(kcId, learnerId)
   
   // Use:
   const session = await adaptiveApi.startSession({
     learner_id: learnerId,
     session_length: 10
   })
   const questions = session.items
   ```

2. **Or use one-at-a-time selection**:
   ```typescript
   // Get next question adaptively
   const nextItem = await adaptiveApi.getNextItem(learnerId, kcId)
   ```

3. **Keep interaction logging** (already working):
   ```typescript
   // This already updates mastery
   await adaptiveApi.logInteraction({...})
   ```

## Testing the Adaptive System

### Check Mastery Updates
```python
# In Python shell
from database import Database
db = Database()
state = db.collections.learner_skill_states.find_one({
    'learner_id': ObjectId(learner_id),
    'kc_id': ObjectId(kc_id)
})
print(f"Mastery: {state['p_mastery']}, Status: {state['status']}")
```

### Test Adaptive Selection
```bash
# Get next adaptive question
curl "http://localhost:5000/api/adaptive/next-item?learner_id=...&kc_id=..."
```

## Summary

✅ **Mastery/ELO is being tracked** - Every answer updates BKT mastery  
✅ **Recommendation system exists** - Ready to use when needed  
✅ **Currently using sequential list** - Simple for MVP  
✅ **Easy to switch to adaptive** - Just change question fetching endpoint  

The adaptive learning system is production-ready and will automatically:
- Select optimal difficulty questions
- Focus on weak areas
- Schedule reviews at optimal times
- Personalize to each learner's skill level

