from flask import Blueprint, request, jsonify, redirect, session, make_response, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import os
import json
import hmac
import hashlib
import base64
import time
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

# Allow insecure transport for localhost development only (HTTP instead of HTTPS)
# Only enable this for local development, not production
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
if 'localhost' in FRONTEND_URL or '127.0.0.1' in FRONTEND_URL:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    print("⚠️  OAUTHLIB_INSECURE_TRANSPORT enabled for localhost development")

auth_bp = Blueprint('auth', __name__)

# Token expiration time (5 minutes - enough for the redirect flow)
AUTH_TOKEN_EXPIRY = 300  # seconds

def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']


def _get_secret_key():
    """Get the Flask secret key for signing tokens"""
    return current_app.secret_key or os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')


def _create_auth_token(user_data: dict) -> str:
    """
    Create a signed auth token containing user session data.
    This is used to pass auth info through the redirect URL when cross-site cookies fail.

    Token format: base64(json_payload).base64(signature)
    """
    # Add expiration timestamp
    payload = {
        **user_data,
        'exp': int(time.time()) + AUTH_TOKEN_EXPIRY,
        'iat': int(time.time())
    }

    # Encode payload
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode().rstrip('=')

    # Create signature
    secret = _get_secret_key()
    signature = hmac.new(
        secret.encode(),
        payload_b64.encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

    return f"{payload_b64}.{signature_b64}"


def _verify_auth_token(token: str) -> dict:
    """
    Verify and decode an auth token.
    Returns the user data if valid, None if invalid or expired.
    """
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None

        payload_b64, signature_b64 = parts

        # Verify signature
        secret = _get_secret_key()
        expected_signature = hmac.new(
            secret.encode(),
            payload_b64.encode(),
            hashlib.sha256
        ).digest()
        expected_b64 = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')

        if not hmac.compare_digest(signature_b64, expected_b64):
            print("⚠️  Auth token signature mismatch")
            return None

        # Decode payload (add padding back)
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += '=' * padding

        payload_json = base64.urlsafe_b64decode(payload_b64).decode()
        payload = json.loads(payload_json)

        # Check expiration
        if payload.get('exp', 0) < time.time():
            print("⚠️  Auth token expired")
            return None

        # Remove metadata fields
        payload.pop('exp', None)
        payload.pop('iat', None)

        return payload

    except Exception as e:
        print(f"⚠️  Auth token verification error: {e}")
        return None

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI')

def create_flow():
    """Create OAuth flow"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise ValueError("Missing Google OAuth credentials")
    
    return Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        },
        scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
        redirect_uri=GOOGLE_REDIRECT_URI
    )

@auth_bp.route('/google', methods=['GET'])
def google_auth():
    """Initiate Google OAuth login"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return jsonify({'error': 'OAuth not configured'}), 500
    
    try:
        flow = create_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        session['state'] = state
        return redirect(authorization_url)
    except Exception as e:
        print(f"OAuth initiation error: {e}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    try:
        flow = create_flow()
        flow.fetch_token(authorization_response=request.url)
        
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        email = id_info['email']

        # Get database instance
        db = get_db()
        
        # Ensure database connection
        if not db.is_connected:
            raise Exception("Database not connected")
        
        # Get or create learner
        learner = db.collections.get_learner_by_email(email)

        if not learner:
            # Create new learner
            learner_id = db.collections.create_learner(
                email=email,
                display_name=id_info.get('name', email.split('@')[0]),
                profile_picture_url=id_info.get('picture', ''),
                native_language='English',  # Will be updated in onboarding
                english_proficiency='intermediate'
            )

            # Initialize starter skills for new learner
            _initialize_learner_skills(learner_id)

            # Get the created learner
            learner = db.collections.get_learner_by_email(email)
            is_new_user = True
        else:
            learner_id = str(learner['_id'])
            is_new_user = False

        # Create user session data
        user_data = {
            'id': id_info['sub'],
            'email': email,
            'learner_id': learner_id,
            'name': id_info.get('name', ''),
            'picture': id_info.get('picture', ''),
            'is_new_user': is_new_user
        }

        # Store user info in session (for same-origin requests)
        session['user'] = user_data

        # Force session to persist (Flask sessions are signed cookies by default)
        session.permanent = True

        print(f"✅ Session set for user: {email}, learner_id: {learner_id}, is_new_user: {is_new_user}")
        print(f"🔍 Session contents: {dict(session)}")

        # Create a signed auth token for cross-site cookie fallback
        # This token is passed in the URL and allows the frontend to establish auth
        # even when third-party cookies are blocked
        auth_token = _create_auth_token(user_data)
        print(f"🔑 Auth token created for redirect")

        # Redirect to frontend (onboarding if new user)
        # Include auth token in URL for cross-site cookie fallback
        base_path = "/onboarding" if is_new_user else "/learn"
        redirect_url = f"{FRONTEND_URL}/#/auth-callback?token={auth_token}&redirect={base_path}"

        response = make_response(redirect(redirect_url))

        # Debug: log redirect
        print(f"🔍 Redirecting to: {FRONTEND_URL}/#/auth-callback?token=***&redirect={base_path}")

        return response
        
    except Exception as e:
        print(f"OAuth error: {e}")
        import traceback
        traceback.print_exc()
        return redirect(f"{FRONTEND_URL}/#/auth?error=auth_failed")

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user"""
    print(f"🔍 /auth/me called. Session keys: {list(session.keys())}")
    print(f"🔍 Session contents: {dict(session)}")

    if 'user' not in session:
        print("⚠️  No 'user' key in session")
        return jsonify({'error': 'Not authenticated'}), 401

    print(f"✅ Returning user: {session['user']['email']}")
    return jsonify(session['user'])


@auth_bp.route('/exchange-token', methods=['POST'])
def exchange_token():
    """
    Exchange a signed auth token for a session.

    This endpoint is used when cross-site cookies are blocked.
    The frontend receives a token in the OAuth redirect URL and
    exchanges it here to establish a proper session.

    Request JSON:
    {
        "token": "base64payload.base64signature"
    }

    Response:
    {
        "success": true,
        "user": {...}  # User session data
    }
    """
    try:
        data = request.get_json()
        token = data.get('token')

        if not token:
            return jsonify({'error': 'Token required'}), 400

        # Verify and decode the token
        user_data = _verify_auth_token(token)

        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Verify the learner still exists
        db = get_db()
        learner_id = user_data.get('learner_id')

        if learner_id:
            from bson import ObjectId
            try:
                learner = db.collections.learners.find_one({'_id': ObjectId(learner_id)})
                if not learner:
                    return jsonify({'error': 'Learner not found'}), 404
            except:
                return jsonify({'error': 'Invalid learner ID'}), 400

        # Store user info in session
        session['user'] = user_data
        session.permanent = True

        print(f"✅ Token exchanged for session: {user_data.get('email')}")

        return jsonify({
            'success': True,
            'user': user_data
        }), 200

    except Exception as e:
        print(f"⚠️  Token exchange error: {e}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user - clears session on backend"""
    try:
        # Clear all session data
        session.clear()
        print(f"✅ Logout successful - session cleared")
        return jsonify({'success': True}), 200
    except Exception as e:
        print(f"⚠️  Logout error: {e}")
        # Still return success even if there's an error clearing session
        # The session will expire anyway
        return jsonify({'success': True}), 200


def _initialize_learner_skills(learner_id: str):
    """
    Initialize starter skills for a new learner.

    Unlocks the first 3 beginner-friendly skills that have no prerequisites.
    """
    # Get database instance
    db = get_db()
    
    # Starter skills for new learners (tier 1, no prerequisites)
    starter_slugs = [
        'understanding-us-currency',
        'checking-accounts',
        'what-is-credit'
    ]

    print(f"🎯 Initializing starter skills for learner {learner_id}")

    initialized_count = 0

    for slug in starter_slugs:
        try:
            skill = db.collections.knowledge_components.find_one({'slug': slug})

            if skill:
                # Create skill state as 'available'
                db.collections.create_learner_skill_state(
                    learner_id=learner_id,
                    kc_id=str(skill['_id']),
                    status='available'
                )
                print(f"  ✓ Initialized: {skill['name']}")
                initialized_count += 1
            else:
                print(f"  ⚠️  Skill not found: {slug}")

        except Exception as e:
            print(f"  ❌ Error initializing {slug}: {e}")

    print(f"✅ Initialized {initialized_count}/{len(starter_slugs)} starter skills")

    return initialized_count
