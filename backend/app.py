from flask import Flask
from flask_cors import CORS
import os
from auth import auth_bp
from database import Database
from services import LearningEngine
from blueprints.adaptive import adaptive_bp

# Create Flask app
app = Flask(__name__)

# Configure CORS
FRONTEND_URL_ENV = os.getenv('FRONTEND_URL', 'http://localhost:5173')
FRONTEND_BASE = FRONTEND_URL_ENV.rstrip('/').split('/auth')[0].split('/onboarding')[0]

CORS_ORIGINS = [FRONTEND_BASE]

if 'localhost' in FRONTEND_URL_ENV or '127.0.0.1' in FRONTEND_URL_ENV:
    CORS_ORIGINS.extend([
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ])

CORS_ORIGINS = [origin.rstrip('/') for origin in CORS_ORIGINS]
CORS_ORIGINS = list(dict.fromkeys(CORS_ORIGINS))

CORS(app,
     origins=CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure session
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

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

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(adaptive_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
