from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import re
import io
from datetime import datetime
from database import ReceiptDatabase
import uuid
import os
from auth import auth_bp
from ai_hub import ai_hub_bp
from trading import trading_bp
from education import education_bp

# PostgreSQL/SQLAlchemy imports
from config.database import init_app, init_db_tables, db
import models


# Optional imports for OCR functionality
try:
    import cv2
    import numpy as np
    from PIL import Image, ImageEnhance
    import pytesseract
    OCR_AVAILABLE = True
except ImportError as e:
    print(f"OCR packages not available: {e}")
    OCR_AVAILABLE = False

# Create Flask app ONCE with static folder configuration
app = Flask(__name__, static_folder='../frontend/dist')

# Configure CORS - Allow frontend URL from environment or use defaults
FRONTEND_URL_ENV = os.getenv('FRONTEND_URL', 'http://localhost:5173')
# Extract base URL (remove trailing slash and path)
FRONTEND_BASE = FRONTEND_URL_ENV.rstrip('/').split('/auth')[0].split('/onboarding')[0]

# CORS allowed origins - use environment variable, add localhost only for development
CORS_ORIGINS = [FRONTEND_BASE]  # Primary frontend URL from environment

# Add localhost origins only if not in production (when FRONTEND_URL is not a production URL)
if 'localhost' in FRONTEND_URL_ENV or '127.0.0.1' in FRONTEND_URL_ENV:
    CORS_ORIGINS.extend([
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
    ])
else:
    # In production, also allow the explicit production URL (in case FRONTEND_URL is different)
    CORS_ORIGINS.append("https://finlit-nsa.onrender.com")

# Remove duplicates and normalize (remove trailing slashes)
CORS_ORIGINS = [origin.rstrip('/') for origin in CORS_ORIGINS]
CORS_ORIGINS = list(dict.fromkeys(CORS_ORIGINS))

print("=" * 60)
print("CORS Configuration:")
print("=" * 60)
print(f"Frontend URL (from env): {FRONTEND_URL_ENV}")
print(f"Frontend Base URL: {FRONTEND_BASE}")
print(f"Allowed CORS Origins: {CORS_ORIGINS}")
print("=" * 60)

CORS(app, 
     origins=CORS_ORIGINS,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure session for development
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-change-this')
app.config['SESSION_COOKIE_SECURE'] = False  # False for HTTP in development
app.config['SESSION_COOKIE_HTTPONLY'] = False  # Allow JavaScript access in development
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Lax for development

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(ai_hub_bp, url_prefix='/api/ai')
app.register_blueprint(trading_bp, url_prefix='/api/trading')
app.register_blueprint(education_bp, url_prefix='/api/education')


# Initialize MongoDB database (legacy)
receipt_db = ReceiptDatabase()

# Initialize PostgreSQL database with Flask-SQLAlchemy and Flask-Migrate
init_app(app)

# Create tables if they don't exist
try:
    init_db_tables(app)
except Exception as e:
    print(f"Warning: Could not initialize PostgreSQL database: {e}")
    print("The app will continue to work with MongoDB only.")
    print("Make sure PostgreSQL is installed and DATABASE_URL is set in .env")

# Frontend serving routes (place these BEFORE your API routes)
@app.route('/')
def serve_index():
    """Serve the React app"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files or fall back to index.html for React Router"""
    if path.startswith('api/') or path.startswith('auth/') or path == 'health':
        # API route not found
        return jsonify({'error': 'Endpoint not found'}), 404
    
    # Try to serve the file, fall back to index.html for client-side routing
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# Hardcoded popular companies with their variations and stock tickers
POPULAR_COMPANIES = {
    'starbucks': {
        'name': 'Starbucks Corporation',
        'ticker': 'SBUX',
        'variations': ['starbucks', 'sbux', 'star bucks', 'starbu'],
        'logo': '☕'
    },
    'target': {
        'name': 'Target Corporation',
        'ticker': 'TGT',
        'variations': ['target', 'tgt', 'target corp'],
        'logo': '🎯'
    },
    'walmart': {
        'name': 'Walmart Inc',
        'ticker': 'WMT',
        'variations': ['walmart', 'wal mart', 'wal-mart', 'wmt'],
        'logo': '🛒'
    },
    'nike': {
        'name': 'Nike Inc',
        'ticker': 'NKE',
        'variations': ['nike', 'nke', 'nike inc'],
        'logo': '👟'
    },
    'apple': {
        'name': 'Apple Inc',
        'ticker': 'AAPL',
        'variations': ['apple', 'aapl', 'apple inc', 'apple store'],
        'logo': ''
    },
    'amazon': {
        'name': 'Amazon.com Inc',
        'ticker': 'AMZN',
        'variations': ['amazon', 'amzn', 'amazon.com', 'amazon fresh', 'whole foods'],
        'logo': ''
    },
    'mcdonalds': {
        'name': 'McDonald\'s Corporation',
        'ticker': 'MCD',
        'variations': ['mcdonalds', 'mcd', 'mcdonald\'s', 'mc donalds'],
        'logo': ''
    },
    'cocacola': {
        'name': 'The Coca-Cola Company',
        'ticker': 'KO',
        'variations': ['coca cola', 'coke', 'coca-cola', 'ko'],
        'logo': '🥤'
    },
    'tesla': {
        'name': 'Tesla Inc',
        'ticker': 'TSLA',
        'variations': ['tesla', 'tsla', 'tesla motors'],
        'logo': ''
    },
    'microsoft': {
        'name': 'Microsoft Corporation',
        'ticker': 'MSFT',
        'variations': ['microsoft', 'msft', 'xbox'],
        'logo': ''
    },
    'netflix': {
        'name': 'Netflix Inc',
        'ticker': 'NFLX',
        'variations': ['netflix', 'nflx'],
        'logo': ''
    },
    'uber': {
        'name': 'Uber Technologies Inc',
        'ticker': 'UBER',
        'variations': ['uber', 'uber eats'],
        'logo': ''
    },
    'spotify': {
        'name': 'Spotify Technology SA',
        'ticker': 'SPOT',
        'variations': ['spotify', 'spot'],
        'logo': ''
    },
    'meta': {
        'name': 'Meta Platforms Inc',
        'ticker': 'META',
        'variations': ['meta', 'facebook', 'fb', 'instagram', 'whatsapp'],
        'logo': ''
    },
    'disney': {
        'name': 'The Walt Disney Company',
        'ticker': 'DIS',
        'variations': ['disney', 'dis', 'walt disney', 'disneyland', 'disney world'],
        'logo': ''
    },
    'costco': {
        'name': 'Costco Wholesale Corporation',
        'ticker': 'COST',
        'variations': ['costco', 'cost', 'costco wholesale'],
        'logo': ''
    },
    'homedepot': {
        'name': 'The Home Depot Inc',
        'ticker': 'HD',
        'variations': ['home depot', 'hd', 'homedepot'],
        'logo': ''
    },
    'cvs': {
        'name': 'CVS Health Corporation',
        'ticker': 'CVS',
        'variations': ['cvs', 'cvs pharmacy', 'cvs health'],
        'logo': ''
    },
    'walgreens': {
        'name': 'Walgreens Boots Alliance Inc',
        'ticker': 'WBA',
        'variations': ['walgreens', 'wba', 'walgreen'],
        'logo': ''
    },
    'chipotle': {
        'name': 'Chipotle Mexican Grill Inc',
        'ticker': 'CMG',
        'variations': ['chipotle', 'cmg'],
        'logo': ''
    }
}

def enhance_receipt_image(image):
    """Enhanced preprocessing for better OCR"""
    # Convert to OpenCV
    opencv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(opencv_img, cv2.COLOR_BGR2GRAY)
    
    # Resize to optimal size for OCR
    height, width = gray.shape
    target_height = 1500
    if height < target_height:
        scale = target_height / height
        new_width = int(width * scale)
        gray = cv2.resize(gray, (new_width, target_height), interpolation=cv2.INTER_CUBIC)
    
    # Advanced denoising
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Gaussian blur
    blurred = cv2.GaussianBlur(denoised, (1, 1), 0)
    
    # Enhanced contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(blurred)
    
    # Morphological operations
    kernel = np.ones((1,1), np.uint8)
    morph = cv2.morphologyEx(enhanced, cv2.MORPH_CLOSE, kernel)
    
    # Adaptive threshold
    binary = cv2.adaptiveThreshold(
        morph, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 15, 4
    )
    
    # Cleanup
    kernel = np.ones((2,2), np.uint8)
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    return cleaned

def extract_text_robust(processed_img):
    """Multi-pass OCR extraction"""
    psm_modes = [6, 4, 8, 11, 13, 3]
    oem_modes = [3, 1, 2]
    
    all_results = []
    
    for oem in oem_modes:
        for psm in psm_modes:
            try:
                config = f'--oem {oem} --psm {psm} -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,$/():- '
                text = pytesseract.image_to_string(processed_img, config=config)
                
                if text.strip() and len(text.strip()) > 20:
                    all_results.append({
                        'text': text.strip(),
                        'length': len(text.strip()),
                        'oem': oem,
                        'psm': psm
                    })
            except Exception as e:
                continue
    
    if not all_results:
        return ""
    
    # Return the longest result
    best_result = max(all_results, key=lambda x: x['length'])
    print(f"Best OCR: OEM {best_result['oem']}, PSM {best_result['psm']}, Length: {best_result['length']}")
    return best_result['text']

def detect_popular_company(text):
    """Detect popular companies from OCR text using fuzzy matching"""
    text_lower = text.lower()
    
    # First, try exact matches and variations
    for company_key, company_data in POPULAR_COMPANIES.items():
        for variation in company_data['variations']:
            if variation.lower() in text_lower:
                print(f"Found company variation '{variation}' for {company_data['name']}")
                return {
                    'name': company_data['name'],
                    'ticker': company_data['ticker'],
                    'logo': company_data['logo'],
                    'confidence': 'high',
                    'matched_text': variation
                }
    
    # If no exact match, try partial matching for common words
    words = re.findall(r'\b\w+\b', text_lower)
    
    for company_key, company_data in POPULAR_COMPANIES.items():
        for variation in company_data['variations']:
            variation_words = variation.split()
            if len(variation_words) == 1:
                # Single word company names
                for word in words:
                    if word in variation or variation in word:
                        if len(word) >= 3:  # Avoid very short matches
                            print(f"Found partial match '{word}' for {company_data['name']}")
                            return {
                                'name': company_data['name'],
                                'ticker': company_data['ticker'],
                                'logo': company_data['logo'],
                                'confidence': 'medium',
                                'matched_text': word
                            }
    
    return None

def find_company_name(text):
    """Find company name with enhanced popular company detection"""
    
    # First, try to detect popular companies
    popular_company = detect_popular_company(text)
    if popular_company:
        return popular_company['name']
    
    # Fallback to original logic for unknown companies
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Patterns to skip
    skip_patterns = [
        r'^\d+\s+.*(?:street|st|avenue|ave|road|rd|boulevard|blvd)',
        r'^\(\d{3}\)\s*\d{3}-\d{4}',
        r'^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}',
        r'^store\s*#?\d+',
        r'^\d{1,2}:\d{2}',
        r'^\$\d+\.?\d*',
        r'^receipt\s*#?\d*',
        r'^transaction\s*#?\d*',
        r'^cashier:?\s*\w+',
        r'^terminal:?\s*\d+',
        r'^card\s*#?\*+\d+',
        r'^\*+\d{4}$',
        r'^auth\s*code:?\s*\d+',
        r'^ref\s*#?\d+'
    ]
    
    potential_companies = []
    
    for i, line in enumerate(lines[:12]):
        line_clean = line.strip()
        
        if len(line_clean) < 3:
            continue
            
        # Skip patterns
        skip = False
        for pattern in skip_patterns:
            if re.match(pattern, line_clean, re.IGNORECASE):
                skip = True
                break
        if skip:
            continue
        
        # Skip numbers only or common words
        if re.match(r'^[\d\s\.\-\(\)]+$', line_clean):
            continue
            
        if line_clean.lower() in ['receipt', 'thank you', 'thanks', 'visit', 'again', 'customer', 'copy']:
            continue
        
        # Good company name indicators
        if (len(line_clean) >= 4 and 
            not re.match(r'^\d+$', line_clean) and
            not re.match(r'^\d+\.\d+$', line_clean) and
            any(c.isalpha() for c in line_clean)):
            
            clean_name = re.sub(r'[^\w\s&\'-]', ' ', line_clean)
            clean_name = ' '.join(clean_name.split())
            
            # Score the company name
            score = 0
            if i < 3:
                score += 10
            if len(clean_name.split()) <= 4:
                score += 5
            if clean_name.upper() == clean_name:
                score += 3
            if any(word in clean_name.upper() for word in ['STORE', 'MARKET', 'SHOP', 'FOODS', 'MART']):
                score += 5
                
            potential_companies.append({
                'name': clean_name.title(),
                'score': score,
                'position': i
            })
    
    if potential_companies:
        best = max(potential_companies, key=lambda x: x['score'])
        return best['name']
    
    return "Unknown Store"

def find_total_amount(text):
    """Find total amount with better patterns"""
    
    # Total patterns
    total_patterns = [
        r'(?i)(?:total|amount\s*due|balance\s*due|grand\s*total)\s*:?\s*\$?(\d{1,4}\.\d{2})',
        r'(?i)total\s*\$?(\d{1,4}\.\d{2})',
        r'(?i)\$(\d{1,4}\.\d{2})\s*(?:total|due)',
        r'(?i)(?:final|net)\s*(?:total|amount)\s*:?\s*\$?(\d{1,4}\.\d{2})',
        r'(?i)amount\s*:?\s*\$?(\d{1,4}\.\d{2})'
    ]
    
    found_amounts = []
    
    # Look for explicit patterns
    for pattern in total_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            try:
                amount = float(match)
                if 0.50 <= amount <= 9999.99:
                    found_amounts.append(amount)
            except:
                continue
    
    if found_amounts:
        return max(found_amounts)
    
    # Look near total-related words
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if re.search(r'\b(?:total|amount|due|balance|grand)\b', line, re.IGNORECASE):
            search_lines = lines[max(0, i-1):i+3]
            for search_line in search_lines:
                amounts = re.findall(r'\$(\d{1,4}\.\d{2})', search_line)
                for amount in amounts:
                    try:
                        val = float(amount)
                        if 1.00 <= val <= 9999.99:
                            found_amounts.append(val)
                    except:
                        continue
    
    if found_amounts:
        return max(found_amounts)
    
    # Last resort: largest reasonable amount
    all_amounts = re.findall(r'\$(\d{1,4}\.\d{2})', text)
    valid_amounts = []
    
    for amount in all_amounts:
        try:
            val = float(amount)
            if 5.00 <= val <= 999.99:
                valid_amounts.append(val)
        except:
            continue
    
    return max(valid_amounts) if valid_amounts else 0.0

@app.route('/api/scan-receipt', methods=['POST'])
def scan_receipt():
    if not OCR_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'OCR functionality not available. Please install opencv-python, Pillow, pytesseract, and numpy packages.'
        }), 503
    
    try:
        if 'receipt' not in request.files:
            return jsonify({'error': 'No file uploaded', 'success': False}), 400
        
        file = request.files['receipt']
        if not file or file.filename == '':
            return jsonify({'error': 'No file selected', 'success': False}), 400

        # Get user_id from request
        user_id = request.form.get('user_id', 'anonymous_user')
        
        # Process image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        print(f"Processing receipt for user: {user_id}")
        
        # Enhanced preprocessing
        processed_image = enhance_receipt_image(image)
        
        # Extract text
        extracted_text = extract_text_robust(processed_image)
        
        print("=== EXTRACTED TEXT ===")
        print(extracted_text)
        print("=== END TEXT ===")
        
        if not extracted_text or len(extracted_text.strip()) < 10:
            return jsonify({
                'success': False,
                'error': 'Could not extract readable text. Please try a clearer image.',
                'extracted_text': extracted_text
            }), 400
        
        # Detect popular company first
        popular_company = detect_popular_company(extracted_text)
        
        if popular_company:
            company_name = popular_company['name']
            ticker = popular_company['ticker']
            logo = popular_company['logo']
            confidence_boost = 30  # Boost confidence for known companies
            print(f"Detected popular company: {company_name} ({ticker})")
        else:
            company_name = find_company_name(extracted_text)
            ticker = None
            logo = '🏪'
            confidence_boost = 0
        
        total_amount = find_total_amount(extracted_text)
        
        # Calculate confidence with boost for popular companies
        confidence_score = 100 + confidence_boost
        
        if company_name == "Unknown Store":
            confidence_score -= 40
        if total_amount == 0.0:
            confidence_score -= 50
        if len(extracted_text.strip()) < 100:
            confidence_score -= 20
            
        # Cap confidence at 100
        confidence_score = min(confidence_score, 100)
            
        if confidence_score >= 80:
            confidence = "high"
        elif confidence_score >= 50:
            confidence = "medium"
        else:
            confidence = "low"
        
        print(f"Results: Company='{company_name}', Amount=${total_amount}, Confidence={confidence}, Ticker={ticker}")
        
        # Save to database
        scan_metadata = {
            'file_name': file.filename,
            'file_size': len(image_bytes),
            'processing_time': datetime.now().isoformat(),
            'detected_company': popular_company is not None,
            'ticker': ticker,
            'logo': logo
        }
        
        receipt_id = receipt_db.save_receipt_scan(
            user_id=user_id,
            company_name=company_name,
            total_amount=total_amount,
            confidence=confidence,
            extracted_text=extracted_text,
            scan_metadata=scan_metadata
        )
        
        response_data = {
            'success': True,
            'company_name': company_name,
            'total_amount': total_amount,
            'confidence': confidence,
            'extracted_text': extracted_text,
            'ticker': ticker,
            'logo': logo,
            'is_popular_company': popular_company is not None
        }
        
        if receipt_id:
            response_data['receipt_id'] = receipt_id
        
        return jsonify(response_data)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Processing error: {str(e)}'
        }), 500

# Dashboard API endpoints (keeping existing endpoints)
@app.route('/api/dashboard/receipts/<user_id>', methods=['GET'])
def get_user_receipts(user_id):
    """Get all receipts for a user"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        skip = (page - 1) * limit
        
        receipts = receipt_db.get_user_receipts(user_id, limit=limit, skip=skip)
        
        return jsonify({
            'success': True,
            'receipts': receipts,
            'page': page,
            'limit': limit
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dashboard/stats/<user_id>', methods=['GET'])
def get_user_stats(user_id):
    """Get dashboard statistics for a user"""
    try:
        stats = receipt_db.get_user_stats(user_id)
        
        if stats is None:
            return jsonify({
                'success': False,
                'error': 'Failed to get user statistics'
            }), 500
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dashboard/companies/<user_id>', methods=['GET'])
def get_company_breakdown(user_id):
    """Get spending breakdown by company"""
    try:
        companies = receipt_db.get_company_breakdown(user_id)
        
        return jsonify({
            'success': True,
            'companies': companies
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/dashboard/monthly/<user_id>', methods=['GET'])
def get_monthly_spending(user_id):
    """Get monthly spending trends"""
    try:
        months = int(request.args.get('months', 12))
        monthly_data = receipt_db.get_monthly_spending(user_id, months=months)
        
        return jsonify({
            'success': True,
            'monthly_data': monthly_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/receipts/<receipt_id>', methods=['DELETE'])
def delete_receipt(receipt_id):
    """Delete a receipt"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        success = receipt_db.delete_receipt(receipt_id, user_id)
        
        return jsonify({
            'success': success,
            'message': 'Receipt deleted successfully' if success else 'Failed to delete receipt'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/receipts/<receipt_id>', methods=['PUT'])
def update_receipt(receipt_id):
    """Update a receipt (manual correction)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        # Extract updatable fields
        updates = {}
        if 'company_name' in data:
            updates['company_name'] = data['company_name']
        if 'total_amount' in data:
            updates['total_amount'] = float(data['total_amount'])
        if 'confidence' in data:
            updates['confidence'] = data['confidence']
        
        success = receipt_db.update_receipt(receipt_id, user_id, updates)
        
        return jsonify({
            'success': success,
            'message': 'Receipt updated successfully' if success else 'Failed to update receipt'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'database': 'connected' if receipt_db.is_connected else 'disconnected'})

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Enhanced Receipt Scanner API with Popular Company Detection'})

@app.route('/api/config', methods=['GET'])
def get_config():
    """Get public configuration for frontend"""
    return jsonify({
        'google_client_id': os.getenv('GOOGLE_CLIENT_ID'),
        'api_base_url': request.url_root.rstrip('/')
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint - shows database connection status"""
    # Use the global db instance (already initialized)
    mongo_uri = os.getenv('MONGO_URI', '')
    database_name = os.getenv('DATABASE_NAME', 'receipt_scanner')
    
    # Check if database is connected (triggers lazy connection)
    # This will attempt to connect if not already connected
    try:
        is_connected = receipt_db.is_connected
    except Exception as e:
        print(f"Error checking database connection: {e}")
        is_connected = False
    
    health_status = {
        'status': 'healthy' if is_connected else 'unhealthy',
        'database': {
            'connected': is_connected,
            'mongo_uri_set': bool(mongo_uri and mongo_uri != 'mongodb://localhost:27017/'),
            'database_name_set': bool(database_name),
            'database_name': database_name if database_name else 'Not set'
        }
    }
    
    if not is_connected:
        health_status['database']['error'] = 'Database not connected'
        # Show MONGO_URI preview (first 40 chars + last 20 chars for security)
        mongo_uri_preview = ''
        if mongo_uri:
            if len(mongo_uri) > 60:
                mongo_uri_preview = mongo_uri[:40] + "..." + mongo_uri[-20:]
            else:
                mongo_uri_preview = mongo_uri[:40] + "..."
        health_status['database']['mongo_uri_preview'] = mongo_uri_preview
        health_status['database']['troubleshooting'] = {
            'check_mongo_uri': 'Set MONGO_URI in Render environment variables',
            'check_database_name': 'Set DATABASE_NAME in Render environment variables',
            'check_network_access': 'Allow 0.0.0.0/0 in MongoDB Atlas Network Access',
            'check_credentials': 'Verify username and password in MONGO_URI are correct',
            'check_render_logs': 'Check Render logs for connection error details'
        }
    
    status_code = 200 if is_connected else 503
    return jsonify(health_status), status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
 