import { supabase } from '../supabaseClient'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  extendedProperties?: {
    private?: {
      category?: string
    }
  }
}

/**
 * Fetch events from user's Google Calendar for a specific date range
 */
export async function syncGoogleCalendarEvents(weekStart: Date, weekEnd: Date) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the user's Google Calendar token from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_calendar_token, google_calendar_sync_enabled')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.google_calendar_token || !profile.google_calendar_sync_enabled) {
      throw new Error('Google Calendar not configured for this user')
    }

    // Call the sync endpoint
    const response = await fetch('/api/google-calendar/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        userId: user.id
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to sync Google Calendar: ${response.statusText}`)
    }

    const { events } = await response.json()
    return events as GoogleCalendarEvent[]
  } catch (err) {
    console.error('Failed to sync Google Calendar:', err)
    throw err
  }
}

/**
 * Check if user has connected Google Calendar
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('google_calendar_token')
      .eq('id', user.id)
      .single()

    return !!(profile?.google_calendar_token)
  } catch {
    return false
  }
}

/**
 * Get Google Calendar connection URL
 */
export function getGoogleCalendarAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/google-calendar/callback`
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar'
  ]

  const params = new URLSearchParams({
    client_id: clientId || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
