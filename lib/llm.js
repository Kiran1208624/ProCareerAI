import OpenAI from 'openai'

let _client
export function getLLM() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 120_000,
      maxRetries: 1,
    })
  }
  return _client
}

export const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o'

export async function complete(messages, opts = {}) {
  const client = getLLM()
  const res = await client.chat.completions.create({
    model: LLM_MODEL,
    messages,
    ...opts,
  })
  return res.choices?.[0]?.message?.content ?? ''
}

export function parseJson(text) {
  if (!text) throw new Error('Empty LLM response')
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    return JSON.parse(cleaned.slice(first, last + 1))
  }
  throw new Error('Could not parse JSON from LLM response')
}
