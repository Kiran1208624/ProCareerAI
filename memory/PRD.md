# VEYRA AI — Master Product Requirement Document

> **Single source of truth.** Every feature we ship must map back to this doc.
> Last updated by user: current build session.

## Identity
- **Name:** Veyra AI
- **Positioning:** The AI Career Operating System
- **Tagline:** One AI. One Workspace. One Career.
- **Alt tagline:** Build. Apply. Prepare. Get Hired.

## Vision
Veyra AI is **not** a resume builder, job portal, interview app, or dashboard.
Veyra AI is an **AI Career Operating System** — the way Notion manages knowledge or Cursor manages software development, Veyra manages a person's entire career.

## Mission
Help millions of students and professionals discover, build, improve, and grow their careers using AI. Everything career-related happens inside one workspace.

## Target Users
1. **Students** — resume, career guidance, skill gap, internships, campus placements, AI mentor
2. **Freshers** — resume optimization, ATS scoring, applications, interview prep, cover letters
3. **Working Professionals** — career growth, salary insights, updates, promotion planning, job switching
4. **Recruiters** — candidate management, screening, interview scheduling, hiring analytics
5. **Companies** — job posting, recruitment pipeline, candidate tracking, campus hiring
6. **Colleges** — student analytics, placement management, resume monitoring, company partnerships

## Core Philosophy
Every user has ONE AI-powered Career Workspace. Everything lives inside that workspace.

---

## Workspace Modules

### 1. Dashboard
Intelligent overview: Resume Score, ATS Score, Career Health, Jobs Applied, Interviews, AI Suggestions, Calendar, Notifications, Weekly Goals, Skill Progress, Recent Activity, Quick Actions.

### 2. Resume Studio (Flagship)
- **Builder:** Personal Info, Professional Summary, Education, Experience, Projects, Skills, Achievements, Certifications, Languages, Interests, Portfolio, References
- **AI Analysis:** Resume Score, ATS Score, Keyword Analysis, Missing Skills, Grammar Review, Impact Score, Formatting Analysis, Industry Benchmark
- **AI Improvement:** improve summary, rewrite experience, add measurable achievements, tailor per role
- **Templates:** Modern, Minimal, Executive, Creative, ATS-Friendly, Startup, International
- **Version History:** V1 → V2 → Google resume → Amazon resume → Microsoft resume
- **Export:** PDF, DOCX (future), share link, print

### 3. Job Tracker
Application management with stages: **Wishlist → Saved → Applied → Assessment → Interview → Offer → Accepted → Rejected**
Each job: Company, Role, Salary, Location, Referral, Notes, Deadlines, Contacts, Interview Dates, Documents, AI Match %

### 4. AI Career Copilot (Heart of Veyra)
ChatGPT dedicated to careers. Example prompts: improve resume, write cover letter, find matching jobs, prepare for Amazon interview, salary negotiation, explain a JD, what to learn.

### 5. Interview Preparation
Mock interviews (behavioral, technical, HR), Coding/Voice/Video (future). AI feedback with confidence & communication scores.

### 6. Cover Letter Studio
Personalized letters by company, role, experience, tone.

### 7. Career DNA (Signature Feature)
Analyzes personality, skills, interests, experience, goals, strengths, weaknesses, learning style. Outputs: career match, roadmap, recommendations, learning path.

### 8. Learning Roadmap
90-day / 6-month / yearly roadmap: skills, certifications, projects, books, courses.

### 9. Skill Gap Analysis
Current Skills → Target Job → Missing Skills → Learning Plan.

### 10. Gmail Integration
Read recruiter emails, categorize (interview invites, application updates), AI replies, follow-up reminders.

### 11. Google Calendar
Interview schedule, deadlines, meetings, reminders, learning schedule.

### 12. Google Drive
Resume backup, portfolio, certificates, documents, version history.

### 13. LinkedIn Integration (Future)
Import/analyze/optimize profile, generate posts, networking suggestions.

### 14. GitHub Integration (Future)
Repository analysis, project showcase, contribution insights, developer portfolio.

### 15. Analytics
Applications, interviews, resume performance, skill growth, learning progress, offer rate, success rate, monthly reports.

### 16. Notifications
Interview tomorrow, resume needs update, deadline, recruiter replied, AI recommendation.

### 17. AI Automation (Future)
Daily briefing, weekly goals, application reminders, prep schedule, learning reminders.

### 18. Admin Dashboard
Users, colleges, companies, recruiters, reports, analytics, permissions.

### 19. College Portal
Student mgmt, placement analytics, eligible students, recruiter coordination, reports.

### 20. Company Portal
Post jobs, manage applicants, schedule interviews, hiring pipeline, offer management.

---

## Authentication
Email/password, Google Sign-In, JWT, protected routes, role-based access.

## Tech Stack
- **Backend:** Node.js (Next.js API routes), MongoDB, JWT, REST APIs, Google OAuth, OpenAI API, file uploads
- **Frontend:** Next.js 15+, React, Tailwind CSS, feature-first architecture, reusable components

## Design System
Premium SaaS, dark-first, minimal, professional, modern. References: Linear, Notion, Cursor, Raycast, Perplexity, Stripe Dashboard, Apple HIG.

## Business Model
- **Free:** 1 resume, basic ATS, limited AI, job tracker, basic dashboard
- **Pro:** Unlimited resumes, advanced AI, tailoring, mock interviews, cover letters, Gmail/Calendar, analytics, career roadmap
- **Enterprise:** Colleges, universities, placement cells, companies, recruiters, team mgmt, custom dashboards, API access

## Long-Term Vision
Users should open Veyra every day to manage their professional lives — the way they open Notion for notes or GitHub for code. Every career action, one workspace.

---

## Current Build Status (as of this session)

### ✅ Shipped
- Landing page with hero, features, integrations, waitlist
- Google OAuth (login + session + auto-refresh)
- Dashboard shell with 11-module sidebar
- Professional Identity (profile, skills, projects)
- AI Career Copilot (chat with memory injection, session persistence)
- **AI Memory / Knowledge Graph** (auto-extracts durable facts from every chat)
- Resume Studio (partial): ATS Analyzer, Resume Tailor, AI Resume Generator from profile
- Opportunity Engine (AI job recommendations)
- Gmail connector (list + filter recruiter emails)
- Calendar connector (list + create events)
- Drive connector (list files)
- Waitlist capture

### 🔨 Next up (aligned with PRD gaps)
- **Job Tracker** (Kanban: Wishlist → Applied → Interview → Offer → Rejected → Accepted)
- **Cover Letter Studio** (per company/role/tone)
- **Mock Interview** module (behavioral, technical, HR with AI feedback + scores)
- **Career DNA** (personality + skill + goal analysis → career match report)
- **Learning Roadmap** (90-day / 6-month / yearly)
- **Skill Gap Analysis** (dedicated view: current vs target vs plan)
- **Resume Templates + Version History**
- **Notifications** (interview tomorrow, deadline, recruiter replied)
- **Role-based access** (student / professional / recruiter / company / college)
- **Admin, College, Company portals**
