#!/usr/bin/env python3
"""
Veyra AI Backend API Test Suite - Round 2
Tests new endpoints: Jobs CRUD, AI Job Match, Cover Letter, Mock Interview, Career DNA, Roadmap, Skill Gap, Notifications
"""

import requests
import json
import sys
import pymongo
import uuid
import datetime

BASE_URL = "http://localhost:3000/api"

def print_test(name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def create_test_session():
    """Create a test user and session in MongoDB, return session token"""
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        
        # Create test user
        uid = str(uuid.uuid4())
        db.users.insert_one({
            "id": uid,
            "googleId": "test-" + uid,
            "email": "sarah.chen@example.com",
            "name": "Sarah Chen",
            "headline": "Senior Software Engineer",
            "targetRole": "Staff Engineer",
            "yearsExperience": 5,
            "bio": "Passionate about distributed systems and cloud architecture",
            "location": "San Francisco, CA",
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow()
        })
        
        # Create session
        token = str(uuid.uuid4()) + "." + str(uuid.uuid4())
        db.sessions.insert_one({
            "token": token,
            "userId": uid,
            "createdAt": datetime.datetime.utcnow(),
            "expiresAt": datetime.datetime.utcnow() + datetime.timedelta(days=30)
        })
        
        print(f"✓ Created test user: {uid}")
        print(f"✓ Created test session: {token}\n")
        
        return token, uid
    except Exception as e:
        print(f"❌ Failed to create test session: {str(e)}")
        sys.exit(1)

def test_jobs_crud(session_token):
    """Test Jobs CRUD endpoints"""
    print("=" * 60)
    print("TEST 1: Jobs CRUD")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    job_id = None
    
    # Test 1: POST /api/jobs - Create job with status=applied
    try:
        payload = {
            "company": "Google",
            "role": "Staff Engineer",
            "location": "Remote",
            "status": "applied"
        }
        r = requests.post(f"{BASE_URL}/jobs", json=payload, cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "id" in data and
            data.get("company") == "Google" and
            data.get("role") == "Staff Engineer" and
            data.get("status") == "applied" and
            data.get("appliedAt") is not None  # Should be set since status=applied
        )
        
        if passed:
            job_id = data.get("id")
        
        results.append(passed)
        print_test(
            "POST /api/jobs (status=applied)",
            passed,
            f"Status: {r.status_code}, Job ID: {data.get('id')}, appliedAt: {data.get('appliedAt')}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/jobs", False, f"Error: {str(e)}")
    
    # Test 2: GET /api/jobs - List jobs
    try:
        r = requests.get(f"{BASE_URL}/jobs", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            isinstance(data, list) and
            len(data) > 0 and
            any(j.get("id") == job_id for j in data)
        )
        
        results.append(passed)
        print_test(
            "GET /api/jobs",
            passed,
            f"Status: {r.status_code}, Jobs count: {len(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/jobs", False, f"Error: {str(e)}")
    
    # Test 3: PUT /api/jobs/{id} - Update status
    if job_id:
        try:
            payload = {"status": "interview"}
            r = requests.put(f"{BASE_URL}/jobs/{job_id}", json=payload, cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("status") == "interview"
            )
            
            results.append(passed)
            print_test(
                "PUT /api/jobs/{id} (update status)",
                passed,
                f"Status: {r.status_code}, New status: {data.get('status')}"
            )
        except Exception as e:
            results.append(False)
            print_test("PUT /api/jobs/{id} (status)", False, f"Error: {str(e)}")
        
        # Test 4: PUT /api/jobs/{id} - Update notes
        try:
            payload = {"notes": "call scheduled for next week"}
            r = requests.put(f"{BASE_URL}/jobs/{job_id}", json=payload, cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("notes") == "call scheduled for next week"
            )
            
            results.append(passed)
            print_test(
                "PUT /api/jobs/{id} (update notes)",
                passed,
                f"Status: {r.status_code}, Notes: {data.get('notes')}"
            )
        except Exception as e:
            results.append(False)
            print_test("PUT /api/jobs/{id} (notes)", False, f"Error: {str(e)}")
        
        # Test 5: DELETE /api/jobs/{id}
        try:
            r = requests.delete(f"{BASE_URL}/jobs/{job_id}", cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("ok") is True
            )
            
            results.append(passed)
            print_test(
                "DELETE /api/jobs/{id}",
                passed,
                f"Status: {r.status_code}, Response: {json.dumps(data)}"
            )
        except Exception as e:
            results.append(False)
            print_test("DELETE /api/jobs/{id}", False, f"Error: {str(e)}")
    
    # Test 6: GET /api/jobs without cookie -> 401
    try:
        r = requests.get(f"{BASE_URL}/jobs", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "GET /api/jobs (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/jobs (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_ai_job_match(session_token):
    """Test AI Job Match endpoint"""
    print("=" * 60)
    print("TEST 2: AI Job Match")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # First create a job to match against
    job_id = None
    try:
        payload = {
            "company": "Google",
            "role": "Staff Engineer",
            "location": "Remote",
            "status": "wishlist"
        }
        r = requests.post(f"{BASE_URL}/jobs", json=payload, cookies=cookies, timeout=10)
        data = r.json()
        job_id = data.get("id")
        print(f"✓ Created job for matching: {job_id}\n")
    except Exception as e:
        print(f"❌ Failed to create job: {str(e)}")
    
    # Test 1: POST /api/ai/job-match with jobId
    try:
        payload = {
            "company": "Google",
            "role": "Staff Engineer",
            "description": "We're looking for a Staff Engineer with deep expertise in distributed systems, Go, Kubernetes, and cloud architecture. You'll lead technical design for our infrastructure team.",
            "jobId": job_id
        }
        r = requests.post(f"{BASE_URL}/ai/job-match", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "matchScore" in data and
            isinstance(data.get("matchScore"), (int, float)) and
            0 <= data.get("matchScore") <= 100 and
            "why" in data and
            isinstance(data.get("why"), str) and
            "topStrengths" in data and
            isinstance(data.get("topStrengths"), list) and
            len(data.get("topStrengths", [])) == 3 and
            "topGaps" in data and
            isinstance(data.get("topGaps"), list) and
            len(data.get("topGaps", [])) == 3 and
            "prepPlan" in data and
            isinstance(data.get("prepPlan"), list) and
            len(data.get("prepPlan", [])) == 3
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/job-match",
            passed,
            f"Status: {r.status_code}, Match Score: {data.get('matchScore')}, Fields: {list(data.keys())}"
        )
        
        # Verify job's matchScore was updated in DB
        if passed and job_id:
            try:
                client = pymongo.MongoClient("mongodb://localhost:27017")
                db = client["veyra_ai"]
                job = db.jobs.find_one({"id": job_id})
                if job and job.get("matchScore") == data.get("matchScore"):
                    print(f"   ✓ Job matchScore updated in DB: {job.get('matchScore')}")
                else:
                    print(f"   ✗ Job matchScore NOT updated in DB")
            except Exception as e:
                print(f"   ✗ Failed to verify DB update: {str(e)}")
        
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/job-match", False, f"Error: {str(e)}")
    
    # Test 2: Without cookie -> 401
    try:
        payload = {
            "company": "Google",
            "role": "Staff Engineer",
            "description": "Test"
        }
        r = requests.post(f"{BASE_URL}/ai/job-match", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/job-match (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/job-match (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_cover_letter_studio(session_token):
    """Test Cover Letter Studio endpoints"""
    print("=" * 60)
    print("TEST 3: Cover Letter Studio")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    letter_id = None
    
    # Test 1: POST /api/ai/cover-letter
    try:
        payload = {
            "company": "Stripe",
            "role": "Senior Frontend Engineer",
            "description": "We're looking for a Senior Frontend Engineer with expertise in React, TypeScript, and payments infrastructure. You'll build user-facing features for our global payments platform.",
            "tone": "professional and warm"
        }
        r = requests.post(f"{BASE_URL}/ai/cover-letter", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "letter" in data and
            isinstance(data.get("letter"), str) and
            len(data.get("letter", "")) > 0 and
            "highlights" in data and
            isinstance(data.get("highlights"), list) and
            len(data.get("highlights", [])) == 3 and
            "openingHook" in data and
            isinstance(data.get("openingHook"), str) and
            "id" in data
        )
        
        if passed:
            letter_id = data.get("id")
        
        results.append(passed)
        print_test(
            "POST /api/ai/cover-letter",
            passed,
            f"Status: {r.status_code}, Letter ID: {data.get('id')}, Letter length: {len(data.get('letter', ''))}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/cover-letter", False, f"Error: {str(e)}")
    
    # Test 2: GET /api/cover-letters
    try:
        r = requests.get(f"{BASE_URL}/cover-letters", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            isinstance(data, list) and
            len(data) > 0 and
            any(l.get("id") == letter_id for l in data)
        )
        
        results.append(passed)
        print_test(
            "GET /api/cover-letters",
            passed,
            f"Status: {r.status_code}, Letters count: {len(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/cover-letters", False, f"Error: {str(e)}")
    
    # Test 3: DELETE /api/cover-letters/{id}
    if letter_id:
        try:
            r = requests.delete(f"{BASE_URL}/cover-letters/{letter_id}", cookies=cookies, timeout=10)
            data = r.json()
            
            passed = (
                r.status_code == 200 and
                data.get("ok") is True
            )
            
            results.append(passed)
            print_test(
                "DELETE /api/cover-letters/{id}",
                passed,
                f"Status: {r.status_code}, Response: {json.dumps(data)}"
            )
        except Exception as e:
            results.append(False)
            print_test("DELETE /api/cover-letters/{id}", False, f"Error: {str(e)}")
    
    # Test 4: Without cookie -> 401
    try:
        r = requests.get(f"{BASE_URL}/cover-letters", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "GET /api/cover-letters (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/cover-letters (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_mock_interview(session_token):
    """Test Mock Interview endpoints"""
    print("=" * 60)
    print("TEST 4: Mock Interview")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    session_id = None
    
    # Test 1: First call - no sessionId, no message (should start interview)
    try:
        payload = {
            "mode": "behavioral",
            "role": "Product Manager",
            "company": "Meta"
        }
        r = requests.post(f"{BASE_URL}/ai/mock-interview", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "sessionId" in data and
            isinstance(data.get("sessionId"), str) and
            "answer" in data and
            isinstance(data.get("answer"), str) and
            len(data.get("answer", "")) > 0
        )
        
        if passed:
            session_id = data.get("sessionId")
        
        results.append(passed)
        print_test(
            "POST /api/ai/mock-interview (first call - intro)",
            passed,
            f"Status: {r.status_code}, Session ID: {data.get('sessionId')}, Answer length: {len(data.get('answer', ''))}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/mock-interview (first call)", False, f"Error: {str(e)}")
    
    # Test 2: Second call - with sessionId and message (should give feedback + next question)
    if session_id:
        try:
            payload = {
                "sessionId": session_id,
                "mode": "behavioral",
                "role": "Product Manager",
                "company": "Meta",
                "message": "My most challenging project was launching a payment product to 3 markets in 6 months. I led a cross-functional team of 8 engineers and designers. We had to navigate complex regulatory requirements in each market while maintaining a unified user experience. I established weekly sync meetings with stakeholders, created a shared roadmap, and implemented feature flags for market-specific functionality. We launched on time and achieved 95% user satisfaction in the first quarter."
            }
            r = requests.post(f"{BASE_URL}/ai/mock-interview", json=payload, cookies=cookies, timeout=60)
            data = r.json()
            
            answer = data.get("answer", "")
            has_feedback = "feedback" in answer.lower() or "score" in answer.lower()
            
            passed = (
                r.status_code == 200 and
                "sessionId" in data and
                data.get("sessionId") == session_id and
                "answer" in data and
                isinstance(answer, str) and
                len(answer) > 0 and
                has_feedback  # Should include feedback on the answer
            )
            
            results.append(passed)
            print_test(
                "POST /api/ai/mock-interview (second call - feedback)",
                passed,
                f"Status: {r.status_code}, Has feedback: {has_feedback}, Answer preview: {answer[:150]}..."
            )
        except Exception as e:
            results.append(False)
            print_test("POST /api/ai/mock-interview (second call)", False, f"Error: {str(e)}")
    
    # Test 3: GET /api/interviews
    try:
        r = requests.get(f"{BASE_URL}/interviews", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            isinstance(data, list) and
            len(data) > 0 and
            any(i.get("sessionId") == session_id for i in data) and
            all("turns" in i for i in data)  # Should have turns field
        )
        
        results.append(passed)
        print_test(
            "GET /api/interviews",
            passed,
            f"Status: {r.status_code}, Interviews count: {len(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/interviews", False, f"Error: {str(e)}")
    
    # Test 4: Without cookie -> 401
    try:
        payload = {
            "mode": "behavioral",
            "role": "Product Manager"
        }
        r = requests.post(f"{BASE_URL}/ai/mock-interview", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/mock-interview (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/mock-interview (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_career_dna(session_token):
    """Test Career DNA endpoints"""
    print("=" * 60)
    print("TEST 5: Career DNA")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # Test 1: POST /api/ai/career-dna
    try:
        payload = {
            "answers": {
                "personality": "analytical, curious, detail-oriented",
                "values": "impact, continuous learning, work-life balance",
                "goal5yr": "Staff Engineer at a series-B startup building developer tools",
                "energizes": "deep technical work, mentoring junior engineers, solving complex problems",
                "drains": "long meetings without clear outcomes, repetitive tasks",
                "learningStyle": "hands-on building and experimentation",
                "riskTolerance": "medium-high"
            }
        }
        r = requests.post(f"{BASE_URL}/ai/career-dna", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "personality" in data and
            isinstance(data.get("personality"), dict) and
            "type" in data.get("personality", {}) and
            "description" in data.get("personality", {}) and
            "traits" in data.get("personality", {}) and
            isinstance(data.get("personality", {}).get("traits"), list) and
            "workStyle" in data and
            "strengths" in data and
            isinstance(data.get("strengths"), list) and
            "growthAreas" in data and
            isinstance(data.get("growthAreas"), list) and
            "energyDrivers" in data and
            isinstance(data.get("energyDrivers"), list) and
            "careerMatches" in data and
            isinstance(data.get("careerMatches"), list) and
            all("role" in m and "matchScore" in m and "why" in m for m in data.get("careerMatches", [])) and
            "idealEnvironment" in data and
            "learningStyle" in data and
            "topCoreValues" in data and
            isinstance(data.get("topCoreValues"), list) and
            "twelveMonthRecommendation" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/career-dna",
            passed,
            f"Status: {r.status_code}, Fields: {list(data.keys())}, Career matches: {len(data.get('careerMatches', []))}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/career-dna", False, f"Error: {str(e)}")
    
    # Test 2: GET /api/career-dna (should return saved report)
    try:
        r = requests.get(f"{BASE_URL}/career-dna", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "report" in data and
            isinstance(data.get("report"), dict)
        )
        
        results.append(passed)
        print_test(
            "GET /api/career-dna",
            passed,
            f"Status: {r.status_code}, Has report: {data.get('report') is not None}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/career-dna", False, f"Error: {str(e)}")
    
    # Test 3: Without cookie -> 401
    try:
        r = requests.get(f"{BASE_URL}/career-dna", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "GET /api/career-dna (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/career-dna (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_learning_roadmap(session_token):
    """Test Learning Roadmap endpoint"""
    print("=" * 60)
    print("TEST 6: Learning Roadmap")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # Test 1: POST /api/ai/roadmap
    try:
        payload = {
            "horizon": "90d",
            "targetRole": "Senior AI Engineer"
        }
        r = requests.post(f"{BASE_URL}/ai/roadmap", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "horizon" in data and
            "goal" in data and
            isinstance(data.get("goal"), str) and
            "milestones" in data and
            isinstance(data.get("milestones"), list) and
            len(data.get("milestones", [])) > 0 and
            all("week" in m and "focus" in m and "deliverables" in m and "resources" in m for m in data.get("milestones", [])) and
            "skillsToLearn" in data and
            isinstance(data.get("skillsToLearn"), list) and
            "projectsToBuild" in data and
            isinstance(data.get("projectsToBuild"), list) and
            "successMetrics" in data and
            isinstance(data.get("successMetrics"), list)
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/roadmap",
            passed,
            f"Status: {r.status_code}, Milestones: {len(data.get('milestones', []))}, Skills: {len(data.get('skillsToLearn', []))}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/roadmap", False, f"Error: {str(e)}")
    
    # Test 2: Without cookie -> 401
    try:
        payload = {
            "horizon": "90d",
            "targetRole": "Senior AI Engineer"
        }
        r = requests.post(f"{BASE_URL}/ai/roadmap", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/roadmap (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/roadmap (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_skill_gap_analysis(session_token):
    """Test Skill Gap Analysis endpoint"""
    print("=" * 60)
    print("TEST 7: Skill Gap Analysis")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # Test 1: POST /api/ai/skill-gap with targetRole
    try:
        payload = {
            "targetRole": "Senior AI Engineer"
        }
        r = requests.post(f"{BASE_URL}/ai/skill-gap", json=payload, cookies=cookies, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "readinessScore" in data and
            isinstance(data.get("readinessScore"), (int, float)) and
            0 <= data.get("readinessScore") <= 100 and
            "haveSkills" in data and
            isinstance(data.get("haveSkills"), list) and
            "missingSkills" in data and
            isinstance(data.get("missingSkills"), list) and
            all("skill" in s and "importance" in s and "howToLearn" in s and "timeEstimate" in s for s in data.get("missingSkills", [])) and
            "quickWins" in data and
            isinstance(data.get("quickWins"), list) and
            "longerBets" in data and
            isinstance(data.get("longerBets"), list) and
            "estimatedTimeToReady" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/skill-gap",
            passed,
            f"Status: {r.status_code}, Readiness: {data.get('readinessScore')}, Missing skills: {len(data.get('missingSkills', []))}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/skill-gap", False, f"Error: {str(e)}")
    
    # Test 2: POST /api/ai/skill-gap without targetRole or jobDescription -> 400
    try:
        payload = {}
        r = requests.post(f"{BASE_URL}/ai/skill-gap", json=payload, cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 400 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/skill-gap (missing params)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/skill-gap (missing params)", False, f"Error: {str(e)}")
    
    # Test 3: Without cookie -> 401
    try:
        payload = {
            "targetRole": "Senior AI Engineer"
        }
        r = requests.post(f"{BASE_URL}/ai/skill-gap", json=payload, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/skill-gap (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/skill-gap (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_notifications(session_token):
    """Test Notifications endpoint"""
    print("=" * 60)
    print("TEST 8: Notifications")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # First create some jobs to generate notifications
    try:
        # Create a job applied 5 days ago
        client = pymongo.MongoClient("mongodb://localhost:27017")
        db = client["veyra_ai"]
        
        # Get userId from session
        session = db.sessions.find_one({"token": session_token})
        user_id = session.get("userId")
        
        # Create job applied 5 days ago
        five_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=5)
        db.jobs.insert_one({
            "id": str(uuid.uuid4()),
            "userId": user_id,
            "company": "TestCorp",
            "role": "Engineer",
            "status": "applied",
            "appliedAt": five_days_ago,
            "createdAt": five_days_ago,
            "updatedAt": five_days_ago
        })
        print("✓ Created test job (applied 5 days ago)\n")
    except Exception as e:
        print(f"⚠ Failed to create test job: {str(e)}\n")
    
    # Test 1: GET /api/notifications
    try:
        r = requests.get(f"{BASE_URL}/notifications", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "notifications" in data and
            isinstance(data.get("notifications"), list)
        )
        
        results.append(passed)
        print_test(
            "GET /api/notifications",
            passed,
            f"Status: {r.status_code}, Notifications count: {len(data.get('notifications', []))}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/notifications", False, f"Error: {str(e)}")
    
    # Test 2: Without cookie -> 401
    try:
        r = requests.get(f"{BASE_URL}/notifications", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 401 and
            "error" in data
        )
        
        results.append(passed)
        print_test(
            "GET /api/notifications (unauthenticated)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/notifications (unauthenticated)", False, f"Error: {str(e)}")
    
    return all(results)

def test_regression(session_token):
    """Test regression - ensure existing endpoints still work"""
    print("=" * 60)
    print("TEST 9: Regression Tests")
    print("=" * 60)
    
    results = []
    cookies = {"veyra_session": session_token}
    
    # Test 1: GET /api/ (public)
    try:
        r = requests.get(f"{BASE_URL}/", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("message") == "Veyra AI is live"
        )
        
        results.append(passed)
        print_test(
            "GET /api/ (public)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/", False, f"Error: {str(e)}")
    
    # Test 2: GET /api/me without cookie
    try:
        r = requests.get(f"{BASE_URL}/me", timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            data.get("user") is None
        )
        
        results.append(passed)
        print_test(
            "GET /api/me (no cookie)",
            passed,
            f"Status: {r.status_code}, Response: {json.dumps(data)}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/me (no cookie)", False, f"Error: {str(e)}")
    
    # Test 3: GET /api/me WITH cookie
    try:
        r = requests.get(f"{BASE_URL}/me", cookies=cookies, timeout=10)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "user" in data and
            isinstance(data.get("user"), dict) and
            data.get("user") is not None
        )
        
        results.append(passed)
        print_test(
            "GET /api/me (with cookie)",
            passed,
            f"Status: {r.status_code}, User: {data.get('user', {}).get('name')}"
        )
    except Exception as e:
        results.append(False)
        print_test("GET /api/me (with cookie)", False, f"Error: {str(e)}")
    
    # Test 4: POST /api/ai/ats (public)
    try:
        payload = {
            "resume": "Senior React developer with 5 years experience building web apps in TypeScript, Node.js, and MongoDB. Led 3-person frontend team at TechCorp.",
            "jobDescription": "We need a Staff React engineer familiar with GraphQL and AWS."
        }
        r = requests.post(f"{BASE_URL}/ai/ats", json=payload, timeout=60)
        data = r.json()
        
        passed = (
            r.status_code == 200 and
            "atsScore" in data and
            isinstance(data.get("atsScore"), (int, float))
        )
        
        results.append(passed)
        print_test(
            "POST /api/ai/ats (public)",
            passed,
            f"Status: {r.status_code}, ATS Score: {data.get('atsScore')}"
        )
    except Exception as e:
        results.append(False)
        print_test("POST /api/ai/ats", False, f"Error: {str(e)}")
    
    return all(results)

def main():
    print("\n" + "=" * 60)
    print("VEYRA AI BACKEND API TEST SUITE - ROUND 2")
    print("Testing at: " + BASE_URL)
    print("=" * 60 + "\n")
    
    # Create test session
    session_token, user_id = create_test_session()
    
    results = {}
    
    # Run all tests
    results["Jobs CRUD"] = test_jobs_crud(session_token)
    results["AI Job Match"] = test_ai_job_match(session_token)
    results["Cover Letter Studio"] = test_cover_letter_studio(session_token)
    results["Mock Interview"] = test_mock_interview(session_token)
    results["Career DNA"] = test_career_dna(session_token)
    results["Learning Roadmap"] = test_learning_roadmap(session_token)
    results["Skill Gap Analysis"] = test_skill_gap_analysis(session_token)
    results["Notifications"] = test_notifications(session_token)
    results["Regression Tests"] = test_regression(session_token)
    
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
