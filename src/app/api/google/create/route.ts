import { NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createCalendarEvent, refreshAccessToken } from '@/lib/integrations/google'

interface CreateBody {
  title: string
  start: string
  end: string
  description?: string
  localBlockId?: string
  timeZone?: string
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 })
  }

  const body = (await request.json()) as CreateBody
  if (!body.title || !body.start || !body.end) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from('google_accounts')
    .select('*')
    .eq('profile_id', userId)
    .single()

  if (accountError || !account) return NextResponse.json({ error: 'Google account not connected' }, { status: 400 })

  let accessToken = account.access_token as string
  let refreshToken = account.refresh_token as string | undefined

  const attemptCreate = async () =>
    createCalendarEvent(accessToken, {
      summary: body.title,
      description: body.description,
      startDateTime: body.start,
      endDateTime: body.end,
      timeZone: body.timeZone,
    })

  try {
    let created = await attemptCreate()

    const { error: upsertError } = await supabaseAdmin
      .from('google_events')
      .upsert(
        {
          account_id: account.id,
          profile_id: userId,
          local_block_id: body.localBlockId,
          event_id: created.id,
          title: created.summary || body.title,
          description: created.description || body.description,
          start: created.start?.dateTime || body.start,
          end: created.end?.dateTime || body.end,
          status: created.status,
          external_updated_at: created.updated,
          raw_payload: created,
          sync_state: 'synced',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'account_id,event_id' }
      )

    if (upsertError) throw upsertError

    return NextResponse.json({ eventId: created.id, event: created })
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

        const created = await createCalendarEvent(accessToken, {
          summary: body.title,
          description: body.description,
          startDateTime: body.start,
          endDateTime: body.end,
          timeZone: body.timeZone,
        })

        const { error: upsertError } = await supabaseAdmin
          .from('google_events')
          .upsert(
            {
              account_id: account.id,
              profile_id: userId,
              local_block_id: body.localBlockId,
              event_id: created.id,
              title: created.summary || body.title,
              description: created.description || body.description,
              start: created.start?.dateTime || body.start,
              end: created.end?.dateTime || body.end,
              status: created.status,
              external_updated_at: created.updated,
              raw_payload: created,
              sync_state: 'synced',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'account_id,event_id' }
          )

        if (upsertError) throw upsertError

        return NextResponse.json({ eventId: created.id, event: created })
      } catch (refreshErr) {
        const refreshMessage = refreshErr instanceof Error ? refreshErr.message : 'Unknown refresh error'
        return NextResponse.json({ error: refreshMessage }, { status: 500 })
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
