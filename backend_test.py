#!/usr/bin/env python3
"""
Round 3 Backend Testing - Veyra AI
Tests new endpoints: Extended profile, Candidate Discovery, Coding Interview, Daily Briefing
"""

import pymongo
import uuid
import datetime
import requests
import json
import time

# Configuration
BASE_URL = "https://pro-career-ai.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "veyra_ai"

# MongoDB connection
client = pymongo.MongoClient(MONGO_URL)
db = client[DB_NAME]

def make_session(role=None, discoverable=False, orgName=None, name="Test User", location="", headline=""):
    """Create a test user with session token"""
    uid = str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    doc = {
        "id": uid,
        "googleId": "g-" + uid,
        "email": f"{uid[:8]}@test.com",
        "name": name,
        "headline": headline or "Senior Engineer",
        "targetRole": "Staff Engineer",
        "yearsExperience": 5,
        "location": location,
        "createdAt": now,
        "updatedAt": now,
        "discoverable": discoverable
    }
    if role:
        doc["role"] = role
    if orgName:
        doc["orgName"] = orgName
    
    db.users.insert_one(doc)
    
    token = str(uuid.uuid4()) + "." + str(uuid.uuid4())
    db.sessions.insert_one({
        "token": token,
        "userId": uid,
        "createdAt": now,
        "expiresAt": now + datetime.timedelta(days=30)
    })
    
    return uid, token

def cleanup_test_users(user_ids):
    """Clean up test data"""
    for uid in user_ids:
        db.users.delete_many({"id": uid})
        db.sessions.delete_many({"userId": uid})
        db.skills.delete_many({"userId": uid})
        db.projects.delete_many({"userId": uid})
        db.jobs.delete_many({"userId": uid})
        db.coding_attempts.delete_many({"userId": uid})

print("=" * 80)
print("ROUND 3: BACKEND TESTING - VEYRA AI")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
print()

test_users = []
all_passed = True

try:
    # ============================================================================
    # TEST 1: Extended Profile PUT
    # ============================================================================
    print("TEST 1: Extended Profile PUT with new fields")
    print("-" * 80)
    
    try:
        uid1, token1 = make_session(name="John Doe")
        test_users.append(uid1)
        
        # PUT /api/profile with new fields
        response = requests.put(
            f"{BASE_URL}/profile",
            json={
                "role": "recruiter",
                "discoverable": True,
                "orgName": "Google",
                "orgType": "company"
            },
            cookies={"veyra_session": token1},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            if (user.get("role") == "recruiter" and 
                user.get("discoverable") == True and 
                user.get("orgName") == "Google" and 
                user.get("orgType") == "company"):
                print("✅ PASS: Profile updated with new fields")
                
                # Verify with GET /api/me
                me_response = requests.get(
                    f"{BASE_URL}/me",
                    cookies={"veyra_session": token1},
                    timeout=30
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    me_user = me_data.get("user", {})
                    
                    if (me_user.get("role") == "recruiter" and 
                        me_user.get("discoverable") == True and 
                        me_user.get("orgName") == "Google"):
                        print("✅ PASS: GET /api/me reflects profile changes")
                    else:
                        print(f"❌ FAIL: GET /api/me doesn't reflect changes: {me_user}")
                        all_passed = False
                else:
                    print(f"❌ FAIL: GET /api/me returned {me_response.status_code}")
                    all_passed = False
            else:
                print(f"❌ FAIL: Profile fields not updated correctly: {user}")
                all_passed = False
        else:
            print(f"❌ FAIL: PUT /api/profile returned {response.status_code}: {response.text}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 1: {str(e)}")
        all_passed = False
    
    print()
    
    # ============================================================================
    # TEST 2: Candidate Discovery - Role Guarding
    # ============================================================================
    print("TEST 2: Candidate Discovery - Role Guarding")
    print("-" * 80)
    
    try:
        # Test 2a: Unauthenticated request should return 401
        response = requests.get(f"{BASE_URL}/candidates", timeout=30)
        if response.status_code == 401:
            print("✅ PASS: Unauthenticated request returns 401")
        else:
            print(f"❌ FAIL: Unauthenticated request returned {response.status_code}, expected 401")
            all_passed = False
        
        # Test 2b: Student role should return 403
        uid_student, token_student = make_session(role="student", name="Student User")
        test_users.append(uid_student)
        
        response = requests.get(
            f"{BASE_URL}/candidates",
            cookies={"veyra_session": token_student},
            timeout=30
        )
        
        if response.status_code == 403:
            data = response.json()
            error_msg = data.get("error", "").lower()
            if "recruiter" in error_msg or "company" in error_msg or "college" in error_msg:
                print("✅ PASS: Student role returns 403 with appropriate error message")
            else:
                print(f"⚠️  PASS: Student role returns 403 but error message unclear: {data.get('error')}")
        else:
            print(f"❌ FAIL: Student role returned {response.status_code}, expected 403")
            all_passed = False
        
        # Test 2c: Recruiter role should return 200 with empty list initially
        uid_recruiter, token_recruiter = make_session(role="recruiter", name="Recruiter User")
        test_users.append(uid_recruiter)
        
        response = requests.get(
            f"{BASE_URL}/candidates",
            cookies={"veyra_session": token_recruiter},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "candidates" in data and "total" in data:
                print(f"✅ PASS: Recruiter role returns 200 with candidates list (count: {data['total']})")
            else:
                print(f"❌ FAIL: Response missing 'candidates' or 'total' keys: {data}")
                all_passed = False
        else:
            print(f"❌ FAIL: Recruiter role returned {response.status_code}: {response.text}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 2: {str(e)}")
        all_passed = False
    
    print()
    
    # ============================================================================
    # TEST 3: Candidate Discovery - Search & View
    # ============================================================================
    print("TEST 3: Candidate Discovery - Search & View")
    print("-" * 80)
    
    try:
        # Create User A (Alice) - discoverable with skills
        uid_alice, token_alice = make_session(
            discoverable=True,
            name="Alice Johnson",
            headline="Senior Frontend Engineer",
            location="Berlin"
        )
        test_users.append(uid_alice)
        
        # Add React skill to Alice
        skill_response = requests.post(
            f"{BASE_URL}/skills",
            json={"name": "React", "level": "expert"},
            cookies={"veyra_session": token_alice},
            timeout=30
        )
        
        if skill_response.status_code != 200:
            print(f"⚠️  Warning: Failed to add skill to Alice: {skill_response.status_code}")
        
        # Create User B (Recruiter) for searching
        uid_recruiter2, token_recruiter2 = make_session(role="recruiter", name="Bob Recruiter")
        test_users.append(uid_recruiter2)
        
        # Test 3a: GET /api/candidates should list Alice
        response = requests.get(
            f"{BASE_URL}/candidates",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            alice_found = any(c.get("name") == "Alice Johnson" for c in candidates)
            
            if alice_found:
                alice = next(c for c in candidates if c.get("name") == "Alice Johnson")
                if "React" in alice.get("skills", []):
                    print("✅ PASS: Alice found in candidates list with React skill")
                else:
                    print(f"⚠️  PASS: Alice found but skills missing: {alice.get('skills')}")
            else:
                print(f"❌ FAIL: Alice not found in candidates list. Found {len(candidates)} candidates")
                all_passed = False
        else:
            print(f"❌ FAIL: GET /api/candidates returned {response.status_code}")
            all_passed = False
        
        # Test 3b: Search by name (q=alice)
        response = requests.get(
            f"{BASE_URL}/candidates?q=alice",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            alice_found = any(c.get("name") == "Alice Johnson" for c in candidates)
            
            if alice_found:
                print("✅ PASS: Search by name (q=alice) returns Alice")
            else:
                print(f"❌ FAIL: Search by name didn't find Alice. Found {len(candidates)} candidates")
                all_passed = False
        else:
            print(f"❌ FAIL: Search by name returned {response.status_code}")
            all_passed = False
        
        # Test 3c: Search with no results (q=zzznoresult)
        response = requests.get(
            f"{BASE_URL}/candidates?q=zzznoresult",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            
            if len(candidates) == 0:
                print("✅ PASS: Search with no results returns empty list")
            else:
                print(f"❌ FAIL: Search with no results returned {len(candidates)} candidates")
                all_passed = False
        else:
            print(f"❌ FAIL: Search with no results returned {response.status_code}")
            all_passed = False
        
        # Test 3d: Filter by skill (skill=react)
        response = requests.get(
            f"{BASE_URL}/candidates?skill=react",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            alice_found = any(c.get("name") == "Alice Johnson" for c in candidates)
            
            if alice_found:
                print("✅ PASS: Filter by skill (skill=react) returns Alice")
            else:
                print(f"❌ FAIL: Filter by skill didn't find Alice. Found {len(candidates)} candidates")
                all_passed = False
        else:
            print(f"❌ FAIL: Filter by skill returned {response.status_code}")
            all_passed = False
        
        # Test 3e: GET /api/candidates/{alice_id} - detailed view
        response = requests.get(
            f"{BASE_URL}/candidates/{uid_alice}",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidate = data.get("candidate", {})
            
            if (candidate.get("name") == "Alice Johnson" and 
                "skills" in candidate and 
                "projects" in candidate):
                print("✅ PASS: GET /api/candidates/{id} returns detailed candidate profile")
            else:
                print(f"❌ FAIL: Detailed candidate view missing fields: {candidate.keys()}")
                all_passed = False
        else:
            print(f"❌ FAIL: GET /api/candidates/{{id}} returned {response.status_code}")
            all_passed = False
        
        # Test 3f: GET /api/candidates/{random-uuid} should return 404
        random_uuid = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/candidates/{random_uuid}",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 404:
            print("✅ PASS: GET /api/candidates/{invalid-id} returns 404")
        else:
            print(f"❌ FAIL: GET /api/candidates/{{invalid-id}} returned {response.status_code}, expected 404")
            all_passed = False
        
        # Test 3g: Verify recruiter is NOT in their own candidate list
        response = requests.get(
            f"{BASE_URL}/candidates",
            cookies={"veyra_session": token_recruiter2},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            recruiter_in_list = any(c.get("id") == uid_recruiter2 for c in candidates)
            
            if not recruiter_in_list:
                print("✅ PASS: Recruiter is NOT in their own candidate list")
            else:
                print(f"❌ FAIL: Recruiter found in their own candidate list")
                all_passed = False
        else:
            print(f"❌ FAIL: Final candidate list check returned {response.status_code}")
            all_passed = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 3: {str(e)}")
        all_passed = False
    
    print()
    
    # ============================================================================
    # TEST 4: Coding Interview
    # ============================================================================
    print("TEST 4: Coding Interview")
    print("-" * 80)
    
    try:
        # Create a test user for coding interview
        uid_coder, token_coder = make_session(name="Coder User")
        test_users.append(uid_coder)
        
        # Test 4a: POST /api/ai/coding-challenge
        print("Generating coding challenge (may take 10-60s)...")
        challenge_response = requests.post(
            f"{BASE_URL}/ai/coding-challenge",
            json={
                "topic": "arrays",
                "difficulty": "easy",
                "language": "Python"
            },
            cookies={"veyra_session": token_coder},
            timeout=60
        )
        
        if challenge_response.status_code == 200:
            challenge_data = challenge_response.json()
            required_keys = ["title", "difficulty", "prompt", "constraints", "examples", "hints", "starterCode"]
            missing_keys = [k for k in required_keys if k not in challenge_data]
            
            if not missing_keys:
                # Validate examples structure
                examples = challenge_data.get("examples", [])
                if len(examples) >= 2:
                    example = examples[0]
                    if "input" in example and "output" in example and "explanation" in example:
                        print(f"✅ PASS: Coding challenge generated with all required fields")
                        print(f"   Title: {challenge_data.get('title', '')[:50]}...")
                        print(f"   Examples: {len(examples)}, Hints: {len(challenge_data.get('hints', []))}")
                    else:
                        print(f"❌ FAIL: Example structure invalid: {example.keys()}")
                        all_passed = False
                else:
                    print(f"❌ FAIL: Expected 2+ examples, got {len(examples)}")
                    all_passed = False
            else:
                print(f"❌ FAIL: Missing keys in challenge response: {missing_keys}")
                all_passed = False
            
            # Test 4b: POST /api/ai/coding-grade
            print("Grading coding solution (may take 10-60s)...")
            grade_response = requests.post(
                f"{BASE_URL}/ai/coding-grade",
                json={
                    "problem": challenge_data.get("prompt", "Sum two numbers"),
                    "code": "def sum_two(a, b):\n    return a + b",
                    "language": "Python"
                },
                cookies={"veyra_session": token_coder},
                timeout=60
            )
            
            if grade_response.status_code == 200:
                grade_data = grade_response.json()
                required_keys = ["overallScore", "correctness", "complexity", "codeQuality", 
                               "edgeCases", "strengths", "improvements", "verdict", "improvedSolution"]
                missing_keys = [k for k in required_keys if k not in grade_data]
                
                if not missing_keys:
                    # Validate complexity structure
                    complexity = grade_data.get("complexity", {})
                    if "time" in complexity and "space" in complexity:
                        # Validate arrays
                        strengths = grade_data.get("strengths", [])
                        improvements = grade_data.get("improvements", [])
                        edge_cases = grade_data.get("edgeCases", [])
                        
                        if len(strengths) >= 3 and len(improvements) >= 3:
                            print(f"✅ PASS: Coding solution graded with all required fields")
                            print(f"   Overall Score: {grade_data.get('overallScore')}/100")
                            print(f"   Correctness: {grade_data.get('correctness')}/100")
                            print(f"   Complexity: Time={complexity.get('time')}, Space={complexity.get('space')}")
                            
                            # Verify doc was inserted into coding_attempts
                            attempt_count = db.coding_attempts.count_documents({"userId": uid_coder})
                            if attempt_count > 0:
                                print(f"✅ PASS: Coding attempt saved to database (count: {attempt_count})")
                            else:
                                print(f"❌ FAIL: Coding attempt not saved to database")
                                all_passed = False
                        else:
                            print(f"❌ FAIL: Insufficient strengths ({len(strengths)}) or improvements ({len(improvements)})")
                            all_passed = False
                    else:
                        print(f"❌ FAIL: Complexity missing time/space: {complexity}")
                        all_passed = False
                else:
                    print(f"❌ FAIL: Missing keys in grade response: {missing_keys}")
                    all_passed = False
            else:
                print(f"❌ FAIL: POST /api/ai/coding-grade returned {grade_response.status_code}: {grade_response.text}")
                all_passed = False
        else:
            print(f"❌ FAIL: POST /api/ai/coding-challenge returned {challenge_response.status_code}: {challenge_response.text}")
            all_passed = False
        
        # Test 4c: Unauthenticated requests should return 401
        unauth_challenge = requests.post(
            f"{BASE_URL}/ai/coding-challenge",
            json={"topic": "arrays", "difficulty": "easy", "language": "Python"},
            timeout=30
        )
        
        unauth_grade = requests.post(
            f"{BASE_URL}/ai/coding-grade",
            json={"problem": "test", "code": "test", "language": "Python"},
            timeout=30
        )
        
        if unauth_challenge.status_code == 401 and unauth_grade.status_code == 401:
            print("✅ PASS: Both coding endpoints return 401 when unauthenticated")
        else:
            print(f"❌ FAIL: Unauthenticated requests returned {unauth_challenge.status_code}, {unauth_grade.status_code} (expected 401, 401)")
            all_passed = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 4: {str(e)}")
        all_passed = False
    
    print()
    
    # ============================================================================
    # TEST 5: Daily Briefing
    # ============================================================================
    print("TEST 5: Daily Briefing")
    print("-" * 80)
    
    try:
        # Create a test user with jobs
        uid_briefing, token_briefing = make_session(name="Briefing User")
        test_users.append(uid_briefing)
        
        # Create some jobs with different statuses
        now = datetime.datetime.utcnow()
        jobs_data = [
            {
                "id": str(uuid.uuid4()),
                "userId": uid_briefing,
                "company": "TechCorp",
                "role": "Senior Engineer",
                "status": "applied",
                "appliedAt": now - datetime.timedelta(days=5),
                "createdAt": now,
                "updatedAt": now
            },
            {
                "id": str(uuid.uuid4()),
                "userId": uid_briefing,
                "company": "StartupXYZ",
                "role": "Lead Developer",
                "status": "applied",
                "appliedAt": now - datetime.timedelta(days=7),
                "createdAt": now,
                "updatedAt": now
            },
            {
                "id": str(uuid.uuid4()),
                "userId": uid_briefing,
                "company": "BigTech Inc",
                "role": "Staff Engineer",
                "status": "interview",
                "createdAt": now,
                "updatedAt": now
            }
        ]
        
        for job in jobs_data:
            db.jobs.insert_one(job)
        
        # Test 5a: GET /api/daily-briefing
        print("Generating daily briefing (may take 10-60s)...")
        response = requests.get(
            f"{BASE_URL}/daily-briefing",
            cookies={"veyra_session": token_briefing},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            required_keys = ["briefing", "events", "followUps", "date"]
            missing_keys = [k for k in required_keys if k not in data]
            
            if not missing_keys:
                briefing = data.get("briefing", {})
                briefing_keys = ["greeting", "focusOfDay", "todoList", "opportunityHint", "motivationalNote"]
                missing_briefing_keys = [k for k in briefing_keys if k not in briefing]
                
                if not missing_briefing_keys:
                    todo_list = briefing.get("todoList", [])
                    events = data.get("events", [])
                    follow_ups = data.get("followUps", [])
                    
                    print(f"✅ PASS: Daily briefing generated with all required fields")
                    print(f"   Greeting: {briefing.get('greeting', '')[:60]}...")
                    print(f"   Todo items: {len(todo_list)}")
                    print(f"   Events: {len(events)}")
                    print(f"   Follow-ups: {len(follow_ups)}")
                    print(f"   Date: {data.get('date', '')[:10]}")
                    
                    # Verify follow-ups are detected (we created jobs 5 and 7 days ago)
                    if len(follow_ups) >= 2:
                        print(f"✅ PASS: Follow-ups correctly detected for jobs applied 5-7 days ago")
                    else:
                        print(f"⚠️  Warning: Expected 2+ follow-ups, got {len(follow_ups)}")
                else:
                    print(f"❌ FAIL: Missing briefing keys: {missing_briefing_keys}")
                    all_passed = False
            else:
                print(f"❌ FAIL: Missing keys in daily briefing response: {missing_keys}")
                all_passed = False
        else:
            print(f"❌ FAIL: GET /api/daily-briefing returned {response.status_code}: {response.text}")
            all_passed = False
        
        # Test 5b: Unauthenticated request should return 401
        unauth_response = requests.get(f"{BASE_URL}/daily-briefing", timeout=30)
        
        if unauth_response.status_code == 401:
            print("✅ PASS: Unauthenticated request returns 401")
        else:
            print(f"❌ FAIL: Unauthenticated request returned {unauth_response.status_code}, expected 401")
            all_passed = False
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 5: {str(e)}")
        all_passed = False
    
    print()
    
    # ============================================================================
    # TEST 6: Regression - Quick check of existing endpoints
    # ============================================================================
    print("TEST 6: Regression - Existing Endpoints")
    print("-" * 80)
    
    try:
        # Create a test user for regression tests
        uid_regression, token_regression = make_session(name="Regression User")
        test_users.append(uid_regression)
        
        regression_tests = []
        
        # Test 6a: GET /api/ (public)
        response = requests.get(f"{BASE_URL}/", timeout=30)
        if response.status_code == 200 and "message" in response.json():
            regression_tests.append(("GET /api/", True))
        else:
            regression_tests.append(("GET /api/", False))
            all_passed = False
        
        # Test 6b: GET /api/me without cookie
        response = requests.get(f"{BASE_URL}/me", timeout=30)
        if response.status_code == 200 and response.json().get("user") is None:
            regression_tests.append(("GET /api/me (no cookie)", True))
        else:
            regression_tests.append(("GET /api/me (no cookie)", False))
            all_passed = False
        
        # Test 6c: POST /api/ai/ats (public)
        response = requests.post(
            f"{BASE_URL}/ai/ats",
            json={
                "resume": "John Doe\nSenior Software Engineer\n5 years experience in Python, JavaScript, React, Node.js\nBuilt scalable web applications",
                "jobDescription": "Looking for a Senior Engineer with Python and React experience"
            },
            timeout=60
        )
        if response.status_code == 200 and "atsScore" in response.json():
            regression_tests.append(("POST /api/ai/ats", True))
        else:
            regression_tests.append(("POST /api/ai/ats", False))
            all_passed = False
        
        # Test 6d: GET /api/analytics (authenticated)
        response = requests.get(
            f"{BASE_URL}/analytics",
            cookies={"veyra_session": token_regression},
            timeout=30
        )
        if response.status_code == 200 and "totals" in response.json():
            regression_tests.append(("GET /api/analytics", True))
        else:
            regression_tests.append(("GET /api/analytics", False))
            all_passed = False
        
        # Print results
        for test_name, passed in regression_tests:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {test_name}")
            
    except Exception as e:
        print(f"❌ FAIL: Exception in Test 6: {str(e)}")
        all_passed = False
    
    print()

finally:
    # Cleanup
    print("=" * 80)
    print("CLEANUP")
    print("-" * 80)
    cleanup_test_users(test_users)
    print(f"Cleaned up {len(test_users)} test users")
    print()

# Final summary
print("=" * 80)
print("FINAL SUMMARY")
print("=" * 80)

if all_passed:
    print("✅ ALL TESTS PASSED")
    print()
    print("Summary:")
    print("  1. Extended Profile PUT - ✅ Working")
    print("  2. Candidate Discovery (Role Guarding) - ✅ Working")
    print("  3. Candidate Discovery (Search & View) - ✅ Working")
    print("  4. Coding Interview - ✅ Working")
    print("  5. Daily Briefing - ✅ Working")
    print("  6. Regression Tests - ✅ Working")
else:
    print("❌ SOME TESTS FAILED")
    print()
    print("Please review the detailed output above for specific failures.")

print("=" * 80)
