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

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('User not authenticated')
  return { Authorization: `Bearer ${accessToken}` }
}

/**
 * Fetch events from user's Google Calendar for a specific date range
 */
export async function syncGoogleCalendarEvents(): Promise<GoogleCalendarEvent[]> {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/google/sync', { method: 'POST', headers })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Failed to sync Google Calendar')
  }

  const { events } = await response.json()
  return events as GoogleCalendarEvent[]
}

/**
 * Check if user has connected Google Calendar
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/google/status', { headers })
    if (!response.ok) return false
    const data = await response.json()
    return !!data.connected
  } catch {
    return false
  }
}

/**
 * Get Google Calendar connection URL
 */
export async function getGoogleCalendarAuthUrl(): Promise<string> {
  const headers = await getAuthHeaders()
  const response = await fetch('/api/google/connect?format=json', { headers })
  if (!response.ok) throw new Error('Failed to start Google OAuth')
  const data = await response.json()
  return data.url as string
}
