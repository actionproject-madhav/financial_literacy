# Phase 2: Algorithm Services - Usage Guide

## Overview

Phase 2 implements adaptive learning algorithms that power personalized content selection and mastery tracking. The system combines four key algorithms:

1. **BKT (Bayesian Knowledge Tracing)**: Tracks probability of skill mastery
2. **FSRS (Free Spaced Repetition Scheduler)**: Optimizes review timing for long-term retention
3. **IRT (Item Response Theory)**: Calibrates item difficulty and matches to learner ability
4. **Content Selector**: Intelligently selects next learning item

All services are unified in the `LearningEngine` for easy integration.

## Quick Start

### Basic Usage

```python
from database import Database
from services import LearningEngine

# Initialize database
db = Database()
if not db.is_connected:
    print("Database connection failed")
    exit(1)

# Create learning engine
engine = LearningEngine(db.collections)

# Get next item for a learner
learner_id = "507f1f77bcf86cd799439011"
next_item = engine.get_next_item(learner_id)

if next_item:
    print(f"Next item: {next_item['item']['content']['stem']}")
    print(f"Knowledge component: {next_item['kc']['name']}")
    print(f"Predicted difficulty: {next_item['predicted_p_correct']:.2f}")
    print(f"Current mastery: {next_item['p_mastery']:.2f}")
```

### Submitting Learner Answers

```python
# Learner submits an answer
result = engine.submit_answer(
    learner_id="507f1f77bcf86cd799439011",
    item_id="507f1f77bcf86cd799439012",
    kc_id="507f1f77bcf86cd799439013",
    is_correct=True,
    response_value={"selected_choice": 2},
    response_time_ms=12000,
    hint_used=False,
    session_id="unique-session-id"
)

print(f"Mastery updated: {result['p_mastery_before']:.2f} → {result['p_mastery_after']:.2f}")
print(f"Next review: {result['next_review_date']}")
print(f"XP earned: {result['xp_earned']}")
```

### Creating Learning Sessions

```python
# Create a 5-item learning session
session = engine.create_learning_session(learner_id, target_items=5)

for i, item_data in enumerate(session):
    print(f"\n{i+1}. {item_data['item']['content']['stem']}")
    print(f"   KC: {item_data['kc']['name']}")
    print(f"   Predicted p(correct): {item_data['predicted_p_correct']:.2f}")
```

## Individual Services

### 1. Bayesian Knowledge Tracing (BKT)

```python
from services import BayesianKnowledgeTracer, BKTParams

bkt = BayesianKnowledgeTracer(db.collections)

# Initialize skill state with custom parameters
params = BKTParams(
    p_init=0.1,    # Initial mastery probability
    p_learn=0.15,  # Learning rate
    p_slip=0.1,    # Slip probability
    p_guess=0.25   # Guess probability
)

bkt.initialize_skill_state(learner_id, kc_id, params)

# Update mastery after interaction
new_mastery = bkt.update_mastery(learner_id, kc_id, is_correct=True)
print(f"New mastery: {new_mastery:.2f}")

# Get mastery status
status = bkt.get_mastery_status(learner_id, kc_id)
print(f"Status: {status['status']}")
print(f"Mastery: {status['p_mastery']:.2f}")
print(f"Is mastered: {status['is_mastered']}")

# Predict correctness
p_correct = bkt.predict_correctness(learner_id, kc_id)
print(f"Predicted p(correct): {p_correct:.2f}")
```

### 2. FSRS Scheduler

```python
from services import FSRSScheduler

fsrs = FSRSScheduler(db.collections)

# Schedule a review based on performance
# Rating: 1=again, 2=hard, 3=good, 4=easy
schedule = fsrs.schedule_review(
    learner_id=learner_id,
    kc_id=kc_id,
    rating=3  # Good
)

print(f"Next review: {schedule['next_review_date']}")
print(f"Interval: {schedule['interval_days']} days")
print(f"Stability: {schedule['stability']:.2f}")
print(f"Difficulty: {schedule['difficulty']:.2f}")

# Get due reviews
due = fsrs.get_due_reviews(learner_id)
for review in due:
    print(f"KC {review['kc_id']} - {review['days_overdue']:.1f} days overdue")

# Get upcoming reviews
upcoming = fsrs.get_upcoming_reviews(learner_id, days_ahead=7)
for review in upcoming:
    print(f"KC {review['kc_id']} - in {review['days_until']} days")

# Get current retention rate
retention = fsrs.get_retention_rate(learner_id, kc_id)
print(f"Current retention: {retention:.2%}")
```

### 3. IRT Calibration

```python
from services import IRTCalibrator

irt = IRTCalibrator(db.collections)

# Estimate learner ability
theta = irt.estimate_ability(learner_id)
print(f"Learner ability (theta): {theta:.2f}")

# Calibrate a single item
result = irt.update_item_parameters(item_id)
print(f"Difficulty: {result['difficulty']:.2f}")
print(f"Discrimination: {result['discrimination']:.2f}")
print(f"Sample size: {result['sample_size']}")

# Calibrate all items with sufficient data
results = irt.calibrate_all_items(min_responses=10)
print(f"Calibrated {len(results)} items")

# Predict performance
p_correct = irt.predict_performance(learner_id, item_id)
print(f"Predicted p(correct): {p_correct:.2f}")

# Get item analysis
analysis = irt.get_item_analysis(item_id)
print(f"Item difficulty: {analysis['difficulty']:.2f}")
print(f"P-value: {analysis['p_value']:.2f}")
print(f"Needs calibration: {analysis['needs_calibration']}")

# Get ability distribution
distribution = irt.get_ability_distribution()
print(f"Mean ability: {distribution['mean']:.2f}")
print(f"Std dev: {distribution['std']:.2f}")
```

### 4. Content Selector

```python
from services import ContentSelector

selector = ContentSelector(db.collections, bkt, fsrs, irt)

# Select next KC to study
kc_id = selector.select_next_kc(learner_id)
print(f"Next KC: {kc_id}")

# Select item for specific KC
item = selector.select_item_for_kc(learner_id, kc_id)
print(f"Selected item: {item['item_id']}")
print(f"Predicted difficulty: {item['predicted_p_correct']:.2f}")

# Get available KCs
available = selector.get_available_kcs(learner_id)
for kc_data in available:
    print(f"KC: {kc_data['kc']['name']}")
    print(f"Status: {kc_data['skill_state']['status']}")

# Check if review is due
is_due = selector.should_review(learner_id, kc_id)
print(f"Review due: {is_due}")
```

## Learning Engine API Reference

### Core Learning Flow

#### `get_next_item(learner_id, kc_id=None)`
Get the next optimal learning item.

**Returns:**
```python
{
    'item_id': str,
    'item': {...},              # Full item document
    'kc_id': str,
    'kc': {...},                # Full KC document
    'predicted_p_correct': float,
    'is_review': bool,
    'p_mastery': float,
    'selection_method': 'adaptive',
    'difficulty': float,
    'discrimination': float
}
```

#### `submit_answer(...)`
Submit answer and update all models.

**Returns:**
```python
{
    'interaction_id': str,
    'p_mastery_before': float,
    'p_mastery_after': float,
    'mastery_change': float,
    'next_review_date': datetime,
    'fsrs_stability': float,
    'fsrs_difficulty': float,
    'xp_earned': int,
    'is_correct': bool
}
```

### Analytics and Progress

#### `get_mastery_overview(learner_id)`
Get comprehensive mastery statistics.

**Returns:**
```python
{
    'total_kcs': int,
    'mastered': int,
    'in_progress': int,
    'available': int,
    'locked': int,
    'avg_mastery': float,
    'kcs': [...]              # List of KC progress
}
```

#### `get_learner_analytics(learner_id)`
Get full analytics dashboard data.

**Returns:**
```python
{
    'learner_id': str,
    'display_name': str,
    'total_xp': int,
    'streak_count': int,
    'mastery_overview': {...},
    'recent_accuracy': float,
    'estimated_ability': float,
    'total_interactions': int,
    'daily_progress': [...]
}
```

#### `get_learning_path(learner_id)`
Get recommended learning path.

**Returns:**
```python
[
    {
        'kc_id': str,
        'kc_name': str,
        'reason': 'review_due|in_progress|new_topic',
        'priority': 'high|medium|low',
        'retrievability': float  # For reviews
    },
    ...
]
```

### Review Management

#### `get_review_schedule(learner_id, days_ahead=7)`
Get review schedule.

**Returns:**
```python
{
    'due_now': int,
    'due_items': [...],
    'upcoming': [...],
    'total_upcoming': int
}
```

### Utilities

#### `initialize_learner_kcs(learner_id)`
Initialize all tier-1 KCs for new learner.

#### `check_achievements(learner_id)`
Check and award new achievements.

#### `calibrate_item(item_id)`
Calibrate single item.

#### `calibrate_all_items(min_responses=10)`
Calibrate all items with sufficient data.

## Integration Example

Here's a complete example integrating with Flask API:

```python
from flask import Flask, request, jsonify
from database import Database
from services import LearningEngine

app = Flask(__name__)
db = Database()
engine = LearningEngine(db.collections)

@app.route('/api/learning/next-item', methods=['GET'])
def get_next_item():
    learner_id = request.args.get('learner_id')
    kc_id = request.args.get('kc_id')  # Optional

    item = engine.get_next_item(learner_id, kc_id)

    if not item:
        return jsonify({'error': 'No items available'}), 404

    return jsonify({
        'item_id': item['item_id'],
        'content': item['item']['content'],
        'kc_name': item['kc']['name'],
        'predicted_difficulty': item['predicted_p_correct'],
        'current_mastery': item['p_mastery']
    })

@app.route('/api/learning/submit-answer', methods=['POST'])
def submit_answer():
    data = request.json

    result = engine.submit_answer(
        learner_id=data['learner_id'],
        item_id=data['item_id'],
        kc_id=data['kc_id'],
        is_correct=data['is_correct'],
        response_value=data['response_value'],
        response_time_ms=data['response_time_ms'],
        hint_used=data.get('hint_used', False),
        session_id=data.get('session_id')
    )

    return jsonify({
        'correct': result['is_correct'],
        'mastery_change': result['mastery_change'],
        'xp_earned': result['xp_earned'],
        'next_review': result['next_review_date'].isoformat()
    })

@app.route('/api/learning/session', methods=['GET'])
def create_session():
    learner_id = request.args.get('learner_id')
    items = int(request.args.get('items', 5))

    session = engine.create_learning_session(learner_id, items)

    return jsonify({
        'session_items': [
            {
                'item_id': item['item_id'],
                'content': item['item']['content'],
                'kc_name': item['kc']['name']
            }
            for item in session
        ]
    })

@app.route('/api/analytics/overview', methods=['GET'])
def get_overview():
    learner_id = request.args.get('learner_id')
    analytics = engine.get_learner_analytics(learner_id)
    return jsonify(analytics)

if __name__ == '__main__':
    app.run(debug=True)
```

## Best Practices

1. **Initialize new learners**: Always call `engine.initialize_learner_kcs(learner_id)` for new users
2. **Regular calibration**: Run `engine.calibrate_all_items()` periodically (daily/weekly)
3. **Achievement checks**: Call `engine.check_achievements(learner_id)` after significant progress
4. **Session management**: Use consistent `session_id` for related interactions
5. **Error handling**: Wrap calls in try/except to handle edge cases

## Algorithm Details

### BKT Update Formula
```
P(L_t|evidence) = P(evidence|L_t) * P(L_t) / P(evidence)
P(L_t+1) = P(L_t) + (1 - P(L_t)) * p_learn
```

### FSRS Retrievability
```
R = exp(ln(0.9) * days / stability)
```

### IRT 2PL Model
```
P(correct) = 1 / (1 + exp(-a * (theta - b)))
```
where:
- `a` = discrimination
- `b` = difficulty
- `theta` = learner ability

### Content Selection
Selects items with `predicted_p_correct ≈ 0.6` (zone of proximal development)

## Testing

Run the included test suite:

```bash
python -m pytest tests/test_services.py -v
```

## Performance Considerations

- BKT updates are O(1)
- FSRS scheduling is O(1)
- IRT calibration is O(n * iterations) where n = response count
- Content selection queries are optimized with indexes
- Use batch calibration during off-peak hours

## Troubleshooting

**No items returned**: Check that KC has mapped items and learner has available KCs

**Inaccurate predictions**: Ensure sufficient calibration data (min 10 responses per item)

**Review scheduling issues**: Verify FSRS data is being saved correctly in skill states

**Import errors**: Ensure all services are in the services/ directory and `__init__.py` exports them
