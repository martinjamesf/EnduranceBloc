import { NextResponse } from 'next/server'
import { fetchCalendarEvents } from '../../../../lib/integrations/outlook'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const accessToken = body.accessToken || process.env.SAMPLE_OUTLOOK_TOKEN
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 400 })

    const events = await fetchCalendarEvents(accessToken)
    // TODO: upsert into Supabase calendar entries
    return NextResponse.json({ ok: true, count: events.length, events })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}