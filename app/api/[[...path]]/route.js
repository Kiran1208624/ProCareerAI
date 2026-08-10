import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { complete, parseJson } from '@/lib/llm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'veyra_ai')
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const database = await connectToMongo()

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Veyra AI is live', model: process.env.EMERGENT_LLM_MODEL }))
    }

    // --------- AI: ATS Analyzer ---------
    if (route === '/ai/ats' && method === 'POST') {
      const body = await request.json()
      const resume = (body.resume || '').toString().trim()
      const jobDescription = (body.jobDescription || '').toString().trim()
      if (resume.length < 30) {
        return handleCORS(NextResponse.json({ error: 'Please paste at least a few lines of your resume.' }, { status: 400 }))
      }
      const messages = [
        { role: 'system', content: 'You are a strict, expert ATS (Applicant Tracking System) evaluator and career coach. You return only valid JSON.' },
        { role: 'user', content: `Analyze this resume${jobDescription ? ' against the job description' : ''}.\n\n== RESUME ==\n${resume}\n\n${jobDescription ? `== JOB DESCRIPTION ==\n${jobDescription}` : ''}\n\nReturn ONLY a JSON object with this exact shape:\n{\n  "atsScore": number (0-100),\n  "summary": string (2-3 sentence overall verdict),\n  "strengths": string[] (top 4 strengths),\n  "weaknesses": string[] (top 4 issues that hurt ATS score),\n  "matchedKeywords": string[] (skills/keywords aligned with the JD, empty if no JD),\n  "missingKeywords": string[] (skills/keywords missing but expected, based on JD or general market),\n  "formattingIssues": string[] (ATS-unfriendly formatting problems),\n  "impactScore": number (0-100, quality of quantified achievements),\n  "clarityScore": number (0-100),\n  "recommendations": string[] (5 concrete improvements, each starting with an action verb)\n}` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // --------- AI: Resume Tailor / Builder ---------
    if (route === '/ai/tailor' && method === 'POST') {
      const body = await request.json()
      const resume = (body.resume || '').toString().trim()
      const jobDescription = (body.jobDescription || '').toString().trim()
      if (resume.length < 30) {
        return handleCORS(NextResponse.json({ error: 'Please paste at least a few lines of your resume.' }, { status: 400 }))
      }
      const messages = [
        { role: 'system', content: 'You are an elite resume writer. You rewrite resumes truthfully — never invent employers, dates, degrees, metrics or experience the person does not have. You emphasize existing achievements, rephrase for impact, add strong action verbs, and align keywords with the target role. You return only valid JSON.' },
        { role: 'user', content: `Rewrite the resume below to be ATS-optimized${jobDescription ? ' for the target job description' : ' for a strong general professional role'}. Keep it truthful and preserve the person\'s facts.\n\n== RESUME ==\n${resume}\n\n${jobDescription ? `== JOB DESCRIPTION ==\n${jobDescription}` : ''}\n\nReturn ONLY a JSON object with this exact shape:\n{\n  "tailoredResume": string (the full rewritten resume in clean plain text, using clear section headers like SUMMARY, EXPERIENCE, PROJECTS, SKILLS, EDUCATION, with bullet points starting with strong action verbs; keep it 1 page equivalent),\n  "summaryLine": string (a single strong 2-sentence professional summary line),\n  "topBullets": string[] (5 of the strongest rewritten bullet points),\n  "keywordsAdded": string[] (keywords woven in for ATS),\n  "changesExplained": string[] (5 short bullet points explaining what changed and why)\n}` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // --------- AI: Career Coach Chat ---------
    if (route === '/ai/chat' && method === 'POST') {
      const body = await request.json()
      const sessionId = (body.sessionId || uuidv4()).toString()
      const message = (body.message || '').toString().trim()
      if (!message) return handleCORS(NextResponse.json({ error: 'Empty message' }, { status: 400 }))

      const chats = database.collection('career_chats')
      const existing = await chats.findOne({ sessionId })
      const history = (existing?.messages || []).slice(-20)

      const messages = [
        { role: 'system', content: `You are Veyra, an elite AI career coach. You give sharp, actionable, encouraging career advice — concise, structured with short bullets, and tailored to the user's stage (student, junior, senior, career switcher). You help with career direction, resumes, interviews, skill gaps, salary negotiation, and roadmap. When appropriate, ask 1 clarifying question. Never fabricate job offers or claim to guarantee outcomes.` },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ]
      const answer = await complete(messages)
      const now = new Date()
      await chats.updateOne(
        { sessionId },
        {
          $setOnInsert: { id: uuidv4(), sessionId, createdAt: now },
          $set: { updatedAt: now },
          $push: { messages: { $each: [
            { role: 'user', content: message, createdAt: now },
            { role: 'assistant', content: answer, createdAt: now },
          ] } },
        },
        { upsert: true },
      )
      return handleCORS(NextResponse.json({ sessionId, answer }))
    }

    // --------- Chat history fetch ---------
    if (route.startsWith('/ai/chat/') && method === 'GET') {
      const sessionId = route.replace('/ai/chat/', '')
      const chats = database.collection('career_chats')
      const doc = await chats.findOne({ sessionId })
      const messages = (doc?.messages || []).map(({ role, content, createdAt }) => ({ role, content, createdAt }))
      return handleCORS(NextResponse.json({ sessionId, messages }))
    }

    // --------- Waitlist / lead capture ---------
    if (route === '/waitlist' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').toString().trim().toLowerCase()
      if (!email || !email.includes('@')) {
        return handleCORS(NextResponse.json({ error: 'Invalid email' }, { status: 400 }))
      }
      const doc = { id: uuidv4(), email, createdAt: new Date() }
      await database.collection('waitlist').updateOne({ email }, { $setOnInsert: doc }, { upsert: true })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error?.message || error)
    const msg = error?.message || 'Internal server error'
    return handleCORS(NextResponse.json({ error: msg }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
