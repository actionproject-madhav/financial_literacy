from flask import Blueprint, request, jsonify, redirect, session, make_response, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import os
from dotenv import load_dotenv

load_dotenv()

# Allow insecure transport for localhost development (HTTP instead of HTTPS)
# This is safe for localhost only - DO NOT use in production
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

auth_bp = Blueprint('auth', __name__)

def get_db():
    """Get database instance from app context"""
    return current_app.config['DATABASE']

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.getenv('GOOGLE_REDIRECT_URI')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

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

        # Store user info in session
        session['user'] = {
            'id': id_info['sub'],
            'email': email,
            'learner_id': learner_id,
            'name': id_info.get('name', ''),
            'picture': id_info.get('picture', ''),
            'is_new_user': is_new_user
        }
        
        # Force session to persist (Flask sessions are signed cookies by default)
        session.permanent = True
        
        print(f"✅ Session set for user: {email}, learner_id: {learner_id}")
        print(f"🔍 Session contents: {dict(session)}")

        # Redirect to frontend (onboarding if new user)
        # Use hash-based routing for frontend
        # Create response to ensure session cookie is set
        redirect_url = f"{FRONTEND_URL}/#/onboarding" if is_new_user else f"{FRONTEND_URL}/#/learn"
        response = make_response(redirect(redirect_url))
        
        # Debug: log session cookie
        print(f"🔍 Redirecting to: {redirect_url}")
        
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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'success': True})


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
