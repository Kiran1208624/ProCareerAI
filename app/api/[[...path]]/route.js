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
  if (_db) {
    return _db
  }

  if (!_client) {
    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL is not configured')
    }

    _client = new MongoClient(process.env.MONGO_URL)
  }

  await _client.connect()

  _db = _client.db(process.env.DB_NAME || 'veyra_ai')

  if (!_db) {
    throw new Error('Failed to initialize MongoDB database')
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
    secure: process.env.NODE_ENV === 'production',
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

  // Persist refreshed Google tokens back to MongoDB.
  client.on('tokens', async (newTokens) => {
    try {
      await saveUserGoogleTokens(userId, newTokens)
    } catch (error) {
      console.error('Failed to save refreshed Google tokens:', error)
    }
  })

  // IMPORTANT:
  // Force Google OAuth to obtain a valid access token before
  // any Gmail / Calendar / Drive request is made.
  try {
    await client.getAccessToken()
  } catch (error) {
    console.error('Google access-token refresh failed:', error)
    return null
  }

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

      console.log("GOOGLE_REDIRECT_URI =", process.env.GOOGLE_REDIRECT_URI)

      await db.collection('oauth_states').insertOne({
        state,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })

      console.log("GOOGLE OAUTH STATE SAVED:", state)
      const url = oauth2Client().generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        scope: GOOGLE_SCOPES,
        state,
      })

      console.log(url)

      const response = NextResponse.redirect(url)


      return handleCORS(response)
    }


    if (route === '/auth/google/callback' && method === 'GET') {
      const url = new URL(request.url)

      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const errParam = url.searchParams.get('error')

      const oauthState = state
  ? await db.collection('oauth_states').findOne({
      state,
      expiresAt: { $gt: new Date() },
    })
  : null

console.log("STATE FROM GOOGLE:", state)
console.log("STATE FROM DATABASE:", oauthState?.state)

if (errParam) {
  return NextResponse.redirect(
    new URL(
      '/?auth_error=' + encodeURIComponent(errParam),
      request.url
    )
  )
}

if (!code || !state || !oauthState) {
  console.log("GOOGLE OAUTH STATE VALIDATION FAILED")
  return NextResponse.redirect(
    new URL('/?auth_error=state', request.url)
  )
}

// State is valid — consume it so it cannot be reused.
await db.collection('oauth_states').deleteOne({
  _id: oauthState._id,
})
      let tokens, me
      try {
        const client = oauth2Client()
        const tk = await client.getToken(code)
tokens = tk.tokens


client.setCredentials(tokens)

const ticket = await client.verifyIdToken({
  idToken: tokens.id_token,
  audience: process.env.GOOGLE_CLIENT_ID,
})

const payload = ticket.getPayload()

me = {
  id: payload.sub,
  email: payload.email,
  name: payload.name,
  picture: payload.picture,
  verified_email: payload.email_verified,
  locale: payload.locale,
}
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

          await db.collection('sessions').insertOne({
            token: sessionToken,
            userId,
            createdAt: now,
            expiresAt,
          })

          // IMPORTANT:
          // Set the session cookie on the SAME response that redirects
          // the browser to the dashboard.
          const response = NextResponse.redirect(
            new URL('/dashboard', request.url)
          )

          response.cookies.set(SESSION_COOKIE, sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
          })

          console.log('SESSION COOKIE SET:', SESSION_COOKIE)

          return response
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

  if (!s) {
    return handleCORS(
      NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    )
  }

  const client = await getAuthedGoogle(s.user.id)

  if (!client) {
    return handleCORS(
      NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 }
      )
    )
  }

  const url = new URL(request.url)

  // Optional Gmail search.
  // If no q is provided, fetch latest emails.
  const q = url.searchParams.get('q') || ''

  try {
    // --------------------------------------------------
    // STEP 1: Get latest message IDs
    // --------------------------------------------------

    const listParams = {
      maxResults: 20,
    }

    if (q.trim()) {
      listParams.q = q.trim()
    }

    const listResponse = await client.request({
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      params: listParams,
    })

    const items = listResponse.data.messages || []

    // --------------------------------------------------
    // STEP 2: Fetch messages in small batches
    // Avoid Gmail 429 "Too many concurrent requests"
    // --------------------------------------------------

    const messages = []

    const batchSize = 10

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)

      const results = await Promise.all(
        batch.map(async ({ id }) => {
          try {
            const messageResponse = await client.request({
              url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
              params: {
                format: 'full',
              },
            })

            const message = messageResponse.data
            const h = extractHeaders(message)

            const text =
              extractText(message.payload) ||
              message.snippet ||
              ''

            return {
              id,
              threadId: message.threadId,
              messageId: h['message-id'] || '',
              from: h.from || '',
              to: h.to || '',
              subject: h.subject || '(no subject)',
              date: h.date || '',
              snippet: message.snippet || '',
              text: text.slice(0, 4000),

              // Gmail internal timestamp.
              // Used to guarantee newest-first ordering.
              internalDate: Number(message.internalDate || 0),

              // Useful for frontend unread/read state.
              labelIds: message.labelIds || [],
            }
          } catch (error) {
            console.error(
              `Failed to load Gmail message ${id}:`,
              error.message
            )

            return null
          }
        })
      )

      messages.push(
        ...results.filter(Boolean)
      )
    }

    // --------------------------------------------------
    // STEP 3: Sort newest → oldest
    // --------------------------------------------------

    messages.sort(
      (a, b) => b.internalDate - a.internalDate
    )

    // --------------------------------------------------
    // STEP 4: Return clean response
    // --------------------------------------------------

    return handleCORS(
      NextResponse.json({
        messages,
        total: messages.length,
        query: q || null,
      })
    )

  } catch (error) {
    console.error('GMAIL API ERROR:', error)

    return handleCORS(
      NextResponse.json(
        {
          error:
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to load Gmail',
        },
        {
          status: error.response?.status || 500,
        }
      )
    )
  }
}

    // ============ GOOGLE: GMAIL DRAFT ============
    if (route === '/google/gmail/draft' && method === 'POST') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      const client = await getAuthedGoogle(s.user.id)

      if (!client) {
        return handleCORS(
          NextResponse.json(
            { error: 'Google not connected' },
            { status: 400 }
          )
        )
      }

      try {
        const body = await request.json()

        const from = (body.from || '').toString().trim()
        const to = (body.to || '').toString().trim()
        const subject = (body.subject || '').toString().trim()
        const instruction = (body.instruction || '').toString().trim()
        const emailText = (body.emailText || '').toString().trim()
        if (!to || !emailText) {
          return handleCORS(
            NextResponse.json(
              { error: 'Recipient and email content are required' },
              { status: 400 }
            )
          )
        }

        const messages = [
          {
            role: 'system',
            content: `
You are Veyra AI, an expert career communication assistant.

The email is being written and sent by Kiran.
Always write from Kiran's perspective.
If you include a signature, use "Kiran".
Never use the recruiter's name as the sender or signature.


Write professional recruiter/job-related email replies.

Rules:
- Be concise and natural.
- Never invent qualifications, experience, dates, salary, interviews, or commitments.
- Do not claim the user has done something unless the supplied context says so.
- Keep the tone confident, polite and professional.
- Return JSON only.
`
          },
          {
            role: 'user',
            content: `
Create a reply to this recruiter/career email.

FROM:
${from}

TO:
${to}

SUBJECT:
${subject}

ORIGINAL EMAIL:
${emailText}

USER INSTRUCTION:
${instruction || 'Write a professional and interested reply. Ask for the next steps if appropriate.'}

Return exactly:

{
  "subject": "string",
  "body": "string"
}
`
          }
        ]
        console.log('CALENDAR DETECTOR INPUT:', {
          emailDate,
          from,
          subject,
          emailText: emailText.slice(0, 4000),
        })
        const raw = await complete(
          messages,
          { response_format: { type: 'json_object' } }
        )

        const data = parseJson(raw)
        console.log('CALENDAR DETECTOR RAW:', raw)
        console.log('CALENDAR DETECTOR PARSED:', data)
        return handleCORS(
          NextResponse.json({
            to,
            subject: draft.subject || (
              subject.toLowerCase().startsWith('re:')
                ? subject
                : `Re: ${subject}`
            ),
            body: draft.body || '',
          })
        )
      } catch (error) {
        console.error('GMAIL DRAFT ERROR:', error)

        return handleCORS(
          NextResponse.json(
            {
              error:
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to generate email draft',
            },
            { status: error.response?.status || 500 }
          )
        )
      }
    }

    // ============ GOOGLE: GMAIL SEND ============
    if (route === '/google/gmail/send' && method === 'POST') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      const client = await getAuthedGoogle(s.user.id)

      if (!client) {
        return handleCORS(
          NextResponse.json(
            { error: 'Google not connected' },
            { status: 400 }
          )
        )
      }

      try {
        const body = await request.json()

        const to = (body.to || '').toString().trim()
        const subject = (body.subject || '').toString().trim()
        const emailBody = (body.body || '').toString().trim()
        const threadId = (body.threadId || '').toString().trim()
        const inReplyTo = (body.inReplyTo || '').toString().trim()
        const references = (body.references || '').toString().trim()

        if (!to) {
          return handleCORS(
            NextResponse.json(
              { error: 'Recipient is required' },
              { status: 400 }
            )
          )
        }

        if (!emailBody) {
          return handleCORS(
            NextResponse.json(
              { error: 'Email body is required' },
              { status: 400 }
            )
          )
        }

        if (!subject) {
          return handleCORS(
            NextResponse.json(
              { error: 'Subject is required' },
              { status: 400 }
            )
          )
        }

        const headers = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/plain; charset=UTF-8',
          'Content-Transfer-Encoding: 8bit',
        ]

        if (inReplyTo) {
          headers.push(`In-Reply-To: ${inReplyTo}`)
        }

        if (references) {
          headers.push(`References: ${references}`)
        }

        const mimeMessage =
          headers.join('\r\n') +
          '\r\n\r\n' +
          emailBody

        const raw = Buffer
          .from(mimeMessage, 'utf8')
          .toString('base64url')

        const payload = {
          raw,
        }

        if (threadId) {
          payload.threadId = threadId
        }

        const response = await client.request({
          method: 'POST',
          url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          data: payload,
        })

        return handleCORS(
          NextResponse.json({
            ok: true,
            messageId: response.data?.id || null,
            threadId: response.data?.threadId || threadId || null,
          })
        )
      } catch (error) {
        console.error('GMAIL SEND ERROR:', error)

        return handleCORS(
          NextResponse.json(
            {
              error:
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to send email',
            },
            { status: error.response?.status || 500 }
          )
        )
      }
    }

    // ============ GOOGLE: GMAIL AI COMPOSE ============
if (route === '/google/gmail/compose' && method === 'POST') {
  const s = await getSession()

  if (!s) {
    return handleCORS(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  }

  const client = await getAuthedGoogle(s.user.id)

  if (!client) {
    return handleCORS(
      NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 }
      )
    )
  }

  try {
    const body = await request.json()

    const to = (body.to || '').toString().trim()
    const requestedSubject = (body.subject || '').toString().trim()
    const instruction = (body.instruction || '').toString().trim()

    if (!to) {
      return handleCORS(
        NextResponse.json(
          { error: 'Recipient is required' },
          { status: 400 }
        )
      )
    }

    if (!instruction) {
      return handleCORS(
        NextResponse.json(
          { error: 'Email instruction is required' },
          { status: 400 }
        )
      )
    }

    if (!requestedSubject) {
      return handleCORS(
        NextResponse.json(
          { error: 'Subject is required' },
          { status: 400 }
        )
      )
    }


    const messages = [
      {
        role: 'system',
        content: `
    You are Veyra's intelligent career calendar detector.

    Your job is to detect REAL scheduled career-related events from emails.

    DETECT an event when the email contains a specific scheduled:
    - job interview
    - HR interview
    - technical interview
    - recruiter call
    - hiring manager call
    - hiring manager meeting
    - networking meeting
    - career meeting
    - assessment
    - coding test
    - interview round
    - onboarding/joining appointment
    - application deadline
    - other explicitly scheduled career appointment

    IMPORTANT:
    An email does NOT need to use the exact words "calendar", "meeting", or "appointment".

    Examples that SHOULD be detected:
    - "Your interview is scheduled for August 15 at 11 AM."
    - "We would like to invite you for an interview on Monday at 2 PM."
    - "The next round will be held tomorrow at 10:30 AM."
    - "Please join the recruiter call on August 20 at 4 PM."
    - "Your assessment is scheduled for Friday."
    - "You are invited to a Google Meet interview."
    - "The HR discussion is confirmed for 3 PM."
    - "Please attend the interview at our office."

    DO NOT detect:
    - newsletters
    - marketing emails
    - generic job alerts
    - investment/news emails
    - generic recruiter outreach with no scheduled event
    - rejection emails
    - application acknowledgements with no scheduled date
    - emails merely mentioning an interview without actually scheduling one

    CRITICAL:
    1. Use the email content, subject, sender and email date together.
    2. Resolve relative dates such as "today", "tomorrow", "Monday", "next Friday" using EMAIL DATE as the reference date.
    3. If a specific event is clearly scheduled, detected MUST be true.
    4. Never invent a date or time.
    5. If a date is present but no time is present, keep startTime null.
    6. If a time is present but the date is genuinely unknown, keep date null.
    7. If duration is not stated, use null.
    8. Extract Google Meet, Zoom, Teams, phone number, office address, or other location when present.
    9. Keep the title concise and useful.
    10. confidence must be between 0 and 1.
    11. Return ONLY valid JSON.
        `.trim(),
      },
      {
        role: 'user',
        content: `
    Analyze this career email.

    EMAIL DATE:
    ${emailDate}

    FROM:
    ${from}

    SUBJECT:
    ${subject}

    EMAIL CONTENT:
    ${emailText}

    Determine whether this email contains a REAL scheduled career event.

    Return exactly this JSON:

    {
      "detected": boolean,
      "type": "interview" | "meeting" | "assessment" | "deadline" | "onboarding" | "other" | null,
      "title": string | null,
      "date": "YYYY-MM-DD" | null,
      "startTime": "HH:mm" | null,
      "durationMinutes": number | null,
      "location": string | null,
      "description": string | null,
      "confidence": number
    }

    IMPORTANT:
    - If the email clearly schedules an interview/meeting/assessment, detected must be true.
    - Convert dates to YYYY-MM-DD.
    - Convert times to 24-hour HH:mm.
    - Resolve relative dates using EMAIL DATE.
    - Do not invent missing information.
    - If no real event exists, return detected=false and null event fields.
        `.trim(),
      },
    ]

    const raw = await complete(
      messages,
      { response_format: { type: 'json_object' } }
    )

    const email = parseJson(raw)

    const subject = (email.subject || '').toString().trim()
    const emailBody = (email.body || '').toString().trim()

    if (!subject || !emailBody) {
      throw new Error('AI returned an incomplete email')
    }

    return handleCORS(
      NextResponse.json({
        ok: true,
        to,
        subject,
        body: emailBody,
      })
    )
  } catch (error) {
    console.error('GMAIL AI COMPOSE ERROR:', error)

    return handleCORS(
      NextResponse.json(
        {
          error:
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to compose and send email',
        },
        { status: error.response?.status || 500 }
      )
    )
  }
}

    // ============ GOOGLE: CALENDAR ============
    if (route === '/google/calendar' && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        )
      }

      const client = await getAuthedGoogle(s.user.id)

      if (!client) {
        return handleCORS(
          NextResponse.json(
            { error: 'Google not connected' },
            { status: 400 }
          )
        )
      }

      try {
        const response = await client.request({
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          params: {
            timeMin: new Date().toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 20,
          },
        })

        return handleCORS(
          NextResponse.json({
            events: response.data.items || [],
          })
        )
      } catch (error) {
        console.error('CALENDAR API ERROR:', error)

        return handleCORS(
          NextResponse.json(
            {
              error:
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to load Calendar',
            },
            {
              status: error.response?.status || 500,
            }
          )
        )
      }
    }

    if (route === '/google/calendar/events' && method === 'POST') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        )
      }

      const client = await getAuthedGoogle(s.user.id)

      if (!client) {
        return handleCORS(
          NextResponse.json(
            { error: 'Google not connected' },
            { status: 400 }
          )
        )
      }

      try {
        const body = await request.json()

        if (!body.summary || !body.start || !body.end) {
          return handleCORS(
            NextResponse.json(
              { error: 'summary, start, end required' },
              { status: 400 }
            )
          )
        }

        const requestBody = {
          summary: body.summary,
          description: body.description || '',
          location: body.location || undefined,
          start: body.start,
          end: body.end,
        }

        console.log('CALENDAR CREATE REQUEST:', {
          summary: requestBody.summary,
          start: requestBody.start,
          end: requestBody.end,
          location: requestBody.location,
        })

        const response = await client.request({
          url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: requestBody,
        })

        console.log('CALENDAR EVENT CREATED:', response.data?.id)

        return handleCORS(
          NextResponse.json({
            event: response.data,
          })
        )

      } catch (error) {
        console.error('CALENDAR CREATE ERROR:', error)

        return handleCORS(
          NextResponse.json(
            {
              error:
                error.response?.data?.error?.message ||
                error.message ||
                'Failed to create Calendar event',
            },
            {
              status: error.response?.status || 500,
            }
          )
        )
      }
    }
    // ============ AI: CALENDAR EVENT CREATOR ============
if (route === '/ai/calendar-create' && method === 'POST') {
  const body = await request.json().catch(() => ({}))

  const instruction = (body.instruction || '').toString().trim()

  if (!instruction) {
    return handleCORS(
      NextResponse.json(
        { error: 'Event instruction is required' },
        { status: 400 }
      )
    )
  }

  try {
    const now = new Date()

    const today = now.toISOString().slice(0, 10)

    const messages = [
      {
        role: 'system',
        content: `
You are Veyra AI's calendar event parser.

Convert the user's request into ONE calendar event.

Today's date is:
${today}

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. title must always be a useful event title.
3. date MUST be YYYY-MM-DD.
4. startTime MUST be HH:mm in 24-hour format.
5. "tomorrow" means the calendar date immediately after today.
6. "today" means today's date.
7. Convert AM/PM correctly.
8. If duration is not provided, use 60 minutes.
9. If location is not provided, return null.
10. Never invent a date when the user did not provide enough information.
11. For relative dates such as tomorrow, use today's date above.
12. confidence must be between 0 and 1.

Examples:

User:
"Tomorrow at 3 PM interview with Rahul for 45 minutes on Google Meet."

Return:
{
  "title": "Interview with Rahul",
  "date": "YYYY-MM-DD",
  "startTime": "15:00",
  "durationMinutes": 45,
  "location": "Google Meet",
  "description": "Interview with Rahul",
  "confidence": 1
}

User:
"Meeting with Priya on Friday at 10 AM"

Return:
{
  "title": "Meeting with Priya",
  "date": "YYYY-MM-DD",
  "startTime": "10:00",
  "durationMinutes": 60,
  "location": null,
  "description": "Meeting with Priya",
  "confidence": 1
}
        `.trim(),
      },
      {
        role: 'user',
        content: `
USER REQUEST:

${instruction}

Return exactly this JSON:

{
  "title": "string",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "durationMinutes": number,
  "location": "string or null",
  "description": "string or null",
  "confidence": number
}
        `.trim(),
      },
    ]

    const raw = await complete(
      messages,
      {
        response_format: {
          type: 'json_object',
        },
      }
    )

    console.log('AI CALENDAR RAW:', raw)

    const data = parseJson(raw)

    console.log('AI CALENDAR PARSED:', data)

    const title =
      typeof data.title === 'string'
        ? data.title.trim()
        : ''

    const date =
      typeof data.date === 'string'
        ? data.date.trim()
        : ''

    const startTime =
      typeof data.startTime === 'string'
        ? data.startTime.trim()
        : ''

    const durationMinutes =
      Number(data.durationMinutes) > 0
        ? Number(data.durationMinutes)
        : 60

    const location =
      typeof data.location === 'string'
        ? data.location.trim()
        : null

    const description =
      typeof data.description === 'string'
        ? data.description.trim()
        : null

    const confidence =
      typeof data.confidence === 'number'
        ? Math.max(0, Math.min(1, data.confidence))
        : 0

    // Validate date
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(
        new Date(`${date}T00:00:00`).getTime()
      )

    // Validate time
    const validTime =
      /^\d{2}:\d{2}$/.test(startTime) &&
      Number(startTime.slice(0, 2)) >= 0 &&
      Number(startTime.slice(0, 2)) <= 23 &&
      Number(startTime.slice(3, 5)) >= 0 &&
      Number(startTime.slice(3, 5)) <= 59

    if (!title || !validDate || !validTime) {
      console.error('AI CALENDAR INVALID RESPONSE:', {
        title,
        date,
        startTime,
        raw,
      })

      return handleCORS(
        NextResponse.json(
          {
            error:
              'Veyra could not determine a valid event title, date, or time.',
            raw: data,
          },
          { status: 422 }
        )
      )
    }

    return handleCORS(
      NextResponse.json({
        title,
        date,
        startTime,
        durationMinutes,
        location,
        description,
        confidence,
      })
    )

  } catch (error) {
    console.error('AI CALENDAR CREATE ERROR:', error)

    return handleCORS(
      NextResponse.json(
        {
          error:
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to create calendar event with AI',
        },
        { status: 500 }
      )
    )
  }
}


    // ============ GOOGLE: DRIVE ============
if (route === '/google/drive' && method === 'GET') {
  const s = await getSession()

  if (!s) {
    return handleCORS(
      NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    )
  }

  const client = await getAuthedGoogle(s.user.id)

  if (!client) {
    return handleCORS(
      NextResponse.json(
        { error: 'Google not connected' },
        { status: 400 }
      )
    )
  }

  try {
    const response = await client.request({
      url: 'https://www.googleapis.com/drive/v3/files',
      params: {
        pageSize: 30,
        orderBy: 'modifiedTime desc',
        fields:
          'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)',
        q: 'trashed = false',
      },
    })

    return handleCORS(
      NextResponse.json({
        files: response.data.files || [],
      })
    )
  } catch (error) {
    console.error('DRIVE API ERROR:', error)

    return handleCORS(
      NextResponse.json(
        {
          error:
            error.response?.data?.error?.message ||
            error.message ||
            'Failed to load Drive',
        },
        {
          status: error.response?.status || 500,
        }
      )
    )
  }
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
        // ============ AI: CALENDAR EVENT DETECTOR ============
        if (route === '/ai/calendar-detect' && method === 'POST') {
          const body = await request.json().catch(() => ({}))

          const subject = (body.subject || '').toString().trim()
          const from = (body.from || '').toString().trim()
          const emailText = (body.emailText || '').toString().trim()
          const emailDate = (body.date || '').toString().trim()

          if (!subject && !emailText) {
            return handleCORS(
              NextResponse.json(
                { error: 'Email subject or content is required' },
                { status: 400 }
              )
            )
          }

          const messages = [
            {
              role: 'system',
              content: `
    You are Veyra's career calendar detection engine.

    Analyze an email and determine whether it contains a real calendar-worthy
    career event such as:

    - job interview
    - recruiter call
    - hiring manager meeting
    - assessment
    - technical interview
    - HR interview
    - networking meeting
    - career-related appointment
    - application deadline
    - joining/onboarding date

    Do NOT create an event for ordinary emails, newsletters, job alerts,
    marketing emails, rejection emails, or generic recruiter outreach unless
    a specific scheduled event or deadline is clearly mentioned.

    Never invent a date or time.

    Return ONLY valid JSON.
              `.trim(),
            },
            {
              role: 'user',
              content: `
    EMAIL DATE:
    ${emailDate}

    FROM:
    ${from}

    SUBJECT:
    ${subject}

    EMAIL:
    ${emailText}

    Return exactly this JSON structure:

    {
      "detected": boolean,
      "type": "interview" | "meeting" | "assessment" | "deadline" | "onboarding" | "other" | null,
      "title": string | null,
      "date": "YYYY-MM-DD" | null,
      "startTime": "HH:mm" | null,
      "durationMinutes": number | null,
      "location": string | null,
      "description": string | null,
      "confidence": number
    }

    Rules:

    1. detected must be false if there is no clearly identifiable event.
    2. Never invent missing date/time information.
    3. If only a date is mentioned, keep startTime null.
    4. If duration is not explicitly mentioned, keep durationMinutes null.
    5. If the email contains a Google Meet, Zoom, Teams, office address, or
       other meeting location, extract it.
    6. confidence must be between 0 and 1.
    7. Return null for fields that cannot be determined.
              `.trim(),
            },
          ]

          try {
            const raw = await complete(
              messages,
              { response_format: { type: 'json_object' } }
            )

            const data = parseJson(raw)

            console.log('CALENDAR DETECTOR RAW:', raw)
            console.log('CALENDAR DETECTOR PARSED:', data)

            return handleCORS(
              NextResponse.json(data)
            )
          } catch (error) {
            console.error('CALENDAR DETECTION ERROR:', error)

            return handleCORS(
              NextResponse.json(
                {
                  error:
                    error.message ||
                    'Failed to detect calendar event',
                },
                { status: 500 }
              )
            )
          }
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

        // ============ PUBLIC COMPANY JOBS ============

        if (route === '/public/jobs' && method === 'GET') {
          const jobs = await db
            .collection('jobs')
            .find({
              status: { $in: ['published', 'Published'] },
            })
            .sort({ createdAt: -1 })
            .toArray()

          const companyIds = jobs
            .map((job) => job.companyId)
            .filter(Boolean)

          const companies = companyIds.length
            ? await db
                .collection('companies')
                .find({
                  _id: { $in: companyIds },
                })
                .project({
                  companyName: 1,
                  logo: 1,
                })
                .toArray()
            : []

          const companyMap = new Map(
            companies.map((company) => [
              String(company._id),
              company,
            ])
          )

          return handleCORS(
            NextResponse.json(
              jobs.map(({ _id, ...job }) => {
                const company = companyMap.get(
                  String(job.companyId)
                )

                return {
                  ...job,
                  id: String(_id),
                  companyName:
                    company?.companyName ||
                    job.companyName ||
                    job.company ||
                    'Company',
                  companyLogo:
                    company?.logo || '',
                }
              })
            )
          )
        }
    // ============ PUBLIC JOB DETAIL ============

    if (route.startsWith('/public/jobs/') && method === 'GET') {
      const id = route.replace('/public/jobs/', '')

      let job
      try {
        job = await db.collection('jobs').findOne({
          _id: new (await import('mongodb')).ObjectId(id),
          status: 'published',
        })
      } catch {
        return handleCORS(
          NextResponse.json(
            { error: 'Invalid job id' },
            { status: 400 }
          )
        )
      }

      if (!job) {
        return handleCORS(
          NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        )
      }

      let company = null

if (job.companyId) {
  company = await db.collection('companies').findOne(
    {
      _id: job.companyId,
    },
    {
      projection: {
        companyName: 1,
        logo: 1,
      },
    }
  )
}

const { _id, ...rest } = job

return handleCORS(
  NextResponse.json({
    ...rest,
    id: String(_id),
    companyName:
      company?.companyName ||
      job.companyName ||
      job.company ||
      'Company',
    companyLogo:
      company?.logo || '',
  })
)
    }

    // ============ STUDENT: APPLY TO COMPANY JOB ============

    if (route === '/applications' && method === 'POST') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        )
      }

      const body = await request.json()
      const jobId = body.jobId

      if (!jobId) {
        return handleCORS(
          NextResponse.json(
            { error: 'jobId is required' },
            { status: 400 }
          )
        )
      }

      let objectId

      try {
        const { ObjectId } = await import('mongodb')
        objectId = new ObjectId(jobId)
      } catch {
        return handleCORS(
          NextResponse.json(
            { error: 'Invalid job id' },
            { status: 400 }
          )
        )
      }

      const job = await db.collection('jobs').findOne({
        _id: objectId,
        status: 'published',
      })

      if (!job) {
        return handleCORS(
          NextResponse.json(
            { error: 'Job is no longer available' },
            { status: 404 }
          )
        )
      }

      const studentId = s.user.id

      const existing = await db.collection('applications').findOne({
        studentId,
        jobId: job._id,
        isDeleted: { $ne: true },
      })

      if (existing) {
        return handleCORS(
          NextResponse.json(
            {
              error: 'You have already applied for this job.',
            },
            { status: 409 }
          )
        )
      }

      const now = new Date()

      const application = {
        studentId,
        companyId: job.companyId,
        jobId: job._id,

        resumeId: body.resumeId || null,
        coverLetter: body.coverLetter || '',

        status: 'Applied',
        matchScore: body.matchScore ?? 0,
        notes: '',

        appliedAt: now,
        isDeleted: false,

        createdAt: now,
        updatedAt: now,
      }

      const result =
        await db.collection('applications').insertOne(
          application
        )

      return handleCORS(
        NextResponse.json(
          {
            success: true,
            id: String(result.insertedId),
            application: {
              ...application,
              id: String(result.insertedId),
              jobId: String(job._id),
              companyId: String(job.companyId),
            },
          },
          { status: 201 }
        )
      )
    }

    // ============ STUDENT: MY APPLICATIONS ============

    if (route === '/applications/student' && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        )
      }

      const applications =
        await db.collection('applications')
          .find({
            studentId: s.user.id,
            isDeleted: { $ne: true },
          })
          .sort({ createdAt: -1 })
          .toArray()

      const jobIds = applications
        .map(a => a.jobId)
        .filter(Boolean)

      const jobs = jobIds.length
        ? await db.collection('jobs')
            .find({
              _id: { $in: jobIds },
            })
            .toArray()
        : []

      const jobMap = new Map(
        jobs.map(j => [String(j._id), j])
      )

      return handleCORS(
        NextResponse.json(
          applications.map(({ _id, ...application }) => {
            const job =
              jobMap.get(String(application.jobId))

            return {
              ...application,
              id: String(_id),
              jobId: String(application.jobId),
              companyId: String(application.companyId),
              job: job
                ? {
                    id: String(job._id),
                    title: job.title,
                    role: job.role || job.title,
                    department: job.department,
                    company: job.company,
                    location: job.location,
                    employmentType: job.employmentType,
                    experience: job.experience,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    description: job.description,
                    status: job.status,
                  }
                : null,
            }
          })
        )
      )
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

    // ============ COLLEGE PORTAL — PROFILE + STUDENTS ============

    if (route === '/college/profile' && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const college = await db.collection('colleges').findOne({
        _id: new (await import('mongodb')).ObjectId(s.user.collegeId),
      })

      if (!college) {
        return handleCORS(
          NextResponse.json({ error: 'College not found' }, { status: 404 })
        )
      }

      const { password, ...safeCollege } = college

      return handleCORS(
        NextResponse.json({
          ...safeCollege,
          id: String(college._id),
        })
      )
    }

    if (route === '/college/profile' && method === 'PUT') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const body = await request.json()

      const allowed = [
        'collegeName',
        'phone',
        'website',
        'address',
        'logo',
      ]

      const update = {
        updatedAt: new Date(),
      }

      for (const key of allowed) {
        if (key in body) {
          update[key] = body[key]
        }
      }

      const collegeId = new (await import('mongodb')).ObjectId(
        s.user.collegeId
      )

      await db.collection('colleges').updateOne(
        { _id: collegeId },
        { $set: update }
      )

      const college = await db.collection('colleges').findOne({
        _id: collegeId,
      })

      if (!college) {
        return handleCORS(
          NextResponse.json({ error: 'College not found' }, { status: 404 })
        )
      }

      const { password, ...safeCollege } = college

      return handleCORS(
        NextResponse.json({
          ...safeCollege,
          id: String(college._id),
        })
      )
    }

    if (route === '/college/students' && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const college = await db.collection('colleges').findOne({
        _id: new (await import('mongodb')).ObjectId(s.user.collegeId),
      })

      if (!college) {
        return handleCORS(
          NextResponse.json({ error: 'College not found' }, { status: 404 })
        )
      }

      const students = await db.collection('studentprofiles')
        .find({
          college: college.collegeName,
        })
        .sort({ updatedAt: -1 })
        .toArray()

      return handleCORS(
        NextResponse.json({
          students,
          total: students.length,
        })
      )
    }

    if (route.startsWith('/college/students/') && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const studentId = route.replace('/college/students/', '')

      const student = await db.collection('studentprofiles').findOne({
        userId: studentId,
      })

      if (!student) {
        return handleCORS(
          NextResponse.json({ error: 'Student not found' }, { status: 404 })
        )
      }

      return handleCORS(
        NextResponse.json({ student })
      )
    }

    // ============ COLLEGE PORTAL — PLACEMENT DRIVES ============

    // College: create placement drive
    if (route === '/college/drives' && method === 'POST') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const body = await request.json()
      const now = new Date()

      if (!body.companyName || !body.jobTitle) {
        return handleCORS(
          NextResponse.json(
            { error: 'Company name and job title are required' },
            { status: 400 }
          )
        )
      }

      const drive = {
        id: uuidv4(),

        collegeId: s.user.collegeId,
        collegeName: s.user.orgName || '',

        companyId: body.companyId || null,
        companyName: body.companyName,

        jobId: body.jobId || null,
        jobTitle: body.jobTitle,

        description: body.description || '',
        location: body.location || '',
        employmentType: body.employmentType || 'full_time',

        salaryMin: Number(body.salaryMin || 0),
        salaryMax: Number(body.salaryMax || 0),

        eligibility: body.eligibility || '',
        skills: Array.isArray(body.skills) ? body.skills : [],

        driveDate: body.driveDate
          ? new Date(body.driveDate)
          : null,

        applicationDeadline: body.applicationDeadline
          ? new Date(body.applicationDeadline)
          : null,

        status: body.status || 'open',

        createdAt: now,
        updatedAt: now,
      }

      await db.collection('placementdrives').insertOne(drive)

      return handleCORS(
        NextResponse.json(drive, { status: 201 })
      )
    }


    // College: list placement drives
    if (route === '/college/drives' && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const drives = await db.collection('placementdrives')
        .find({
          collegeId: s.user.collegeId,
        })
        .sort({ createdAt: -1 })
        .toArray()

      return handleCORS(
        NextResponse.json({
          drives,
          total: drives.length,
        })
      )
    }


    // College: single placement drive
    if (route.startsWith('/college/drives/') && method === 'GET') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const id = route.replace('/college/drives/', '')

      const drive = await db.collection('placementdrives').findOne({
        id,
        collegeId: s.user.collegeId,
      })

      if (!drive) {
        return handleCORS(
          NextResponse.json(
            { error: 'Placement drive not found' },
            { status: 404 }
          )
        )
      }

      return handleCORS(
        NextResponse.json(drive)
      )
    }


    // College: update placement drive
    if (route.startsWith('/college/drives/') && method === 'PUT') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const id = route.replace('/college/drives/', '')
      const body = await request.json()

      const allowed = [
        'companyId',
        'companyName',
        'jobId',
        'jobTitle',
        'description',
        'location',
        'employmentType',
        'salaryMin',
        'salaryMax',
        'eligibility',
        'skills',
        'driveDate',
        'applicationDeadline',
        'status',
      ]

      const update = {
        updatedAt: new Date(),
      }

      for (const key of allowed) {
        if (key in body) {
          update[key] = body[key]
        }
      }

      await db.collection('placementdrives').updateOne(
        {
          id,
          collegeId: s.user.collegeId,
        },
        {
          $set: update,
        }
      )

      const drive = await db.collection('placementdrives').findOne({
        id,
        collegeId: s.user.collegeId,
      })

      if (!drive) {
        return handleCORS(
          NextResponse.json(
            { error: 'Placement drive not found' },
            { status: 404 }
          )
        )
      }

      return handleCORS(
        NextResponse.json(drive)
      )
    }


    // College: delete placement drive
    if (route.startsWith('/college/drives/') && method === 'DELETE') {
      const s = await getSession()

      if (!s) {
        return handleCORS(
          NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        )
      }

      if (s.user.role !== 'college_admin') {
        return handleCORS(
          NextResponse.json(
            { error: 'College admin access required' },
            { status: 403 }
          )
        )
      }

      const id = route.replace('/college/drives/', '')

      const result = await db.collection('placementdrives').deleteOne({
        id,
        collegeId: s.user.collegeId,
      })

      if (!result.deletedCount) {
        return handleCORS(
          NextResponse.json(
            { error: 'Placement drive not found' },
            { status: 404 }
          )
        )
      }

      return handleCORS(
        NextResponse.json({ ok: true })
      )
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
    console.error("========== FULL ERROR ==========");
    console.error(error);
    console.error(error?.stack);
    console.error("===============================");

    return handleCORS(
      NextResponse.json(
        {
          error: error?.message,
          stack: error?.stack,
        },
        { status: 500 }
      )
    );
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
