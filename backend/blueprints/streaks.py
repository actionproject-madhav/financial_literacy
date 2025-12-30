"""
Streaks API Blueprint

Provides endpoints for:
- Getting streak information
- Updating streaks
- Streak freeze management
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta

streaks_bp = Blueprint('streaks', __name__, url_prefix='/api/streaks')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def get_start_of_day(dt=None):
    """Get the start of a day (midnight UTC)"""
    if dt is None:
        dt = datetime.utcnow()
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def get_streak_calendar(db, learner_id, days=30):
    """Get streak calendar for the last N days"""
    end_date = get_start_of_day()
    start_date = end_date - timedelta(days=days - 1)

    # Get daily progress for date range
    progress = list(db.collections.daily_progress.find({
        'learner_id': ObjectId(learner_id),
        'date': {'$gte': start_date, '$lte': end_date}
    }))

    progress_map = {p['date'].date(): p for p in progress}

    calendar = []
    current_date = start_date
    while current_date <= end_date:
        day_progress = progress_map.get(current_date.date())
        calendar.append({
            'date': current_date.isoformat() + 'Z',
            'completed': day_progress.get('goal_met', False) if day_progress else False,
            'xp_earned': day_progress.get('xp_earned', 0) if day_progress else 0,
            'lessons_completed': day_progress.get('lessons_completed', 0) if day_progress else 0
        })
        current_date += timedelta(days=1)

    return calendar


@streaks_bp.route('/<learner_id>', methods=['GET'])
def get_streak(learner_id):
    """
    Get streak information for a learner.

    Response:
    {
        "current_streak": 5,
        "longest_streak": 12,
        "streak_alive": true,
        "hours_until_deadline": 8,
        "today_completed": true,
        "streak_freezes": 2,
        "calendar": [...]
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        current_streak = learner.get('streak_count', 0)
        longest_streak = learner.get('longest_streak', current_streak)
        streak_last_date = learner.get('streak_last_date')
        streak_freezes = learner.get('streak_freezes', 0)

        # Check if today's goal is completed
        today = get_start_of_day()
        today_progress = db.collections.daily_progress.find_one({
            'learner_id': learner_oid,
            'date': today
        })
        today_completed = today_progress.get('goal_met', False) if today_progress else False

        # Determine if streak is alive
        streak_alive = True
        if streak_last_date:
            days_since_last = (today - streak_last_date).days
            if days_since_last > 1 and not today_completed:
                streak_alive = False
        elif current_streak > 0 and not today_completed:
            streak_alive = False

        # Calculate hours until deadline (next midnight)
        now = datetime.utcnow()
        tomorrow = get_start_of_day() + timedelta(days=1)
        hours_until_deadline = (tomorrow - now).total_seconds() / 3600

        # Get streak calendar
        calendar = get_streak_calendar(db, learner_id, days=30)

        return jsonify({
            'current_streak': current_streak,
            'longest_streak': max(longest_streak, current_streak),
            'streak_alive': streak_alive,
            'hours_until_deadline': round(hours_until_deadline, 1),
            'today_completed': today_completed,
            'streak_freezes': streak_freezes,
            'calendar': calendar
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@streaks_bp.route('/<learner_id>/check', methods=['POST'])
def check_and_update_streak(learner_id):
    """
    Check and update streak based on daily progress.
    Called when a lesson is completed or daily goal is met.

    Response:
    {
        "streak_updated": true,
        "new_streak": 6,
        "streak_extended": true,
        "milestone_reached": 7
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        today = get_start_of_day()
        today_progress = db.collections.daily_progress.find_one({
            'learner_id': learner_oid,
            'date': today
        })

        if not today_progress or not today_progress.get('goal_met', False):
            return jsonify({
                'streak_updated': False,
                'new_streak': learner.get('streak_count', 0),
                'streak_extended': False,
                'message': 'Daily goal not yet met'
            }), 200

        current_streak = learner.get('streak_count', 0)
        streak_last_date = learner.get('streak_last_date')
        longest_streak = learner.get('longest_streak', 0)

        # Check if we already updated today
        if streak_last_date and streak_last_date.date() == today.date():
            return jsonify({
                'streak_updated': False,
                'new_streak': current_streak,
                'streak_extended': False,
                'message': 'Streak already updated today'
            }), 200

        # Calculate new streak
        streak_extended = False
        if streak_last_date:
            days_since_last = (today - streak_last_date).days
            if days_since_last == 1:
                # Consecutive day - extend streak
                new_streak = current_streak + 1
                streak_extended = True
            elif days_since_last == 0:
                # Same day - no change
                new_streak = current_streak
            else:
                # Streak broken - start new
                new_streak = 1
        else:
            # First day with streak
            new_streak = 1
            streak_extended = True

        # Update longest streak if needed
        new_longest = max(longest_streak, new_streak)

        # Check for milestones
        milestone_reached = None
        milestones = [7, 14, 30, 60, 100, 365]
        for m in milestones:
            if new_streak == m:
                milestone_reached = m
                break

        # Update learner
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {'$set': {
                'streak_count': new_streak,
                'streak_last_date': today,
                'longest_streak': new_longest
            }}
        )

        return jsonify({
            'streak_updated': True,
            'new_streak': new_streak,
            'streak_extended': streak_extended,
            'milestone_reached': milestone_reached,
            'longest_streak': new_longest
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@streaks_bp.route('/<learner_id>/freeze', methods=['POST'])
def use_streak_freeze(learner_id):
    """
    Use a streak freeze to protect streak for one day.

    Response:
    {
        "success": true,
        "remaining_freezes": 1
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        streak_freezes = learner.get('streak_freezes', 0)
        if streak_freezes <= 0:
            return jsonify({'error': 'No streak freezes available'}), 400

        # Check if already completed today (don't need freeze)
        today = get_start_of_day()
        today_progress = db.collections.daily_progress.find_one({
            'learner_id': learner_oid,
            'date': today
        })
        if today_progress and today_progress.get('goal_met', False):
            return jsonify({'error': 'Already completed today, freeze not needed'}), 400

        # Use freeze - mark today as completed without actual progress
        db.collections.daily_progress.update_one(
            {'learner_id': learner_oid, 'date': today},
            {
                '$set': {
                    'goal_met': True,
                    'freeze_used': True
                }
            },
            upsert=True
        )

        # Decrement freeze count
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {'$inc': {'streak_freezes': -1}}
        )

        return jsonify({
            'success': True,
            'remaining_freezes': streak_freezes - 1
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@streaks_bp.route('/<learner_id>/repair', methods=['POST'])
def repair_streak(learner_id):
    """
    Repair a broken streak (premium feature or using gems).

    Request body:
    {
        "gems_cost": 50
    }

    Response:
    {
        "success": true,
        "restored_streak": 5
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)
        data = request.get_json() or {}

        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        gems_cost = data.get('gems_cost', 50)
        current_gems = learner.get('gems', 0)

        if current_gems < gems_cost:
            return jsonify({'error': 'Not enough gems'}), 400

        # Get the streak before it was broken (from longest_streak)
        previous_streak = learner.get('longest_streak', 0)
        if previous_streak == 0:
            return jsonify({'error': 'No streak to repair'}), 400

        today = get_start_of_day()
        yesterday = today - timedelta(days=1)

        # Mark yesterday as completed to repair the gap
        db.collections.daily_progress.update_one(
            {'learner_id': learner_oid, 'date': yesterday},
            {
                '$set': {
                    'goal_met': True,
                    'streak_repaired': True
                }
            },
            upsert=True
        )

        # Restore streak and deduct gems
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {
                '$set': {
                    'streak_count': previous_streak,
                    'streak_last_date': yesterday
                },
                '$inc': {'gems': -gems_cost}
            }
        )

        return jsonify({
            'success': True,
            'restored_streak': previous_streak,
            'gems_spent': gems_cost
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@streaks_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200
