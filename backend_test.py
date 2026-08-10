#!/usr/bin/env python3
"""
Veyra AI Backend API Test Suite
Tests all backend endpoints at http://localhost:3000/api
"""

import requests
import json
import sys
from urllib.parse import urlparse, parse_qs

BASE_URL = "http://localhost:3000/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def test_root():
    """Test GET /api/ returns {message: 'Veyra AI is live', model: 'gpt-4o'}"""
    print("=" * 60)
    print("TEST 1: Root API endpoint")
    print("=" * 60)
    try:
        r = requests.get(f"{BASE_URL}/", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("message") == "Veyra AI is live" and
            data.get("model") == "gpt-4o"
        )
        
        print_test(
            "GET /api/",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data, indent=2)}"
        )
        return passed
    except Exception as e:
        print_test("GET /api/", False, f"Error: {str(e)}")
        return False

def test_google_oauth_start():
    """Test GET /api/auth/google returns 307 redirect with correct params"""
    print("=" * 60)
    print("TEST 2: Google OAuth start")
    print("=" * 60)
    try:
        r = requests.get(f"{BASE_URL}/auth/google", allow_redirects=False, timeout=10)
        
        # Should be 307 redirect
        if r.status_code != 307:
            print_test("GET /api/auth/google", False, f"Expected 307, got {r.status_code}")
            return False
        
        # Get redirect location
        location = r.headers.get("Location", "")
        if not location.startswith("https://accounts.google.com/o/oauth2/v2/auth"):
            print_test("GET /api/auth/google", False, f"Redirect not to Google OAuth: {location}")
            return False
        
        # Parse URL
        parsed = urlparse(location)
        params = parse_qs(parsed.query)
        
        # Check required params
        checks = []
        checks.append(("client_id", params.get("client_id", [""])[0] == "679155619284-1l3oimtk5vh9buof158bimeqss5ffg9o.apps.googleusercontent.com"))
        checks.append(("redirect_uri", "https://pro-career-ai.preview.emergentagent.com/api/auth/google/callback" in params.get("redirect_uri", [""])[0]))
        checks.append(("access_type", params.get("access_type", [""])[0] == "offline"))
        checks.append(("prompt", params.get("prompt", [""])[0] == "consent"))
        checks.append(("state", len(params.get("state", [""])[0]) > 0))
        
        # Check scopes
        scope = params.get("scope", [""])[0]
        required_scopes = [
            "openid", "email", "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file"
        ]
        scopes_ok = all(s in scope for s in required_scopes)
        checks.append(("scopes", scopes_ok))
        
        # Check cookie
        cookie_set = "veyra_oauth_state" in r.cookies
        checks.append(("veyra_oauth_state cookie", cookie_set))
        
        # If cookie is set, verify it matches state param
        if cookie_set:
            cookie_state = r.cookies.get("veyra_oauth_state")
            url_state = params.get("state", [""])[0]
            checks.append(("state matches cookie", cookie_state == url_state))
        
        all_passed = all(check[1] for check in checks)
        
        details = "\n   ".join([f"{name}: {'✓' if passed else '✗'}" for name, passed in checks])
        print_test("GET /api/auth/google", all_passed, details)
        
        return all_passed
    except Exception as e:
        print_test("GET /api/auth/google", False, f"Error: {str(e)}")
        return False

def test_google_oauth_callback_errors():
    """Test GET /api/auth/google/callback error handling"""
    print("=" * 60)
    print("TEST 3: Google OAuth callback error handling")
    print("=" * 60)
    
    results = []
    
    # Test 1: No code/state -> redirect with auth_error=state
    try:
        r = requests.get(f"{BASE_URL}/auth/google/callback", allow_redirects=False, timeout=10)
        passed = (
            r.status_code == 307 and
            "auth_error=state" in r.headers.get("Location", "")
        )
        results.append(passed)
        print_test(
            "No code/state",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location', '')}"
        )
    except Exception as e:
        results.append(False)
        print_test("No code/state", False, f"Error: {str(e)}")
    
    # Test 2: error=access_denied -> redirect with auth_error=access_denied
    try:
        r = requests.get(f"{BASE_URL}/auth/google/callback?error=access_denied", allow_redirects=False, timeout=10)
        passed = (
            r.status_code == 307 and
            "auth_error=access_denied" in r.headers.get("Location", "")
        )
        results.append(passed)
        print_test(
            "error=access_denied",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location', '')}"
        )
    except Exception as e:
        results.append(False)
        print_test("error=access_denied", False, f"Error: {str(e)}")
    
    # Test 3: Invalid code with state -> redirect with auth_error (NOT 500)
    try:
        # Set a cookie first
        session = requests.Session()
        session.cookies.set("veyra_oauth_state", "test-state-123")
        r = session.get(f"{BASE_URL}/auth/google/callback?code=invalid&state=test-state-123", allow_redirects=False, timeout=10)
        passed = (
            r.status_code == 307 and
            "auth_error=" in r.headers.get("Location", "")
        )
        results.append(passed)
        print_test(
            "Invalid code",
            passed,
            f"Status: {r.status_code}, Location: {r.headers.get('Location', '')}"
        )
    except Exception as e:
        results.append(False)
        print_test("Invalid code", False, f"Error: {str(e)}")
    
    return all(results)

def test_me_unauthenticated():
    """Test GET /api/me without session returns {user: null}"""
    print("=" * 60)
    print("TEST 4: GET /api/me (unauthenticated)")
    print("=" * 60)
    try:
        r = requests.get(f"{BASE_URL}/me", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("user") is None
        )
        
        print_test(
            "GET /api/me (no session)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data, indent=2)}"
        )
        return passed
    except Exception as e:
        print_test("GET /api/me (no session)", False, f"Error: {str(e)}")
        return False

def test_protected_endpoints():
    """Test protected endpoints return 401 without session"""
    print("=" * 60)
    print("TEST 5: Protected endpoints require session (401 without cookie)")
    print("=" * 60)
    
    endpoints = [
        ("PUT", "/profile", {"name": "Test"}),
        ("POST", "/skills", {"name": "Python"}),
        ("DELETE", "/skills/abc", None),
        ("POST", "/projects", {"name": "test"}),
        ("GET", "/memories", None),
        ("POST", "/memories", {"fact": "test"}),
        ("GET", "/google/gmail", None),
        ("GET", "/google/calendar", None),
        ("POST", "/google/calendar/events", {"summary": "test", "start": {"dateTime": "2025-01-01T10:00:00Z"}, "end": {"dateTime": "2025-01-01T11:00:00Z"}}),
        ("GET", "/google/drive", None),
        ("POST", "/ai/resume/generate", {}),
        ("POST", "/ai/opportunities", {}),
    ]
    
    results = []
    for method, path, body in endpoints:
        try:
            if method == "GET":
                r = requests.get(f"{BASE_URL}{path}", timeout=10)
            elif method == "POST":
                r = requests.post(f"{BASE_URL}{path}", json=body, timeout=10)
            elif method == "PUT":
                r = requests.put(f"{BASE_URL}{path}", json=body, timeout=10)
            elif method == "DELETE":
                r = requests.delete(f"{BASE_URL}{path}", timeout=10)
            
            data = r.json()
            passed = (
                r.status_code == 401 and
                data.get("error") == "Unauthorized"
            )
            results.append(passed)
            
            print_test(
                f"{method} {path}",
                passed,
                f"Status: {r.status_code}, Response: {json.dumps(data)}"
            )
        except Exception as e:
            results.append(False)
            print_test(f"{method} {path}", False, f"Error: {str(e)}")
    
    return all(results)

def test_ai_ats():
    """Test POST /api/ai/ats (public)"""
    print("=" * 60)
    print("TEST 6: AI /api/ai/ats (public)")
    print("=" * 60)
    
    results = []
    
    # Test 1: Valid request
    try:
        payload = {
            "resume": "Senior React developer with 5 years experience building web apps in TypeScript, Node.js, and MongoDB. Led 3-person frontend team at TechCorp. Built scalable e-commerce platform serving 100k users. Expert in React, Redux, Next.js, GraphQL, REST APIs, AWS, Docker, CI/CD.",
            "jobDescription": "We need a Staff React engineer familiar with GraphQL and AWS. Must have 5+ years experience with modern frontend frameworks and cloud infrastructure."
        }
        r = requests.post(f"{BASE_URL}/ai/ats", json=payload, timeout=60)
        data = r.json()
        
        # Check response structure
        required_fields = ["atsScore", "summary", "strengths", "weaknesses", "matchedKeywords", "missingKeywords", "recommendations"]
        has_fields = all(field in data for field in required_fields)
        
        # Check types
        score_valid = isinstance(data.get("atsScore"), (int, float)) and 0 <= data.get("atsScore", -1) <= 100
        arrays_valid = all(isinstance(data.get(field), list) for field in ["strengths", "weaknesses", "matchedKeywords", "missingKeywords", "recommendations"])
        
        passed = (
            r.status_code == 200 and
            has_fields and
            score_valid and
            arrays_valid
        )
        results.append(passed)
        
        print_test(
            "Valid ATS request",
            passed,
            f"Status: {r.status_code}, Score: {data.get('atsScore')}, Fields: {list(data.keys())}"
        )
    except Exception as e:
        results.append(False)
        print_test("Valid ATS request", False, f"Error: {str(e)}")
    
    # Test 2: Short resume (< 30 chars) -> 400
    try:
        payload = {
            "resume": "Too short",
            "jobDescription": "Test job"
        }
        r = requests.post(f"{BASE_URL}/ai/ats", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 400 and
            "error" in data
        )
        results.append(passed)
        
        print_test(
            "Short resume (< 30 chars)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("Short resume", False, f"Error: {str(e)}")
    
    return all(results)

def test_ai_tailor():
    """Test POST /api/ai/tailor (public)"""
    print("=" * 60)
    print("TEST 7: AI /api/ai/tailor (public)")
    print("=" * 60)
    
    try:
        payload = {
            "resume": "Senior React developer with 5 years experience building web apps in TypeScript, Node.js, and MongoDB. Led 3-person frontend team at TechCorp. Built scalable e-commerce platform serving 100k users.",
            "jobDescription": "We need a Staff React engineer familiar with GraphQL and AWS."
        }
        r = requests.post(f"{BASE_URL}/ai/tailor", json=payload, timeout=60)
        data = r.json()
        
        # Check response structure
        required_fields = ["tailoredResume", "summaryLine", "topBullets", "keywordsAdded", "changesExplained"]
        has_fields = all(field in data for field in required_fields)
        
        # Check types
        strings_valid = isinstance(data.get("tailoredResume"), str) and isinstance(data.get("summaryLine"), str)
        arrays_valid = all(isinstance(data.get(field), list) for field in ["topBullets", "keywordsAdded", "changesExplained"])
        
        passed = (
            r.status_code == 200 and
            has_fields and
            strings_valid and
            arrays_valid
        )
        
        print_test(
            "POST /api/ai/tailor",
            passed,
            f"Status: {r.status_code}, Fields: {list(data.keys())}"
        )
        return passed
    except Exception as e:
        print_test("POST /api/ai/tailor", False, f"Error: {str(e)}")
        return False

def test_ai_chat():
    """Test POST /api/ai/chat (public, session-based, multi-turn)"""
    print("=" * 60)
    print("TEST 8: AI /api/ai/chat (public, session-based)")
    print("=" * 60)
    
    results = []
    session_id = "test-abc-123"
    
    # Test 1: First message
    try:
        payload = {
            "sessionId": session_id,
            "message": "I'm a React dev wanting to move to Rust in 6 months."
        }
        r = requests.post(f"{BASE_URL}/ai/chat", json=payload, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("sessionId") == session_id and
            isinstance(data.get("answer"), str) and
            len(data.get("answer", "")) > 0
        )
        results.append(passed)
        
        print_test(
            "First chat message",
            passed,
            f"Status: {r.status_code}, SessionId: {data.get('sessionId')}, Answer length: {len(data.get('answer', ''))}"
        )
    except Exception as e:
        results.append(False)
        print_test("First chat message", False, f"Error: {str(e)}")
    
    # Test 2: Second message (should have context from first)
    try:
        payload = {
            "sessionId": session_id,
            "message": "What was I asking about again?"
        }
        r = requests.post(f"{BASE_URL}/ai/chat", json=payload, timeout=60)
        data = r.json()
        
        answer = data.get("answer", "").lower()
        has_context = "rust" in answer or "react" in answer
        
        passed = (
            r.status_code == 200 and
            data.get("sessionId") == session_id and
            isinstance(data.get("answer"), str) and
            len(data.get("answer", "")) > 0 and
            has_context
        )
        results.append(passed)
        
        print_test(
            "Second chat message (context check)",
            passed,
            f"Status: {r.status_code}, Has context (Rust/React): {has_context}, Answer: {data.get('answer', '')[:100]}..."
        )
    except Exception as e:
        results.append(False)
        print_test("Second chat message", False, f"Error: {str(e)}")
    
    # Test 3: Empty message -> 400
    try:
        payload = {
            "sessionId": session_id,
            "message": ""
        }
        r = requests.post(f"{BASE_URL}/ai/chat", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 400 and
            "error" in data
        )
        results.append(passed)
        
        print_test(
            "Empty message",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("Empty message", False, f"Error: {str(e)}")
    
    # Test 4: Verify MongoDB has the conversation
    try:
        from pymongo import MongoClient
        client = MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        chat = db["career_chats"].find_one({"sessionId": session_id})
        
        if chat:
            messages = chat.get("messages", [])
            # Should have 4 messages: 2 user + 2 assistant
            passed = len(messages) >= 4
            print_test(
                "MongoDB conversation persistence",
                passed,
                f"Messages in DB: {len(messages)} (expected >= 4)"
            )
            results.append(passed)
        else:
            print_test("MongoDB conversation persistence", False, "No chat found in DB")
            results.append(False)
    except Exception as e:
        print_test("MongoDB conversation persistence", False, f"Error: {str(e)}")
        results.append(False)
    
    return all(results)

def test_waitlist():
    """Test POST /api/waitlist"""
    print("=" * 60)
    print("TEST 9: Waitlist /api/waitlist")
    print("=" * 60)
    
    results = []
    
    # Test 1: Valid email
    try:
        payload = {"email": "test@test.com"}
        r = requests.post(f"{BASE_URL}/waitlist", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") is True
        )
        results.append(passed)
        
        print_test(
            "Valid email",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("Valid email", False, f"Error: {str(e)}")
    
    # Test 2: Invalid email
    try:
        payload = {"email": "notanemail"}
        r = requests.post(f"{BASE_URL}/waitlist", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 400 and
            data.get("error") == "Invalid email"
        )
        results.append(passed)
        
        print_test(
            "Invalid email",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("Invalid email", False, f"Error: {str(e)}")
    
    # Test 3: Same email twice (upsert)
    try:
        payload = {"email": "test@test.com"}
        r = requests.post(f"{BASE_URL}/waitlist", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") is True
        )
        results.append(passed)
        
        print_test(
            "Same email twice (upsert)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("Same email twice", False, f"Error: {str(e)}")
    
    return all(results)

def main():
    print("\n" + "=" * 60)
    print("VEYRA AI BACKEND API TEST SUITE")
    print("Testing at: " + BASE_URL)
    print("=" * 60 + "\n")
    
    results = {}
    
    # Run all tests
    results["Root endpoint"] = test_root()
    results["Google OAuth start"] = test_google_oauth_start()
    results["Google OAuth callback errors"] = test_google_oauth_callback_errors()
    results["GET /api/me (unauthenticated)"] = test_me_unauthenticated()
    results["Protected endpoints"] = test_protected_endpoints()
    results["AI ATS"] = test_ai_ats()
    results["AI Tailor"] = test_ai_tailor()
    results["AI Chat"] = test_ai_chat()
    results["Waitlist"] = test_waitlist()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("\n" + "=" * 60)
    print(f"TOTAL: {passed}/{total} tests passed")
    print("=" * 60 + "\n")
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
