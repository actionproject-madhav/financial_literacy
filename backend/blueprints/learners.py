"""
Learner Management Blueprint

Handles:
- Learner onboarding
- Profile management
- Skill initialization
- Preference updates
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta

learners_bp = Blueprint('learners', __name__, url_prefix='/api/learners')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def get_learning_engine():
    """Get learning engine from app context"""
    return current_app.config['LEARNING_ENGINE']


@learners_bp.route('/onboarding', methods=['POST'])
def complete_onboarding():
    """
    Complete learner onboarding with profile information.

    Request JSON:
    {
        "learner_id": "507f...",
        "native_language": "Spanish",
        "english_proficiency": "intermediate",
        "country_of_origin": "MEX",
        "immigration_status": "H1B",
        "visa_type": "H1B",
        "has_ssn": true,
        "sends_remittances": false,
        "financial_goals": ["emergency_fund", "retirement"],
        "financial_experience_level": "novice",
        "daily_goal_minutes": 15,
        "timezone": "America/Los_Angeles"
    }

    Response:
    {
        "success": true,
        "learner_id": "...",
        "starter_skills": 3,
        "message": "Onboarding completed!"
    }
    """
    try:
        data = request.get_json()
        learner_id = data.get('learner_id')

        if not learner_id:
            return jsonify({'error': 'learner_id required'}), 400

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Update learner profile
        update_data = {
            'native_language': data.get('native_language', 'English'),
            'english_proficiency': data.get('english_proficiency', 'intermediate'),
            'country_of_origin': data.get('country_of_origin'),
            'immigration_status': data.get('immigration_status'),
            'visa_type': data.get('visa_type'),
            'has_ssn': data.get('has_ssn', False),
            'sends_remittances': data.get('sends_remittances', False),
            'financial_goals': data.get('financial_goals', []),
            'financial_experience_level': data.get('financial_experience_level', 'novice'),
            'daily_goal_minutes': data.get('daily_goal_minutes', 15),
            'timezone': data.get('timezone', 'America/New_York'),
            'onboarding_completed': True,
            'onboarding_completed_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {'$set': update_data}
        )

        # Count initialized skills
        skill_count = db.collections.learner_skill_states.count_documents({
            'learner_id': ObjectId(learner_id),
            'status': 'available'
        })

        return jsonify({
            'success': True,
            'learner_id': learner_id,
            'starter_skills': skill_count,
            'message': 'Onboarding completed! You can start learning now.'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>', methods=['GET'])
def get_learner(learner_id):
    """
    Get learner profile.

    Response:
    {
        "learner_id": "...",
        "email": "...",
        "display_name": "...",
        "native_language": "Spanish",
        "country_of_origin": "MEX",
        "total_xp": 1250,
        "streak_count": 7,
        ...
    }
    """
    try:
        db = get_db()

        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})

        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        return jsonify({
            'learner_id': str(learner['_id']),
            'email': learner.get('email'),
            'display_name': learner.get('display_name'),
            'profile_picture_url': learner.get('profile_picture_url'),
            'native_language': learner.get('native_language'),
            'english_proficiency': learner.get('english_proficiency'),
            'country_of_origin': learner.get('country_of_origin'),
            'immigration_status': learner.get('immigration_status'),
            'visa_type': learner.get('visa_type'),
            'has_ssn': learner.get('has_ssn'),
            'sends_remittances': learner.get('sends_remittances'),
            'financial_goals': learner.get('financial_goals', []),
            'financial_experience_level': learner.get('financial_experience_level'),
            'total_xp': learner.get('total_xp', 0),
            'streak_count': learner.get('streak_count', 0),
            'streak_last_date': learner.get('streak_last_date').isoformat() if learner.get('streak_last_date') else None,
            'daily_goal_minutes': learner.get('daily_goal_minutes', 15),
            'timezone': learner.get('timezone'),
            'onboarding_completed': learner.get('onboarding_completed', False),
            'created_at': learner.get('created_at').isoformat() if learner.get('created_at') else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>', methods=['PUT'])
def update_learner(learner_id):
    """
    Update learner profile.

    Request JSON:
    {
        "display_name": "New Name",
        "daily_goal_minutes": 20,
        "financial_goals": ["retirement", "home_purchase"],
        ...
    }

    Response:
    {
        "success": true,
        "updated_fields": ["display_name", "daily_goal_minutes"]
    }
    """
    try:
        data = request.get_json()
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Allowed fields for update
        allowed_fields = [
            'display_name', 'native_language', 'english_proficiency',
            'country_of_origin', 'immigration_status', 'visa_type',
            'has_ssn', 'sends_remittances', 'financial_goals',
            'financial_experience_level', 'daily_goal_minutes', 'timezone'
        ]

        update_data = {
            'updated_at': datetime.utcnow()
        }

        updated_fields = []
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
                updated_fields.append(field)

        if updated_fields:
            db.collections.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {'$set': update_data}
            )

        return jsonify({
            'success': True,
            'updated_fields': updated_fields
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/skills/initialize', methods=['POST'])
def initialize_skills(learner_id):
    """
    Initialize all tier-1 skills for a learner.

    This is called automatically during onboarding but can be
    triggered manually if needed.

    Response:
    {
        "success": true,
        "initialized": 15,
        "message": "Initialized 15 skills"
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Use learning engine to initialize
        engine = get_learning_engine()
        count = engine.initialize_learner_kcs(learner_id)

        return jsonify({
            'success': True,
            'initialized': count,
            'message': f'Initialized {count} skills'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/skills', methods=['GET'])
def get_learner_skills(learner_id):
    """
    Get all skills for a learner with their states.

    Query params:
    - status: Filter by status (available, in_progress, mastered, locked)
    - domain: Filter by domain (banking, credit, etc.)

    Response:
    {
        "skills": [
            {
                "kc_id": "...",
                "name": "Credit Score Basics",
                "domain": "credit",
                "status": "available",
                "p_mastery": 0.1,
                "total_attempts": 0
            },
            ...
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Build query
        query = {'learner_id': ObjectId(learner_id)}

        # Filter by status
        status = request.args.get('status')
        if status:
            query['status'] = status

        # Get skill states
        skill_states = list(db.collections.learner_skill_states.find(query))

        results = []
        for state in skill_states:
            kc = db.collections.knowledge_components.find_one({
                '_id': state['kc_id']
            })

            if not kc:
                continue

            # Filter by domain if specified
            domain = request.args.get('domain')
            if domain and kc.get('domain') != domain:
                continue

            results.append({
                'kc_id': str(kc['_id']),
                'slug': kc.get('slug'),
                'name': kc.get('name'),
                'description': kc.get('description'),
                'domain': kc.get('domain'),
                'difficulty_tier': kc.get('difficulty_tier', 1),
                'estimated_minutes': kc.get('estimated_minutes', 20),
                'icon_url': kc.get('icon_url'),
                'status': state.get('status', 'locked'),
                'p_mastery': state.get('p_mastery', 0.0),
                'total_attempts': state.get('total_attempts', 0),
                'correct_count': state.get('correct_count', 0),
                'current_streak': state.get('current_streak', 0),
                'next_review_at': state.get('next_review_at').isoformat() if state.get('next_review_at') else None,
                'mastered_at': state.get('mastered_at').isoformat() if state.get('mastered_at') else None
            })

        return jsonify({
            'skills': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/achievements', methods=['GET'])
def get_learner_achievements(learner_id):
    """
    Get all achievements for a learner.

    Response:
    {
        "achievements": [
            {
                "achievement_id": "...",
                "name": "First Steps",
                "description": "Complete your first lesson",
                "xp_reward": 50,
                "earned_at": "2025-01-10T15:30:00Z"
            },
            ...
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get learner achievements
        learner_achievements = list(db.collections.learner_achievements.find({
            'learner_id': ObjectId(learner_id)
        }))

        results = []
        for la in learner_achievements:
            achievement = db.collections.achievements.find_one({
                '_id': la['achievement_id']
            })

            if achievement:
                results.append({
                    'achievement_id': str(achievement['_id']),
                    'slug': achievement.get('slug'),
                    'name': achievement.get('name'),
                    'description': achievement.get('description'),
                    'icon_url': achievement.get('icon_url'),
                    'xp_reward': achievement.get('xp_reward', 0),
                    'earned_at': la.get('earned_at').isoformat() if la.get('earned_at') else None
                })

        return jsonify({
            'achievements': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/daily-progress', methods=['GET'])
def get_daily_progress(learner_id):
    """
    Get daily progress history for a learner.

    Query params:
    - days: Number of days to retrieve (default 7)

    Response:
    {
        "daily_progress": [
            {
                "date": "2025-01-10",
                "xp_earned": 150,
                "lessons_completed": 3,
                "minutes_practiced": 25,
                "goal_met": true
            },
            ...
        ]
    }
    """
    try:
        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        days = int(request.args.get('days', 7))

        # Get daily progress
        progress = list(db.collections.daily_progress.find({
            'learner_id': ObjectId(learner_id)
        }).sort('date', -1).limit(days))

        results = []
        for p in progress:
            results.append({
                'date': p.get('date').isoformat() if p.get('date') else None,
                'xp_earned': p.get('xp_earned', 0),
                'lessons_completed': p.get('lessons_completed', 0),
                'minutes_practiced': p.get('minutes_practiced', 0),
                'goal_met': p.get('goal_met', False)
            })

        return jsonify({
            'daily_progress': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def calculate_level_from_xp(total_xp):
    """
    Calculate user level from total XP.
    Duolingo-style progression:
    - Level 1: 0 XP
    - Level 2: 100 XP (100 needed)
    - Level 3: 300 XP (200 needed)
    - Level 4: 600 XP (300 needed)
    - Level 5: 1000 XP (400 needed)
    - Level 6: 1500 XP (500 needed)
    - Level 7: 2100 XP (600 needed)
    - Level 8: 2800 XP (700 needed)
    - Level 9: 3600 XP (800 needed)
    - Level 10: 4500 XP (900 needed)
    - Level 11: 5500 XP (1000 needed)
    - Level 12: 6600 XP (1100 needed)
    Formula: XP for level N = sum(100 * i for i in range(1, N))
    """
    if total_xp <= 0:
        return {
            'level': 1,
            'xp_for_current_level': 0,
            'xp_for_next_level': 100,
            'xp_in_current_level': 0,
            'xp_needed_for_level': 100,
            'level_progress': 0
        }
    
    # Find current level
    level = 1
    xp_required = 0
    
    while xp_required <= total_xp:
        level += 1
        xp_required = sum(100 * i for i in range(1, level))
    
    level = level - 1  # Adjust for the last increment
    
    # Calculate XP thresholds
    xp_for_current_level = sum(100 * i for i in range(1, level)) if level > 1 else 0
    xp_for_next_level = sum(100 * i for i in range(1, level + 1))
    xp_in_current_level = total_xp - xp_for_current_level
    xp_needed_for_level = xp_for_next_level - xp_for_current_level
    level_progress = int((xp_in_current_level / xp_needed_for_level) * 100) if xp_needed_for_level > 0 else 0
    
    return {
        'level': level,
        'xp_for_current_level': xp_for_current_level,
        'xp_for_next_level': xp_for_next_level,
        'xp_in_current_level': xp_in_current_level,
        'xp_needed_for_level': xp_needed_for_level,
        'level_progress': min(100, max(0, level_progress))
    }


@learners_bp.route('/<learner_id>/stats', methods=['GET'])
def get_learner_stats(learner_id):
    """
    Get comprehensive learner statistics for profile page.
    ALL DATA COMES FROM DATABASE - NO MOCK DATA.
    
    Response:
    {
        "learner_id": "...",
        "display_name": "...",
        "email": "...",
        "country_of_origin": "US",
        "visa_type": "Other",
        "total_xp": 915,  # From learners.total_xp
        "streak_count": 33,  # From learners.streak_count
        "lessons_completed": 3,  # Count from learner_skill_states where status='mastered'
        "skills_mastered": 3,  # Same as lessons_completed
        "level": 4,  # Calculated from total_xp
        "level_progress": 78,  # Calculated from total_xp
        "xp_for_current_level": 600,
        "xp_for_next_level": 1000,
        "xp_in_current_level": 315,
        "xp_needed_for_level": 400
    }
    """
    try:
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Get data directly from database - NO MOCK DATA
        total_xp = learner.get('total_xp', 0)
        streak_count = learner.get('streak_count', 0)
        
        # Count lessons completed (status = 'mastered') from database
        lessons_completed = db.collections.learner_skill_states.count_documents({
            'learner_id': ObjectId(learner_id),
            'status': 'mastered'
        })
        
        # Skills mastered is the same as lessons completed (each lesson is a skill/KC)
        skills_mastered = lessons_completed
        
        # Calculate level from XP (real calculation, not mock)
        level_info = calculate_level_from_xp(total_xp)

        # Count followers and following
        followers_count = db.collections.follows.count_documents({
            'following_id': ObjectId(learner_id)
        })

        following_count = db.collections.follows.count_documents({
            'follower_id': ObjectId(learner_id)
        })

        # Log for debugging (can be removed in production)
        print(f'[get_learner_stats] Learner {learner_id}: XP={total_xp}, Streak={streak_count}, Lessons={lessons_completed}, Level={level_info["level"]}')

        return jsonify({
            'learner_id': str(learner['_id']),
            'display_name': learner.get('display_name', 'User'),
            'email': learner.get('email', ''),
            'country_of_origin': learner.get('country_of_origin', 'US'),
            'visa_type': learner.get('visa_type', 'Other'),
            'total_xp': total_xp,
            'streak_count': streak_count,
            'lessons_completed': lessons_completed,
            'skills_mastered': skills_mastered,
            'level': level_info['level'],
            'level_progress': level_info['level_progress'],
            'xp_for_current_level': level_info['xp_for_current_level'],
            'xp_for_next_level': level_info['xp_for_next_level'],
            'xp_in_current_level': level_info['xp_in_current_level'],
            'xp_needed_for_level': level_info['xp_needed_for_level'],
            'followers': followers_count,
            'following': following_count
        }), 200
        
    except Exception as e:
        print(f'[get_learner_stats] Error: {e}')
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/hearts', methods=['GET'])
def get_hearts(learner_id):
    """
    Get current hearts with automatic recharge calculation.
    Hearts recharge at 1 per 5 minutes, up to max 5.

    Response:
    {
        "hearts": 3,
        "max_hearts": 5,
        "next_heart_at": "2026-01-01T12:35:00Z",  # null if at max
        "seconds_until_next_heart": 180,  # null if at max
        "full_hearts_at": "2026-01-01T12:45:00Z"  # null if at max
    }
    """
    try:
        db = get_db()

        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        MAX_HEARTS = 5
        RECHARGE_MINUTES = 5  # 1 heart every 5 minutes

        # Get stored hearts and last loss time
        stored_hearts = learner.get('hearts', MAX_HEARTS)
        last_heart_lost_at = learner.get('last_heart_lost_at')

        # If already at max or never lost a heart, return max
        if stored_hearts >= MAX_HEARTS or not last_heart_lost_at:
            return jsonify({
                'hearts': MAX_HEARTS,
                'max_hearts': MAX_HEARTS,
                'next_heart_at': None,
                'seconds_until_next_heart': None,
                'full_hearts_at': None
            }), 200

        # Calculate recharged hearts
        now = datetime.utcnow()
        time_since_loss = (now - last_heart_lost_at).total_seconds()
        hearts_recharged = int(time_since_loss // (RECHARGE_MINUTES * 60))
        current_hearts = min(stored_hearts + hearts_recharged, MAX_HEARTS)

        # Update database if hearts have recharged
        if current_hearts != stored_hearts:
            db.collections.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {'$set': {'hearts': current_hearts}}
            )

        # Calculate time until next heart
        next_heart_at = None
        seconds_until_next_heart = None
        full_hearts_at = None

        if current_hearts < MAX_HEARTS:
            seconds_since_last_recharge = time_since_loss % (RECHARGE_MINUTES * 60)
            seconds_until_next_heart = int((RECHARGE_MINUTES * 60) - seconds_since_last_recharge)
            next_heart_at = (now + timedelta(seconds=seconds_until_next_heart)).isoformat() + 'Z'

            # Calculate when hearts will be full
            hearts_needed = MAX_HEARTS - current_hearts
            seconds_until_full = seconds_until_next_heart + ((hearts_needed - 1) * RECHARGE_MINUTES * 60)
            full_hearts_at = (now + timedelta(seconds=seconds_until_full)).isoformat() + 'Z'

        return jsonify({
            'hearts': current_hearts,
            'max_hearts': MAX_HEARTS,
            'next_heart_at': next_heart_at,
            'seconds_until_next_heart': seconds_until_next_heart,
            'full_hearts_at': full_hearts_at
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/hearts/lose', methods=['POST'])
def lose_heart(learner_id):
    """
    Lose a heart (called when user gets a wrong answer).

    Response:
    {
        "hearts": 4,
        "max_hearts": 5,
        "lost": true
    }
    """
    try:
        db = get_db()

        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        MAX_HEARTS = 5
        current_hearts = learner.get('hearts', MAX_HEARTS)

        # Don't go below 0
        new_hearts = max(0, current_hearts - 1)

        # Update database
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$set': {
                    'hearts': new_hearts,
                    'last_heart_lost_at': datetime.utcnow()
                }
            }
        )

        return jsonify({
            'hearts': new_hearts,
            'max_hearts': MAX_HEARTS,
            'lost': True
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Health check
@learners_bp.route('/health', methods=['GET'])
def health_check():
    """Check if learner service is healthy."""
    try:
        db = get_db()
        # Try a simple query
        db.collections.learners.find_one()

        return jsonify({
            'status': 'healthy',
            'service': 'learners',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
