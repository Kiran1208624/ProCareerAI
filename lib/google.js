import { OAuth2Client } from 'google-auth-library'
import { gmail } from '@googleapis/gmail'
import { calendar } from '@googleapis/calendar'
import { drive } from '@googleapis/drive'
import { oauth2 } from '@googleapis/oauth2'

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
]

export function oauth2Client() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

export function authedClient(tokens) {
  const c = oauth2Client()
  c.setCredentials(tokens)
  return c
}

export function gmailApi(auth) { return gmail({ version: 'v1', auth }) }
export function calendarApi(auth) { return calendar({ version: 'v3', auth }) }
export function driveApi(auth) { return drive({ version: 'v3', auth }) }
export function oauth2Api(auth) { return oauth2({ version: 'v2', auth }) }

export function extractHeaders(message) {
  const out = {}
  for (const h of message.payload?.headers || []) out[h.name.toLowerCase()] = h.value
  return out
}

export function extractText(part) {
  if (!part) return ''
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf8')
  }
  if (part.mimeType === 'text/html' && part.body?.data) {
    const html = Buffer.from(part.body.data, 'base64url').toString('utf8')
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return (part.parts || []).map(extractText).join('\n')
}
