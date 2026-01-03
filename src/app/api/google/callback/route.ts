import { NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/integrations/google'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateUserId = searchParams.get('state')
  const userId = (await getUserIdFromRequest(request)) || stateUserId

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 })
  }

  try {
    const token = await exchangeCodeForToken(code)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    await supabaseAdmin.from('profiles').upsert({ id: userId }).select('id').single()

    const { error: upsertError } = await supabaseAdmin
      .from('google_accounts')
      .upsert(
        {
          profile_id: userId,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      )

    if (upsertError) throw upsertError

    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('google', 'connected')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
