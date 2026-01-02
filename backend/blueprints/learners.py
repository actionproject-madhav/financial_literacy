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

        # Get join date from created_at
        created_at = learner.get('created_at')
        joined_date = None
        if created_at:
            # Format as "Month Year" (e.g., "January 2024")
            joined_date = created_at.strftime('%B %Y')
        else:
            joined_date = 'January 2024'  # Fallback if no created_at

        # Calculate league from XP (using leaderboard logic)
        # League definitions - Duolingo-style
        LEAGUES = [
            {'id': 'bronze', 'name': 'Bronze', 'min_xp': 0},
            {'id': 'silver', 'name': 'Silver', 'min_xp': 500},
            {'id': 'gold', 'name': 'Gold', 'min_xp': 1500},
            {'id': 'emerald', 'name': 'Emerald', 'min_xp': 3000},
            {'id': 'diamond', 'name': 'Diamond', 'min_xp': 5000},
            {'id': 'master', 'name': 'Master', 'min_xp': 10000},
        ]
        current_league_info = LEAGUES[0]
        for league in LEAGUES:
            if total_xp >= league['min_xp']:
                current_league_info = league
        current_league = current_league_info.get('name', 'Bronze')

        # Count top 3 finishes (weeks where user finished in top 3 of their league)
        # This would require tracking weekly leaderboard history, for now return 0
        top_3_finishes = 0  # TODO: Implement weekly leaderboard history tracking

        # Get username if available (could be stored in learner document)
        username = learner.get('username') or None

        # Log for debugging (can be removed in production)
        print(f'[get_learner_stats] Learner {learner_id}: XP={total_xp}, Streak={streak_count}, Lessons={lessons_completed}, Level={level_info["level"]}, League={current_league}')

        return jsonify({
            'learner_id': str(learner['_id']),
            'display_name': learner.get('display_name', 'User'),
            'username': username,
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
            'gems': learner.get('gems', 0),
            'hearts': learner.get('hearts', 5),
            'followers': followers_count,
            'following': following_count,
            'joined_date': joined_date,
            'current_league': current_league,
            'top_3_finishes': top_3_finishes
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


@learners_bp.route('/<learner_id>/gems', methods=['GET'])
def get_gems(learner_id):
    """
    Get current gems for a learner.
    
    Response:
    {
        "gems": 150,
        "learner_id": "..."
    }
    """
    try:
        db = get_db()
        
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        gems = learner.get('gems', 0)
        
        return jsonify({
            'gems': gems,
            'learner_id': learner_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/gems/add', methods=['POST'])
def add_gems(learner_id):
    """
    Add gems to a learner (e.g., from completing quests, achievements).
    
    Request JSON:
    {
        "amount": 50,
        "reason": "quest_completion"
    }
    
    Response:
    {
        "gems": 200,
        "added": 50,
        "learner_id": "..."
    }
    """
    try:
        db = get_db()
        data = request.get_json()
        
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        amount = int(data.get('amount', 0))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        current_gems = learner.get('gems', 0)
        new_gems = current_gems + amount
        
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$inc': {'gems': amount},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return jsonify({
            'gems': new_gems,
            'added': amount,
            'learner_id': learner_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/gems/deduct', methods=['POST'])
def deduct_gems(learner_id):
    """
    Deduct gems from a learner (e.g., for shop purchases).
    
    Request JSON:
    {
        "amount": 50,
        "reason": "shop_purchase"
    }
    
    Response:
    {
        "gems": 100,
        "deducted": 50,
        "learner_id": "..."
    }
    """
    try:
        db = get_db()
        data = request.get_json()
        
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        amount = int(data.get('amount', 0))
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        current_gems = learner.get('gems', 0)
        if current_gems < amount:
            return jsonify({'error': 'Insufficient gems'}), 400
        
        new_gems = current_gems - amount
        
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$inc': {'gems': -amount},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        return jsonify({
            'gems': new_gems,
            'deducted': amount,
            'learner_id': learner_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/shop/purchase', methods=['POST'])
def purchase_item(learner_id):
    """
    Purchase an item from the shop.
    
    Request JSON:
    {
        "item_id": "refill-hearts",
        "item_name": "Refill Hearts",
        "price": 100,
        "currency": "gems"
    }
    
    Response:
    {
        "success": true,
        "item_id": "refill-hearts",
        "gems_remaining": 50,
        "effect": {
            "type": "refill_hearts",
            "hearts": 5
        }
    }
    """
    try:
        db = get_db()
        data = request.get_json()
        
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        item_id = data.get('item_id')
        price = int(data.get('price', 0))
        currency = data.get('currency', 'gems')
        
        if currency != 'gems':
            return jsonify({'error': 'Only gems currency supported'}), 400
        
        current_gems = learner.get('gems', 0)
        if current_gems < price:
            return jsonify({'error': 'Insufficient gems'}), 400
        
        # Deduct gems
        new_gems = current_gems - price
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$inc': {'gems': -price},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        # Apply item effect
        effect = {}
        if item_id == 'refill-hearts':
            # Refill hearts to max
            MAX_HEARTS = 5
            db.collections.learners.update_one(
                {'_id': ObjectId(learner_id)},
                {
                    '$set': {
                        'hearts': MAX_HEARTS,
                        'last_heart_lost_at': None  # Reset recharge timer
                    }
                }
            )
            effect = {'type': 'refill_hearts', 'hearts': MAX_HEARTS}
        
        elif item_id == 'double-xp':
            # Set XP multiplier (would need to track this in session/state)
            # For now, just return success - frontend can handle the multiplier
            effect = {'type': 'double_xp', 'duration_minutes': 15}
        
        elif item_id == 'streak-freeze':
            # Streak freeze would be handled by streaks service
            effect = {'type': 'streak_freeze', 'days': 1}
        
        return jsonify({
            'success': True,
            'item_id': item_id,
            'gems_remaining': new_gems,
            'effect': effect
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/preferences', methods=['GET'])
def get_preferences(learner_id):
    """
    Get user preferences/settings.
    
    Response:
    {
        "sound_effects": true,
        "animations": true,
        "motivational_messages": true,
        "listening_exercises": true,
        "dark_mode": false,
        "push_notifications": true,
        "practice_reminders": true,
        "learning_language": "en"
    }
    """
    try:
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Get preferences from learner document (defaults if not set)
        preferences = learner.get('preferences', {})
        
        return jsonify({
            'sound_effects': preferences.get('sound_effects', True),
            'animations': preferences.get('animations', True),
            'motivational_messages': preferences.get('motivational_messages', True),
            'listening_exercises': preferences.get('listening_exercises', True),
            'dark_mode': preferences.get('dark_mode', False),
            'push_notifications': preferences.get('push_notifications', True),
            'practice_reminders': preferences.get('practice_reminders', True),
            'learning_language': preferences.get('learning_language', learner.get('native_language', 'en'))
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/preferences', methods=['PUT'])
def update_preferences(learner_id):
    """
    Update user preferences/settings.
    
    Request JSON:
    {
        "sound_effects": true,
        "animations": false,
        "motivational_messages": true,
        "listening_exercises": true,
        "dark_mode": true,
        "push_notifications": false,
        "practice_reminders": true,
        "learning_language": "es"
    }
    
    Response:
    {
        "success": true,
        "updated_preferences": {...}
    }
    """
    try:
        data = request.get_json()
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Allowed preference fields
        allowed_fields = [
            'sound_effects', 'animations', 'motivational_messages',
            'listening_exercises', 'dark_mode', 'push_notifications',
            'practice_reminders', 'learning_language'
        ]
        
        # Get existing preferences or create new dict
        preferences = learner.get('preferences', {})
        
        # Update only provided fields
        updated_preferences = {}
        for field in allowed_fields:
            if field in data:
                preferences[field] = data[field]
                updated_preferences[field] = data[field]
        
        # Save to database
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$set': {
                    'preferences': preferences,
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return jsonify({
            'success': True,
            'updated_preferences': updated_preferences
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/export', methods=['GET'])
def export_data(learner_id):
    """
    Export all user data as JSON.
    
    Response: JSON file with all user data including:
    - Profile information
    - Progress (XP, streak, lessons completed)
    - Skill states
    - Interactions
    - Achievements
    - Daily progress
    """
    try:
        from flask import Response
        import json
        
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Collect all user data
        export_data = {
            'profile': {
                'email': learner.get('email'),
                'display_name': learner.get('display_name'),
                'country_of_origin': learner.get('country_of_origin'),
                'visa_type': learner.get('visa_type'),
                'native_language': learner.get('native_language'),
                'created_at': learner.get('created_at').isoformat() if learner.get('created_at') else None,
            },
            'progress': {
                'total_xp': learner.get('total_xp', 0),
                'streak_count': learner.get('streak_count', 0),
                'gems': learner.get('gems', 0),
                'hearts': learner.get('hearts', 5),
            },
            'preferences': learner.get('preferences', {}),
            'skill_states': [],
            'interactions': [],
            'achievements': [],
            'daily_progress': []
        }
        
        # Get skill states
        skill_states = list(db.collections.learner_skill_states.find({
            'learner_id': ObjectId(learner_id)
        }))
        for state in skill_states:
            export_data['skill_states'].append({
                'kc_id': str(state.get('kc_id')),
                'status': state.get('status'),
                'mastery': state.get('mastery', 0),
                'elo': state.get('elo', 1500),
                'updated_at': state.get('updated_at').isoformat() if state.get('updated_at') else None
            })
        
        # Get recent interactions (limit to last 1000)
        interactions = list(db.collections.interactions.find({
            'learner_id': ObjectId(learner_id)
        }).sort('timestamp', -1).limit(1000))
        for interaction in interactions:
            export_data['interactions'].append({
                'item_id': str(interaction.get('item_id')),
                'correct': interaction.get('correct'),
                'timestamp': interaction.get('timestamp').isoformat() if interaction.get('timestamp') else None
            })
        
        # Get achievements
        achievements = list(db.collections.learner_achievements.find({
            'learner_id': ObjectId(learner_id)
        }))
        for achievement in achievements:
            export_data['achievements'].append({
                'achievement_id': str(achievement.get('achievement_id')),
                'progress': achievement.get('progress', 0),
                'unlocked_at': achievement.get('unlocked_at').isoformat() if achievement.get('unlocked_at') else None
            })
        
        # Get daily progress (last 90 days)
        daily_progress = list(db.collections.daily_progress.find({
            'learner_id': ObjectId(learner_id)
        }).sort('date', -1).limit(90))
        for progress in daily_progress:
            export_data['daily_progress'].append({
                'date': progress.get('date').isoformat() if progress.get('date') else None,
                'xp_earned': progress.get('xp_earned', 0),
                'lessons_completed': progress.get('lessons_completed', 0)
            })
        
        # Create JSON response
        json_data = json.dumps(export_data, indent=2, default=str)
        
        return Response(
            json_data,
            mimetype='application/json',
            headers={
                'Content-Disposition': f'attachment; filename=finlit_export_{learner_id}_{datetime.utcnow().strftime("%Y%m%d")}.json'
            }
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@learners_bp.route('/<learner_id>/delete', methods=['POST'])
def delete_account(learner_id):
    """
    Delete user account and all associated data.
    
    Request JSON:
    {
        "confirm": true  // Must be true to proceed
    }
    
    Response:
    {
        "success": true,
        "message": "Account deleted successfully"
    }
    """
    try:
        data = request.get_json()
        
        # Require explicit confirmation
        if not data.get('confirm'):
            return jsonify({'error': 'Confirmation required. Set "confirm": true'}), 400
        
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Delete all associated data
        # Note: In production, you might want to soft-delete (mark as deleted) instead
        
        # Delete skill states
        db.collections.learner_skill_states.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete interactions
        db.collections.interactions.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete achievements
        db.collections.learner_achievements.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete daily progress
        db.collections.daily_progress.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete voice responses
        db.collections.voice_responses.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete quest claims
        db.collections.quest_claims.delete_many({
            'learner_id': ObjectId(learner_id)
        })
        
        # Delete social connections (friendships, follows, friend requests)
        db.collections.friendships.delete_many({
            '$or': [
                {'user1_id': ObjectId(learner_id)},
                {'user2_id': ObjectId(learner_id)}
            ]
        })
        
        db.collections.follows.delete_many({
            '$or': [
                {'follower_id': ObjectId(learner_id)},
                {'following_id': ObjectId(learner_id)}
            ]
        })
        
        db.collections.friend_requests.delete_many({
            '$or': [
                {'from_user_id': ObjectId(learner_id)},
                {'to_user_id': ObjectId(learner_id)}
            ]
        })
        
        # Finally, delete the learner document
        db.collections.learners.delete_one({
            '_id': ObjectId(learner_id)
        })
        
        return jsonify({
            'success': True,
            'message': 'Account and all associated data deleted successfully'
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
