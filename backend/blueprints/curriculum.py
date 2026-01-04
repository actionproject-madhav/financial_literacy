"""
Curriculum API Blueprint

Provides endpoints for:
- Getting all courses (domains) with personalized recommendations
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

# Import personalization service
def get_personalization_service():
    """Get personalization function for course prioritization"""
    from services.personalization import get_personalized_course_order
    return get_personalized_course_order


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


# Domain metadata for display
DOMAIN_METADATA = {
    'banking': {
        'title': 'Banking Basics',
        'description': 'Master US banking fundamentals.',
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
        'description': 'Navigate the US tax system with confidence.',
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
    Get all available courses (domains) with their lessons count, progress, and personalization.

    Query params:
    - learner_id: optional, to include learner progress and personalized recommendations

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
                "progress": 0.25,
                "priority_score": 75.0,
                "recommendation_type": "priority",  // priority, suggested, optional, mastered
                "recommendation_reason": "matches your goals",
                "blur_level": 0.0
            }
        ],
        "personalization": {
            "is_us_resident": false,
            "is_advanced_user": false,
            "goal_domains": ["credit", "banking"],
            ...
        }
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

        # Get learner profile for personalization
        learner_profile = None
        if learner_id:
            learner_profile = db.collections.learners.find_one({'_id': ObjectId(learner_id)})

        # Build courses response
        courses = []
        available_domains = []

        for domain_data in domains:
            domain = domain_data['_id']
            if not domain:
                continue

            available_domains.append(domain)

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
                'mastered_count': mastered_count,
                # Default personalization values (will be updated below)
                'priority_score': 50.0,
                'recommendation_type': 'suggested',
                'recommendation_reason': '',
                'blur_level': 0.0
            })

        # Apply personalization if learner profile exists
        personalization_summary = {}
        if learner_profile:
            try:
                get_personalized_order = get_personalization_service()
                recommendations, personalization_summary = get_personalized_order(
                    learner_profile,
                    available_domains
                )

                # Create lookup for recommendations
                rec_lookup = {r['domain']: r for r in recommendations}

                # Update courses with personalization data
                for course in courses:
                    rec = rec_lookup.get(course['id'])
                    if rec:
                        course['priority_score'] = rec['priority_score']
                        course['recommendation_type'] = rec['recommendation_type']
                        course['recommendation_reason'] = rec['reason']
                        course['blur_level'] = rec['blur_level']

                # Sort courses by priority score (highest first)
                courses.sort(key=lambda x: x['priority_score'], reverse=True)

            except Exception as e:
                print(f"⚠️  Personalization error: {e}")
                # Fall back to default order
                courses.sort(key=lambda x: x['order'])
        else:
            # Sort by default order if no learner profile
            courses.sort(key=lambda x: x['order'])

        return jsonify({
            'courses': courses,
            'personalization': personalization_summary
        }), 200

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

        # NEW: Use curriculum_modules and curriculum_lessons instead of KCs
        # Map domain to module_id
        domain_to_module = {
            'banking': 'banking-fundamentals',
            'credit': 'credit-fundamentals',
            'money-management': 'money-management',
            'taxes': 'taxes',
            'investing': 'investing-basics',
            'retirement': 'retirement-planning',
            'insurance': 'insurance',
            'consumer-protection': 'consumer-protection',
            'major-purchases': 'major-purchases',
            'crypto': 'crypto-basics',
            'cryptocurrency': 'crypto-basics',
            'financial-planning': 'financial-planning'
        }
        
        module_id = domain_to_module.get(domain)
        if not module_id:
            return jsonify({'error': 'Course not found'}), 404
        
        # Get lessons from curriculum_lessons
        lessons_docs = list(db.collections.curriculum_lessons.find({
            'module_id': module_id,
            'is_active': True
        }).sort('order', 1))

        if not lessons_docs:
            return jsonify({'error': 'Course not found'}), 404

        # Get learner lesson completions from separate collection (scalable)
        learner_progress = {}
        if learner_id:
            completions = db.db.lesson_completions.find({
                'learner_id': ObjectId(learner_id)
            })
            for completion in completions:
                learner_progress[completion['lesson_id']] = {
                    'p_mastery': completion.get('p_mastery', 0),
                    'status': completion.get('status', 'locked'),
                    'total_attempts': completion.get('completion_count', 0),
                    'correct_count': completion.get('completion_count', 0)  # Simplified
                }

        # Build lessons response using curriculum_lessons
        lessons = []
        for i, lesson_doc in enumerate(lessons_docs):
            lesson_id = lesson_doc['lesson_id']  # Use lesson_id (string) not ObjectId

            # Count questions for this lesson
            questions_count = db.collections.learning_items.count_documents({
                'lesson_id': lesson_id,
                'item_type': 'multiple_choice'
            })

            # Get learner progress (using lesson_id as key)
            progress = learner_progress.get(lesson_id, {
                'p_mastery': 0,
                'status': 'available' if i == 0 else 'locked',
                'total_attempts': 0,
                'correct_count': 0
            })

            # Unlock logic: first lesson always available, others unlock when previous is at least in_progress
            if i == 0:
                status = progress['status'] if progress['status'] != 'locked' else 'available'
            else:
                prev_lesson_id = lessons_docs[i-1]['lesson_id']
                prev_progress = learner_progress.get(prev_lesson_id, {})
                prev_status = prev_progress.get('status', 'locked')
                if prev_status in ['in_progress', 'mastered']:
                    status = progress['status'] if progress['status'] != 'locked' else 'available'
                else:
                    status = 'locked'

            lessons.append({
                'id': lesson_id,  # Return lesson_id (string) not ObjectId
                'slug': lesson_doc.get('skill_slug', lesson_id),
                'title': lesson_doc['title'],
                'description': lesson_doc.get('description', ''),
                'difficulty_tier': 1,  # Default for now
                'estimated_minutes': lesson_doc.get('estimated_minutes', 10),
                'questions_count': questions_count,
                'content_count': len(lesson_doc.get('content_blocks', [])),
                'xp_reward': lesson_doc.get('xp_reward', 12),
                'status': status,
                'p_mastery': round(progress['p_mastery'], 2),
                'total_attempts': progress['total_attempts'],
                'correct_count': progress['correct_count'],
                'order': lesson_doc.get('order', i + 1)
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


@curriculum_bp.route('/lessons/<lesson_id>/complete', methods=['POST'])
def complete_lesson(lesson_id):
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
            "id": "us-currency",
            "status": "mastered",
            "p_mastery": 0.95
        },
        "learner": {
            "total_xp": 120,
            "gems": 50
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
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': learner_oid})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Find lesson by lesson_id (string) or ObjectId
        lesson = db.collections.curriculum_lessons.find_one({'lesson_id': lesson_id})
        if not lesson and ObjectId.is_valid(lesson_id):
            lesson = db.collections.curriculum_lessons.find_one({'_id': ObjectId(lesson_id)})
        
        if not lesson:
            return jsonify({'error': 'Lesson not found'}), 404
        
        # Check for active XP multiplier FIRST (before using actual_xp_earned)
        xp_multiplier = 1.0
        if learner.get('xp_multiplier_active', False):
            activation_time = learner.get('xp_multiplier_activated_at')
            duration_minutes = learner.get('xp_multiplier_duration_minutes', 15)
            if activation_time:
                try:
                    if isinstance(activation_time, str):
                        if 'T' in activation_time:
                            activation_time = datetime.fromisoformat(activation_time.replace('Z', '+00:00'))
                        else:
                            activation_time = datetime.strptime(activation_time, '%Y-%m-%d %H:%M:%S')
                    elif not isinstance(activation_time, datetime):
                        activation_time = datetime.utcnow()
                    
                    if hasattr(activation_time, 'tzinfo') and activation_time.tzinfo:
                        activation_time = activation_time.replace(tzinfo=None)
                    
                    elapsed = (datetime.utcnow() - activation_time).total_seconds() / 60
                    if elapsed < duration_minutes:
                        xp_multiplier = 2.0
                    else:
                        db.collections.learners.update_one(
                            {'_id': learner_oid},
                            {'$set': {'xp_multiplier_active': False}}
                        )
                except Exception as e:
                    print(f"Error parsing XP multiplier activation time: {e}")
                    xp_multiplier = 1.0
        
        # Calculate actual XP earned
        actual_xp_earned = int(xp_earned * xp_multiplier)
        new_mastery = accuracy
        
        # Track lesson completion in a separate collection (scalable)
        db.db.lesson_completions.update_one(
            {
                'learner_id': learner_oid,
                'lesson_id': lesson['lesson_id']
            },
            {
                '$set': {
                    'module_id': lesson['module_id'],
                    'completed_at': datetime.utcnow(),
                    'accuracy': accuracy,
                    'p_mastery': accuracy,
                    'status': 'mastered',
                    'xp_earned': actual_xp_earned,
                    'time_spent_minutes': time_spent_minutes
                },
                '$setOnInsert': {
                    'first_completed_at': datetime.utcnow()
                },
                '$inc': {
                    'completion_count': 1
                }
            },
            upsert=True
        )
        
        # Award gems based on lesson completion (5 gems per lesson)
        gems_earned = 5
        
        # Update learner's total XP and gems
        db.collections.learners.update_one(
            {'_id': learner_oid},
            {
                '$inc': {
                    'total_xp': actual_xp_earned,
                    'gems': gems_earned
                }
            }
        )
        
        # Update daily progress
        today = date.today()
        db.collections.update_daily_progress(
            learner_id=learner_id,
            date_obj=today,
            xp_earned=actual_xp_earned,
            lessons_completed=1,
            minutes_practiced=time_spent_minutes
        )
        
        # Check if next lesson should be unlocked
        # Get all lessons in the same module, sorted by order
        module_id = lesson['module_id']
        all_lessons = list(db.collections.curriculum_lessons.find({
            'module_id': module_id,
            'is_active': True
        }).sort('order', 1))
        
        current_index = next((i for i, l in enumerate(all_lessons) if l['lesson_id'] == lesson['lesson_id']), -1)
        next_lesson_unlocked = False
        next_lesson_id = None
        
        if current_index >= 0 and current_index < len(all_lessons) - 1:
            # There is a next lesson
            next_lesson = all_lessons[current_index + 1]
            next_lesson_id = next_lesson['lesson_id']
            next_lesson_unlocked = True
        
        # Get updated learner data
        updated_learner = db.collections.learners.find_one({'_id': learner_oid})
        
        return jsonify({
            'success': True,
            'lesson': {
                'id': lesson['lesson_id'],
                'status': 'mastered',
                'p_mastery': round(new_mastery, 2)
            },
            'next_lesson': {
                'id': next_lesson_id,
                'unlocked': next_lesson_unlocked
            } if next_lesson_id else None,
            'xp_earned': actual_xp_earned,
            'xp_multiplier_applied': xp_multiplier > 1.0,
            'total_xp': updated_learner.get('total_xp', 0),
            'gems': updated_learner.get('gems', 0),
            'gems_earned': gems_earned
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


@curriculum_bp.route('/lessons/<lesson_id>/steps', methods=['GET'])
def get_lesson_steps(lesson_id):
    """
    Get interleaved content and quiz steps for a lesson
    
    Returns content blocks and questions in an optimal learning sequence:
    content → quiz → content → quiz
    
    Query params:
    - learner_id: optional, for personalized question selection
    
    Response:
    {
        "lesson": {
            "id": "us-currency",
            "title": "US Currency and Money Basics",
            "description": "...",
            "xp_reward": 12,
            "estimated_minutes": 10
        },
        "steps": [
            {
                "type": "content",
                "block_type": "concept",
                "title": "...",
                "content": {...}
            },
            {
                "type": "quiz",
                "item_id": "...",
                "question": "...",
                "choices": [...],
                "correct_answer": 0,
                "explanation": "...",
                "kc_id": "..."
            }
        ],
        "total_steps": 10,
        "total_xp": 12
    }
    """
    try:
        db = get_db()
        learner_id = request.args.get('learner_id')
        
        # Find lesson by lesson_id (string) OR _id (ObjectId)
        # Frontend might pass either format
        lesson = None
        
        # Try as lesson_id (string like 'us-currency')
        lesson = db.collections.curriculum_lessons.find_one({'lesson_id': lesson_id})
        
        # If not found, try as ObjectId
        if not lesson and ObjectId.is_valid(lesson_id):
            lesson = db.collections.curriculum_lessons.find_one({'_id': ObjectId(lesson_id)})
        
        if not lesson:
            current_app.logger.error(f"Lesson not found: {lesson_id}")
            return jsonify({'error': 'Lesson not found', 'lesson_id': lesson_id}), 404
        
        # Get content blocks
        content_blocks = lesson.get('content_blocks', [])
        
        # Get questions
        question_ids = lesson.get('questions', [])
        questions = []
        
        if question_ids:
            # Convert string IDs to ObjectIds
            question_oids = [ObjectId(qid) for qid in question_ids if ObjectId.is_valid(qid)]
            
            # Fetch questions from database
            questions_cursor = db.collections.learning_items.find({
                '_id': {'$in': question_oids},
                'is_active': True
            })
            questions = list(questions_cursor)
        
        # Interleave content and questions
        steps = []
        
        num_content = len(content_blocks)
        num_questions = len(questions)
        
        if num_content == 0 and num_questions == 0:
            return jsonify({'error': 'Lesson has no content or questions'}), 404
        
        # DETERMINISTIC INTERLEAVING STRATEGY:
        # 1. Present ALL content blocks first (in curriculum order)
        # 2. Then present ALL quiz questions (in database order)
        # This ensures learners see all teaching material before being tested
        
        # Add all content blocks first (preserves curriculum.json order)
        for block in content_blocks:
            steps.append({
                'type': 'content',
                'block_type': block.get('type', 'concept'),
                'title': block.get('title', ''),
                'content': block.get('content', {})
            })
        
        # Then add all quiz questions (preserves database order)
        for q in questions:
            # Get KC mapping for this question
            kc_mapping = db.db.item_kc_mappings.find_one({'item_id': q['_id']})
            kc_id = str(kc_mapping['kc_id']) if kc_mapping else None
            
            # Extract question data properly
            question_text = q.get('stem', '')
            choices = q.get('choices', [])
            
            # Handle both list and dict formats for choices
            if isinstance(choices, dict):
                # Convert dict to list (sorted by key)
                choices = [choices.get(str(i), '') for i in range(len(choices))]
            
            steps.append({
                'type': 'quiz',
                'item_id': str(q['_id']),
                'question': question_text,
                'choices': choices,
                'correct_answer': q.get('correct_answer', 0),
                'explanation': q.get('explanation', ''),
                'kc_id': kc_id
            })
        
        # Calculate XP reward
        xp_reward = lesson.get('xp_reward', len(questions) * 2)  # 2 XP per question
        
        # Map module_id to domain for frontend compatibility
        module_to_domain = {
            'banking-fundamentals': 'banking',
            'credit-fundamentals': 'credit',
            'money-management': 'money-management',
            'taxes': 'taxes',
            'investing-basics': 'investing',
            'retirement-planning': 'retirement',
            'insurance': 'insurance',
            'consumer-protection': 'consumer-protection',
            'major-purchases': 'major-purchases',
            'crypto-basics': 'crypto',
            'financial-planning': 'financial-planning'
        }
        
        module_id = lesson.get('module_id')
        domain = module_to_domain.get(module_id, module_id)
        
        return jsonify({
            'lesson': {
                'id': lesson.get('lesson_id'),  # Return the actual lesson_id from DB
                '_id': str(lesson['_id']),      # Also include ObjectId for reference
                'title': lesson.get('title', ''),
                'description': lesson.get('description', ''),
                'xp_reward': xp_reward,
                'estimated_minutes': lesson.get('estimated_minutes', 10),
                'module_id': module_id,
                'domain': domain  # Include domain for frontend navigation
            },
            'steps': steps,
            'total_steps': len(steps),
            'total_xp': xp_reward
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error getting lesson steps: {str(e)}")
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
