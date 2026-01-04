# XP Tracking & Leaderboard Integration - FIXED

## Issue Identified

Previously, not all XP sources were updating the `daily_progress` collection, which meant:
- Leaderboard only showed XP from lesson completions
- XP from quests, referrals, and achievements weren't counted in weekly rankings
- Incomplete picture of user activity

## All XP Sources Now Tracked

### 1. Lesson Completions ✅ (Already Working)
**File:** `backend/blueprints/curriculum.py:489-499`

```python
# Award XP
db.collections.learners.update_one(
    {'_id': learner_oid},
    {'$inc': {'total_xp': xp_earned}}
)

# Update daily progress
db.collections.update_daily_progress(
    learner_id=learner_id,
    date_obj=today,
    xp_earned=xp_earned,
    lessons_completed=1,
    minutes_practiced=time_spent_minutes
)
```

### 2. Quest Claims ✅ (FIXED)
**File:** `backend/blueprints/quests.py:369-382`

```python
# Award XP
db.collections.learners.update_one(
    {'_id': learner_oid},
    {'$inc': {'total_xp': quest_def['xp_reward']}}
)

# Update daily progress for leaderboard tracking (NEW)
from datetime import date
today = date.today()
db.collections.update_daily_progress(
    learner_id=learner_id,
    date_obj=today,
    xp_earned=quest_def['xp_reward']
)
```

### 3. Referral Rewards ✅ (FIXED)
**File:** `backend/blueprints/social.py:919-933`

```python
# Award XP to referrer
reward_xp = 100
db.collections.learners.update_one(
    {'_id': referrer['_id']},
    {'$inc': {'total_xp': reward_xp}}
)

# Update daily progress for leaderboard tracking (NEW)
from datetime import date
today = date.today()
db.collections.update_daily_progress(
    learner_id=referrer_id,
    date_obj=today,
    xp_earned=reward_xp
)
```

### 4. Achievement Rewards ✅ (FIXED)
**File:** `backend/mongo_collections.py:323-338`

Updated the `add_xp()` helper function to always update daily progress:

```python
def add_xp(self, learner_id: str, xp_amount: int) -> bool:
    """Add XP to learner and update daily progress for leaderboard tracking"""
    result = self.learners.update_one(
        {'_id': ObjectId(learner_id)},
        {'$inc': {'total_xp': xp_amount}}
    )

    # Update daily progress for leaderboard tracking (NEW)
    today = date.today()
    self.update_daily_progress(
        learner_id=learner_id,
        date_obj=today,
        xp_earned=xp_amount
    )

    return result.modified_count > 0
```

This function is used by:
- Achievement awards (`award_achievement()`)
- Any future XP sources

## Database Schema

### learners collection
```json
{
  "_id": ObjectId,
  "total_xp": 1250,      // Lifetime XP (for leagues)
  "streak_count": 7,
  "streak_last_date": ISODate
}
```

### daily_progress collection
```json
{
  "_id": ObjectId,
  "learner_id": ObjectId,
  "date": ISODate("2024-01-15T00:00:00Z"),
  "xp_earned": 150,           // Daily XP (for leaderboard)
  "lessons_completed": 3,
  "minutes_practiced": 25,
  "goal_met": true
}
```

## How Leaderboard Works

**Weekly XP Calculation** (`backend/blueprints/leaderboard.py:50-65`):
```python
def get_weekly_xp(db, learner_id):
    week_start = get_start_of_week()  # Monday midnight UTC
    pipeline = [
        {'$match': {
            'learner_id': ObjectId(learner_id),
            'date': {'$gte': week_start}
        }},
        {'$group': {
            '_id': None,
            'total': {'$sum': '$xp_earned'}  # Sums from daily_progress
        }}
    ]
    result = db.collections.daily_progress.aggregate(pipeline)
    return result[0]['total'] if result else 0
```

**League Assignment** (based on total_xp):
- Bronze: 0+ XP
- Silver: 500+ XP
- Gold: 1,500+ XP
- Emerald: 3,000+ XP
- Diamond: 5,000+ XP
- Master: 10,000+ XP

## Impact

### Before
- Leaderboard only tracked lesson XP
- Quests/referrals didn't boost weekly rankings
- Social features felt disconnected from competition

### After
- ✅ All XP sources count toward weekly leaderboard
- ✅ Complete picture of user engagement
- ✅ Social features (referrals) now boost leaderboard position
- ✅ Daily/weekly quests directly impact rankings
- ✅ Achievement hunters rewarded in leaderboard

## Testing

To verify the fix works:

1. **Complete a quest:**
   ```bash
   POST /api/quests/{learner_id}/claim/{quest_id}
   # Check: daily_progress.xp_earned should increase
   # Check: Weekly leaderboard should reflect new XP
   ```

2. **Refer a friend:**
   ```bash
   POST /api/social/referral/track
   # Check: Referrer's daily_progress.xp_earned += 100
   # Check: Referrer moves up on leaderboard
   ```

3. **Earn achievement:**
   ```python
   db.collections.award_achievement(learner_id, achievement_id)
   # Check: daily_progress.xp_earned increases by achievement.xp_reward
   ```

4. **Complete lesson:**
   ```bash
   POST /api/curriculum/lessons/{kc_id}/complete
   # Check: Both total_xp and daily_progress.xp_earned update
   ```

## Summary

✅ **All XP sources now update both:**
1. `learners.total_xp` - For league assignment
2. `daily_progress.xp_earned` - For weekly leaderboard

✅ **No caching** - All data directly from MongoDB
✅ **Real-time rankings** - Aggregated on each request
✅ **Complete tracking** - Every XP source counted

---

**Status:** ✅ COMPLETE
**Impact:** HIGH - Leaderboard now accurately reflects all user activity
