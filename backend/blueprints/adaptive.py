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
