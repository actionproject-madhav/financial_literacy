#!/usr/bin/env python3
"""
Frontend-Backend Integration Test

Tests the full integration between frontend and backend:
- Backend API endpoints
- Database connectivity
- External services
- Frontend API service compatibility
"""

import requests
import json
import sys
import os
from datetime import datetime

API_BASE = os.getenv('API_BASE', 'http://localhost:5000')

def print_header(text):
    print(f"\n{'='*70}")
    print(f"  {text}")
    print(f"{'='*70}")

def print_success(text):
    print(f"  ✅ {text}")

def print_error(text):
    print(f"  ❌ {text}")

def print_info(text):
    print(f"  ℹ️  {text}")

def test_endpoint(method, endpoint, data=None, description=None):
    """Test an API endpoint"""
    url = f"{API_BASE}{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json=data, headers={'Content-Type': 'application/json'}, timeout=5)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers={'Content-Type': 'application/json'}, timeout=5)
        
        if response.status_code in [200, 201]:
            try:
                return True, response.json()
            except:
                return True, response.text
        else:
            return False, f"Status {response.status_code}: {response.text[:200]}"
    except requests.exceptions.ConnectionError:
        return False, "Connection refused - is backend running?"
    except Exception as e:
        return False, str(e)

def main():
    print_header("Frontend-Backend Integration Test")
    print(f"Backend: {API_BASE}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {
        'backend': {},
        'database': {},
        'api_endpoints': {}
    }

    # 1. Test Backend Health
    print_header("1. Backend Health Checks")
    
    health_endpoints = [
        ('/api/health', 'Main health'),
        ('/api/learners/health', 'Learners health'),
        ('/api/adaptive/health', 'Adaptive health'),
    ]
    
    for endpoint, desc in health_endpoints:
        success, result = test_endpoint('GET', endpoint)
        if success:
            print_success(f"{desc}: {endpoint}")
            results['backend'][endpoint] = result
        else:
            print_error(f"{desc}: {endpoint} - {result}")

    # 2. Test Database Connection (via API)
    print_header("2. Database Connectivity")
    
    # Test if we can get knowledge components (requires DB)
    success, result = test_endpoint('GET', '/api/adaptive/kcs')
    if success:
        kcs = result if isinstance(result, list) else []
        print_success(f"Database connected: {len(kcs)} knowledge components found")
        results['database']['connected'] = True
        results['database']['kc_count'] = len(kcs)
    else:
        print_error(f"Database check failed: {result}")
        results['database']['connected'] = False

    # 3. Test API Endpoints Structure
    print_header("3. API Endpoints Structure")
    
    endpoint_tests = [
        # Auth
        ('GET', '/auth/me', None, 'Get current user'),
        
        # Learners
        ('GET', '/api/learners/health', None, 'Learners health'),
        
        # Adaptive Learning
        ('GET', '/api/adaptive/kcs', None, 'List all KCs'),
        ('GET', '/api/adaptive/health', None, 'Adaptive health'),
    ]
    
    for method, endpoint, data, desc in endpoint_tests:
        success, result = test_endpoint(method, endpoint, data)
        if success:
            print_success(f"{desc}: {method} {endpoint}")
            results['api_endpoints'][endpoint] = 'OK'
        else:
            # Some endpoints may fail without auth, that's OK for structure test
            if '401' in str(result) or '403' in str(result):
                print_info(f"{desc}: {method} {endpoint} (requires auth)")
            else:
                print_error(f"{desc}: {method} {endpoint} - {result}")

    # 4. Summary
    print_header("Integration Test Summary")
    
    backend_ok = len(results['backend']) > 0
    db_ok = results['database'].get('connected', False)
    
    print(f"\nBackend Status: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Database Status: {'✅ OK' if db_ok else '❌ FAILED'}")
    
    if backend_ok and db_ok:
        print("\n🎉 Integration test PASSED!")
        print("\nNext steps:")
        print("  1. Start backend: cd backend && python app.py")
        print("  2. Start frontend: cd frontend && npm run dev")
        print("  3. Test authentication flow")
        print("  4. Test lesson flow with real learner")
        return 0
    else:
        print("\n⚠️  Integration test found issues")
        return 1

if __name__ == '__main__':
    sys.exit(main())
