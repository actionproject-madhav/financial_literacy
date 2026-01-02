"""
Quests API Blueprint

Provides endpoints for:
- Getting available quests (daily, weekly, special)
- Tracking quest progress
- Claiming quest rewards
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta

quests_bp = Blueprint('quests', __name__, url_prefix='/api/quests')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


# Quest definitions - these could be moved to database later
QUEST_DEFINITIONS = {
    'daily': [
        {
            'quest_id': 'earn_50_xp',
            'title': 'Earn 50 XP',
            'description': 'Complete lessons to earn experience points',
            'target': 50,
            'xp_reward': 10,
            'gems_reward': 5,  # Bonus gems for completing quest
            'icon': 'xp',
            'metric': 'xp_earned'
        },
        {
            'quest_id': 'complete_3_lessons',
            'title': 'Complete 3 Lessons',
            'description': 'Finish any 3 lessons today',
            'target': 3,
            'xp_reward': 15,
            'gems_reward': 10,  # Bonus gems for completing quest
            'icon': 'lesson',
            'metric': 'lessons_completed'
        },
        {
            'quest_id': 'perfect_score',
            'title': 'Perfect Score',
            'description': 'Get 100% on any lesson',
            'target': 1,
            'xp_reward': 25,
            'gems_reward': 15,  # Bonus gems for completing quest
            'icon': 'perfect',
            'metric': 'perfect_lessons'
        },
        {
            'quest_id': 'answer_10_correct',
            'title': 'Answer 10 Correctly',
            'description': 'Get 10 correct answers',
            'target': 10,
            'xp_reward': 10,
            'gems_reward': 5,  # Bonus gems for completing quest
            'icon': 'lesson',
            'metric': 'correct_answers'
        },
    ],
    'weekly': [
        {
            'quest_id': '7_day_streak',
            'title': '7 Day Streak',
            'description': 'Practice for 7 days in a row',
            'target': 7,
            'xp_reward': 100,
            'gems_reward': 50,  # Bonus gems for completing quest
            'icon': 'streak',
            'metric': 'streak_days'
        },
        {
            'quest_id': 'earn_500_xp_week',
            'title': 'Earn 500 XP This Week',
            'description': 'Accumulate 500 XP over the week',
            'target': 500,
            'xp_reward': 75,
            'gems_reward': 30,  # Bonus gems for completing quest
            'icon': 'xp',
            'metric': 'weekly_xp'
        },
        {
            'quest_id': 'complete_10_lessons_week',
            'title': 'Complete 10 Lessons',
            'description': 'Finish 10 lessons this week',
            'target': 10,
            'xp_reward': 50,
            'gems_reward': 25,  # Bonus gems for completing quest
            'icon': 'lesson',
            'metric': 'weekly_lessons'
        },
    ],
    'special': [
        {
            'quest_id': 'complete_banking_module',
            'title': 'Complete Banking Basics',
            'description': 'Finish all lessons in the Banking module',
            'target': 10,
            'xp_reward': 200,
            'gems_reward': 100,  # Bonus gems for completing quest
            'icon': 'lesson',
            'metric': 'banking_lessons',
            'domain': 'banking'
        },
        {
            'quest_id': 'complete_credit_module',
            'title': 'Master Credit',
            'description': 'Finish all lessons in the Credit module',
            'target': 8,
            'xp_reward': 200,
            'gems_reward': 100,  # Bonus gems for completing quest
            'icon': 'lesson',
            'metric': 'credit_lessons',
            'domain': 'credit'
        },
    ]
}


def get_start_of_day():
    """Get the start of today (midnight UTC)"""
    now = datetime.utcnow()
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_start_of_week():
    """Get the start of current week (Monday midnight UTC)"""
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_since_monday = now.weekday()
    return start_of_day - timedelta(days=days_since_monday)


def get_hours_until_reset(quest_type):
    """Get hours until quest resets"""
    now = datetime.utcnow()
    if quest_type == 'daily':
        next_reset = get_start_of_day() + timedelta(days=1)
    else:  # weekly
        next_reset = get_start_of_week() + timedelta(weeks=1)

    delta = next_reset - now
    return int(delta.total_seconds() / 3600)


def calculate_quest_progress(db, learner_id, quest_def, quest_type):
    """Calculate progress for a specific quest"""
    learner_oid = ObjectId(learner_id)

    if quest_type == 'daily':
        start_time = get_start_of_day()
    elif quest_type == 'weekly':
        start_time = get_start_of_week()
    else:  # special - all time
        start_time = datetime(2000, 1, 1)

    metric = quest_def['metric']

    if metric == 'xp_earned':
        # Sum XP from daily progress
        pipeline = [
            {'$match': {
                'learner_id': learner_oid,
                'date': {'$gte': start_time}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$xp_earned'}}}
        ]
        result = list(db.collections.daily_progress.aggregate(pipeline))
        return result[0]['total'] if result else 0

    elif metric == 'lessons_completed':
        # Count unique lessons completed
        pipeline = [
            {'$match': {
                'learner_id': learner_oid,
                'date': {'$gte': start_time}
            }},
            {'$group': {'_id': None, 'total': {'$sum': '$lessons_completed'}}}
        ]
        result = list(db.collections.daily_progress.aggregate(pipeline))
        return result[0]['total'] if result else 0

    elif metric == 'perfect_lessons':
        # Count lessons with 100% accuracy
        # This would need session tracking - for now, estimate from interactions
        pipeline = [
            {'$match': {
                'learner_id': learner_oid,
                'created_at': {'$gte': start_time}
            }},
            {'$group': {
                '_id': '$session_id',
                'total': {'$sum': 1},
                'correct': {'$sum': {'$cond': ['$is_correct', 1, 0]}}
            }},
            {'$match': {'$expr': {'$eq': ['$total', '$correct']}}},
            {'$count': 'perfect_sessions'}
        ]
        result = list(db.collections.interactions.aggregate(pipeline))
        return result[0]['perfect_sessions'] if result else 0

    elif metric == 'correct_answers':
        # Count correct answers
        count = db.collections.interactions.count_documents({
            'learner_id': learner_oid,
            'created_at': {'$gte': start_time},
            'is_correct': True
        })
        return count

    elif metric == 'streak_days':
        # Get current streak from learner
        learner = db.collections.learners.find_one({'_id': learner_oid})
        return learner.get('streak_count', 0) if learner else 0

    elif metric == 'weekly_xp':
        return calculate_quest_progress(db, learner_id, {'metric': 'xp_earned'}, 'weekly')

    elif metric == 'weekly_lessons':
        return calculate_quest_progress(db, learner_id, {'metric': 'lessons_completed'}, 'weekly')

    elif metric in ['banking_lessons', 'credit_lessons']:
        # Count mastered skills in domain
        domain = quest_def.get('domain', metric.replace('_lessons', ''))
        kcs = list(db.collections.knowledge_components.find({'domain': domain}))
        kc_ids = [kc['_id'] for kc in kcs]

        mastered = db.collections.learner_skill_states.count_documents({
            'learner_id': learner_oid,
            'kc_id': {'$in': kc_ids},
            'status': 'mastered'
        })
        return mastered

    return 0


@quests_bp.route('/<learner_id>', methods=['GET'])
def get_quests(learner_id):
    """
    Get all quests with progress for a learner.

    Response:
    {
        "daily": [...],
        "weekly": [...],
        "special": [...],
        "daily_reset_hours": 12,
        "weekly_reset_hours": 48
    }
    """
    try:
        db = get_db()

        # Get claimed quests for today/this week
        today = get_start_of_day()
        week_start = get_start_of_week()

        claimed_today = set()
        claimed_this_week = set()
        claimed_special = set()

        claims = list(db.collections.quest_claims.find({
            'learner_id': ObjectId(learner_id)
        }))

        for claim in claims:
            if claim.get('claimed_at', datetime.min) >= today:
                claimed_today.add(claim['quest_id'])
            if claim.get('claimed_at', datetime.min) >= week_start:
                claimed_this_week.add(claim['quest_id'])
            if claim.get('quest_type') == 'special':
                claimed_special.add(claim['quest_id'])

        def build_quest_response(quest_def, quest_type):
            progress = calculate_quest_progress(db, learner_id, quest_def, quest_type)

            if quest_type == 'daily':
                completed = quest_def['quest_id'] in claimed_today
            elif quest_type == 'weekly':
                completed = quest_def['quest_id'] in claimed_this_week
            else:
                completed = quest_def['quest_id'] in claimed_special

            return {
                'id': quest_def['quest_id'],
                'title': quest_def['title'],
                'description': quest_def['description'],
                'progress': min(progress, quest_def['target']),
                'target': quest_def['target'],
                'xp_reward': quest_def['xp_reward'],
                'gems_reward': quest_def.get('gems_reward', 0),
                'icon': quest_def['icon'],
                'completed': completed,
                'can_claim': progress >= quest_def['target'] and not completed
            }

        response = {
            'daily': [build_quest_response(q, 'daily') for q in QUEST_DEFINITIONS['daily']],
            'weekly': [build_quest_response(q, 'weekly') for q in QUEST_DEFINITIONS['weekly']],
            'special': [build_quest_response(q, 'special') for q in QUEST_DEFINITIONS['special']],
            'daily_reset_hours': get_hours_until_reset('daily'),
            'weekly_reset_hours': get_hours_until_reset('weekly')
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quests_bp.route('/<learner_id>/claim/<quest_id>', methods=['POST'])
def claim_quest(learner_id, quest_id):
    """
    Claim a completed quest reward.

    Response:
    {
        "success": true,
        "xp_earned": 25,
        "total_xp": 1250
    }
    """
    try:
        db = get_db()
        learner_oid = ObjectId(learner_id)

        # Find the quest definition
        quest_def = None
        quest_type = None
        for qtype, quests in QUEST_DEFINITIONS.items():
            for q in quests:
                if q['quest_id'] == quest_id:
                    quest_def = q
                    quest_type = qtype
                    break
            if quest_def:
                break

        if not quest_def:
            return jsonify({'error': 'Quest not found'}), 404

        # Check if already claimed
        if quest_type == 'daily':
            start_time = get_start_of_day()
        elif quest_type == 'weekly':
            start_time = get_start_of_week()
        else:
            start_time = datetime(2000, 1, 1)

        existing_claim = db.collections.quest_claims.find_one({
            'learner_id': learner_oid,
            'quest_id': quest_id,
            'claimed_at': {'$gte': start_time}
        })

        if existing_claim:
            return jsonify({'error': 'Quest already claimed'}), 400

        # Check if quest is complete
        progress = calculate_quest_progress(db, learner_id, quest_def, quest_type)
        if progress < quest_def['target']:
            return jsonify({'error': 'Quest not complete'}), 400

        # Claim the quest
        db.collections.quest_claims.insert_one({
            'learner_id': learner_oid,
            'quest_id': quest_id,
            'quest_type': quest_type,
            'xp_earned': quest_def['xp_reward'],
            'claimed_at': datetime.utcnow()
        })

        # Award XP and Gems
        gems_reward = quest_def.get('gems_reward', 0)  # Default to 0 if not specified
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {
                '$inc': {
                    'total_xp': quest_def['xp_reward'],
                    'gems': gems_reward
                }
            }
        )

        # Update daily progress for leaderboard tracking
        from datetime import date
        today = date.today()
        db.collections.update_daily_progress(
            learner_id=learner_id,
            date_obj=today,
            xp_earned=quest_def['xp_reward']
        )

        # Get updated totals
        learner = db.collections.learners.find_one({'_id': learner_oid})
        total_xp = learner.get('total_xp', 0) if learner else 0
        total_gems = learner.get('gems', 0) if learner else 0

        return jsonify({
            'success': True,
            'xp_earned': quest_def['xp_reward'],
            'gems_earned': gems_reward,
            'total_xp': total_xp,
            'total_gems': total_gems
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@quests_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200
