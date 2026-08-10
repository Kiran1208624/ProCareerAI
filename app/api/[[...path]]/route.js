import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { complete, parseJson } from '@/lib/llm'
import { oauth2Client, authedClient, GOOGLE_SCOPES, extractHeaders, extractText, gmailApi, calendarApi, driveApi, oauth2Api } from '@/lib/google'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let _client
let _db

async function connectToMongo() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
    _db = _client.db(process.env.DB_NAME || 'veyra_ai')
  }
  return _db
}

const SESSION_COOKIE = process.env.SESSION_COOKIE || 'veyra_session'

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

// ---------------- Session helpers ----------------

async function getSession() {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (!token) return null
  const db = await connectToMongo()
  const sess = await db.collection('sessions').findOne({ token, expiresAt: { $gt: new Date() } })
  if (!sess) return null
  const user = await db.collection('users').findOne({ id: sess.userId })
  if (!user) return null
  return { session: sess, user }
}

async function setSessionCookie(token) {
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
}

async function clearSessionCookie() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
}

async function getUserGoogleTokens(userId) {
  const db = await connectToMongo()
  const t = await db.collection('google_tokens').findOne({ userId })
  return t?.tokens || null
}

async function saveUserGoogleTokens(userId, tokens) {
  const db = await connectToMongo()
  const existing = await getUserGoogleTokens(userId)
  const merged = { ...(existing || {}), ...tokens }
  await db.collection('google_tokens').updateOne(
    { userId },
    { $set: { userId, tokens: merged, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  )
}

async function getAuthedGoogle(userId) {
  const tokens = await getUserGoogleTokens(userId)
  if (!tokens) return null
  const client = authedClient(tokens)
  // Auto-refresh handling
  client.on('tokens', async (newTokens) => {
    await saveUserGoogleTokens(userId, newTokens)
  })
  return client
}

// ---------------- AI helpers ----------------

async function loadUserContext(userId) {
  const db = await connectToMongo()
  const [profile, memories, skills, projects] = await Promise.all([
    db.collection('users').findOne({ id: userId }),
    db.collection('memories').find({ userId }).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection('skills').find({ userId }).toArray(),
    db.collection('projects').find({ userId }).toArray(),
  ])
  return { profile, memories, skills, projects }
}

function contextToString({ profile, memories, skills, projects }) {
  const parts = []
  if (profile) {
    parts.push(`USER: ${profile.name || ''} · ${profile.headline || ''}`)
    if (profile.location) parts.push(`Location: ${profile.location}`)
    if (profile.bio) parts.push(`Bio: ${profile.bio}`)
    if (profile.yearsExperience != null) parts.push(`Years of experience: ${profile.yearsExperience}`)
    if (profile.targetRole) parts.push(`Target role: ${profile.targetRole}`)
  }
  if (skills?.length) parts.push(`Skills: ${skills.map(s => s.name).join(', ')}`)
  if (projects?.length) {
    parts.push('Projects:')
    for (const p of projects.slice(0, 10)) {
      parts.push(`- ${p.name}: ${p.description || ''}`)
    }
  }
  if (memories?.length) {
    parts.push('Long-term memory (facts about the user):')
    for (const m of memories.slice(0, 30)) parts.push(`- ${m.fact}`)
  }
  return parts.join('\n')
}

async function upsertMemoriesFromMessage(userId, userText, assistantText) {
  // Ask LLM to extract 0-3 durable facts to remember
  try {
    const raw = await complete([
      { role: 'system', content: 'You extract durable long-term facts about the user from a chat turn. Return JSON only. Only include facts that would be helpful to remember weeks later (skills, goals, constraints, employer, target role, values, deadlines). Skip small talk.' },
      { role: 'user', content: `User said: "${userText}"\nAssistant replied: "${assistantText}"\n\nReturn JSON: {"facts": string[]} with 0 to 3 concise atomic facts. Empty array if none.` },
    ], { response_format: { type: 'json_object' } })
    const data = parseJson(raw)
    const facts = Array.isArray(data.facts) ? data.facts.filter(f => typeof f === 'string' && f.length > 3 && f.length < 200).slice(0, 3) : []
    if (facts.length === 0) return
    const db = await connectToMongo()
    for (const fact of facts) {
      await db.collection('memories').updateOne(
        { userId, fact },
        { $set: { userId, fact, updatedAt: new Date() }, $setOnInsert: { id: uuidv4(), createdAt: new Date() } },
        { upsert: true },
      )
    }
  } catch (e) {
    // Silent — memory extraction is best-effort
    console.error('memory extraction failed', e.message)
  }
}

// ---------------- Route handler ----------------

async function handleRoute(request, { params }) {
  const p = await params
  const path = p.path || []
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // ============ ROOT ============
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Veyra AI is live', model: process.env.LLM_MODEL }))
    }

    // ============ AUTH: GOOGLE ============
    if (route === '/auth/google' && method === 'GET') {
      const state = uuidv4()
      const c = await cookies()
      c.set('veyra_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
      const url = oauth2Client().generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        scope: GOOGLE_SCOPES,
        state,
      })
      return NextResponse.redirect(url)
    }

    if (route === '/auth/google/callback' && method === 'GET') {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const c = await cookies()
      const stored = c.get('veyra_oauth_state')?.value
      c.delete('veyra_oauth_state')
      if (!code || !state || state !== stored) {
        return NextResponse.redirect(new URL('/?auth_error=state', request.url))
      }
      const client = oauth2Client()
      const { tokens } = await client.getToken(code)
      client.setCredentials(tokens)
      const { data: me } = await oauth2Api(client).userinfo.get()

      // Upsert user
      const existing = await db.collection('users').findOne({ googleId: me.id })
      const userId = existing?.id || uuidv4()
      const now = new Date()
      await db.collection('users').updateOne(
        { googleId: me.id },
        {
          $set: {
            googleId: me.id,
            email: me.email,
            name: me.name,
            picture: me.picture,
            emailVerified: me.verified_email,
            locale: me.locale,
            updatedAt: now,
          },
          $setOnInsert: {
            id: userId,
            createdAt: now,
            headline: '',
            bio: '',
            location: '',
            targetRole: '',
            yearsExperience: null,
          },
        },
        { upsert: true },
      )
      // Save tokens (preserve refresh_token if not returned again)
      const prior = await getUserGoogleTokens(userId)
      const finalTokens = { ...(prior || {}), ...tokens }
      if (!finalTokens.refresh_token && prior?.refresh_token) finalTokens.refresh_token = prior.refresh_token
      await saveUserGoogleTokens(userId, finalTokens)

      // Create session
      const sessionToken = uuidv4() + '.' + uuidv4()
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await db.collection('sessions').insertOne({ token: sessionToken, userId, createdAt: now, expiresAt })
      await setSessionCookie(sessionToken)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const s = await getSession()
      if (s) await db.collection('sessions').deleteOne({ token: s.session.token })
      await clearSessionCookie()
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ ME / PROFILE ============
    if (route === '/me' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ user: null }))
      const { _id, ...u } = s.user
      const [skills, projects, memoriesCount] = await Promise.all([
        db.collection('skills').find({ userId: s.user.id }).toArray(),
        db.collection('projects').find({ userId: s.user.id }).toArray(),
        db.collection('memories').countDocuments({ userId: s.user.id }),
      ])
      return handleCORS(NextResponse.json({
        user: u,
        skills: skills.map(({ _id, ...x }) => x),
        projects: projects.map(({ _id, ...x }) => x),
        memoriesCount,
        connected: { google: !!(await getUserGoogleTokens(s.user.id)) },
      }))
    }

    if (route === '/profile' && method === 'PUT') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const allowed = ['name', 'headline', 'bio', 'location', 'targetRole', 'yearsExperience', 'linkedinUrl', 'githubUrl', 'portfolioUrl']
      const update = {}
      for (const k of allowed) if (k in body) update[k] = body[k]
      update.updatedAt = new Date()
      await db.collection('users').updateOne({ id: s.user.id }, { $set: update })
      const u = await db.collection('users').findOne({ id: s.user.id })
      const { _id, ...rest } = u
      return handleCORS(NextResponse.json({ user: rest }))
    }

    // ============ SKILLS ============
    if (route === '/skills' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const name = (body.name || '').trim()
      if (!name) return handleCORS(NextResponse.json({ error: 'Name required' }, { status: 400 }))
      const doc = { id: uuidv4(), userId: s.user.id, name, level: body.level || 'intermediate', createdAt: new Date() }
      await db.collection('skills').insertOne(doc)
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/skills/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/skills/', '')
      await db.collection('skills').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ PROJECTS ============
    if (route === '/projects' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const name = (body.name || '').trim()
      if (!name) return handleCORS(NextResponse.json({ error: 'Name required' }, { status: 400 }))
      const doc = {
        id: uuidv4(), userId: s.user.id, name,
        description: body.description || '', url: body.url || '',
        tech: body.tech || [], createdAt: new Date(),
      }
      await db.collection('projects').insertOne(doc)
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/projects/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/projects/', '')
      await db.collection('projects').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ MEMORIES (Knowledge Graph) ============
    if (route === '/memories' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const mem = await db.collection('memories').find({ userId: s.user.id }).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(mem.map(({ _id, ...x }) => x)))
    }
    if (route === '/memories' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const fact = (body.fact || '').trim()
      if (!fact) return handleCORS(NextResponse.json({ error: 'Fact required' }, { status: 400 }))
      const doc = { id: uuidv4(), userId: s.user.id, fact, createdAt: new Date() }
      await db.collection('memories').insertOne(doc)
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/memories/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/memories/', '')
      await db.collection('memories').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ GOOGLE: GMAIL ============
    if (route === '/google/gmail' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const client = await getAuthedGoogle(s.user.id)
      if (!client) return handleCORS(NextResponse.json({ error: 'Google not connected' }, { status: 400 }))
      const url = new URL(request.url)
      const q = url.searchParams.get('q') || 'category:primary (recruiter OR interview OR opportunity OR "job") newer_than:30d'
      const gmail = gmailApi(client)
      const list = await gmail.users.messages.list({ userId: 'me', q, maxResults: 15 })
      const items = list.data.messages || []
      const messages = await Promise.all(items.map(async ({ id }) => {
        const m = await gmail.users.messages.get({ userId: 'me', id, format: 'full' })
        const h = extractHeaders(m.data)
        const text = extractText(m.data.payload) || m.data.snippet || ''
        return {
          id, threadId: m.data.threadId,
          from: h.from, to: h.to, subject: h.subject, date: h.date,
          snippet: m.data.snippet,
          text: text.slice(0, 4000),
        }
      }))
      return handleCORS(NextResponse.json({ messages }))
    }

    // ============ GOOGLE: CALENDAR ============
    if (route === '/google/calendar' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const client = await getAuthedGoogle(s.user.id)
      if (!client) return handleCORS(NextResponse.json({ error: 'Google not connected' }, { status: 400 }))
      const cal = calendarApi(client)
      const r = await cal.events.list({
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date().toISOString(),
        maxResults: 20,
      })
      return handleCORS(NextResponse.json({ events: r.data.items || [] }))
    }

    if (route === '/google/calendar/events' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const client = await getAuthedGoogle(s.user.id)
      if (!client) return handleCORS(NextResponse.json({ error: 'Google not connected' }, { status: 400 }))
      const body = await request.json()
      if (!body.summary || !body.start || !body.end) {
        return handleCORS(NextResponse.json({ error: 'summary, start, end required' }, { status: 400 }))
      }
      const cal = calendarApi(client)
      const r = await cal.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: body.summary,
          description: body.description || '',
          start: body.start,
          end: body.end,
          location: body.location || undefined,
        },
      })
      return handleCORS(NextResponse.json({ event: r.data }))
    }

    // ============ GOOGLE: DRIVE ============
    if (route === '/google/drive' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const client = await getAuthedGoogle(s.user.id)
      if (!client) return handleCORS(NextResponse.json({ error: 'Google not connected' }, { status: 400 }))
      const drive = driveApi(client)
      const r = await drive.files.list({
        pageSize: 30,
        orderBy: 'modifiedTime desc',
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)',
        q: "trashed = false",
      })
      return handleCORS(NextResponse.json({ files: r.data.files || [] }))
    }

    // ============ AI: CHAT (with memory) ============
    if (route === '/ai/chat' && method === 'POST') {
      const body = await request.json()
      const sessionId = (body.sessionId || uuidv4()).toString()
      const message = (body.message || '').toString().trim()
      if (!message) return handleCORS(NextResponse.json({ error: 'Empty message' }, { status: 400 }))

      const s = await getSession()
      let contextStr = ''
      if (s) {
        const ctx = await loadUserContext(s.user.id)
        contextStr = contextToString(ctx)
      }

      const chats = db.collection('career_chats')
      const existing = await chats.findOne({ sessionId })
      const history = (existing?.messages || []).slice(-20)

      const messages = [
        { role: 'system', content: `You are Veyra, an elite AI career coach and career OS. You give sharp, actionable, encouraging career advice — concise, structured, and personal. Use bullet points where helpful. When appropriate, ask 1 clarifying question. Never fabricate job offers or guarantee outcomes.\n\n${contextStr ? `KNOWN USER CONTEXT (use this to personalize; do not repeat verbatim):\n${contextStr}` : 'The user is not signed in — give great generic advice.'}` },
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ]
      const answer = await complete(messages)
      const now = new Date()
      await chats.updateOne(
        { sessionId },
        {
          $setOnInsert: { id: uuidv4(), sessionId, userId: s?.user?.id || null, createdAt: now },
          $set: { updatedAt: now },
          $push: { messages: { $each: [
            { role: 'user', content: message, createdAt: now },
            { role: 'assistant', content: answer, createdAt: now },
          ] } },
        },
        { upsert: true },
      )
      // Fire-and-forget memory extraction for signed-in users
      if (s) upsertMemoriesFromMessage(s.user.id, message, answer).catch(() => {})
      return handleCORS(NextResponse.json({ sessionId, answer }))
    }

    // ============ AI: ATS ANALYZER ============
    if (route === '/ai/ats' && method === 'POST') {
      const body = await request.json()
      const resume = (body.resume || '').toString().trim()
      const jobDescription = (body.jobDescription || '').toString().trim()
      if (resume.length < 30) return handleCORS(NextResponse.json({ error: 'Please paste your resume.' }, { status: 400 }))
      const messages = [
        { role: 'system', content: 'You are a strict expert ATS evaluator. Return only valid JSON.' },
        { role: 'user', content: `Analyze this resume${jobDescription ? ' against the job description' : ''}.\n\n== RESUME ==\n${resume}\n\n${jobDescription ? `== JOB DESCRIPTION ==\n${jobDescription}` : ''}\n\nReturn JSON with keys: atsScore(number 0-100), summary(string), strengths(string[]), weaknesses(string[]), matchedKeywords(string[]), missingKeywords(string[]), formattingIssues(string[]), impactScore(number 0-100), clarityScore(number 0-100), recommendations(string[] 5 items).` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // ============ AI: TAILOR ============
    if (route === '/ai/tailor' && method === 'POST') {
      const body = await request.json()
      const resume = (body.resume || '').toString().trim()
      const jobDescription = (body.jobDescription || '').toString().trim()
      if (resume.length < 30) return handleCORS(NextResponse.json({ error: 'Please paste your resume.' }, { status: 400 }))
      const messages = [
        { role: 'system', content: 'You are an elite resume writer. Truthful — never invent facts. Return only valid JSON.' },
        { role: 'user', content: `Rewrite the resume for ATS optimization${jobDescription ? ' targeting the job description' : ''}.\n\n== RESUME ==\n${resume}\n\n${jobDescription ? `== JOB DESCRIPTION ==\n${jobDescription}` : ''}\n\nReturn JSON: tailoredResume(string, clean plain text with sections), summaryLine(string), topBullets(string[5]), keywordsAdded(string[]), changesExplained(string[5]).` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // ============ AI: RESUME GEN FROM PROFILE ============
    if (route === '/ai/resume/generate' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Sign in first' }, { status: 401 }))
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const messages = [
        { role: 'system', content: 'You are an elite resume writer. Generate a professional, ATS-optimized resume from the user profile below. Use only facts provided. Return only valid JSON.' },
        { role: 'user', content: `USER PROFILE:\n${ctxStr}\n\nGenerate a full one-page resume. Return JSON: resume(string plain text, with sections: SUMMARY, EXPERIENCE, PROJECTS, SKILLS, EDUCATION), highlights(string[5] key bullets).` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // ============ AI: OPPORTUNITY ENGINE ============
    if (route === '/ai/opportunities' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Sign in first' }, { status: 401 }))
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const body = await request.json().catch(() => ({}))
      const filter = body.filter || ''
      const messages = [
        { role: 'system', content: 'You are Veyra Opportunity Engine — an AI that recommends roles, companies, and next steps tailored to a professional. Base everything on the profile provided. Return only valid JSON.' },
        { role: 'user', content: `USER PROFILE:\n${ctxStr}\n\n${filter ? `Additional filter: ${filter}` : ''}\n\nReturn JSON: {"opportunities": [ { "role": string, "company": string, "matchScore": number 0-100, "why": string (1-2 sentence match rationale), "skillGap": string[] (skills to strengthen), "location": string, "salaryRange": string, "level": "entry"|"mid"|"senior"|"staff", "nextStep": string }, ... 6 items ], "topSkillsToLearn": string[5], "careerNextMoves": string[3] }` },
      ]
      const raw = await complete(messages, { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // ============ WAITLIST ============
    if (route === '/waitlist' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').toString().trim().toLowerCase()
      if (!email || !email.includes('@')) return handleCORS(NextResponse.json({ error: 'Invalid email' }, { status: 400 }))
      const doc = { id: uuidv4(), email, createdAt: new Date() }
      await db.collection('waitlist').updateOne({ email }, { $setOnInsert: doc }, { upsert: true })
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
