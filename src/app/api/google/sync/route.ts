import { NextResponse } from 'next/server'
import { syncGoogleCalendar } from '@/lib/services/googleSyncService'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getUserIdFromRequest } from '@/lib/auth/serverAuth'
import { refreshAccessToken } from '@/lib/integrations/google'

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service role key missing' }, { status: 500 })
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 })
  }

  const { data: account, error: accountError } = await supabaseAdmin
    .from('google_accounts')
    .select('*')
    .eq('profile_id', userId)
    .single()

  if (accountError || !account) return NextResponse.json({ error: 'Google account not connected' }, { status: 400 })

  let accessToken = account.access_token as string
  let refreshToken = account.refresh_token as string | undefined
  let syncToken = account.sync_token as string | undefined

  const runSync = async () => syncGoogleCalendar({ accessToken, refreshToken, syncToken })

  try {
    let { events, nextSyncToken } = await runSync()

    if (events.length === 0 && nextSyncToken === undefined) {
      // No changes but still update timestamps
      nextSyncToken = account.sync_token
    }

    if (events.length > 0) {
      const payload = events.map((event) => ({
        account_id: account.id,
        profile_id: userId,
        event_id: event.id,
        title: event.title,
        description: event.description,
        start: event.start,
        end: event.end,
        status: event.externalStatus,
        external_updated_at: event.updatedAt,
        raw_payload: event.raw,
        updated_at: new Date().toISOString(),
      }))

      const { error: upsertEventsError } = await supabaseAdmin
        .from('google_events')
        .upsert(payload, { onConflict: 'account_id,event_id' })

      if (upsertEventsError) throw upsertEventsError
    }

    const { error: updateAccountError } = await supabaseAdmin
      .from('google_accounts')
      .update({
        sync_token: nextSyncToken ?? account.sync_token,
        access_token: accessToken,
        refresh_token: refreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', account.id)

    if (updateAccountError) throw updateAccountError

    return NextResponse.json({ events, nextSyncToken })
  } catch (error) {
    // Attempt refresh once on auth errors
    const message = error instanceof Error ? error.message : 'Unknown error'
    const needsRefresh = message.includes('401') || message.toLowerCase().includes('unauthorized')

    if (needsRefresh && refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken)
        accessToken = refreshed.access_token
        refreshToken = refreshed.refresh_token || refreshToken
        const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

        const { error: updateError } = await supabaseAdmin
          .from('google_accounts')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id)

        if (updateError) throw updateError

        const { events: retriedEvents, nextSyncToken: retriedSyncToken } = await syncGoogleCalendar({ accessToken, refreshToken, syncToken })

        if (retriedEvents.length > 0) {
          const payload = retriedEvents.map((event) => ({
            account_id: account.id,
            profile_id: userId,
            event_id: event.id,
            title: event.title,
            description: event.description,
            start: event.start,
            end: event.end,
            status: event.externalStatus,
            external_updated_at: event.updatedAt,
            raw_payload: event.raw,
            updated_at: new Date().toISOString(),
          }))

          const { error: retryUpsertError } = await supabaseAdmin
            .from('google_events')
            .upsert(payload, { onConflict: 'account_id,event_id' })

          if (retryUpsertError) throw retryUpsertError
        }

        const { error: finalUpdateError } = await supabaseAdmin
          .from('google_accounts')
          .update({
            sync_token: retriedSyncToken ?? account.sync_token,
            access_token: accessToken,
            refresh_token: refreshToken,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id)

        if (finalUpdateError) throw finalUpdateError

        return NextResponse.json({ events: retriedEvents, nextSyncToken: retriedSyncToken })
      } catch (refreshErr) {
        const refreshMessage = refreshErr instanceof Error ? refreshErr.message : 'Unknown refresh error'
        return NextResponse.json({ error: refreshMessage }, { status: 500 })
      }
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
