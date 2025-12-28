import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: NextRequest) {
  try {
    const { weekStart, weekEnd, userId } = await request.json()

    if (!weekStart || !weekEnd || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user's Google Calendar token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_token, google_calendar_refresh_token')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.google_calendar_token) {
      return NextResponse.json(
        { error: 'Google Calendar not configured' },
        { status: 401 }
      )
    }

    // Fetch events from Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams({
        timeMin: new Date(weekStart).toISOString(),
        timeMax: new Date(weekEnd).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50'
      })}`,
      {
        headers: {
          'Authorization': `Bearer ${profile.google_calendar_token}`
        }
      }
    )

    if (!calendarResponse.ok) {
      // If token expired, try to refresh
      if (calendarResponse.status === 401 && profile.google_calendar_refresh_token) {
        const refreshed = await refreshGoogleToken(userId, profile.google_calendar_refresh_token)
        if (refreshed) {
          // Retry with new token
          return POST(request)
        }
      }
      
      throw new Error(`Google Calendar API error: ${calendarResponse.statusText}`)
    }

    const { items: events = [] } = await calendarResponse.json()

    return NextResponse.json({
      events: events.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        extendedProperties: event.extendedProperties
      }))
    })
  } catch (error) {
    console.error('Google Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Google Calendar' },
      { status: 500 }
    )
  }
}

async function refreshGoogleToken(userId: string, refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) throw new Error('Failed to refresh token')

    const { access_token } = await response.json()

    await supabase
      .from('profiles')
      .update({ google_calendar_token: access_token })
      .eq('id', userId)

    return true
  } catch (error) {
    console.error('Failed to refresh Google Calendar token:', error)
    return false
  }
}
