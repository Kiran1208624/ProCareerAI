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
      const errParam = url.searchParams.get('error')
      const c = await cookies()
      const stored = c.get('veyra_oauth_state')?.value
      c.delete('veyra_oauth_state')
      if (errParam) {
        return NextResponse.redirect(new URL('/?auth_error=' + encodeURIComponent(errParam), request.url))
      }
      if (!code || !state || state !== stored) {
        return NextResponse.redirect(new URL('/?auth_error=state', request.url))
      }
      let tokens, me
      try {
        const client = oauth2Client()
        const tk = await client.getToken(code)
        tokens = tk.tokens
        client.setCredentials(tokens)
        const info = await oauth2Api(client).userinfo.get()
        me = info.data
      } catch (e) {
        console.error('OAuth token exchange failed:', e?.message)
        return NextResponse.redirect(new URL('/?auth_error=' + encodeURIComponent(e?.message || 'token_exchange'), request.url))
      }

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
      const allowed = ['name', 'headline', 'bio', 'location', 'targetRole', 'yearsExperience', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'role', 'discoverable', 'orgName', 'orgType']
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

    // ============ RESUME VERSIONS ============
    if (route === '/resume-versions' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const docs = await db.collection('resume_versions').find({ userId: s.user.id }).sort({ createdAt: -1 }).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, ...x }) => x)))
    }
    if (route === '/resume-versions' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const doc = {
        id: uuidv4(), userId: s.user.id,
        name: (body.name || 'Untitled').toString().slice(0, 80),
        template: body.template || 'modern',
        content: body.content || '',
        sections: body.sections || null,
        createdAt: new Date(), updatedAt: new Date(),
      }
      await db.collection('resume_versions').insertOne(doc)
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/resume-versions/') && method === 'PUT') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/resume-versions/', '')
      const body = await request.json()
      const update = { updatedAt: new Date() }
      for (const k of ['name', 'template', 'content', 'sections']) if (k in body) update[k] = body[k]
      await db.collection('resume_versions').updateOne({ id, userId: s.user.id }, { $set: update })
      const doc = await db.collection('resume_versions').findOne({ id, userId: s.user.id })
      if (!doc) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/resume-versions/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/resume-versions/', '')
      await db.collection('resume_versions').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ ANALYTICS ============
    if (route === '/analytics' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const uid = s.user.id
      const [jobs, interviews, letters, chats, memoriesCount] = await Promise.all([
        db.collection('jobs').find({ userId: uid }).toArray(),
        db.collection('interview_sessions').find({ userId: uid }).toArray(),
        db.collection('cover_letters').countDocuments({ userId: uid }),
        db.collection('career_chats').countDocuments({ userId: uid }),
        db.collection('memories').countDocuments({ userId: uid }),
      ])
      const byStatus = {}
      const stages = ['wishlist', 'saved', 'applied', 'assessment', 'interview', 'offer', 'accepted', 'rejected']
      for (const st of stages) byStatus[st] = 0
      for (const j of jobs) if (j.status in byStatus) byStatus[j.status] += 1
      // Applications per week (last 8 weeks)
      const now = Date.now()
      const weeks = []
      for (let i = 7; i >= 0; i--) {
        const wStart = now - (i + 1) * 7 * 86400000
        const wEnd = now - i * 7 * 86400000
        const count = jobs.filter(j => {
          const t = new Date(j.appliedAt || j.createdAt).getTime()
          return t >= wStart && t < wEnd
        }).length
        const label = new Date(wStart).toLocaleDateString('en', { month: 'short', day: 'numeric' })
        weeks.push({ label, count })
      }
      // Match score distribution
      const scores = jobs.filter(j => j.matchScore != null).map(j => j.matchScore)
      const avgMatch = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      // Offer / interview rate
      const totalApplied = jobs.filter(j => ['applied', 'assessment', 'interview', 'offer', 'accepted', 'rejected'].includes(j.status)).length
      const interviewRate = totalApplied > 0 ? Math.round((jobs.filter(j => ['interview', 'offer', 'accepted'].includes(j.status)).length / totalApplied) * 100) : 0
      const offerRate = totalApplied > 0 ? Math.round((jobs.filter(j => ['offer', 'accepted'].includes(j.status)).length / totalApplied) * 100) : 0
      return handleCORS(NextResponse.json({
        totals: {
          jobs: jobs.length,
          applied: byStatus.applied + byStatus.assessment + byStatus.interview + byStatus.offer + byStatus.accepted + byStatus.rejected,
          interviews: byStatus.interview + byStatus.offer + byStatus.accepted,
          offers: byStatus.offer + byStatus.accepted,
          mockInterviews: interviews.length,
          coverLetters: letters,
          conversations: chats,
          memories: memoriesCount,
        },
        pipeline: stages.map(st => ({ stage: st, count: byStatus[st] })),
        weekly: weeks,
        avgMatch,
        interviewRate,
        offerRate,
      }))
    }

    // ============ JOBS TRACKER ============
    if (route === '/jobs' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const jobs = await db.collection('jobs').find({ userId: s.user.id }).sort({ updatedAt: -1 }).toArray()
      return handleCORS(NextResponse.json(jobs.map(({ _id, ...x }) => x)))
    }
    if (route === '/jobs' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const now = new Date()
      const doc = {
        id: uuidv4(), userId: s.user.id,
        company: body.company || '', role: body.role || '',
        location: body.location || '', salary: body.salary || '',
        status: body.status || 'wishlist', // wishlist|saved|applied|assessment|interview|offer|accepted|rejected
        jobUrl: body.jobUrl || '', description: body.description || '',
        notes: body.notes || '', referral: body.referral || '',
        matchScore: body.matchScore ?? null,
        appliedAt: body.status === 'applied' ? now : null,
        createdAt: now, updatedAt: now,
      }
      await db.collection('jobs').insertOne(doc)
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/jobs/') && method === 'PUT') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/jobs/', '')
      const body = await request.json()
      const allowed = ['company', 'role', 'location', 'salary', 'status', 'jobUrl', 'description', 'notes', 'referral', 'matchScore']
      const update = { updatedAt: new Date() }
      for (const k of allowed) if (k in body) update[k] = body[k]
      if (body.status === 'applied') update.appliedAt = update.appliedAt || new Date()
      await db.collection('jobs').updateOne({ id, userId: s.user.id }, { $set: update })
      const doc = await db.collection('jobs').findOne({ id, userId: s.user.id })
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/jobs/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/jobs/', '')
      await db.collection('jobs').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ AI: JOB MATCH % ============
    if (route === '/ai/job-match' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const raw = await complete([
        { role: 'system', content: 'You compute honest, evidence-based match scores. Return JSON only.' },
        { role: 'user', content: `User profile:\n${ctxStr}\n\nJob: ${body.company || ''} — ${body.role || ''}\nDescription:\n${body.description || ''}\n\nReturn JSON: {"matchScore": number 0-100, "why": string (1-2 sentences), "topStrengths": string[3], "topGaps": string[3], "prepPlan": string[3]}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      if (body.jobId) {
        await db.collection('jobs').updateOne({ id: body.jobId, userId: s.user.id }, { $set: { matchScore: data.matchScore, updatedAt: new Date() } })
      }
      return handleCORS(NextResponse.json(data))
    }

    // ============ AI: COVER LETTER ============
    if (route === '/ai/cover-letter' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const tone = body.tone || 'professional and warm'
      const raw = await complete([
        { role: 'system', content: 'You write world-class cover letters — concise (~250 words), specific, truthful. Never invent facts. Return JSON only.' },
        { role: 'user', content: `Write a cover letter for: ${body.company || ''} — ${body.role || ''}\nJob description:\n${body.description || ''}\n\nCandidate profile:\n${ctxStr}\n\nTone: ${tone}\n\nReturn JSON: {"letter": string (the full letter, plain text with paragraph breaks), "highlights": string[3] (why this letter works), "openingHook": string}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      // Save
      const doc = { id: uuidv4(), userId: s.user.id, company: body.company || '', role: body.role || '', tone, letter: data.letter, highlights: data.highlights, createdAt: new Date() }
      await db.collection('cover_letters').insertOne(doc)
      return handleCORS(NextResponse.json({ ...data, id: doc.id }))
    }
    if (route === '/cover-letters' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const docs = await db.collection('cover_letters').find({ userId: s.user.id }).sort({ createdAt: -1 }).limit(30).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, ...x }) => x)))
    }
    if (route.startsWith('/cover-letters/') && method === 'DELETE') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const id = route.replace('/cover-letters/', '')
      await db.collection('cover_letters').deleteOne({ id, userId: s.user.id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // ============ AI: MOCK INTERVIEW ============
    if (route === '/ai/mock-interview' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const sessionId = (body.sessionId || uuidv4()).toString()
      const message = (body.message || '').toString().trim()
      const mode = body.mode || 'behavioral' // behavioral | technical | hr
      const role = body.role || 'Software Engineer'
      const company = body.company || ''

      const chats = db.collection('interview_sessions')
      const existing = await chats.findOne({ sessionId })
      const isNew = !existing
      const history = (existing?.messages || []).slice(-20)
      const ctx = await loadUserContext(s.user.id)

      const systemPrompt = `You are an expert ${mode} interviewer${company ? ' at ' + company : ''} for the role of ${role}. Simulate a realistic interview. Ask ONE question at a time. Wait for the candidate's answer. After each answer, provide brief inline feedback in this format:\n\n📝 Feedback:\n- Strength: [one]\n- Improve: [one specific tip]\n- Score: [0-100]\n\nThen ask the next question. Cover 5 questions total, then give a final summary with overall score, confidence score, communication score, and 3 improvement tips.\n\nCandidate context:\n${contextToString(ctx)}`

      let messages
      if (isNew && !message) {
        messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Begin the interview. Introduce yourself briefly and ask the first question.` },
        ]
      } else {
        messages = [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: message || 'continue' },
        ]
      }
      const answer = await complete(messages)
      const now = new Date()
      await chats.updateOne(
        { sessionId },
        {
          $setOnInsert: { id: uuidv4(), sessionId, userId: s.user.id, mode, role, company, createdAt: now },
          $set: { updatedAt: now },
          $push: { messages: { $each: [
            ...(message ? [{ role: 'user', content: message, createdAt: now }] : []),
            { role: 'assistant', content: answer, createdAt: now },
          ] } },
        },
        { upsert: true },
      )
      return handleCORS(NextResponse.json({ sessionId, answer, mode, role, company }))
    }
    if (route === '/interviews' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const docs = await db.collection('interview_sessions').find({ userId: s.user.id }).sort({ updatedAt: -1 }).limit(20).toArray()
      return handleCORS(NextResponse.json(docs.map(({ _id, messages, ...x }) => ({ ...x, turns: (messages || []).length }))))
    }

    // ============ AI: CAREER DNA ============
    if (route === '/ai/career-dna' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const answers = body.answers || {} // { personality, values, goal5yr, energizes, drains, learningStyle, riskTolerance }
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const raw = await complete([
        { role: 'system', content: "You are a career psychologist and coach. Analyze a person's Career DNA from their questionnaire and profile. Insightful, sharp, non-generic. Return JSON only." },
        { role: 'user', content: `Questionnaire answers:\n${JSON.stringify(answers, null, 2)}\n\nProfile:\n${ctxStr}\n\nReturn JSON: {"personality":{"type":string,"description":string,"traits":string[5]}, "workStyle": string, "strengths": string[5], "growthAreas": string[3], "energyDrivers": string[3], "careerMatches": [{"role": string, "matchScore": number 0-100, "why": string}] (5 items), "idealEnvironment": string, "learningStyle": string, "topCoreValues": string[5], "twelveMonthRecommendation": string}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      await db.collection('career_dna').updateOne(
        { userId: s.user.id },
        { $set: { userId: s.user.id, answers, report: data, updatedAt: new Date() }, $setOnInsert: { id: uuidv4(), createdAt: new Date() } },
        { upsert: true },
      )
      return handleCORS(NextResponse.json(data))
    }
    if (route === '/career-dna' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const doc = await db.collection('career_dna').findOne({ userId: s.user.id })
      if (!doc) return handleCORS(NextResponse.json({ report: null }))
      const { _id, ...rest } = doc
      return handleCORS(NextResponse.json(rest))
    }

    // ============ AI: LEARNING ROADMAP ============
    if (route === '/ai/roadmap' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const horizon = body.horizon || '90d' // 90d | 6mo | 1yr
      const targetRole = body.targetRole || ''
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const raw = await complete([
        { role: 'system', content: 'You create sharp, realistic learning roadmaps. Return JSON only.' },
        { role: 'user', content: `Profile:\n${ctxStr}\n\nHorizon: ${horizon}\nTarget role: ${targetRole || 'align with profile targetRole'}\n\nReturn JSON: {"horizon": string, "goal": string, "milestones": [{"week": string (e.g. "Weeks 1-2"), "focus": string, "deliverables": string[2-4], "resources": [{"type":"course|book|project|cert","title":string,"url":string?}]}] (4-8 items), "skillsToLearn": string[6], "projectsToBuild": string[3], "successMetrics": string[3]}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      await db.collection('roadmaps').insertOne({ id: uuidv4(), userId: s.user.id, horizon, targetRole, plan: data, createdAt: new Date() })
      return handleCORS(NextResponse.json(data))
    }

    // ============ AI: SKILL GAP ANALYSIS ============
    if (route === '/ai/skill-gap' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const targetRole = body.targetRole || ''
      const jd = body.jobDescription || ''
      if (!targetRole && !jd) return handleCORS(NextResponse.json({ error: 'targetRole or jobDescription required' }, { status: 400 }))
      const ctx = await loadUserContext(s.user.id)
      const ctxStr = contextToString(ctx)
      const raw = await complete([
        { role: 'system', content: 'You are a career strategist and market-aware skill analyst. Return JSON only.' },
        { role: 'user', content: `User profile:\n${ctxStr}\n\nTarget role: ${targetRole}\n${jd ? `JD:\n${jd}` : ''}\n\nReturn JSON: {"targetRole": string, "readinessScore": number 0-100, "haveSkills": string[], "missingSkills": [{"skill": string, "importance":"critical|high|medium", "howToLearn": string, "timeEstimate": string}], "quickWins": string[3], "longerBets": string[3], "estimatedTimeToReady": string}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }

    // ============ NOTIFICATIONS (derived) ============
    if (route === '/notifications' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const notifications = []
      // From jobs: interviews / deadlines
      const jobs = await db.collection('jobs').find({ userId: s.user.id }).toArray()
      const now = Date.now()
      for (const j of jobs) {
        if (j.status === 'applied' && j.appliedAt) {
          const days = Math.floor((now - new Date(j.appliedAt).getTime()) / 86400000)
          if (days === 5 || days === 7) notifications.push({ id: 'follow-' + j.id, type: 'follow-up', title: `Follow up on ${j.company}`, body: `You applied ${days} days ago. Consider a polite follow-up.`, createdAt: new Date() })
        }
        if (j.status === 'interview') notifications.push({ id: 'prep-' + j.id, type: 'prep', title: `Prep for ${j.company} interview`, body: `Start a mock interview for the ${j.role} role.`, createdAt: new Date() })
      }
      // From memories / profile - one-off welcome
      const profile = s.user
      if (!profile.headline) notifications.push({ id: 'headline', type: 'profile', title: 'Add your headline', body: 'A crisp headline helps Veyra personalize every recommendation.', createdAt: new Date() })
      if (!profile.targetRole) notifications.push({ id: 'target', type: 'profile', title: 'Set your target role', body: 'Tell Veyra your dream role so the Opportunity Engine gets sharper.', createdAt: new Date() })
      return handleCORS(NextResponse.json({ notifications }))
    }

    // ============ CANDIDATE DISCOVERY (Recruiter / College portals) ============
    if (route === '/candidates' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const role = s.user.role
      if (!['recruiter', 'company_admin', 'college_admin'].includes(role)) {
        return handleCORS(NextResponse.json({ error: 'Only recruiters, companies, and college admins can browse candidates' }, { status: 403 }))
      }
      const url = new URL(request.url)
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const skill = (url.searchParams.get('skill') || '').toLowerCase()
      const filter = { discoverable: true, id: { $ne: s.user.id } }
      if (role === 'college_admin' && s.user.orgName) filter.orgName = s.user.orgName
      const users = await db.collection('users').find(filter).sort({ updatedAt: -1 }).limit(200).toArray()
      const enriched = []
      for (const u of users) {
        if (q && !(`${u.name || ''} ${u.headline || ''} ${u.location || ''}`.toLowerCase().includes(q))) continue
        const skills = await db.collection('skills').find({ userId: u.id }).toArray()
        if (skill && !skills.some(sk => sk.name.toLowerCase().includes(skill))) continue
        const projectsCount = await db.collection('projects').countDocuments({ userId: u.id })
        enriched.push({
          id: u.id, name: u.name, picture: u.picture, headline: u.headline,
          location: u.location, targetRole: u.targetRole, yearsExperience: u.yearsExperience,
          bio: u.bio, orgName: u.orgName, orgType: u.orgType,
          skills: skills.map(s => s.name), projectsCount,
        })
      }
      return handleCORS(NextResponse.json({ candidates: enriched, total: enriched.length }))
    }
    if (route.startsWith('/candidates/') && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      if (!['recruiter', 'company_admin', 'college_admin'].includes(s.user.role)) {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }
      const cid = route.replace('/candidates/', '')
      const u = await db.collection('users').findOne({ id: cid, discoverable: true })
      if (!u) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const [skills, projects] = await Promise.all([
        db.collection('skills').find({ userId: cid }).toArray(),
        db.collection('projects').find({ userId: cid }).toArray(),
      ])
      return handleCORS(NextResponse.json({
        candidate: {
          id: u.id, name: u.name, picture: u.picture, headline: u.headline,
          bio: u.bio, location: u.location, targetRole: u.targetRole,
          yearsExperience: u.yearsExperience, linkedinUrl: u.linkedinUrl,
          githubUrl: u.githubUrl, portfolioUrl: u.portfolioUrl, orgName: u.orgName,
          skills: skills.map(s => s.name),
          projects: projects.map(({ _id, userId, ...x }) => x),
        },
      }))
    }

    // ============ AI: CODING INTERVIEW ============
    if (route === '/ai/coding-challenge' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const topic = body.topic || 'arrays'
      const difficulty = body.difficulty || 'medium'
      const language = body.language || 'JavaScript'
      const raw = await complete([
        { role: 'system', content: 'You design great coding interview problems. Return JSON only.' },
        { role: 'user', content: `Design a ${difficulty} coding interview problem on the topic: ${topic}. Language: ${language}.\n\nReturn JSON: {"title": string, "difficulty": string, "prompt": string (full problem statement), "constraints": string[], "examples": [{"input": string, "output": string, "explanation": string}] (2 items), "hints": string[3], "starterCode": string}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      return handleCORS(NextResponse.json(data))
    }
    if (route === '/ai/coding-grade' && method === 'POST') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const raw = await complete([
        { role: 'system', content: 'You are a rigorous but supportive coding interviewer. Grade candidate solutions on correctness, complexity, code quality, and edge cases. Return JSON only.' },
        { role: 'user', content: `Problem:\n${body.problem || ''}\n\nCandidate solution (${body.language || 'JavaScript'}):\n\`\`\`\n${body.code || ''}\n\`\`\`\n\nReturn JSON: {"overallScore": number 0-100, "correctness": number 0-100, "complexity": {"time": string, "space": string}, "codeQuality": number 0-100, "edgeCases": string[], "strengths": string[3], "improvements": string[3], "verdict": string, "improvedSolution": string}` },
      ], { response_format: { type: 'json_object' } })
      const data = parseJson(raw)
      await db.collection('coding_attempts').insertOne({ id: uuidv4(), userId: s.user.id, problem: body.problem, code: body.code, language: body.language, grade: data, createdAt: new Date() })
      return handleCORS(NextResponse.json(data))
    }

    // ============ DAILY BRIEFING ============
    if (route === '/daily-briefing' && method === 'GET') {
      const s = await getSession()
      if (!s) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const uid = s.user.id
      const now = new Date()
      const [jobs, ctx] = await Promise.all([
        db.collection('jobs').find({ userId: uid }).toArray(),
        loadUserContext(uid),
      ])
      let events = []
      try {
        const client = await getAuthedGoogle(uid)
        if (client) {
          const cal = calendarApi(client)
          const r = await cal.events.list({
            calendarId: 'primary', singleEvents: true, orderBy: 'startTime',
            timeMin: now.toISOString(),
            timeMax: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            maxResults: 5,
          })
          events = (r.data.items || []).map(e => ({ summary: e.summary, start: e.start?.dateTime || e.start?.date, location: e.location }))
        }
      } catch {}
      const followUps = jobs.filter(j => j.status === 'applied' && j.appliedAt).filter(j => {
        const days = Math.floor((now - new Date(j.appliedAt)) / 86400000)
        return days >= 5 && days <= 14
      }).map(j => ({ company: j.company, role: j.role, days: Math.floor((now - new Date(j.appliedAt)) / 86400000) }))
      const activeInterviews = jobs.filter(j => j.status === 'interview' || j.status === 'assessment')

      const raw = await complete([
        { role: 'system', content: 'You write a short, energizing morning career briefing for a busy professional. Warm, concise, motivating. Return JSON only.' },
        { role: 'user', content: `USER: ${contextToString(ctx)}\n\nToday: ${now.toDateString()}\nUpcoming events today: ${JSON.stringify(events)}\nPending follow-ups: ${JSON.stringify(followUps)}\nActive interviews in pipeline: ${activeInterviews.length}\n\nReturn JSON: {"greeting": string (personal, warm, 1 sentence), "focusOfDay": string, "todoList": string[3-5], "opportunityHint": string, "motivationalNote": string}` },
      ], { response_format: { type: 'json_object' } })
      const briefing = parseJson(raw)
      return handleCORS(NextResponse.json({ briefing, events, followUps, date: now.toISOString() }))
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
