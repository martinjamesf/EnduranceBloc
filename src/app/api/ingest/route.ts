import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'

function getSupabaseClientWithToken(token: string | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured')
  }
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  })
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body (accept any JSON as raw payload)
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const source: string = (body?.source ?? 'unknown').toString()
    const payload: Record<string, unknown> = body?.payload ?? body

    // Extract token to pass through for RLS
    const headerToken = req.headers.get('authorization')?.replace('Bearer', '').trim()
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('sb-access-token')?.value
    const token = headerToken || cookieToken

    const supabase = getSupabaseClientWithToken(token)

    // Insert raw workout
    const { data: rawInsert, error: rawErr } = await supabase
      .from('raw_workouts')
      .insert({ profile_id: userId, source, payload })
      .select()
      .single()

    if (rawErr || !rawInsert) {
      return NextResponse.json({ error: rawErr?.message ?? 'Failed to insert raw workout' }, { status: 500 })
    }

    // Enqueue translation job
    const { data: jobInsert, error: jobErr } = await supabase
      .from('translator_jobs')
      .insert({ raw_workout_id: rawInsert.id, status: 'pending' })
      .select()
      .single()

    if (jobErr || !jobInsert) {
      return NextResponse.json({ error: jobErr?.message ?? 'Failed to enqueue job' }, { status: 500 })
    }

    return NextResponse.json({ raw_workout_id: rawInsert.id, job_id: jobInsert.id }, { status: 201 })
  } catch (e: any) {
    const msg = typeof e?.message === 'string' ? e.message : 'Unexpected error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
