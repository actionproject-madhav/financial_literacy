# Leaderboard Implementation

## Overview
The leaderboard system is fully implemented and production-ready. It supports:
- Weekly XP tracking
- League-based rankings (Bronze → Silver → Gold → Emerald → Diamond → Master)
- Promotion zones (top 10 advance)
- Real-time rankings
- Mock data generation for testing

## Database Structure

### Collections Used

#### `learners`
Required fields:
- `total_xp` (int): Total lifetime XP (determines league)
- `display_name` (string): User's display name
- `streak_count` (int): Current streak count

#### `daily_progress`
Required fields:
- `learner_id` (ObjectId): Reference to learner
- `date` (datetime): Date of progress
- `xp_earned` (int): XP earned on this day
- `lessons_completed` (int): Number of lessons completed
- `minutes_practiced` (int): Minutes practiced

### Indexes
The following indexes are created automatically:
- `(learner_id, date)` - Unique index for daily progress
- `learner_id` - For learner lookups
- `date` - For weekly queries
- `(learner_id, date)` - Compound index for leaderboard queries

## API Endpoints

### `GET /api/leaderboard/my-league/<learner_id>`
Get the current user's league leaderboard.

**Response:**
```json
{
  "league": {
    "id": "gold",
    "name": "Gold",
    "min_xp": 1500,
    "color": "#FCD34D"
  },
  "rankings": [
    {
      "learner_id": "...",
      "display_name": "Alex Chen",
      "initials": "AC",
      "weekly_xp": 2847,
      "total_xp": 2500,
      "streak": 5,
      "rank": 1,
      "is_current_user": false
    }
  ],
  "my_rank": 5,
  "my_ranking": {...},
  "promotion_zone": true,
  "time_remaining": {
    "days": 2,
    "hours": 5,
    "total_seconds": 190800
  },
  "week_start": "2024-01-01T00:00:00Z",
  "week_end": "2024-01-07T23:59:59Z",
  "total_participants": 15
}
```

### `GET /api/leaderboard/`
Get leaderboard for a specific league or learner.

**Query Params:**
- `league` (optional): Filter by league ID
- `learner_id` (optional): Get leaderboard for learner's league
- `limit` (optional): Number of results (default 50, max 100)

### `GET /api/leaderboard/leagues`
Get all league definitions.

### `GET /api/leaderboard/<learner_id>`
Get a specific learner's ranking and league info.

## League System

### League Tiers
1. **Bronze** (0+ XP) - `#CD7F32`
2. **Silver** (500+ XP) - `#9CA3AF`
3. **Gold** (1500+ XP) - `#FCD34D`
4. **Emerald** (3000+ XP) - `#34D399`
5. **Diamond** (5000+ XP) - `#60A5FA`
6. **Master** (10000+ XP) - `#9B59B6`

### Promotion Rules
- Top 10 users in a league advance to the next league
- Weekly reset on Monday at midnight UTC
- Promotion zone is top 10 positions

## Mock Data

### Generating Mock Data
```bash
# Create 30 mock learners
python3 scripts/seed_leaderboard_mock_data.py --count 30

# Clear existing mock data and regenerate
python3 scripts/seed_leaderboard_mock_data.py --count 30 --clear
```

### Mock Data Features
- Distributes learners across all leagues
- Generates weekly XP for current week
- Creates realistic daily progress entries
- Marks mock users with `is_mock: true` for easy cleanup

### Cleaning Up Mock Data
```python
# In MongoDB shell or Python script
db.learners.delete_many({'is_mock': True})
```

## XP Tracking

### How XP is Tracked
1. When a learner completes a lesson/interaction, XP is awarded
2. XP is added to `learner.total_xp` (lifetime total)
3. XP is also recorded in `daily_progress.xp_earned` for the current day
4. Weekly XP is calculated by summing `daily_progress.xp_earned` for the current week

### Example: Recording XP
```python
from mongo_collections import FinLitCollections
from datetime import date

collections = FinLitCollections(db)

# Update daily progress (automatically handles upsert)
collections.update_daily_progress(
    learner_id="...",
    date_obj=date.today(),
    xp_earned=20,
    lessons_completed=1,
    minutes_practiced=15
)

# Update total XP
collections.learners.update_one(
    {'_id': ObjectId(learner_id)},
    {'$inc': {'total_xp': 20}}
)
```

## Edge Cases Handled

1. **No users in league**: Returns empty rankings array
2. **User with 0 weekly XP**: Included at bottom of rankings
3. **Missing fields**: Automatically initializes `total_xp` and `streak_count` to 0
4. **No daily_progress entries**: Returns 0 for weekly XP
5. **User not in database**: Returns 404 error
6. **Empty database**: Returns empty results gracefully

## Production Checklist

- ✅ Database indexes created
- ✅ Edge cases handled
- ✅ Error handling implemented
- ✅ Mock data generation script
- ✅ Backward compatibility (auto-initializes missing fields)
- ✅ Weekly reset logic (Monday midnight UTC)
- ✅ Promotion zone calculation
- ✅ Time remaining calculation

## Testing

### Test with Mock Data
1. Generate mock data: `python3 scripts/seed_leaderboard_mock_data.py --count 30`
2. Test API endpoint: `GET /api/leaderboard/my-league/<learner_id>`
3. Verify rankings, leagues, and promotion zones

### Test with Real Users
1. Ensure real users have `total_xp` field
2. Ensure `daily_progress` entries exist for current week
3. Test with users in different leagues

## Performance Considerations

- Indexes on `daily_progress` ensure fast weekly queries
- Aggregation pipelines are optimized for weekly XP calculation
- Leaderboard queries are limited to 100 results by default
- Weekly XP is calculated on-demand (consider caching for high traffic)

## Future Enhancements

- [ ] Caching for weekly XP calculations
- [ ] Historical leaderboard snapshots
- [ ] Demotion zones (bottom 10 drop down)
- [ ] League-specific rewards
- [ ] Friend leaderboards
- [ ] Global vs. regional leaderboards

