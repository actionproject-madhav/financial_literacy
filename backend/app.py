from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import os
from auth import auth_bp
from database import Database
from services import LearningEngine
from blueprints.adaptive import adaptive_bp
from blueprints.learners import learners_bp
from blueprints.curriculum import curriculum_bp
from blueprints.chat import chat_bp
from blueprints.quests import quests_bp
from blueprints.leaderboard import leaderboard_bp
from blueprints.streaks import streaks_bp
from blueprints.translate import translate_bp
from blueprints.social import social_bp
from blueprints.payments import payments_bp
from blueprints.payments import payments_bp

# Create Flask app
app = Flask(__name__)

# Fix for running behind Railway's reverse proxy
# This ensures Flask knows the original request was HTTPS
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure CORS
FRONTEND_URL_ENV = os.getenv('FRONTEND_URL', 'http://localhost:5173')
FRONTEND_BASE = FRONTEND_URL_ENV.rstrip('/').split('/auth')[0].split('/onboarding')[0]

# Always include the configured frontend URL
CORS_ORIGINS = [FRONTEND_BASE]

# In development (localhost), also allow common dev ports
if 'localhost' in FRONTEND_URL_ENV or '127.0.0.1' in FRONTEND_URL_ENV:
    CORS_ORIGINS.extend([
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ])

# Always allow production Vercel domain (in case of dual environments)
CORS_ORIGINS.append("https://finlit-sigma.vercel.app")

# Remove duplicates and trailing slashes
CORS_ORIGINS = [origin.rstrip('/') for origin in CORS_ORIGINS]
CORS_ORIGINS = list(dict.fromkeys(CORS_ORIGINS))

print(f"🔒 CORS enabled for: {CORS_ORIGINS}")

CORS(app, 
     origins=CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure session
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')
# Production: Use secure cookies (HTTPS), Development: Allow HTTP
is_production = os.getenv('FLASK_ENV') == 'production' or (FRONTEND_URL_ENV and not FRONTEND_URL_ENV.startswith('http://localhost'))

# Cross-origin cookie settings for production
if is_production:
    app.config['SESSION_COOKIE_SECURE'] = True  # Require HTTPS
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-origin (Railway to Vercel)
else:
    app.config['SESSION_COOKIE_SECURE'] = False  # Allow HTTP for localhost
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Localhost doesn't need None

app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent XSS
app.config['SESSION_COOKIE_DOMAIN'] = None  # None for proper cross-origin handling
app.config['SESSION_COOKIE_PATH'] = '/'
app.config['PERMANENT_SESSION_LIFETIME'] = 86400  # 24 hours

# Initialize database
db = Database()

# Initialize learning engine
learning_engine = None
if db.is_connected:
    learning_engine = LearningEngine(db.collections)
    print("✅ Learning Engine initialized")
else:
    print("⚠️  Warning: Database not connected. Learning Engine not available.")

# Store in app config for blueprint access
app.config['DATABASE'] = db
app.config['LEARNING_ENGINE'] = learning_engine

# Health check endpoint
@app.route('/')
@app.route('/api/health')
def health_check():
    return {
        'status': 'ok',
        'message': 'Financial Literacy API is running',
        'database': 'connected' if db.is_connected else 'disconnected'
    }

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(adaptive_bp)
app.register_blueprint(learners_bp)
app.register_blueprint(curriculum_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(quests_bp)
app.register_blueprint(leaderboard_bp)
app.register_blueprint(streaks_bp)
app.register_blueprint(translate_bp)
app.register_blueprint(social_bp)
app.register_blueprint(payments_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
 