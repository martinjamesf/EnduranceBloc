import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'

export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ connected: false })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ connected: false, error: 'Service role key missing' }, { status: 500 })
  if (!supabaseAdmin) return NextResponse.json({ connected: false, error: 'Supabase admin client not initialized' }, { status: 500 })

  const { data, error } = await supabaseAdmin
    .from('google_accounts')
    .select('id')
    .eq('profile_id', userId)
    .limit(1)

  if (error) return NextResponse.json({ connected: false })

  const connected = Array.isArray(data) ? data.length > 0 : !!data
  return NextResponse.json({ connected })
}
