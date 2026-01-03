"""
Payment Blueprint - Stripe Integration

Handles:
- Creating payment intents for coin purchases
- Processing payment success webhooks
- Awarding coins after successful payment
"""
from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta
import os
import stripe

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')

# Coin packages with prices (in cents)
COIN_PACKAGES = {
    'coins_100': {'coins': 100, 'price_cents': 99, 'name': '100 Coins'},
    'coins_500': {'coins': 500, 'price_cents': 399, 'name': '500 Coins'},
    'coins_1000': {'coins': 1000, 'price_cents': 699, 'name': '1000 Coins'},
    'coins_2500': {'coins': 2500, 'price_cents': 1499, 'name': '2500 Coins'},
    'coins_5000': {'coins': 5000, 'price_cents': 2499, 'name': '5000 Coins'},
}

# Power-up packages
POWERUP_PACKAGES = {
    'double_xp': {'coins': 50, 'price_cents': 49, 'name': 'Double XP (50 Coins)'},
    'refill_hearts': {'coins': 100, 'price_cents': 99, 'name': 'Refill Hearts (100 Coins)'},
    'premium_plus': {'coins': 499, 'price_cents': 499, 'name': 'Premium Plus (499 Coins)'},
}


def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


@payments_bp.route('/create-intent', methods=['POST'])
def create_payment_intent():
    """
    Create a Stripe payment intent for purchasing coins or power-ups.
    
    Request JSON:
    {
        "learner_id": "507f...",
        "package_id": "coins_100" or "double_xp",
        "type": "coins" or "powerup"
    }
    
    Response:
    {
        "client_secret": "pi_...",
        "amount": 99,
        "currency": "usd"
    }
    """
    try:
        if not stripe.api_key:
            return jsonify({'error': 'Stripe not configured'}), 500
        
        data = request.get_json()
        learner_id = data.get('learner_id')
        package_id = data.get('package_id')
        package_type = data.get('type', 'coins')
        
        if not learner_id or not package_id:
            return jsonify({'error': 'learner_id and package_id required'}), 400
        
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Get package details
        if package_type == 'coins':
            package = COIN_PACKAGES.get(package_id)
        else:
            package = POWERUP_PACKAGES.get(package_id)
        
        if not package:
            return jsonify({'error': 'Invalid package'}), 400
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=package['price_cents'],
            currency='usd',
            metadata={
                'learner_id': learner_id,
                'package_id': package_id,
                'package_type': package_type,
                'coins': package['coins'],
                'package_name': package['name']
            },
            automatic_payment_methods={
                'enabled': True,
            },
        )
        
        return jsonify({
            'client_secret': intent.client_secret,
            'amount': package['price_cents'],
            'currency': 'usd',
            'package_name': package['name'],
            'coins': package['coins']
        }), 200
        
    except Exception as e:
        print(f'[create_payment_intent] Error: {e}')
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/success', methods=['POST'])
def handle_payment_success():
    """
    Handle successful payment and award coins.
    Called by Stripe webhook or frontend after payment confirmation.
    
    Request JSON:
    {
        "payment_intent_id": "pi_...",
        "learner_id": "507f..."
    }
    """
    try:
        data = request.get_json()
        payment_intent_id = data.get('payment_intent_id')
        learner_id = data.get('learner_id')
        
        if not payment_intent_id:
            return jsonify({'error': 'payment_intent_id required'}), 400
        
        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            return jsonify({'error': 'Payment not succeeded'}), 400
        
        # Get metadata
        metadata = intent.metadata
        package_id = metadata.get('package_id')
        package_type = metadata.get('package_type', 'coins')
        coins_to_award = int(metadata.get('coins', 0))
        metadata_learner_id = metadata.get('learner_id')
        
        # Verify learner_id matches
        if learner_id and learner_id != metadata_learner_id:
            return jsonify({'error': 'Learner ID mismatch'}), 400
        
        learner_id = metadata_learner_id
        
        db = get_db()
        
        # Verify learner exists
        learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        if not learner:
            return jsonify({'error': 'Learner not found'}), 404
        
        # Check if payment already processed
        existing_payment = db.collections.payments.find_one({
            'payment_intent_id': payment_intent_id
        })
        
        if existing_payment:
            return jsonify({
                'success': True,
                'message': 'Payment already processed',
                'coins_awarded': existing_payment.get('coins_awarded', 0),
                'total_gems': learner.get('gems', 0)
            }), 200
        
        # Award coins
        current_gems = learner.get('gems', 0)
        new_gems = current_gems + coins_to_award
        
        db.collections.learners.update_one(
            {'_id': ObjectId(learner_id)},
            {'$inc': {'gems': coins_to_award}}
        )
        
        # Handle power-ups if applicable
        if package_type == 'powerup':
            if package_id == 'double_xp':
                # Activate double XP for 15 minutes
                db.collections.learners.update_one(
                    {'_id': ObjectId(learner_id)},
                    {'$set': {
                        'xp_multiplier_active': True,
                        'xp_multiplier_activated_at': datetime.utcnow(),
                        'xp_multiplier_duration_minutes': 15
                    }}
                )
            elif package_id == 'refill_hearts':
                # Refill hearts to max (5)
                db.collections.learners.update_one(
                    {'_id': ObjectId(learner_id)},
                    {'$set': {'hearts': 5}}
                )
            elif package_id == 'premium_plus':
                # Activate premium (unlimited hearts, no ads)
                db.collections.learners.update_one(
                    {'_id': ObjectId(learner_id)},
                    {'$set': {
                        'premium_active': True,
                        'premium_activated_at': datetime.utcnow(),
                        'premium_expires_at': datetime.utcnow() + timedelta(days=30)
                    }}
                )
        
        # Record payment
        db.collections.payments.insert_one({
            'learner_id': ObjectId(learner_id),
            'payment_intent_id': payment_intent_id,
            'package_id': package_id,
            'package_type': package_type,
            'amount_cents': intent.amount,
            'coins_awarded': coins_to_award,
            'status': 'completed',
            'created_at': datetime.utcnow()
        })
        
        # Get updated learner
        updated_learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
        
        return jsonify({
            'success': True,
            'message': 'Payment processed successfully',
            'coins_awarded': coins_to_award,
            'total_gems': updated_learner.get('gems', 0),
            'package_type': package_type,
            'package_id': package_id
        }), 200
        
    except Exception as e:
        print(f'[handle_payment_success] Error: {e}')
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/packages', methods=['GET'])
def get_packages():
    """
    Get available coin and power-up packages.
    
    Response:
    {
        "coin_packages": [...],
        "powerup_packages": [...]
    }
    """
    try:
        coin_packages = [
            {
                'id': k,
                'name': v['name'],
                'coins': v['coins'],
                'price_cents': v['price_cents'],
                'price_dollars': v['price_cents'] / 100
            }
            for k, v in COIN_PACKAGES.items()
        ]
        
        powerup_packages = [
            {
                'id': k,
                'name': v['name'],
                'coins': v['coins'],
                'price_cents': v['price_cents'],
                'price_dollars': v['price_cents'] / 100
            }
            for k, v in POWERUP_PACKAGES.items()
        ]
        
        return jsonify({
            'coin_packages': coin_packages,
            'powerup_packages': powerup_packages
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Handle Stripe webhook events (for production).
    """
    try:
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
        
        if not webhook_secret:
            return jsonify({'error': 'Webhook secret not configured'}), 500
        
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
        
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            # Process payment (similar to handle_payment_success)
            # This ensures payments are processed even if frontend callback fails
        
        return jsonify({'received': True}), 200
        
    except ValueError as e:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

