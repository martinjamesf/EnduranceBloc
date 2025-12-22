import { NextResponse } from 'next/server'
import { fetchWorkouts } from '../../../../lib/integrations/trainingpeaks'

export async function POST(req: Request) {
  // In production, validate user auth and which account to sync
  try {
    const body = await req.json()
    const accessToken = body.accessToken || process.env.SAMPLE_TP_TOKEN
    if (!accessToken) return NextResponse.json({ error: 'No access token' }, { status: 400 })

    const workouts = await fetchWorkouts(accessToken)

    // TODO: upsert workouts to Supabase
    return NextResponse.json({ ok: true, count: workouts.length, workouts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}