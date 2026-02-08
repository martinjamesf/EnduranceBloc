import { NextResponse } from 'next/server'
import { buildCanonicalTranslationPrompt } from '@/lib/ai/translationPrompt'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

async function callOpenAI(prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You translate workouts to canonical schema. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned no content')
  return JSON.parse(content)
}

async function callAnthropic(prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1200,
      system: 'You translate workouts to canonical schema. Return valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  const content = json?.content?.[0]?.text
  if (!content) throw new Error('Anthropic returned no content')
  return JSON.parse(content)
}

function sanitizeCanonical(output: any) {
  const o = output || {}
  const canon = {
    source: String(o.source || 'unknown'),
    type: String(o.type || 'other'),
    subtype: o.subtype ?? null,
    duration_min: o.duration_min ?? null,
    distance_km: o.distance_km ?? null,
    intensity: o.intensity ?? null,
    structured: Boolean(o.structured),
    steps: Array.isArray(o.steps) ? o.steps : [],
    notes: typeof o.notes === 'string' ? o.notes : null,
    metadata: {
      raw_payload: o?.metadata?.raw_payload ?? o._raw ?? {},
      raw_workout_id: o?.metadata?.raw_workout_id ?? null,
      external_id: o?.metadata?.external_id ?? null,
    },
  }
  return canon
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const raw = body?.payload ?? body
    const prompt = buildCanonicalTranslationPrompt(raw)

    let output
    if (OPENAI_API_KEY) {
      output = await callOpenAI(prompt)
    } else if (ANTHROPIC_API_KEY) {
      output = await callAnthropic(prompt)
    } else {
      return NextResponse.json(
        { error: 'No LLM API key configured', hint: 'Set OPENAI_API_KEY or ANTHROPIC_API_KEY' },
        { status: 500 }
      )
    }

    const canonical = sanitizeCanonical(output)
    return NextResponse.json(canonical, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
