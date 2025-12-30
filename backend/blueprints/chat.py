"""
Chat API Blueprint - FinAI Coach

Provides conversational AI assistance for financial literacy questions.
Supports multi-turn conversations with context awareness.
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import os

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def get_llm_service():
    """Get LLM service, initializing if needed"""
    from services.llm_service import LLMService

    if 'LLM_SERVICE' not in current_app.config or current_app.config['LLM_SERVICE'] is None:
        try:
            current_app.config['LLM_SERVICE'] = LLMService()
        except Exception as e:
            print(f"Failed to initialize LLM service: {e}")
            return None
    return current_app.config['LLM_SERVICE']


# System prompt for the FinAI Coach
COACH_SYSTEM_PROMPT =COACH_SYSTEM_PROMPT_BASE = """You are FinAI Coach, a friendly and knowledgeable financial literacy assistant specifically designed to help immigrants navigate the US financial system.

Your role is to:
1. Answer questions about US banking, credit, taxes, investing, and financial planning
2. Provide culturally sensitive advice that considers the unique challenges immigrants face
3. Explain complex financial concepts in simple, clear language
4. Help users understand their options based on their visa status and situation
5. Encourage good financial habits and smart money management

Guidelines:
- Be warm, encouraging, and patient
- Use simple language and avoid jargon when possible
- When explaining concepts, use relatable examples
- If you don't know something, say so honestly
- For legal or tax advice, recommend consulting a professional
- Keep responses concise but helpful (aim for 2-3 paragraphs max)
- Consider that the user may be new to the US financial system

You are NOT a licensed financial advisor. Always remind users to consult professionals for major financial decisions."""

LANGUAGE_INSTRUCTIONS = {
    'en': '\n\nRespond in English.',
    'es': '\n\nRespond in Spanish (Español). Use natural, conversational Spanish appropriate for financial topics.',
    'ne': '\n\nRespond in Nepali (नेपाली). Use natural, conversational Nepali appropriate for financial topics. Use Devanagari script.'
}

def get_coach_system_prompt(language='en'):
    """Get system prompt with language instruction"""
    base_prompt = COACH_SYSTEM_PROMPT_BASE
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS['en'])
    return base_prompt + lang_instruction

COACH_SYSTEM_PROMPT = COACH_SYSTEM_PROMPT_BASE  # For backwards compatibility


@chat_bp.route('/message', methods=['POST'])
def send_message():
    """
    Send a message to the FinAI Coach and get a response.

    Request body:
    {
        "learner_id": "optional - for personalization",
        "message": "User's question or message",
        "conversation_id": "optional - to continue a conversation",
        "language": "optional - user's preferred language (en, es, ne)",
        "context": {
            "current_lesson": "optional - what they're learning",
            "visa_type": "optional - for personalized advice"
        }
    }

    Response:
    {
        "response": "Coach's response text",
        "conversation_id": "ID to continue this conversation",
        "suggestions": ["Follow-up question 1", "Follow-up question 2"]
    }
    """
    try:
        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({'error': 'Message is required'}), 400

        user_message = data['message'].strip()
        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        learner_id = data.get('learner_id')
        conversation_id = data.get('conversation_id')
        language = data.get('language', 'en')  # Default to English
        context = data.get('context', {})

        db = get_db()
        llm = get_llm_service()

        if not llm:
            return jsonify({'error': 'AI service is not available'}), 503

        # Get or create conversation
        conversation = None
        messages_history = []

        if conversation_id:
            try:
                conversation = db.collections.chat_conversations.find_one({
                    '_id': ObjectId(conversation_id)
                })
                if conversation:
                    messages_history = conversation.get('messages', [])
            except:
                pass

        # Get learner context for personalization
        learner_context = ""
        if learner_id:
            try:
                learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
                if learner:
                    profile = learner.get('profile', {})
                    if profile.get('visa_type'):
                        learner_context += f"\nUser's visa type: {profile['visa_type']}"
                    if profile.get('country_of_origin'):
                        learner_context += f"\nUser's country of origin: {profile['country_of_origin']}"
                    if profile.get('has_ssn') is not None:
                        learner_context += f"\nUser has SSN: {'Yes' if profile['has_ssn'] else 'No'}"
            except:
                pass

        # Build the prompt with conversation history and language instruction
        prompt_parts = [get_coach_system_prompt(language)]

        if learner_context:
            prompt_parts.append(f"\nUser context:{learner_context}")

        if context.get('current_lesson'):
            prompt_parts.append(f"\nUser is currently learning about: {context['current_lesson']}")

        # Add recent conversation history (last 6 messages for context)
        if messages_history:
            prompt_parts.append("\nRecent conversation:")
            for msg in messages_history[-6:]:
                role = "User" if msg['role'] == 'user' else "Coach"
                prompt_parts.append(f"{role}: {msg['content']}")

        prompt_parts.append(f"\nUser: {user_message}")
        prompt_parts.append("\nCoach:")

        full_prompt = "\n".join(prompt_parts)

        # Generate response
        response_text = llm.generate_content(
            prompt=full_prompt,
            max_tokens=500,
            temperature=0.7
        )

        # Generate follow-up suggestions
        suggestions = generate_suggestions(user_message, response_text, llm)

        # Save to conversation history
        new_messages = [
            {'role': 'user', 'content': user_message, 'timestamp': datetime.utcnow()},
            {'role': 'assistant', 'content': response_text, 'timestamp': datetime.utcnow()}
        ]

        if conversation:
            # Update existing conversation
            db.collections.chat_conversations.update_one(
                {'_id': ObjectId(conversation_id)},
                {
                    '$push': {'messages': {'$each': new_messages}},
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )
        else:
            # Create new conversation
            conversation_doc = {
                'learner_id': ObjectId(learner_id) if learner_id else None,
                'messages': new_messages,
                'context': context,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            result = db.collections.chat_conversations.insert_one(conversation_doc)
            conversation_id = str(result.inserted_id)

        return jsonify({
            'response': response_text,
            'conversation_id': conversation_id,
            'suggestions': suggestions
        }), 200

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 500


def generate_suggestions(user_message: str, response: str, llm) -> list:
    """Generate follow-up question suggestions"""
    try:
        prompt = f"""Based on this conversation about US financial literacy:
User asked: {user_message}
Coach answered: {response}

Generate exactly 2 short follow-up questions the user might want to ask next.
Format: Return only the questions, one per line, no numbers or bullets."""

        result = llm.generate_content(prompt=prompt, max_tokens=100, temperature=0.8)
        suggestions = [q.strip() for q in result.strip().split('\n') if q.strip()]
        return suggestions[:2]
    except:
        return []


@chat_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """
    Get conversation history for a learner.

    Query params:
    - learner_id: required
    - limit: optional (default 10)
    """
    try:
        learner_id = request.args.get('learner_id')
        if not learner_id:
            return jsonify({'error': 'learner_id is required'}), 400

        limit = request.args.get('limit', 10, type=int)

        db = get_db()

        conversations = list(db.collections.chat_conversations.find(
            {'learner_id': ObjectId(learner_id)},
            {'messages': {'$slice': -1}}  # Only get last message for preview
        ).sort('updated_at', -1).limit(limit))

        result = []
        for conv in conversations:
            last_msg = conv.get('messages', [{}])[-1] if conv.get('messages') else {}
            result.append({
                'id': str(conv['_id']),
                'preview': last_msg.get('content', '')[:100] + '...' if len(last_msg.get('content', '')) > 100 else last_msg.get('content', ''),
                'updated_at': conv.get('updated_at', conv.get('created_at')).isoformat() if conv.get('updated_at') or conv.get('created_at') else None
            })

        return jsonify({'conversations': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/conversations/<conversation_id>', methods=['GET'])
def get_conversation(conversation_id):
    """Get full conversation by ID"""
    try:
        db = get_db()

        conversation = db.collections.chat_conversations.find_one({
            '_id': ObjectId(conversation_id)
        })

        if not conversation:
            return jsonify({'error': 'Conversation not found'}), 404

        messages = []
        for msg in conversation.get('messages', []):
            messages.append({
                'role': msg['role'],
                'content': msg['content'],
                'timestamp': msg.get('timestamp').isoformat() if msg.get('timestamp') else None
            })

        return jsonify({
            'id': str(conversation['_id']),
            'messages': messages,
            'created_at': conversation.get('created_at').isoformat() if conversation.get('created_at') else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@chat_bp.route('/quick-questions', methods=['GET'])
def get_quick_questions():
    """Get suggested quick questions for the coach in user's language"""
    language = request.args.get('language', 'en')
    
    questions_by_lang = {
        'en': [
            "How do I open a bank account without an SSN?",
            "What's the difference between a credit card and debit card?",
            "How do I build credit as a new immigrant?",
            "What taxes do I need to pay on an F-1 visa?",
            "Should I open a Roth IRA or Traditional IRA?",
            "How do I send money to my family abroad cheaply?",
            "What is a credit score and why does it matter?",
            "How do I file taxes for the first time?"
        ],
        'es': [
            "¿Cómo abro una cuenta bancaria sin un SSN?",
            "¿Cuál es la diferencia entre una tarjeta de crédito y una de débito?",
            "¿Cómo construyo crédito como nuevo inmigrante?",
            "¿Qué impuestos necesito pagar con una visa F-1?",
            "¿Debo abrir un Roth IRA o un IRA tradicional?",
            "¿Cómo envío dinero a mi familia en el extranjero de forma económica?",
            "¿Qué es una puntuación de crédito y por qué importa?",
            "¿Cómo presento mis impuestos por primera vez?"
        ],
        'ne': [
            "SSN बिना म कसरी बैंक खाता खोल्न सक्छु?",
            "क्रेडिट कार्ड र डेबिट कार्ड बीच के फरक छ?",
            "नयाँ आप्रवासीको रूपमा म कसरी क्रेडिट निर्माण गर्न सक्छु?",
            "F-1 भिसामा मैले कति कर तिर्नुपर्छ?",
            "मैले Roth IRA वा Traditional IRA खोल्नुपर्छ?",
            "म कसरी सस्तोमा विदेशमा मेरो परिवारलाई पैसा पठाउन सक्छु?",
            "क्रेडिट स्कोर भनेको के हो र यसले किन महत्त्वपूर्ण छ?",
            "मैले पहिलो पटक कसरी कर दाखिला गर्न सक्छु?"
        ]
    }
    
    questions = questions_by_lang.get(language, questions_by_lang['en'])
    return jsonify({'questions': questions}), 200


@chat_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        llm = get_llm_service()
        return jsonify({
            'status': 'healthy',
            'llm_available': llm is not None
        }), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 503
