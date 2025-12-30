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


# ========== DIAGNOSTIC TEST ENDPOINTS ==========

@adaptive_bp.route('/diagnostic-test/start', methods=['POST'])
def start_diagnostic_test():
    """
    Start diagnostic test for learner - samples questions per DOMAIN for comprehensive assessment.

    Unlike placement test (which samples by tier), this test samples 2 questions per domain
    to determine domain-level strengths and weaknesses.

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
                "kc_domain": "banking",
                "position": 0
            },
            ...  // 12 items total (2 per domain for 6 domains)
        ],
        "total_items": 12,
        "domains_tested": ["banking", "credit", "taxes", "investing", "budgeting", "retirement"]
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

        # Get all unique domains from knowledge components
        domains = db.collections.knowledge_components.distinct('domain')

        # Filter to main domains (exclude empty/null)
        main_domains = [d for d in domains if d and d.strip()]

        # Sample 2 questions per domain for balanced domain assessment
        questions_per_domain = 2
        selected_items = []
        position = 0
        domains_tested = []

        for domain in main_domains:
            # Get items for this domain
            domain_items = list(db.collections.learning_items.aggregate([
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
                    'kc.domain': domain,
                    'item_type': 'multiple_choice'
                }},
                {'$sample': {'size': questions_per_domain}}
            ]))

            if domain_items:
                domains_tested.append(domain)

                for item_data in domain_items:
                    selected_items.append({
                        'item_id': str(item_data['_id']),
                        'item_type': item_data.get('item_type', 'multiple_choice'),
                        'content': item_data.get('content', {}),
                        'kc_id': str(item_data['kc']['_id']),
                        'kc_name': item_data['kc'].get('name'),
                        'kc_domain': domain,
                        'difficulty_tier': item_data['kc'].get('difficulty_tier', 1),
                        'position': position
                    })
                    position += 1

        # Shuffle the items so domains are mixed (not all banking questions together)
        import random
        random.shuffle(selected_items)

        # Re-assign positions after shuffle
        for i, item in enumerate(selected_items):
            item['position'] = i

        test_id = str(uuid.uuid4())

        return jsonify({
            'test_id': test_id,
            'items': selected_items,
            'total_items': len(selected_items),
            'domains_tested': domains_tested
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/diagnostic-test/complete', methods=['POST'])
def complete_diagnostic_test():
    """
    Process diagnostic test results and calculate domain-level mastery.

    This stores domain_mastery scores and domain_priority order for personalized
    lesson recommendations.

    Request JSON:
    {
        "learner_id": "507f...",
        "test_id": "uuid",
        "results": [
            {
                "item_id": "...",
                "kc_id": "...",
                "kc_domain": "banking",
                "is_correct": true,
                "response_time_ms": 12000
            },
            ...
        ]
    }

    Response:
    {
        "success": true,
        "overall_score": 0.67,
        "domain_scores": {
            "banking": 1.0,
            "credit": 0.5,
            "taxes": 0.0,
            ...
        },
        "domain_priority": ["taxes", "credit", "investing", "budgeting", "retirement", "banking"],
        "strengths": ["banking"],
        "weaknesses": ["taxes", "credit"],
        "recommendations": [
            {"domain": "taxes", "message": "Start with tax basics - this is your biggest opportunity!"},
            {"domain": "credit", "message": "Build on your credit knowledge with more practice"}
        ]
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
        overall_score = correct_count / total_items if total_items > 0 else 0.0

        # Calculate per-domain scores
        domain_results = {}
        for result in results:
            domain = result.get('kc_domain')
            if domain:
                if domain not in domain_results:
                    domain_results[domain] = {'correct': 0, 'total': 0}
                domain_results[domain]['total'] += 1
                if result.get('is_correct'):
                    domain_results[domain]['correct'] += 1

        # Calculate domain scores (0.0 to 1.0)
        domain_scores = {}
        for domain, stats in domain_results.items():
            domain_scores[domain] = stats['correct'] / stats['total'] if stats['total'] > 0 else 0.0

        # Sort domains by score (ascending) to get priority order (weakest first)
        domain_priority = sorted(domain_scores.keys(), key=lambda d: domain_scores[d])

        # Identify strengths (>= 75%) and weaknesses (<= 50%)
        strengths = [d for d, score in domain_scores.items() if score >= 0.75]
        weaknesses = [d for d, score in domain_scores.items() if score <= 0.5]

        # Generate recommendations
        recommendations = []
        domain_messages = {
            'banking': 'Master banking fundamentals for everyday money management',
            'credit': 'Build your credit knowledge to unlock financial opportunities',
            'taxes': 'Learn tax basics to keep more of your hard-earned money',
            'investing': 'Start your investing journey to grow your wealth',
            'budgeting': 'Develop budgeting skills for financial stability',
            'retirement': 'Plan for retirement to secure your future',
            'insurance': 'Understand insurance to protect yourself',
            'cryptocurrency': 'Explore cryptocurrency basics for the modern economy'
        }

        for domain in domain_priority[:3]:  # Top 3 priorities
            score = domain_scores.get(domain, 0)
            if score < 0.5:
                urgency = "Start here!"
            elif score < 0.75:
                urgency = "Build on what you know"
            else:
                urgency = "Perfect your mastery"

            recommendations.append({
                'domain': domain,
                'score': round(score, 2),
                'urgency': urgency,
                'message': domain_messages.get(domain, f'Focus on {domain} to improve')
            })

        # Initialize skill states for all tier-1 KCs with domain-adjusted mastery
        tier1_skills = list(db.collections.knowledge_components.find({
            'difficulty_tier': 1
        }))

        skills_initialized = 0
        for skill in tier1_skills:
            kc_id = str(skill['_id'])
            kc_domain = skill.get('domain')

            # Calculate initial mastery based on domain performance
            base_mastery = domain_scores.get(kc_domain, 0.3)
            # Map domain score (0-1) to mastery (0.1-0.7)
            # Low score = low mastery (more to learn)
            # High score = higher mastery (can skip basics)
            p_mastery = 0.1 + (base_mastery * 0.6)  # Range: 0.1 to 0.7

            # Determine status
            if p_mastery >= 0.5:
                status = 'in_progress'
            else:
                status = 'available'

            # Check if learner already has this skill state
            existing_state = db.collections.learner_skill_states.find_one({
                'learner_id': ObjectId(learner_id),
                'kc_id': ObjectId(kc_id)
            })

            if existing_state:
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
                db.collections.create_learner_skill_state(
                    learner_id=learner_id,
                    kc_id=kc_id,
                    status=status,
                    p_mastery=p_mastery
                )

            skills_initialized += 1

        # Log all diagnostic test interactions
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
                    'is_diagnostic_test': True,
                    'created_at': datetime.utcnow()
                })
            except Exception:
                pass

        # Update learner profile with diagnostic results
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {
                '$set': {
                    'diagnostic_test_completed': True,
                    'diagnostic_test_completed_at': datetime.utcnow(),
                    'diagnostic_test_score': overall_score,
                    'domain_mastery': domain_scores,
                    'domain_priority': domain_priority,
                    'updated_at': datetime.utcnow()
                }
            }
        )

        return jsonify({
            'success': True,
            'overall_score': round(overall_score, 2),
            'correct_count': correct_count,
            'total_items': total_items,
            'domain_scores': {k: round(v, 2) for k, v in domain_scores.items()},
            'domain_priority': domain_priority,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations,
            'skills_initialized': skills_initialized,
            'message': f'Diagnostic complete! We\'ve identified your strengths and areas for growth.'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/diagnostic-results/<learner_id>', methods=['GET'])
def get_diagnostic_results(learner_id):
    """
    Get stored diagnostic results for a learner.

    Response:
    {
        "completed": true,
        "domain_mastery": {...},
        "domain_priority": [...],
        "diagnostic_score": 0.67,
        "completed_at": "2025-01-10T15:30:00Z"
    }
    """
    try:
        db = get_db()

        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        return jsonify({
            'completed': learner.get('diagnostic_test_completed', False),
            'domain_mastery': learner.get('domain_mastery', {}),
            'domain_priority': learner.get('domain_priority', []),
            'diagnostic_score': learner.get('diagnostic_test_score'),
            'completed_at': learner.get('diagnostic_test_completed_at').isoformat() if learner.get('diagnostic_test_completed_at') else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========== VOICE INTERACTION ENDPOINTS ==========

@adaptive_bp.route('/voice/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text.

    Request JSON:
    {
        "audio_base64": "base64_encoded_audio",
        "language_hint": "en"  // optional
    }

    Response:
    {
        "transcription": "I think it's a credit card",
        "confidence": 0.95,
        "detected_language": "en",
        "duration_ms": 2500
    }
    """
    try:
        from services import VoiceService

        data = request.get_json()
        audio_base64 = data.get('audio_base64')
        language_hint = data.get('language_hint')

        if not audio_base64:
            return jsonify({'error': 'audio_base64 required'}), 400

        service = VoiceService()
        result = service.transcribe(audio_base64, language_hint)

        if 'error' in result:
            return jsonify({'error': result['error']}), 500

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/voice/tts', methods=['POST'])
def generate_tts():
    """
    Generate text-to-speech audio.

    Request JSON:
    {
        "text": "What is a credit score?",
        "language": "en",  // optional
        "voice": "alloy"   // optional
    }

    Response:
    {
        "audio_base64": "data:audio/mp3;base64,..."
    }
    """
    try:
        from services import VoiceService

        data = request.get_json()
        text = data.get('text')
        language = data.get('language', 'en')
        voice = data.get('voice')

        if not text:
            return jsonify({'error': 'text required'}), 400

        service = VoiceService()
        audio_base64 = service.generate_tts(text, language, voice)

        if not audio_base64:
            return jsonify({'error': 'Failed to generate audio'}), 500

        return jsonify({'audio_base64': audio_base64}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/voice/tts/<item_id>', methods=['GET'])
def get_item_tts(item_id):
    """
    Get or generate TTS for a learning item (uses cached audio).

    Query params:
    - language: language code (default: 'en')
    - choice_index: optional, index of answer choice (0, 1, 2, 3)

    Response:
    {
        "audio_base64": "data:audio/mp3;base64,...",
        "cached": true/false
    }
    """
    try:
        from services import VoiceService
        from services.voice_cached import CachedVoiceService

        db = get_db()
        language = request.args.get('language', 'en')
        choice_index = request.args.get('choice_index', type=int)
        
        print(f"🔍 TTS request: item_id={item_id}, language={language}, choice_index={choice_index}")

        # Get item
        item = db.collections.learning_items.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Check cache status
        tts_cache = item.get('tts_cache', {})
        print(f"📦 Cache status for language '{language}': {language in tts_cache}")
        if language in tts_cache:
            print(f"   Cache value exists: {bool(tts_cache[language])}, length: {len(str(tts_cache[language])) if tts_cache[language] else 0}")

        # Use cached voice service
        voice_service = VoiceService()
        cached_voice = CachedVoiceService(voice_service)

        # Check if requesting a specific choice
        if choice_index is not None:
            try:
                audio_base64 = cached_voice.get_tts_for_choice(item_id, choice_index, language)
                if not audio_base64:
                    return jsonify({'error': 'Failed to generate choice audio'}), 500
            except Exception as choice_error:
                error_msg = str(choice_error)
                if 'unusual_activity' in error_msg.lower() or '401' in error_msg:
                    return jsonify({
                        'error': 'ElevenLabs API access denied. Please check your API key and account status.'
                    }), 500
                return jsonify({'error': f'Failed to generate choice audio: {error_msg}'}), 500
            
            # Check if it was cached
            tts_cache = item.get('tts_cache', {})
            choice_key = f'{language}_choice_{choice_index}'
            was_cached = choice_key in tts_cache and tts_cache[choice_key]
            
            return jsonify({
                'audio_base64': audio_base64,
                'cached': was_cached
            }), 200

        # Get question stem TTS (cached)
        try:
            audio_base64 = cached_voice.get_tts_for_item(item_id, language)
            if not audio_base64:
                return jsonify({'error': 'Failed to generate audio'}), 500
        except Exception as item_error:
            error_msg = str(item_error)
            if 'unusual_activity' in error_msg.lower() or '401' in error_msg:
                return jsonify({
                    'error': 'ElevenLabs API access denied. Please check your API key and account status.'
                }), 500
            return jsonify({'error': f'Failed to generate audio: {error_msg}'}), 500

        # Check if it was cached
        tts_cache = item.get('tts_cache', {})
        was_cached = language in tts_cache and tts_cache[language]

        return jsonify({
            'audio_base64': audio_base64,
            'cached': was_cached
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/interactions/voice', methods=['POST'])
def log_voice_interaction():
    """
    Log a voice-based interaction with semantic matching.

    Request JSON:
    {
        "learner_id": "507f...",
        "item_id": "507f...",
        "session_id": "uuid",
        "audio_base64": "base64_audio",
        "question_type": "definition"  // optional: for threshold selection
    }

    Response:
    {
        "success": true,
        "is_correct": true,
        "transcription": "A credit score is...",
        "matched_choice": "a",
        "similarity_scores": {"a": 0.92, "b": 0.3, ...},
        "confidence": {
            "transcription": 0.95,
            "semantic_match": 0.92,
            "voice": 0.85
        },
        "misconception": {...},  // if detected
        "skill_state": {...},
        "xp_earned": 20,
        "feedback": "Great job!"
    }
    """
    try:
        from services import VoiceService, SemanticMatcher, MisconceptionDetector

        data = request.get_json()
        learner_id = data.get('learner_id')
        item_id = data.get('item_id')
        session_id = data.get('session_id')
        audio_base64 = data.get('audio_base64')
        question_type = data.get('question_type', 'default')

        if not all([learner_id, item_id, audio_base64]):
            return jsonify({'error': 'learner_id, item_id, and audio_base64 required'}), 400

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
        if not mapping:
            return jsonify({'error': 'Item not mapped to any skill'}), 400

        kc_id = str(mapping['kc_id'])

        # 1. Transcribe audio
        voice_service = VoiceService()
        transcription_result = voice_service.transcribe(
            audio_base64,
            language_hint=learner.get('native_language', 'en')
        )

        if 'error' in transcription_result:
            return jsonify({'error': f'Transcription failed: {transcription_result["error"]}'}), 500

        # 2. Analyze audio confidence
        audio_analysis = voice_service.enhanced_confidence_analysis(
            audio_base64,
            transcription_result['transcription']
        )

        # 3. Semantic matching
        matcher = SemanticMatcher()
        choices = item.get('content', {}).get('choices', {})
        correct_answer = item.get('content', {}).get('correct_answer')

        if not choices or not correct_answer:
            return jsonify({'error': 'Item missing choices or correct answer'}), 400

        match_result = matcher.match_answer(
            transcription_result['transcription'],
            choices,
            correct_answer,
            question_type
        )

        # 4. Handle ambiguous responses
        if match_result.get('clarification_needed'):
            return jsonify({
                'success': False,
                'ambiguous': True,
                'transcription': transcription_result['transcription'],
                'clarification_prompt': match_result['clarification_prompt'],
                'similar_choices': match_result['similar_choices'],
                'similarity_scores': match_result['similarity_scores']
            }), 200

        is_correct = match_result.get('is_correct', False)

        # 5. Detect misconception if wrong
        misconception = None
        if not is_correct:
            detector = MisconceptionDetector(db.collections)
            misconception_result = detector.detect(
                kc_id,
                transcription_result['transcription'],
                item.get('content', {}).get('explanation', ''),
                learner.get('country_of_origin', 'US')
            )

            if misconception_result.get('misconception_detected'):
                misconception = misconception_result

                # Log misconception if it has an ID
                if misconception_result.get('misconception_id'):
                    detector.log_misconception(
                        learner_id,
                        misconception_result['misconception_id']
                    )

        # 6. Create voice response record
        voice_response_id = db.collections.create_voice_response(
            learner_id=learner_id,
            kc_id=kc_id,
            transcription=transcription_result['transcription'],
            transcription_confidence=transcription_result['confidence'],
            detected_language=transcription_result['detected_language'],
            duration_ms=transcription_result['duration_ms'],
            semantic_similarity=match_result['best_match_score'],
            matched_choice=match_result.get('matched_choice'),
            similarity_scores=match_result['similarity_scores'],
            hesitation_ms=audio_analysis.get('hesitation_ms', 0),
            speech_pace_wpm=audio_analysis.get('speech_pace_wpm', 0),
            confidence_score=audio_analysis.get('confidence_score', 0.0),
            filler_words_count=audio_analysis.get('filler_words_count', 0),
            false_starts=audio_analysis.get('false_starts', 0),
            is_correct=is_correct
        )

        # 7. Calculate response time (use audio duration as proxy)
        response_time_ms = transcription_result['duration_ms'] + 1000  # Add thinking time

        # 8. Submit answer through learning engine
        engine = get_learning_engine()
        learning_result = engine.submit_answer(
            learner_id=learner_id,
            item_id=item_id,
            kc_id=kc_id,
            is_correct=is_correct,
            response_value={'voice_response_id': voice_response_id, 'transcription': transcription_result['transcription']},
            response_time_ms=response_time_ms,
            hint_used=False,
            session_id=session_id
        )

        # 9. Update voice response with interaction ID
        db.collections.voice_responses.update_one(
            {'_id': ObjectId(voice_response_id)},
            {'$set': {'interaction_id': learning_result['interaction_id']}}
        )

        # 10. Check for achievements
        new_achievements = engine.check_achievements(learner_id)

        # 11. Generate feedback
        feedback = match_result.get('evaluation_reason', '')
        if misconception:
            feedback += f" {misconception.get('description', '')}"

        return jsonify({
            'success': True,
            'is_correct': is_correct,
            'transcription': transcription_result['transcription'],
            'matched_choice': match_result.get('matched_choice'),
            'similarity_scores': match_result['similarity_scores'],
            'confidence': {
                'transcription': transcription_result['confidence'],
                'semantic_match': match_result['best_match_score'],
                'voice': audio_analysis.get('confidence_score', 0.0)
            },
            'audio_analysis': {
                'hesitation_ms': audio_analysis.get('hesitation_ms', 0),
                'speech_pace_wpm': audio_analysis.get('speech_pace_wpm', 0),
                'filler_words': audio_analysis.get('filler_words_count', 0)
            },
            'misconception': misconception,
            'skill_state': {
                'kc_id': kc_id,
                'p_mastery': learning_result['p_mastery_after'],
                'mastery_change': learning_result['mastery_change'],
                'status': 'mastered' if learning_result['p_mastery_after'] >= 0.95 else 'in_progress',
                'next_review_at': learning_result['next_review_date'].isoformat()
            },
            'xp_earned': learning_result['xp_earned'],
            'achievements': [
                {
                    'achievement_id': str(ach['_id']),
                    'name': ach['name'],
                    'description': ach['description'],
                    'xp_reward': ach['xp_reward']
                }
                for ach in new_achievements
            ],
            'feedback': feedback
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/learner/<learner_id>/misconceptions', methods=['GET'])
def get_learner_misconceptions(learner_id):
    """
    Get learner's detected misconceptions.

    Query params:
    - resolved: true/false (default: false, show unresolved only)

    Response:
    {
        "misconceptions": [
            {
                "misconception_id": "...",
                "kc_id": "...",
                "pattern_type": "confusion",
                "description": "Confuses APR with APY",
                "times_detected": 3,
                "first_detected_at": "2025-01-10T...",
                "last_detected_at": "2025-01-15T...",
                "resolved": false,
                "remediation": {
                    "content": "Review the difference between...",
                    "review_skills": ["apr-basics", "apy-basics"]
                }
            }
        ]
    }
    """
    try:
        from services import MisconceptionDetector

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        resolved = request.args.get('resolved', 'false').lower() == 'true'

        detector = MisconceptionDetector(db.collections)
        misconceptions = detector.get_learner_misconceptions(learner_id, resolved)

        return jsonify({
            'misconceptions': [
                {
                    'misconception_id': str(m['_id']),
                    'kc_id': str(m['kc_id']),
                    'pattern_type': m.get('pattern_type'),
                    'description': m.get('description'),
                    'times_detected': m.get('times_detected', 0),
                    'first_detected_at': m.get('first_detected_at').isoformat() if m.get('first_detected_at') else None,
                    'last_detected_at': m.get('last_detected_at').isoformat() if m.get('last_detected_at') else None,
                    'resolved': m.get('resolved', False),
                    'remediation': m.get('remediation_content', {})
                }
                for m in misconceptions
            ],
            'count': len(misconceptions)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/learner/<learner_id>/misconceptions/<misconception_id>/resolve', methods=['POST'])
def resolve_misconception(learner_id, misconception_id):
    """
    Mark a misconception as resolved for a learner.

    Response:
    {
        "success": true,
        "message": "Misconception marked as resolved"
    }
    """
    try:
        from services import MisconceptionDetector

        db = get_db()

        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        detector = MisconceptionDetector(db.collections)
        detector.mark_misconception_resolved(learner_id, misconception_id)

        return jsonify({
            'success': True,
            'message': 'Misconception marked as resolved'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============= WEAKNESS TRACKING & REVIEW QUEUE =============

@adaptive_bp.route('/weaknesses/<learner_id>', methods=['GET'])
def get_weaknesses(learner_id):
    """
    Get learner's weak areas based on incorrect answers and low mastery.

    Query params:
    - limit: max number of weak areas (default 10)

    Response:
    {
        "weak_areas": [
            {
                "kc_id": "...",
                "kc_name": "Credit Score Basics",
                "domain": "credit",
                "p_mastery": 0.35,
                "incorrect_count": 5,
                "total_attempts": 8,
                "accuracy": 0.375,
                "last_wrong_at": "2025-01-15T10:00:00Z",
                "common_mistakes": [
                    {"choice": "Higher is better", "count": 3}
                ],
                "recommendation": "Focus on understanding what affects credit scores"
            }
        ],
        "summary": {
            "total_weak_areas": 5,
            "weakest_domain": "credit",
            "avg_weak_mastery": 0.32
        }
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        limit = int(request.args.get('limit', 10))

        # Get skill states with low mastery (< 0.6 is considered weak)
        weak_skills = list(db.collections.learner_skill_states.find({
            'learner_id': ObjectId(learner_id),
            'status': {'$in': ['available', 'in_progress']},
            'p_mastery': {'$lt': 0.6}
        }).sort('p_mastery', 1).limit(limit))

        weak_areas = []
        domain_weakness = {}

        for skill in weak_skills:
            kc = db.collections.knowledge_components.find_one({'_id': skill['kc_id']})
            if not kc:
                continue

            # Get incorrect interactions for this KC
            wrong_interactions = list(db.collections.interactions.find({
                'learner_id': ObjectId(learner_id),
                'kc_id': skill['kc_id'],
                'is_correct': False
            }).sort('created_at', -1).limit(20))

            # Analyze common wrong answers
            wrong_choices = {}
            last_wrong_at = None

            for interaction in wrong_interactions:
                if not last_wrong_at:
                    last_wrong_at = interaction.get('created_at')

                response = interaction.get('response_value', {})
                choice = response.get('selected_choice')
                if choice is not None:
                    # Get the choice text from the item
                    item = db.collections.learning_items.find_one({'_id': interaction['item_id']})
                    if item and 'content' in item:
                        choices = item['content'].get('choices', [])
                        if 0 <= choice < len(choices):
                            choice_text = choices[choice]
                            wrong_choices[choice_text] = wrong_choices.get(choice_text, 0) + 1

            # Sort by frequency
            common_mistakes = [
                {'choice': choice, 'count': count}
                for choice, count in sorted(wrong_choices.items(), key=lambda x: -x[1])[:3]
            ]

            total_attempts = skill.get('total_attempts', 0)
            correct_count = skill.get('correct_count', 0)
            incorrect_count = total_attempts - correct_count
            accuracy = correct_count / total_attempts if total_attempts > 0 else 0

            # Track domain weakness
            domain = kc.get('domain', 'unknown')
            if domain not in domain_weakness:
                domain_weakness[domain] = []
            domain_weakness[domain].append(skill.get('p_mastery', 0))

            weak_areas.append({
                'kc_id': str(skill['kc_id']),
                'kc_name': kc.get('name', 'Unknown'),
                'domain': domain,
                'p_mastery': round(skill.get('p_mastery', 0), 3),
                'incorrect_count': incorrect_count,
                'total_attempts': total_attempts,
                'accuracy': round(accuracy, 3),
                'last_wrong_at': last_wrong_at.isoformat() if last_wrong_at else None,
                'common_mistakes': common_mistakes,
                'recommendation': f"Review {kc.get('name', 'this topic')} - focus on the concepts you missed"
            })

        # Find weakest domain
        weakest_domain = None
        lowest_avg = 1.0
        for domain, masteries in domain_weakness.items():
            avg = sum(masteries) / len(masteries)
            if avg < lowest_avg:
                lowest_avg = avg
                weakest_domain = domain

        # Calculate average weak mastery
        avg_weak_mastery = sum(w['p_mastery'] for w in weak_areas) / len(weak_areas) if weak_areas else 0

        return jsonify({
            'weak_areas': weak_areas,
            'summary': {
                'total_weak_areas': len(weak_areas),
                'weakest_domain': weakest_domain,
                'avg_weak_mastery': round(avg_weak_mastery, 3)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/review-queue/<learner_id>', methods=['GET'])
def get_review_queue(learner_id):
    """
    Get review questions based on:
    1. FSRS due reviews (spaced repetition)
    2. Previously incorrect answers
    3. Low mastery areas

    Query params:
    - limit: max questions (default 10)
    - include_due: include FSRS due reviews (default true)
    - include_mistakes: include past mistakes (default true)

    Response:
    {
        "review_items": [
            {
                "item_id": "...",
                "item_type": "multiple_choice",
                "content": {...},
                "kc_id": "...",
                "kc_name": "Credit Score Basics",
                "domain": "credit",
                "review_reason": "due_for_review" | "past_mistake" | "low_mastery",
                "p_mastery": 0.45,
                "last_seen_at": "2025-01-10T...",
                "times_wrong": 2
            }
        ],
        "queue_stats": {
            "due_reviews": 3,
            "mistake_reviews": 4,
            "low_mastery_reviews": 3,
            "total": 10
        }
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        limit = int(request.args.get('limit', 10))
        include_due = request.args.get('include_due', 'true').lower() == 'true'
        include_mistakes = request.args.get('include_mistakes', 'true').lower() == 'true'

        review_items = []
        seen_item_ids = set()
        now = datetime.utcnow()

        queue_stats = {
            'due_reviews': 0,
            'mistake_reviews': 0,
            'low_mastery_reviews': 0,
            'total': 0
        }

        # 1. Get FSRS due reviews
        if include_due:
            due_skills = list(db.collections.learner_skill_states.find({
                'learner_id': ObjectId(learner_id),
                'next_review_at': {'$lte': now},
                'status': {'$in': ['in_progress', 'mastered']}
            }).sort('next_review_at', 1).limit(limit))

            for skill in due_skills:
                if len(review_items) >= limit:
                    break

                # Get a random item for this KC
                items = list(db.collections.learning_items.aggregate([
                    {'$lookup': {
                        'from': 'item_kc_mappings',
                        'localField': '_id',
                        'foreignField': 'item_id',
                        'as': 'mapping'
                    }},
                    {'$unwind': '$mapping'},
                    {'$match': {
                        'mapping.kc_id': skill['kc_id'],
                        'item_type': 'multiple_choice'
                    }},
                    {'$sample': {'size': 1}}
                ]))

                if items and str(items[0]['_id']) not in seen_item_ids:
                    item = items[0]
                    kc = db.collections.knowledge_components.find_one({'_id': skill['kc_id']})

                    review_items.append({
                        'item_id': str(item['_id']),
                        'item_type': item.get('item_type', 'multiple_choice'),
                        'content': item.get('content', {}),
                        'kc_id': str(skill['kc_id']),
                        'kc_name': kc.get('name') if kc else 'Unknown',
                        'domain': kc.get('domain') if kc else 'unknown',
                        'review_reason': 'due_for_review',
                        'p_mastery': round(skill.get('p_mastery', 0), 3),
                        'last_seen_at': skill.get('last_reviewed_at').isoformat() if skill.get('last_reviewed_at') else None,
                        'times_wrong': 0
                    })
                    seen_item_ids.add(str(item['_id']))
                    queue_stats['due_reviews'] += 1

        # 2. Get items the learner got wrong recently
        if include_mistakes and len(review_items) < limit:
            wrong_interactions = list(db.collections.interactions.aggregate([
                {'$match': {
                    'learner_id': ObjectId(learner_id),
                    'is_correct': False
                }},
                {'$group': {
                    '_id': '$item_id',
                    'times_wrong': {'$sum': 1},
                    'last_wrong': {'$max': '$created_at'},
                    'kc_id': {'$first': '$kc_id'}
                }},
                {'$sort': {'times_wrong': -1, 'last_wrong': -1}},
                {'$limit': limit * 2}  # Get more to filter
            ]))

            for wrong in wrong_interactions:
                if len(review_items) >= limit:
                    break

                item_id = str(wrong['_id'])
                if item_id in seen_item_ids:
                    continue

                item = db.collections.learning_items.find_one({'_id': wrong['_id']})
                if not item:
                    continue

                kc = db.collections.knowledge_components.find_one({'_id': wrong['kc_id']})
                skill_state = db.collections.learner_skill_states.find_one({
                    'learner_id': ObjectId(learner_id),
                    'kc_id': wrong['kc_id']
                })

                review_items.append({
                    'item_id': item_id,
                    'item_type': item.get('item_type', 'multiple_choice'),
                    'content': item.get('content', {}),
                    'kc_id': str(wrong['kc_id']),
                    'kc_name': kc.get('name') if kc else 'Unknown',
                    'domain': kc.get('domain') if kc else 'unknown',
                    'review_reason': 'past_mistake',
                    'p_mastery': round(skill_state.get('p_mastery', 0), 3) if skill_state else 0,
                    'last_seen_at': wrong['last_wrong'].isoformat() if wrong.get('last_wrong') else None,
                    'times_wrong': wrong['times_wrong']
                })
                seen_item_ids.add(item_id)
                queue_stats['mistake_reviews'] += 1

        # 3. Get items from low mastery KCs
        if len(review_items) < limit:
            low_mastery_skills = list(db.collections.learner_skill_states.find({
                'learner_id': ObjectId(learner_id),
                'p_mastery': {'$lt': 0.5},
                'status': {'$in': ['available', 'in_progress']}
            }).sort('p_mastery', 1).limit(limit))

            for skill in low_mastery_skills:
                if len(review_items) >= limit:
                    break

                # Get a random item for this KC
                items = list(db.collections.learning_items.aggregate([
                    {'$lookup': {
                        'from': 'item_kc_mappings',
                        'localField': '_id',
                        'foreignField': 'item_id',
                        'as': 'mapping'
                    }},
                    {'$unwind': '$mapping'},
                    {'$match': {
                        'mapping.kc_id': skill['kc_id'],
                        'item_type': 'multiple_choice',
                        '_id': {'$nin': [ObjectId(id) for id in seen_item_ids]}
                    }},
                    {'$sample': {'size': 1}}
                ]))

                if items:
                    item = items[0]
                    kc = db.collections.knowledge_components.find_one({'_id': skill['kc_id']})

                    review_items.append({
                        'item_id': str(item['_id']),
                        'item_type': item.get('item_type', 'multiple_choice'),
                        'content': item.get('content', {}),
                        'kc_id': str(skill['kc_id']),
                        'kc_name': kc.get('name') if kc else 'Unknown',
                        'domain': kc.get('domain') if kc else 'unknown',
                        'review_reason': 'low_mastery',
                        'p_mastery': round(skill.get('p_mastery', 0), 3),
                        'last_seen_at': skill.get('updated_at').isoformat() if skill.get('updated_at') else None,
                        'times_wrong': 0
                    })
                    seen_item_ids.add(str(item['_id']))
                    queue_stats['low_mastery_reviews'] += 1

        queue_stats['total'] = len(review_items)

        return jsonify({
            'review_items': review_items,
            'queue_stats': queue_stats
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@adaptive_bp.route('/recommend-next/<learner_id>', methods=['GET'])
def recommend_next_lesson(learner_id):
    """
    Recommend the next best lesson based on:
    1. Personalization (goals, background)
    2. Current mastery levels
    3. Learning path optimization

    Response:
    {
        "recommended_lessons": [
            {
                "kc_id": "...",
                "kc_name": "Understanding APR",
                "domain": "credit",
                "reason": "Builds on your credit score knowledge",
                "priority_score": 85,
                "estimated_time_minutes": 15,
                "difficulty_tier": 2
            }
        ],
        "learning_path": {
            "current_focus": "credit",
            "next_domains": ["taxes", "investing"],
            "mastery_by_domain": {...}
        }
    }
    """
    try:
        db = get_db()

        # Validate learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404

        # Get all skill states
        skill_states = {
            str(s['kc_id']): s
            for s in db.collections.learner_skill_states.find({
                'learner_id': ObjectId(learner_id)
            })
        }

        # Get all KCs
        all_kcs = list(db.collections.knowledge_components.find({'is_active': True}))

        # Calculate domain mastery
        domain_mastery = {}
        for kc in all_kcs:
            domain = kc.get('domain', 'unknown')
            if domain not in domain_mastery:
                domain_mastery[domain] = {'total': 0, 'sum_mastery': 0, 'kcs': []}

            kc_id = str(kc['_id'])
            state = skill_states.get(kc_id, {})
            mastery = state.get('p_mastery', 0)

            domain_mastery[domain]['total'] += 1
            domain_mastery[domain]['sum_mastery'] += mastery
            domain_mastery[domain]['kcs'].append({
                'kc_id': kc_id,
                'kc': kc,
                'state': state
            })

        # Calculate average mastery per domain
        for domain in domain_mastery:
            total = domain_mastery[domain]['total']
            domain_mastery[domain]['avg_mastery'] = (
                domain_mastery[domain]['sum_mastery'] / total if total > 0 else 0
            )

        # Use personalization to determine priorities
        from services.personalization import get_personalized_course_order
        available_domains = list(domain_mastery.keys())
        recommendations, _ = get_personalized_course_order(learner, available_domains)

        # Build recommended lessons list
        recommended_lessons = []

        # Sort recommendations by priority
        for rec in sorted(recommendations, key=lambda x: -x['priority_score'])[:3]:
            domain = rec['domain']
            domain_data = domain_mastery.get(domain, {})

            # Find the next lesson in this domain (lowest mastery, not mastered)
            for kc_data in sorted(domain_data.get('kcs', []),
                                  key=lambda x: x['state'].get('p_mastery', 0)):
                state = kc_data['state']
                if state.get('status') not in ['mastered']:
                    kc = kc_data['kc']
                    recommended_lessons.append({
                        'kc_id': kc_data['kc_id'],
                        'kc_name': kc.get('name', 'Unknown'),
                        'domain': domain,
                        'reason': rec['reason'],
                        'priority_score': rec['priority_score'],
                        'estimated_time_minutes': kc.get('estimated_minutes', 15),
                        'difficulty_tier': kc.get('difficulty_tier', 1),
                        'current_mastery': round(state.get('p_mastery', 0), 3)
                    })
                    break

        # Determine current focus domain (lowest average mastery among high-priority domains)
        current_focus = None
        for rec in recommendations:
            if rec['recommendation_type'] == 'priority':
                current_focus = rec['domain']
                break

        if not current_focus and recommendations:
            current_focus = recommendations[0]['domain']

        # Get next domains
        next_domains = [
            r['domain'] for r in recommendations[1:4]
            if r['recommendation_type'] in ['priority', 'suggested']
        ]

        return jsonify({
            'recommended_lessons': recommended_lessons,
            'learning_path': {
                'current_focus': current_focus,
                'next_domains': next_domains,
                'mastery_by_domain': {
                    domain: round(data['avg_mastery'], 3)
                    for domain, data in domain_mastery.items()
                }
            }
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
