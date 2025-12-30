"""
Curriculum API Blueprint

Provides endpoints for:
- Getting all courses (domains)
- Getting lessons (skills) for a course
- Getting questions for a lesson
- Marking lessons as complete
"""
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, date

curriculum_bp = Blueprint('curriculum', __name__, url_prefix='/api/curriculum')

# Import adaptive engine for future use (currently using sequential questions for MVP)
def get_learning_engine():
    """Get learning engine instance from app context (for future adaptive selection)"""
    return current_app.config.get('LEARNING_ENGINE')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


# Domain metadata for display
DOMAIN_METADATA = {
    'banking': {
        'title': 'Banking Basics',
        'description': 'Master US banking fundamentals - accounts, fees, and everyday transactions.',
        'level': 'beginner',
        'order': 1
    },
    'credit': {
        'title': 'Credit Mastery',
        'description': 'Build and maintain excellent credit in the US financial system.',
        'level': 'beginner',
        'order': 2
    },
    'taxes': {
        'title': 'US Tax System',
        'description': 'Navigate the US tax system with confidence - filing, deductions, and compliance.',
        'level': 'intermediate',
        'order': 3
    },
    'investing': {
        'title': 'Investing Fundamentals',
        'description': 'Start your investment journey with stocks, bonds, and retirement accounts.',
        'level': 'intermediate',
        'order': 4
    },
    'immigration_finance': {
        'title': 'Immigration Finance',
        'description': 'Financial strategies specifically for immigrants and visa holders.',
        'level': 'beginner',
        'order': 5
    },
    'budgeting': {
        'title': 'Budgeting & Saving',
        'description': 'Create and maintain a budget that works for your goals.',
        'level': 'beginner',
        'order': 6
    }
}


@curriculum_bp.route('/courses', methods=['GET'])
def get_courses():
    """
    Get all available courses (domains) with their lessons count and progress.

    Query params:
    - learner_id: optional, to include learner progress

    Response:
    {
        "courses": [
            {
                "id": "banking",
                "title": "Banking Basics",
                "description": "...",
                "level": "beginner",
                "lessons_count": 5,
                "questions_count": 20,
                "unlocked": true,
                "progress": 0.25  // if learner_id provided
            }
        ]
    }
    """
    try:
        db = get_db()
        learner_id = request.args.get('learner_id')

        # Get all active knowledge components grouped by domain
        pipeline = [
            {'$match': {'is_active': True}},
            {'$group': {
                '_id': '$domain',
                'lessons': {'$push': {
                    'kc_id': {'$toString': '$_id'},
                    'slug': '$slug',
                    'name': '$name',
                    'description': '$description',
                    'difficulty_tier': '$difficulty_tier',
                    'bloom_level': '$bloom_level',
                    'estimated_minutes': '$estimated_minutes',
                    'icon_url': '$icon_url'
                }},
                'lessons_count': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]

        domains = list(db.collections.knowledge_components.aggregate(pipeline))

        # Get question counts per domain
        questions_pipeline = [
            {'$lookup': {
                'from': 'learning_items',
                'localField': 'kc_id',
                'foreignField': '_id',
                'as': 'items'
            }}
        ]

        # Get learner skill states if learner_id provided
        learner_progress = {}
        if learner_id:
            states = list(db.collections.learner_skill_states.find({
                'learner_id': ObjectId(learner_id)
            }))
            for state in states:
                learner_progress[str(state['kc_id'])] = {
                    'p_mastery': state.get('p_mastery', 0),
                    'status': state.get('status', 'locked')
                }

        # Build courses response
        courses = []
        for domain_data in domains:
            domain = domain_data['_id']
            if not domain:
                continue

            metadata = DOMAIN_METADATA.get(domain, {
                'title': domain.replace('_', ' ').title(),
                'description': f'Learn about {domain}',
                'level': 'beginner',
                'order': 99
            })

            # Count questions for this domain
            kc_ids = [ObjectId(l['kc_id']) for l in domain_data['lessons']]
            questions_count = db.collections.item_kc_mappings.count_documents({
                'kc_id': {'$in': kc_ids}
            })

            # Calculate progress if learner_id provided
            progress = 0
            mastered_count = 0
            if learner_id and domain_data['lessons']:
                for lesson in domain_data['lessons']:
                    state = learner_progress.get(lesson['kc_id'], {})
                    if state.get('status') == 'mastered':
                        mastered_count += 1
                    progress += state.get('p_mastery', 0)
                progress = progress / len(domain_data['lessons']) if domain_data['lessons'] else 0

            courses.append({
                'id': domain,
                'title': metadata['title'],
                'description': metadata['description'],
                'level': metadata['level'],
                'order': metadata['order'],
                'lessons_count': domain_data['lessons_count'],
                'questions_count': questions_count,
                'unlocked': True,  # For now, all courses unlocked
                'progress': round(progress, 2),
                'mastered_count': mastered_count
            })

        # Sort by order
        courses.sort(key=lambda x: x['order'])

        return jsonify({'courses': courses}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@curriculum_bp.route('/courses/<domain>/lessons', methods=['GET'])
def get_course_lessons(domain):
    """
    Get all lessons (skills) for a specific course/domain.

    Query params:
    - learner_id: optional, to include learner progress

    Response:
    {
        "course": {
            "id": "banking",
            "title": "Banking Basics",
            ...
        },
        "lessons": [
            {
                "id": "507f...",
                "slug": "understanding-us-currency",
                "title": "Understanding US Currency",
                "description": "...",
                "difficulty_tier": 1,
                "estimated_minutes": 10,
                "questions_count": 5,
                "status": "available",  // locked, available, in_progress, mastered
                "p_mastery": 0.45,
                "order": 1
            }
        ]
    }
    """
    try:
        db = get_db()
        learner_id = request.args.get('learner_id')

        # Get course metadata
        metadata = DOMAIN_METADATA.get(domain, {
            'title': domain.replace('_', ' ').title(),
            'description': f'Learn about {domain}',
            'level': 'beginner',
            'order': 99
        })

        # Get all KCs for this domain
        kcs = list(db.collections.knowledge_components.find({
            'domain': domain,
            'is_active': True
        }).sort('difficulty_tier', 1))

        if not kcs:
            return jsonify({'error': 'Course not found'}), 404

        # Get learner skill states if learner_id provided
        learner_progress = {}
        if learner_id:
            states = list(db.collections.learner_skill_states.find({
                'learner_id': ObjectId(learner_id)
            }))
            for state in states:
                learner_progress[str(state['kc_id'])] = {
                    'p_mastery': state.get('p_mastery', 0),
                    'status': state.get('status', 'available'),
                    'total_attempts': state.get('total_attempts', 0),
                    'correct_count': state.get('correct_count', 0)
                }

        # Build lessons response
        lessons = []
        for i, kc in enumerate(kcs):
            kc_id = str(kc['_id'])

            # Count questions for this KC
            questions_count = db.collections.item_kc_mappings.count_documents({
                'kc_id': kc['_id']
            })

            # Get learner progress
            progress = learner_progress.get(kc_id, {
                'p_mastery': 0,
                'status': 'available' if i == 0 else 'locked',
                'total_attempts': 0,
                'correct_count': 0
            })

            # Unlock logic: first lesson always available, others unlock when previous is at least in_progress
            if i == 0:
                status = progress['status'] if progress['status'] != 'locked' else 'available'
            else:
                prev_kc_id = str(kcs[i-1]['_id'])
                prev_progress = learner_progress.get(prev_kc_id, {})
                prev_status = prev_progress.get('status', 'locked')
                if prev_status in ['in_progress', 'mastered']:
                    status = progress['status'] if progress['status'] != 'locked' else 'available'
                else:
                    status = 'locked'

            lessons.append({
                'id': kc_id,
                'slug': kc['slug'],
                'title': kc['name'],
                'description': kc.get('description', ''),
                'difficulty_tier': kc.get('difficulty_tier', 1),
                'bloom_level': kc.get('bloom_level', 'remember'),
                'estimated_minutes': kc.get('estimated_minutes', 10),
                'icon_url': kc.get('icon_url'),
                'questions_count': questions_count,
                'status': status,
                'p_mastery': round(progress['p_mastery'], 2),
                'total_attempts': progress['total_attempts'],
                'correct_count': progress['correct_count'],
                'order': i + 1
            })

        return jsonify({
            'course': {
                'id': domain,
                'title': metadata['title'],
                'description': metadata['description'],
                'level': metadata['level']
            },
            'lessons': lessons
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@curriculum_bp.route('/lessons/<kc_id>/complete', methods=['POST'])
def complete_lesson(kc_id):
    """
    Mark a lesson as complete for a learner.
    
    Request body:
    {
        "learner_id": "507f...",
        "xp_earned": 20,
        "accuracy": 0.85,  // optional, percentage of correct answers
        "time_spent_minutes": 15  // optional
    }
    
    Response:
    {
        "success": true,
        "lesson": {
            "id": "507f...",
            "status": "mastered",
            "p_mastery": 0.95
        },
        "next_lesson_unlocked": true
    }
    """
    try:
        db = get_db()
        data = request.get_json()
        
        learner_id = data.get('learner_id')
        if not learner_id:
            return jsonify({'error': 'learner_id is required'}), 400
        
        xp_earned = data.get('xp_earned', 20)
        accuracy = data.get('accuracy', 1.0)  # Default to 100% if not provided
        time_spent_minutes = data.get('time_spent_minutes', 10)
        
        learner_oid = ObjectId(learner_id)
        kc_oid = ObjectId(kc_id)
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Verify KC exists
        kc = db.collections.knowledge_components.find_one({'_id': kc_oid})
        if not kc:
            return jsonify({'error': 'Lesson not found'}), 404
        
        # Get current skill state (mastery should already be updated by adaptive engine from individual question answers)
        existing_state = db.collections.learner_skill_states.find_one({
            'learner_id': learner_oid,
            'kc_id': kc_oid
        })
        
        # Use adaptive engine's mastery value if available, otherwise calculate from accuracy
        if existing_state:
            # Mastery is already calculated by BKT from individual question interactions
            # Use the existing mastery value, but ensure it's at least the accuracy threshold
            current_mastery = existing_state.get('p_mastery', 0)
            # If mastery is low but accuracy was high, boost it slightly
            if accuracy >= 0.8 and current_mastery < accuracy:
                new_mastery = min(0.95, current_mastery + (accuracy - current_mastery) * 0.3)
            else:
                new_mastery = current_mastery
        else:
            # No existing state - first time completing, use accuracy
            new_mastery = accuracy
        
        # Update or create skill state with mastered status
        if existing_state:
            db.collections.learner_skill_states.update_one(
                {'_id': existing_state['_id']},
                {
                    '$set': {
                        'status': 'mastered',
                        'p_mastery': new_mastery,
                        'updated_at': datetime.utcnow(),
                        'last_completed_at': datetime.utcnow()
                    }
                }
            )
        else:
            # Create new state - mastery should have been created by adaptive engine, but create if missing
            db.collections.create_learner_skill_state(
                learner_id=learner_id,
                kc_id=kc_id,
                status='mastered',
                p_mastery=new_mastery
            )
            # Set last_completed_at
            db.collections.learner_skill_states.update_one(
                {
                    'learner_id': learner_oid,
                    'kc_id': kc_oid
                },
                {
                    '$set': {
                        'last_completed_at': datetime.utcnow()
                    }
                }
            )
        
        # Update learner's total XP
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {'$inc': {'total_xp': xp_earned}}
        )
        
        # Update daily progress
        today = date.today()
        db.collections.update_daily_progress(
            learner_id=learner_id,
            date_obj=today,
            xp_earned=xp_earned,
            lessons_completed=1,
            minutes_practiced=time_spent_minutes
        )
        
        # Check if next lesson should be unlocked
        # Get all KCs in the same domain, sorted by difficulty_tier
        domain = kc['domain']
        all_kcs = list(db.collections.knowledge_components.find({
            'domain': domain,
            'is_active': True
        }).sort('difficulty_tier', 1))
        
        current_index = next((i for i, k in enumerate(all_kcs) if str(k['_id']) == kc_id), -1)
        next_lesson_unlocked = False
        
        if current_index >= 0 and current_index < len(all_kcs) - 1:
            # There is a next lesson
            next_kc_id = str(all_kcs[current_index + 1]['_id'])
            next_state = db.collections.learner_skill_states.find_one({
                'learner_id': learner_oid,
                'kc_id': ObjectId(next_kc_id)
            })
            
            if not next_state or next_state.get('status') == 'locked':
                # Unlock the next lesson
                db.collections.create_learner_skill_state(
                    learner_id=learner_id,
                    kc_id=next_kc_id,
                    status='available',
                    p_mastery=0
                )
                next_lesson_unlocked = True
        
        return jsonify({
            'success': True,
            'lesson': {
                'id': kc_id,
                'status': 'mastered',
                'p_mastery': round(new_mastery, 2)
            },
            'next_lesson_unlocked': next_lesson_unlocked,
            'xp_earned': xp_earned,
            'total_xp': learner.get('total_xp', 0) + xp_earned
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@curriculum_bp.route('/lessons/<kc_id>/questions', methods=['GET'])
def get_lesson_questions(kc_id):
    """
    Get all questions for a specific lesson (knowledge component).

    Query params:
    - learner_id: optional, to personalize content
    - limit: optional, max questions to return (default: all)

    Response:
    {
        "lesson": {
            "id": "507f...",
            "title": "Understanding US Currency",
            ...
        },
        "questions": [
            {
                "id": "507f...",
                "item_type": "multiple_choice",
                "content": {
                    "stem": "What is the smallest paper bill?",
                    "choices": ["$1", "$2", "$5", "$10"],
                    "correct_answer": 0,
                    "explanation": "..."
                },
                "difficulty": 0.2,
                "media_url": null
            }
        ]
    }
    """
    try:
        db = get_db()
        learner_id = request.args.get('learner_id')
        limit = request.args.get('limit', type=int)

        # Get the KC
        kc = db.collections.knowledge_components.find_one({'_id': ObjectId(kc_id)})
        if not kc:
            return jsonify({'error': 'Lesson not found'}), 404

        # Get all item mappings for this KC (preserve insertion order)
        mappings = list(db.collections.item_kc_mappings.find({'kc_id': ObjectId(kc_id)}))
        item_ids = [m['item_id'] for m in mappings]

        # Get all items (both content and quiz items)
        query = {
            '_id': {'$in': item_ids},
            'is_active': True
        }
        items_cursor = db.collections.learning_items.find(query)
        if limit:
            items_cursor = items_cursor.limit(limit)

        items = list(items_cursor)

        # Create a map of item_id -> position from mappings to preserve order
        # Use the index in mappings array as position (preserves insertion order)
        item_position_map = {}
        for idx, mapping in enumerate(mappings):
            item_id_str = str(mapping['item_id'])
            # Use explicit position/order if available, otherwise use insertion order
            item_position_map[item_id_str] = mapping.get('position', mapping.get('order', idx))

        # Sort items by their position in the mapping (preserves order of content + quiz items)
        items.sort(key=lambda item: item_position_map.get(str(item['_id']), 999))

        # Build questions/content response (includes both types)
        questions = []
        for item in items:
            item_data = {
                'id': str(item['_id']),
                'item_type': item['item_type'],
                'content': item['content'],
                'difficulty': item.get('difficulty', 0.5),
                'discrimination': item.get('discrimination', 1.0),
                'media_type': item.get('media_type'),
                'media_url': item.get('media_url'),
                'allows_personalization': item.get('allows_llm_personalization', False),
                'position': item_position_map.get(str(item['_id']), 0)
            }
            questions.append(item_data)

        return jsonify({
            'lesson': {
                'id': str(kc['_id']),
                'slug': kc['slug'],
                'title': kc['name'],
                'description': kc.get('description', ''),
                'domain': kc['domain'],
                'difficulty_tier': kc.get('difficulty_tier', 1),
                'estimated_minutes': kc.get('estimated_minutes', 10)
            },
            'questions': questions,
            'total_count': len(questions)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@curriculum_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        db = get_db()
        if db.is_connected:
            kc_count = db.collections.knowledge_components.count_documents({})
            items_count = db.collections.learning_items.count_documents({})
            return jsonify({
                'status': 'healthy',
                'knowledge_components': kc_count,
                'learning_items': items_count
            }), 200
        return jsonify({'status': 'unhealthy', 'error': 'Database not connected'}), 503
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 503
