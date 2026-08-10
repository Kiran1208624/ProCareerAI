#!/usr/bin/env python3
"""
OOM Fix Verification Test Suite
Tests server stability after bumping --max-old-space-size from 512 to 2048
Focus: Server stability, public endpoints regression, protected endpoints 401, new endpoints
"""

import requests
import json
import sys
import pymongo
import uuid
import datetime
import time
from urllib.parse import urlparse, parse_qs

# Use public URL from .env
BASE_URL = "https://pro-career-ai.preview.emergentagent.com/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def check_server_logs_for_oom():
    """Check if server restarted due to OOM during tests"""
    print("=" * 80)
    print("CHECKING SERVER LOGS FOR OOM RESTARTS")
    print("=" * 80)
    try:
        with open('/var/log/supervisor/nextjs.out.log', 'r') as f:
            lines = f.readlines()
            # Get last 100 lines
            recent_lines = lines[-100:]
            oom_warnings = [line for line in recent_lines if 'approaching the used memory threshold' in line.lower() or 'restarting' in line.lower()]
            
            if oom_warnings:
                print("⚠️  WARNING: Found OOM-related messages in logs:")
                for line in oom_warnings[-5:]:  # Show last 5
                    print(f"   {line.strip()}")
                return False
            else:
                print("✅ No OOM warnings found in recent logs")
                return True
    except Exception as e:
        print(f"❌ Error reading logs: {e}")
        return False
    print()

# ============ PUBLIC ENDPOINTS REGRESSION ============

def test_root():
    """Test GET /api/ returns 200 with {message, model}"""
    print("=" * 80)
    print("TEST 1: Root API endpoint (regression)")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/", timeout=10, allow_redirects=True)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "message" in data and
            "model" in data
        )
        
        print_test(
            "GET /api/",
            passed,
            f"Status: {r.status_code}, Message: {data.get('message')}, Model: {data.get('model')}"
        )
        return passed
    except Exception as e:
        print_test("GET /api/", False, f"Error: {str(e)}")
        return False

def test_me_unauthenticated():
    """Test GET /api/me without cookie returns {user: null}"""
    print("=" * 80)
    print("TEST 2: GET /api/me (unauthenticated) - regression")
    print("=" * 80)
    try:
        r = requests.get(f"{BASE_URL}/me", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("user") is None
        )
        
        print_test(
            "GET /api/me (no cookie)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
        return passed
    except Exception as e:
        print_test("GET /api/me (no cookie)", False, f"Error: {str(e)}")
        return False

def test_waitlist():
    """Test POST /api/waitlist with valid email"""
    print("=" * 80)
    print("TEST 3: POST /api/waitlist - regression")
    print("=" * 80)
    try:
        email = f"test-{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{BASE_URL}/waitlist", json={"email": email}, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("ok") is True
        )
        
        print_test(
            "POST /api/waitlist",
            passed,
            f"Status: {r.status_code}, Email: {email}, Response: {json.dumps(data)}"
        )
        return passed
    except Exception as e:
        print_test("POST /api/waitlist", False, f"Error: {str(e)}")
        return False

def test_ai_ats():
    """Test POST /api/ai/ats with real resume and JD"""
    print("=" * 80)
    print("TEST 4: POST /api/ai/ats - regression")
    print("=" * 80)
    try:
        resume = """
        Sarah Chen
        Senior Software Engineer
        
        EXPERIENCE
        Tech Corp - Senior Software Engineer (2020-Present)
        - Led development of microservices architecture serving 10M+ users
        - Implemented CI/CD pipelines reducing deployment time by 60%
        - Mentored team of 5 junior engineers
        
        SKILLS
        Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes
        """
        
        jd = """
        We're looking for a Senior Software Engineer with 5+ years experience.
        Must have: Python, React, AWS, Docker
        Nice to have: Kubernetes, CI/CD experience
        """
        
        r = requests.post(
            f"{BASE_URL}/ai/ats",
            json={"resume": resume, "jobDescription": jd},
            timeout=60
        )
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "atsScore" in data and
            "summary" in data and
            isinstance(data.get("strengths"), list) and
            isinstance(data.get("weaknesses"), list) and
            isinstance(data.get("matchedKeywords"), list) and
            isinstance(data.get("missingKeywords"), list) and
            isinstance(data.get("recommendations"), list)
        )
        
        print_test(
            "POST /api/ai/ats",
            passed,
            f"Status: {r.status_code}, ATS Score: {data.get('atsScore')}/100, Summary length: {len(data.get('summary', ''))}"
        )
        return passed
    except Exception as e:
        print_test("POST /api/ai/ats", False, f"Error: {str(e)}")
        return False

# ============ PROTECTED ENDPOINTS 401 CHECKS ============

def test_protected_endpoints_401():
    """Test that protected endpoints return 401 without authentication"""
    print("=" * 80)
    print("TEST 5: Protected endpoints return 401 (regression + new)")
    print("=" * 80)
    
    endpoints = [
        ("GET", "/jobs"),
        ("GET", "/notifications"),
        ("GET", "/interviews"),
        ("GET", "/cover-letters"),
        ("GET", "/career-dna"),
        ("GET", "/memories"),
        ("GET", "/analytics"),  # NEW
        ("GET", "/resume-versions"),  # NEW
    ]
    
    all_passed = True
    for method, path in endpoints:
        try:
            if method == "GET":
                r = requests.get(f"{BASE_URL}{path}", timeout=10)
            else:
                r = requests.request(method, f"{BASE_URL}{path}", timeout=10)
            
            passed = r.status_code == 401
            if not passed:
                all_passed = False
            
            print_test(
                f"{method} {path}",
                passed,
                f"Status: {r.status_code} (expected 401)"
            )
        except Exception as e:
            print_test(f"{method} {path}", False, f"Error: {str(e)}")
            all_passed = False
    
    return all_passed

# ============ NEW ENDPOINTS WITH MOCKED SESSION ============

def create_test_user_and_session():
    """Create a test user and session in MongoDB"""
    print("=" * 80)
    print("SETUP: Creating test user and session")
    print("=" * 80)
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        
        # Create test user
        uid = str(uuid.uuid4())
        user_doc = {
            "id": uid,
            "googleId": f"test-{uid}",
            "email": "sarah.chen@example.com",
            "name": "Sarah Chen",
            "headline": "Senior Software Engineer",
            "targetRole": "Staff Engineer",
            "yearsExperience": 5,
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow()
        }
        db.users.insert_one(user_doc)
        
        # Create session
        token = str(uuid.uuid4()) + "." + str(uuid.uuid4())
        session_doc = {
            "token": token,
            "userId": uid,
            "createdAt": datetime.datetime.utcnow(),
            "expiresAt": datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }
        db.sessions.insert_one(session_doc)
        
        print(f"✅ Created test user: {uid}")
        print(f"✅ Created session token: {token[:20]}...")
        print()
        
        return uid, token
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        return None, None

def cleanup_test_user(uid):
    """Clean up test user and related data"""
    print("=" * 80)
    print("CLEANUP: Removing test user and data")
    print("=" * 80)
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        
        db.users.delete_many({"id": uid})
        db.sessions.delete_many({"userId": uid})
        db.resume_versions.delete_many({"userId": uid})
        db.jobs.delete_many({"userId": uid})
        
        print(f"✅ Cleaned up test user: {uid}")
        print()
    except Exception as e:
        print(f"❌ Error cleaning up: {e}")

def test_resume_versions_crud(uid, token):
    """Test Resume Versions CRUD operations"""
    print("=" * 80)
    print("TEST 6: Resume Versions CRUD (NEW)")
    print("=" * 80)
    
    cookies = {"veyra_session": token}
    all_passed = True
    resume_id = None
    
    # Test 1: POST /api/resume-versions
    try:
        payload = {
            "name": "Google Resume",
            "template": "modern",
            "sections": {
                "name": "Sarah Chen",
                "headline": "Senior Software Engineer"
            },
            "content": "Full resume content here..."
        }
        r = requests.post(f"{BASE_URL}/resume-versions", json=payload, cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "id" in data and
            data.get("name") == "Google Resume" and
            data.get("template") == "modern"
        )
        
        if passed:
            resume_id = data.get("id")
        
        all_passed = all_passed and passed
        print_test(
            "POST /api/resume-versions",
            passed,
            f"Status: {r.status_code}, ID: {data.get('id', 'N/A')}, Name: {data.get('name')}"
        )
    except Exception as e:
        print_test("POST /api/resume-versions", False, f"Error: {str(e)}")
        all_passed = False
    
    # Test 2: GET /api/resume-versions
    try:
        r = requests.get(f"{BASE_URL}/resume-versions", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            isinstance(data, list) and
            len(data) > 0 and
            any(item.get("name") == "Google Resume" for item in data)
        )
        
        all_passed = all_passed and passed
        print_test(
            "GET /api/resume-versions",
            passed,
            f"Status: {r.status_code}, Count: {len(data)}, Contains 'Google Resume': {passed}"
        )
    except Exception as e:
        print_test("GET /api/resume-versions", False, f"Error: {str(e)}")
        all_passed = False
    
    # Test 3: PUT /api/resume-versions/{id}
    if resume_id:
        try:
            payload = {"name": "Google Resume v2"}
            r = requests.put(f"{BASE_URL}/resume-versions/{resume_id}", json=payload, cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("name") == "Google Resume v2"
            )
            
            all_passed = all_passed and passed
            print_test(
                f"PUT /api/resume-versions/{resume_id}",
                passed,
                f"Status: {r.status_code}, Updated name: {data.get('name')}"
            )
        except Exception as e:
            print_test(f"PUT /api/resume-versions/{resume_id}", False, f"Error: {str(e)}")
            all_passed = False
    
    # Test 4: DELETE /api/resume-versions/{id}
    if resume_id:
        try:
            r = requests.delete(f"{BASE_URL}/resume-versions/{resume_id}", cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("ok") is True
            )
            
            all_passed = all_passed and passed
            print_test(
                f"DELETE /api/resume-versions/{resume_id}",
                passed,
                f"Status: {r.status_code}, Response: {json.dumps(data)}"
            )
        except Exception as e:
            print_test(f"DELETE /api/resume-versions/{resume_id}", False, f"Error: {str(e)}")
            all_passed = False
    
    return all_passed

def test_analytics(uid, token):
    """Test Analytics endpoint with real job data"""
    print("=" * 80)
    print("TEST 7: Analytics (NEW)")
    print("=" * 80)
    
    cookies = {"veyra_session": token}
    
    # First, create some test jobs
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        
        now = datetime.datetime.utcnow()
        jobs = [
            {
                "id": str(uuid.uuid4()),
                "userId": uid,
                "company": "Google",
                "role": "Senior Engineer",
                "status": "applied",
                "matchScore": 85,
                "appliedAt": now - datetime.timedelta(days=3),
                "createdAt": now - datetime.timedelta(days=3),
                "updatedAt": now - datetime.timedelta(days=3)
            },
            {
                "id": str(uuid.uuid4()),
                "userId": uid,
                "company": "Meta",
                "role": "Staff Engineer",
                "status": "interview",
                "matchScore": 90,
                "appliedAt": now - datetime.timedelta(days=7),
                "createdAt": now - datetime.timedelta(days=7),
                "updatedAt": now - datetime.timedelta(days=7)
            },
            {
                "id": str(uuid.uuid4()),
                "userId": uid,
                "company": "Amazon",
                "role": "Principal Engineer",
                "status": "offer",
                "matchScore": 95,
                "appliedAt": now - datetime.timedelta(days=14),
                "createdAt": now - datetime.timedelta(days=14),
                "updatedAt": now - datetime.timedelta(days=14)
            }
        ]
        
        db.jobs.insert_many(jobs)
        print(f"✅ Created 3 test jobs for analytics")
        print()
    except Exception as e:
        print(f"❌ Error creating test jobs: {e}")
        return False
    
    # Test GET /api/analytics
    try:
        r = requests.get(f"{BASE_URL}/analytics", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "totals" in data and
            "pipeline" in data and
            "weekly" in data and
            "interviewRate" in data and
            "offerRate" in data and
            isinstance(data.get("totals"), dict) and
            isinstance(data.get("pipeline"), list) and
            isinstance(data.get("weekly"), list) and
            len(data.get("weekly", [])) == 8 and
            data["totals"].get("jobs") >= 3 and
            data["totals"].get("applied") >= 3
        )
        
        print_test(
            "GET /api/analytics",
            passed,
            f"Status: {r.status_code}\n" +
            f"   Totals: jobs={data.get('totals', {}).get('jobs')}, applied={data.get('totals', {}).get('applied')}, " +
            f"interviews={data.get('totals', {}).get('interviews')}, offers={data.get('totals', {}).get('offers')}\n" +
            f"   Pipeline stages: {len(data.get('pipeline', []))}\n" +
            f"   Weekly data points: {len(data.get('weekly', []))}\n" +
            f"   Interview rate: {data.get('interviewRate')}%, Offer rate: {data.get('offerRate')}%\n" +
            f"   Avg match score: {data.get('avgMatch')}"
        )
        return passed
    except Exception as e:
        print_test("GET /api/analytics", False, f"Error: {str(e)}")
        return False

# ============ MAIN TEST RUNNER ============

def main():
    print("\n" + "=" * 80)
    print("OOM FIX VERIFICATION TEST SUITE")
    print("Testing server stability after --max-old-space-size bump to 2048")
    print("=" * 80 + "\n")
    
    results = {}
    
    # Check initial server state
    print("INITIAL SERVER STATE CHECK")
    print("=" * 80)
    initial_oom_check = check_server_logs_for_oom()
    print()
    
    # Run public endpoint regression tests
    results["root"] = test_root()
    results["me_unauth"] = test_me_unauthenticated()
    results["waitlist"] = test_waitlist()
    results["ai_ats"] = test_ai_ats()
    
    # Test protected endpoints return 401
    results["protected_401"] = test_protected_endpoints_401()
    
    # Create test user and session for authenticated tests
    uid, token = create_test_user_and_session()
    
    if uid and token:
        # Test new endpoints
        results["resume_versions"] = test_resume_versions_crud(uid, token)
        results["analytics"] = test_analytics(uid, token)
        
        # Cleanup
        cleanup_test_user(uid)
    else:
        print("❌ Failed to create test user, skipping authenticated tests")
        results["resume_versions"] = False
        results["analytics"] = False
    
    # Final server stability check
    print("\n" + "=" * 80)
    print("FINAL SERVER STATE CHECK")
    print("=" * 80)
    final_oom_check = check_server_logs_for_oom()
    results["server_stability"] = initial_oom_check and final_oom_check
    print()
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nPassed: {passed}/{total}")
    print("\nDetailed Results:")
    print(f"  {'✅' if results.get('server_stability') else '❌'} Server Stability (No OOM restarts)")
    print(f"  {'✅' if results.get('root') else '❌'} GET /api/ (regression)")
    print(f"  {'✅' if results.get('me_unauth') else '❌'} GET /api/me unauthenticated (regression)")
    print(f"  {'✅' if results.get('waitlist') else '❌'} POST /api/waitlist (regression)")
    print(f"  {'✅' if results.get('ai_ats') else '❌'} POST /api/ai/ats (regression)")
    print(f"  {'✅' if results.get('protected_401') else '❌'} Protected endpoints 401 (regression + new)")
    print(f"  {'✅' if results.get('resume_versions') else '❌'} Resume Versions CRUD (NEW)")
    print(f"  {'✅' if results.get('analytics') else '❌'} Analytics (NEW)")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! OOM fix verified successfully.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
