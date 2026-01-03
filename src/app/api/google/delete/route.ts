import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { deleteCalendarEvent, refreshAccessToken } from '@/lib/integrations/google'

interface DeleteBody {
  eventId: string
}

export async function DELETE(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 })
  }

  const body = (await request.json()) as DeleteBody
  if (!body.eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const { data: account, error: accountError } = await supabaseAdmin
    .from('google_accounts')
    .select('*')
    .eq('profile_id', userId)
    .single()

  if (accountError || !account) return NextResponse.json({ error: 'Google account not connected' }, { status: 400 })

  let accessToken = account.access_token as string
  let refreshToken = account.refresh_token as string | undefined

  const attemptDelete = async () => deleteCalendarEvent(accessToken, body.eventId)

  try {
    await attemptDelete()

    const { error: deleteError } = await supabaseAdmin
      .from('google_events')
      .delete()
      .eq('account_id', account.id)
      .eq('event_id', body.eventId)

    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const needsRefresh = message.includes('401') || message.toLowerCase().includes('unauthorized')

    if (needsRefresh && refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken)
        accessToken = refreshed.access_token
        refreshToken = refreshed.refresh_token || refreshToken

        const { error: updateError } = await supabaseAdmin
          .from('google_accounts')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id)

        if (updateError) throw updateError

        await deleteCalendarEvent(accessToken, body.eventId)

        const { error: deleteError } = await supabaseAdmin
          .from('google_events')
          .delete()
          .eq('account_id', account.id)
          .eq('event_id', body.eventId)

        if (deleteError) throw deleteError

        return NextResponse.json({ ok: true })
      } catch (refreshErr) {
        const refreshMessage = refreshErr instanceof Error ? refreshErr.message : 'Unknown refresh error'
        return NextResponse.json({ error: refreshMessage }, { status: 500 })
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
