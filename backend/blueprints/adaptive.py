"""
Adaptive Learning API Blueprint

Provides endpoints for:
- Starting learning sessions
- Logging interactions
- Getting learner progress
- Retrieving next items
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import uuid
from bson import ObjectId

adaptive_bp = Blueprint('adaptive', __name__, url_prefix='/api/adaptive')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def get_learning_engine():
    """Get learning engine from app context"""
    return current_app.config['LEARNING_ENGINE']


@adaptive_bp.route('/sessions/start', methods=['POST'])
def start_session():
    """
    Start a learning session, return items to practice.

    Request JSON:
    {
        "learner_id": "507f...",
        "session_length": 10  // optional, default 5
    }

    Response:
    {
        "session_id": "uuid",
        "items": [
            {
                "item_id": "...",
                "item_type": "multiple_choice",
                "content": {...},
                "kc_id": "...",
                "kc_name": "...",
                "predicted_p_correct": 0.65,
                "position": 0
            }
        ]
    }
    """
    try:
        data = request.get_json()
        learner_id = data.get('learner_id')
        session_length = data.get('session_length', 5)

        if not learner_id:
            return jsonify({'error': 'learner_id required'}), 400

        # Validate learner exists
        db = get_db()
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Use learning engine to create session
        engine = get_learning_engine()
        items = engine.create_learning_session(learner_id, target_items=session_length)

        if not items:
            return jsonify({'error': 'No items available for learning'}), 404

        session_id = str(uuid.uuid4())

        return jsonify({
            'session_id': session_id,
            'items': [
                {
                    'item_id': item['item_id'],
                    'item_type': item['item']['item_type'],
                    'content': item['item']['content'],
                    'kc_id': item['kc_id'],
                    'kc_name': item['kc']['name'],
                    'kc_domain': item['kc']['domain'],
                    'predicted_p_correct': item['predicted_p_correct'],
                    'position': item['position'],
                    'media_url': item['item'].get('media_url')
                }
                for item in items
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/next-item', methods=['GET'])
def get_next_item():
    """
    Get the next optimal learning item for a learner.

    Query params:
    - learner_id: required
    - kc_id: optional, specific KC to practice

    Response:
    {
        "item_id": "...",
        "item_type": "multiple_choice",
        "content": {...},
        "kc_id": "...",
        "kc_name": "...",
        "predicted_p_correct": 0.65,
        "is_review": false,
        "p_mastery": 0.75
    }
    """
    try:
        learner_id = request.args.get('learner_id')
        kc_id = request.args.get('kc_id')

        if not learner_id:
            return jsonify({'error': 'learner_id required'}), 400

        # Use learning engine to select next item
        engine = get_learning_engine()
        item_data = engine.get_next_item(learner_id, kc_id)

        if not item_data:
            return jsonify({'error': 'No items available'}), 404

        return jsonify({
            'item_id': item_data['item_id'],
            'item_type': item_data['item']['item_type'],
            'content': item_data['item']['content'],
            'kc_id': item_data['kc_id'],
            'kc_name': item_data['kc']['name'],
            'kc_domain': item_data['kc']['domain'],
            'predicted_p_correct': item_data['predicted_p_correct'],
            'is_review': item_data['is_review'],
            'p_mastery': item_data['p_mastery'],
            'difficulty': item_data['difficulty'],
            'discrimination': item_data['discrimination'],
            'media_url': item_data['item'].get('media_url')
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/interactions', methods=['POST'])
def log_interaction():
    """
    Log an interaction and update learner state.

    Request JSON:
    {
        "learner_id": "507f...",
        "item_id": "507f...",
        "kc_id": "507f...",
        "session_id": "uuid",
        "is_correct": true,
        "response_value": {"selected_choice": 2},
        "response_time_ms": 12000,
        "hint_used": false
    }

    Response:
    {
        "success": true,
        "interaction_id": "...",
        "skill_state": {
            "kc_id": "...",
            "p_mastery": 0.82,
            "mastery_change": +0.15,
            "status": "in_progress",
            "next_review_at": "2025-01-15T10:00:00Z"
        },
        "xp_earned": 20,
        "achievements": [...]  // newly unlocked achievements
    }
    """
    try:
        data = request.get_json()

        # Validate required fields
        required = ['learner_id', 'item_id', 'kc_id', 'is_correct', 'response_value', 'response_time_ms']
        for field in required:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        learner_id = data['learner_id']
        item_id = data['item_id']
        kc_id = data['kc_id']
        is_correct = data['is_correct']
        response_value = data['response_value']
        response_time_ms = data['response_time_ms']
        hint_used = data.get('hint_used', False)
        session_id = data.get('session_id')

        # Use learning engine to submit answer and update all models
        engine = get_learning_engine()
        result = engine.submit_answer(
            learner_id=learner_id,
            item_id=item_id,
            kc_id=kc_id,
            is_correct=is_correct,
            response_value=response_value,
            response_time_ms=response_time_ms,
            hint_used=hint_used,
            session_id=session_id
        )

        # Check for new achievements
        new_achievements = engine.check_achievements(learner_id)

        return jsonify({
            'success': True,
            'interaction_id': result['interaction_id'],
            'skill_state': {
                'kc_id': kc_id,
                'p_mastery': result['p_mastery_after'],
                'p_mastery_before': result['p_mastery_before'],
                'mastery_change': result['mastery_change'],
                'status': 'mastered' if result['p_mastery_after'] >= 0.95 else 'in_progress',
                'next_review_at': result['next_review_date'].isoformat()
            },
            'xp_earned': result['xp_earned'],
            'achievements': [
                {
                    'achievement_id': str(ach['_id']),
                    'name': ach['name'],
                    'description': ach['description'],
                    'xp_reward': ach['xp_reward']
                }
                for ach in new_achievements
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/progress/<learner_id>', methods=['GET'])
def get_progress(learner_id):
    """
    Get learner's progress across all skills.

    Response:
    {
        "learner": {
            "learner_id": "...",
            "display_name": "Maria Garcia",
            "total_xp": 1250,
            "streak_count": 7,
            "estimated_ability": 0.65
        },
        "overview": {
            "total_kcs": 10,
            "mastered": 3,
            "in_progress": 4,
            "available": 2,
            "locked": 1,
            "avg_mastery": 0.62
        },
        "skills": [...]
    }
    """
    try:
        db = get_db()

        # Get learner
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Use learning engine for analytics
        engine = get_learning_engine()
        analytics = engine.get_learner_analytics(learner_id)

        return jsonify({
            'learner': {
                'learner_id': str(learner['_id']),
                'display_name': learner['display_name'],
                'total_xp': learner.get('total_xp', 0),
                'streak_count': learner.get('streak_count', 0),
                'estimated_ability': analytics['estimated_ability']
            },
            'overview': analytics['mastery_overview'],
            'skills': analytics['mastery_overview']['kcs'],
            'recent_accuracy': analytics['recent_accuracy'],
            'total_interactions': analytics['total_interactions']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/learning-path/<learner_id>', methods=['GET'])
def get_learning_path(learner_id):
    """
    Get recommended learning path for a learner.

    Response:
    {
        "path": [
            {
                "kc_id": "...",
                "kc_name": "Credit Score Basics",
                "reason": "review_due",
                "priority": "high",
                "retrievability": 0.65
            },
            ...
        ]
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get learning path
        engine = get_learning_engine()
        path = engine.get_learning_path(learner_id)

        return jsonify({
            'path': path
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/reviews/<learner_id>', methods=['GET'])
def get_reviews(learner_id):
    """
    Get review schedule for a learner.

    Query params:
    - days_ahead: number of days to look ahead (default 7)

    Response:
    {
        "due_now": 5,
        "due_items": [...],
        "upcoming": [...],
        "total_upcoming": 12
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        days_ahead = int(request.args.get('days_ahead', 7))

        # Get review schedule
        engine = get_learning_engine()
        schedule = engine.get_review_schedule(learner_id, days_ahead)

        return jsonify(schedule), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/analytics/<learner_id>', methods=['GET'])
def get_analytics(learner_id):
    """
    Get comprehensive analytics for a learner.

    Response:
    {
        "learner_id": "...",
        "display_name": "Maria Garcia",
        "total_xp": 1250,
        "streak_count": 7,
        "mastery_overview": {...},
        "recent_accuracy": 0.85,
        "estimated_ability": 0.65,
        "total_interactions": 45,
        "daily_progress": [...]
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get analytics
        engine = get_learning_engine()
        analytics = engine.get_learner_analytics(learner_id)

        return jsonify(analytics), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/kcs', methods=['GET'])
def get_knowledge_components():
    """
    Get all knowledge components with optional filtering.

    Query params:
    - domain: filter by domain (e.g., "credit", "banking")
    - difficulty_tier: filter by difficulty tier (1-5)

    Response:
    {
        "kcs": [
            {
                "kc_id": "...",
                "slug": "credit-score-basics",
                "name": "Understanding Credit Scores",
                "domain": "credit",
                "difficulty_tier": 1,
                "estimated_minutes": 20
            },
            ...
        ]
    }
    """
    try:
        db = get_db()

        # Build query
        query = {}
        if request.args.get('domain'):
            query['domain'] = request.args.get('domain')
        if request.args.get('difficulty_tier'):
            query['difficulty_tier'] = int(request.args.get('difficulty_tier'))

        # Get KCs
        kcs = db.collections.knowledge_components.find(query)

        return jsonify({
            'kcs': [
                {
                    'kc_id': str(kc['_id']),
                    'slug': kc['slug'],
                    'name': kc['name'],
                    'description': kc.get('description'),
                    'domain': kc['domain'],
                    'difficulty_tier': kc.get('difficulty_tier', 1),
                    'bloom_level': kc.get('bloom_level'),
                    'estimated_minutes': kc.get('estimated_minutes'),
                    'icon_url': kc.get('icon_url')
                }
                for kc in kcs
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/kcs/<kc_id>/progress/<learner_id>', methods=['GET'])
def get_kc_progress(kc_id, learner_id):
    """
    Get detailed progress for a specific KC.

    Response:
    {
        "kc": {...},
        "skill_state": {
            "p_mastery": 0.75,
            "status": "in_progress",
            "total_attempts": 15,
            "correct_count": 12,
            "current_streak": 3,
            "next_review_at": "..."
        },
        "recent_interactions": [...]
    }
    """
    try:
        db = get_db()

        # Get KC
        kc = db.collections.knowledge_components.find_one({'_id': ObjectId(kc_id)})
        if not kc:
            return jsonify({'error': 'Knowledge component not found'}), 404

        # Get skill state
        skill_state = db.collections.learner_skill_states.find_one({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        })

        # Get recent interactions
        interactions = list(db.collections.interactions.find({
            'learner_id': ObjectId(learner_id),
            'kc_id': ObjectId(kc_id)
        }).sort('created_at', -1).limit(10))

        return jsonify({
            'kc': {
                'kc_id': str(kc['_id']),
                'slug': kc['slug'],
                'name': kc['name'],
                'description': kc.get('description'),
                'domain': kc['domain']
            },
            'skill_state': {
                'p_mastery': skill_state.get('p_mastery', 0.0) if skill_state else 0.0,
                'status': skill_state.get('status', 'locked') if skill_state else 'locked',
                'total_attempts': skill_state.get('total_attempts', 0) if skill_state else 0,
                'correct_count': skill_state.get('correct_count', 0) if skill_state else 0,
                'current_streak': skill_state.get('current_streak', 0) if skill_state else 0,
                'next_review_at': skill_state.get('next_review_at').isoformat() if skill_state and skill_state.get('next_review_at') else None
            } if skill_state else None,
            'recent_interactions': [
                {
                    'interaction_id': str(i['_id']),
                    'is_correct': i.get('is_correct'),
                    'response_time_ms': i.get('response_time_ms'),
                    'created_at': i.get('created_at').isoformat() if i.get('created_at') else None
                }
                for i in interactions
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/calibrate', methods=['POST'])
def calibrate_items():
    """
    Trigger IRT calibration for items.

    Request JSON:
    {
        "item_id": "..."  // optional, calibrate specific item
    }

    Response:
    {
        "calibrated": 15,
        "results": [...]
    }
    """
    try:
        data = request.get_json() or {}
        item_id = data.get('item_id')

        engine = get_learning_engine()

        if item_id:
            # Calibrate single item
            result = engine.calibrate_item(item_id)
            return jsonify({
                'calibrated': 1,
                'results': [result]
            }), 200
        else:
            # Calibrate all items
            results = engine.calibrate_all_items(min_responses=10)
            return jsonify({
                'calibrated': len(results),
                'results': results
            }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/personalize', methods=['POST'])
def personalize_content():
    """
    Personalize learning content for a learner.

    Request JSON:
    {
        "learner_id": "507f...",
        "item_id": "507f..."
    }

    Response:
    {
        "item_id": "...",
        "content": {...},
        "cultural_bridge": "...",  // if available
        "visa_note": "...",        // if available
        "personalized": true
    }
    """
    try:
        from services import PersonalizationService

        data = request.get_json()
        learner_id = data.get('learner_id')
        item_id = data.get('item_id')

        if not learner_id or not item_id:
            return jsonify({'error': 'learner_id and item_id required'}), 400

        db = get_db()

        # Get learner
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get item
        item = db.collections.learning_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Get KC for this item
        mapping = db.collections.item_kc_mappings.find_one({'item_id': ObjectId(item_id)})
        if mapping:
            item['kc_id'] = str(mapping['kc_id'])

        # Personalize
        service = PersonalizationService(db.collections)
        personalized = service.personalize_item(
            {
                'item_id': str(item['_id']),
                'kc_id': item.get('kc_id'),
                'content': item.get('content', {})
            },
            {
                'country_of_origin': learner.get('country_of_origin'),
                'visa_type': learner.get('visa_type'),
                'english_proficiency': learner.get('english_proficiency')
            }
        )

        personalized['personalized'] = True
        return jsonify(personalized), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/explain-wrong', methods=['POST'])
def explain_wrong_answer():
    """
    Generate personalized explanation for wrong answer.

    Request JSON:
    {
        "learner_id": "507f...",
        "item_id": "507f...",
        "learner_answer": 0  // index of chosen answer
    }

    Response:
    {
        "explanation": "Personalized explanation...",
        "encouragement": "Keep going! You're learning."
    }
    """
    try:
        from services import PersonalizationService

        data = request.get_json()
        learner_id = data.get('learner_id')
        item_id = data.get('item_id')
        learner_answer = data.get('learner_answer')

        if learner_id is None or item_id is None or learner_answer is None:
            return jsonify({'error': 'learner_id, item_id, and learner_answer required'}), 400

        db = get_db()

        # Get learner
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get item
        item = db.collections.learning_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Generate explanation
        service = PersonalizationService(db.collections)
        explanation = service.generate_wrong_answer_explanation(
            {
                'content': item.get('content', {})
            },
            learner_answer,
            {
                'country_of_origin': learner.get('country_of_origin'),
                'english_proficiency': learner.get('english_proficiency'),
                'display_name': learner.get('display_name')
            }
        )

        # Generate encouragement
        encouragement = service.generate_encouragement(
            {
                'display_name': learner.get('display_name'),
                'country_of_origin': learner.get('country_of_origin')
            },
            context='incorrect'
        )

        return jsonify({
            'explanation': explanation,
            'encouragement': encouragement
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/hint', methods=['POST'])
def get_hint():
    """
    Get a personalized hint for a question.

    Request JSON:
    {
        "learner_id": "507f...",
        "item_id": "507f..."
    }

    Response:
    {
        "hint": "Think about the key principle..."
    }
    """
    try:
        from services import PersonalizationService

        data = request.get_json()
        learner_id = data.get('learner_id')
        item_id = data.get('item_id')

        if not learner_id or not item_id:
            return jsonify({'error': 'learner_id and item_id required'}), 400

        db = get_db()

        # Get learner
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get item
        item = db.collections.learning_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        # Generate hint
        service = PersonalizationService(db.collections)
        hint = service.generate_hint(
            {
                'content': item.get('content', {})
            },
            {
                'country_of_origin': learner.get('country_of_origin'),
                'english_proficiency': learner.get('english_proficiency')
            }
        )

        return jsonify({
            'hint': hint
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/generate-cultural-bridge', methods=['POST'])
def generate_cultural_bridge():
    """
    Generate cultural context for a KC using LLM.

    Request JSON:
    {
        "kc_id": "507f...",
        "country_code": "IND"
    }

    Response:
    {
        "cultural_bridge": "Generated context...",
        "cached": false
    }
    """
    try:
        from services import PersonalizationService

        data = request.get_json()
        kc_id = data.get('kc_id')
        country_code = data.get('country_code')

        if not kc_id or not country_code:
            return jsonify({'error': 'kc_id and country_code required'}), 400

        db = get_db()

        # Verify KC exists
        kc = db.collections.knowledge_components.find_one({'_id': ObjectId(kc_id)})
        if not kc:
            return jsonify({'error': 'Knowledge component not found'}), 404

        service = PersonalizationService(db.collections)

        # Check cache first
        cached_bridge = service.get_cultural_bridge(kc_id, country_code)

        if cached_bridge:
            return jsonify({
                'cultural_bridge': cached_bridge,
                'cached': True
            }), 200

        # Generate new one
        bridge = service.generate_cultural_bridge(kc_id, country_code)

        # Optionally cache it
        if bridge and bridge != f"This topic covers {kc['name']} in the US financial system.":
            try:
                db.collections.cultural_contexts.insert_one({
                    'kc_id': ObjectId(kc_id),
                    'country_code': country_code,
                    'context_type': 'comparison',
                    'content': bridge,
                    'is_verified': False,  # LLM-generated, not human-verified
                    'created_at': datetime.utcnow(),
                    'upvotes': 0,
                    'downvotes': 0
                })
            except Exception:
                pass  # Ignore cache errors

        return jsonify({
            'cultural_bridge': bridge,
            'cached': False
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/achievements/<learner_id>', methods=['GET'])
def get_achievements(learner_id):
    """
    Get learner's earned achievements.

    Response:
    {
        "achievements": [
            {
                "achievement_id": "...",
                "slug": "first-lesson",
                "name": "First Steps",
                "description": "Complete your first lesson",
                "icon_url": "...",
                "xp_reward": 50,
                "earned_at": "2025-01-15T10:00:00Z"
            },
            ...
        ]
    }
    """
    try:
        from services.achievements import AchievementService

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        service = AchievementService(db.collections)
        achievements = service.get_learner_achievements(learner_id)

        return jsonify({
            'achievements': achievements,
            'count': len(achievements)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/achievements/<learner_id>/available', methods=['GET'])
def get_available_achievements(learner_id):
    """
    Get achievements not yet earned by learner with progress.

    Response:
    {
        "achievements": [
            {
                "achievement_id": "...",
                "slug": "week-streak",
                "name": "Week Warrior",
                "description": "Maintain a 7-day learning streak",
                "xp_reward": 100,
                "progress": 3,
                "threshold": 7
            },
            ...
        ]
    }
    """
    try:
        from services.achievements import AchievementService

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        service = AchievementService(db.collections)
        achievements = service.get_available_achievements(learner_id)

        return jsonify({
            'achievements': achievements,
            'count': len(achievements)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/achievements/check', methods=['POST'])
def check_achievements():
    """
    Check for newly earned achievements.

    Request JSON:
    {
        "learner_id": "507f..."
    }

    Response:
    {
        "newly_earned": [
            {
                "achievement_id": "...",
                "slug": "first-lesson",
                "name": "First Steps",
                "description": "Complete your first lesson",
                "xp_reward": 50
            }
        ]
    }
    """
    try:
        from services.achievements import AchievementService

        data = request.get_json()
        learner_id = data.get('learner_id')

        if not learner_id:
            return jsonify({'error': 'learner_id required'}), 400

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        service = AchievementService(db.collections)
        newly_earned = service.check_achievements(learner_id)

        return jsonify({
            'newly_earned': newly_earned,
            'count': len(newly_earned)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/placement-test/start', methods=['POST'])
def start_placement_test():
    """
    Start placement test for new learner.

    Request JSON:
    {
        "learner_id": "507f..."
    }

    Response:
    {
        "test_id": "uuid",
        "items": [
            {
                "item_id": "...",
                "item_type": "multiple_choice",
                "content": {...},
                "kc_id": "...",
                "kc_name": "...",
                "position": 0
            },
            ...  // 10 items total
        ],
        "total_items": 10
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

        # Select 10 questions across difficulty range
        # Get items from different difficulty tiers (1-3) for balanced assessment
        items_per_tier = {1: 4, 2: 4, 3: 2}  # More beginner items

        selected_items = []
        position = 0

        for tier, count in items_per_tier.items():
            # Get items for this tier
            tier_items = list(db.collections.learning_items.aggregate([
                {
                    '$lookup': {
                        'from': 'item_kc_mappings',
                        'localField': '_id',
                        'foreignField': 'item_id',
                        'as': 'mappings'
                    }
                },
                {'$unwind': '$mappings'},
                {
                    '$lookup': {
                        'from': 'knowledge_components',
                        'localField': 'mappings.kc_id',
                        'foreignField': '_id',
                        'as': 'kc'
                    }
                },
                {'$unwind': '$kc'},
                {'$match': {
                    'kc.difficulty_tier': tier,
                    'item_type': 'multiple_choice'
                }},
                {'$sample': {'size': count}}
            ]))

            for item_data in tier_items:
                selected_items.append({
                    'item_id': str(item_data['_id']),
                    'item_type': item_data.get('item_type', 'multiple_choice'),
                    'content': item_data.get('content', {}),
                    'kc_id': str(item_data['kc']['_id']),
                    'kc_name': item_data['kc'].get('name'),
                    'kc_domain': item_data['kc'].get('domain'),
                    'difficulty_tier': tier,
                    'position': position
                })
                position += 1

        # If we don't have enough items, get any available items
        if len(selected_items) < 10:
            additional_needed = 10 - len(selected_items)
            additional_items = list(db.collections.learning_items.aggregate([
                {
                    '$lookup': {
                        'from': 'item_kc_mappings',
                        'localField': '_id',
                        'foreignField': 'item_id',
                        'as': 'mappings'
                    }
                },
                {'$unwind': '$mappings'},
                {
                    '$lookup': {
                        'from': 'knowledge_components',
                        'localField': 'mappings.kc_id',
                        'foreignField': '_id',
                        'as': 'kc'
                    }
                },
                {'$unwind': '$kc'},
                {'$match': {
                    'item_type': 'multiple_choice',
                    '_id': {'$nin': [ObjectId(item['item_id']) for item in selected_items]}
                }},
                {'$sample': {'size': additional_needed}}
            ]))

            for item_data in additional_items:
                selected_items.append({
                    'item_id': str(item_data['_id']),
                    'item_type': item_data.get('item_type', 'multiple_choice'),
                    'content': item_data.get('content', {}),
                    'kc_id': str(item_data['kc']['_id']),
                    'kc_name': item_data['kc'].get('name'),
                    'kc_domain': item_data['kc'].get('domain'),
                    'difficulty_tier': item_data['kc'].get('difficulty_tier', 1),
                    'position': position
                })
                position += 1

        test_id = str(uuid.uuid4())

        return jsonify({
            'test_id': test_id,
            'items': selected_items,
            'total_items': len(selected_items)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/placement-test/complete', methods=['POST'])
def complete_placement_test():
    """
    Process placement test results and set initial skill states.

    Request JSON:
    {
        "learner_id": "507f...",
        "test_id": "uuid",
        "results": [
            {
                "item_id": "...",
                "kc_id": "...",
                "is_correct": true,
                "response_time_ms": 12000
            },
            ...
        ]
    }

    Response:
    {
        "success": true,
        "score": 0.75,
        "skills_initialized": 15,
        "performance_level": "intermediate",
        "message": "Placement test complete! Your skills have been initialized."
    }
    """
    try:
        data = request.get_json()
        learner_id = data.get('learner_id')
        test_id = data.get('test_id')
        results = data.get('results', [])

        if not learner_id or not results:
            return jsonify({'error': 'learner_id and results required'}), 400

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Calculate overall score
        total_items = len(results)
        correct_count = sum(1 for r in results if r.get('is_correct'))
        score = correct_count / total_items if total_items > 0 else 0.0

        # Determine performance level
        if score >= 0.8:
            performance_level = 'advanced'
            base_mastery = 0.6
        elif score >= 0.6:
            performance_level = 'intermediate'
            base_mastery = 0.4
        elif score >= 0.4:
            performance_level = 'beginner'
            base_mastery = 0.2
        else:
            performance_level = 'novice'
            base_mastery = 0.1

        # Calculate per-KC performance
        kc_performance = {}
        for result in results:
            kc_id = result.get('kc_id')
            if kc_id:
                if kc_id not in kc_performance:
                    kc_performance[kc_id] = {'correct': 0, 'total': 0}
                kc_performance[kc_id]['total'] += 1
                if result.get('is_correct'):
                    kc_performance[kc_id]['correct'] += 1

        # Get all tier-1 skills to initialize
        tier1_skills = list(db.collections.knowledge_components.find({
            'difficulty_tier': 1
        }))

        skills_initialized = 0

        for skill in tier1_skills:
            kc_id = str(skill['_id'])

            # Check if learner already has this skill state
            existing_state = db.collections.learner_skill_states.find_one({
                'learner_id': ObjectId(learner_id),
                'kc_id': ObjectId(kc_id)
            })

            # Calculate initial mastery for this KC
            if kc_id in kc_performance:
                kc_score = kc_performance[kc_id]['correct'] / kc_performance[kc_id]['total']
                # Adjust based on KC-specific performance
                p_mastery = base_mastery + (kc_score - score) * 0.2
                p_mastery = max(0.05, min(0.85, p_mastery))  # Clamp between 0.05 and 0.85
            else:
                # Use base mastery for untested KCs
                p_mastery = base_mastery

            # Determine status
            if p_mastery >= 0.95:
                status = 'mastered'
            elif p_mastery >= 0.5:
                status = 'in_progress'
            else:
                status = 'available'

            if existing_state:
                # Update existing state
                db.collections.learner_skill_states.update_one(
                    {'_id': existing_state['_id']},
                    {
                        '$set': {
                            'p_mastery': p_mastery,
                            'status': status,
                            'updated_at': datetime.utcnow()
                        }
                    }
                )
            else:
                # Create new state
                db.collections.create_learner_skill_state(
                    learner_id=learner_id,
                    kc_id=kc_id,
                    status=status,
                    p_mastery=p_mastery
                )

            skills_initialized += 1

        # Log all placement test interactions
        for result in results:
            try:
                db.collections.interactions.insert_one({
                    'learner_id': ObjectId(learner_id),
                    'item_id': ObjectId(result['item_id']),
                    'kc_id': ObjectId(result['kc_id']),
                    'session_id': test_id,
                    'is_correct': result.get('is_correct', False),
                    'response_time_ms': result.get('response_time_ms', 0),
                    'response_value': result.get('response_value', {}),
                    'hint_used': False,
                    'is_placement_test': True,
                    'created_at': datetime.utcnow()
                })
            except Exception:
                pass  # Ignore individual interaction logging errors

        # Update learner profile with placement test completion
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$set': {
                    'placement_test_completed': True,
                    'placement_test_completed_at': datetime.utcnow(),
                    'placement_test_score': score,
                    'performance_level': performance_level,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        return jsonify({
            'success': True,
            'score': round(score, 2),
            'correct_count': correct_count,
            'total_items': total_items,
            'skills_initialized': skills_initialized,
            'performance_level': performance_level,
            'message': f'Placement test complete! You scored {correct_count}/{total_items}. Your skills have been initialized based on your performance.'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Health check endpoint
@adaptive_bp.route('/health', methods=['GET'])
def health_check():
    """Check if adaptive learning service is healthy."""
    try:
        db = get_db()
        # Try a simple query
        db.collections.learners.find_one()

        return jsonify({
            'status': 'healthy',
            'service': 'adaptive_learning',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
