import { URLSearchParams } from 'url'

// TODO: Replace placeholders with real secrets and endpoints.
const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type: string
}

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; timeZone?: string }
  end?: { dateTime?: string; timeZone?: string }
  updated?: string
  status?: string
  htmlLink?: string
  etag?: string
}

interface CreateCalendarEventInput {
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  timeZone?: string
}

interface UpdateCalendarEventInput {
  summary?: string
  description?: string
  startDateTime?: string
  endDateTime?: string
  timeZone?: string
}

export function getAuthUrl(userId: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: userId, // TODO: add CSRF protection / PKCE
  })

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    throw new Error(`Failed to exchange Google auth code: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as OAuthTokenResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    throw new Error(`Failed to refresh Google token: ${res.status} ${res.statusText}`)
  }

  return (await res.json()) as OAuthTokenResponse
}

export async function fetchCalendarEvents(accessToken: string, syncToken?: string): Promise<{ events: GoogleCalendarEvent[]; nextSyncToken?: string; nextPageToken?: string }> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    showDeleted: 'true',
    maxResults: '2500',
    orderBy: 'startTime',
  })

  if (syncToken) {
    params.set('syncToken', syncToken)
  } else {
    params.set('timeMin', new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString())
    params.set('timeMax', new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString())
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Calendar events: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  return {
    events: (data.items ?? []) as GoogleCalendarEvent[],
    nextSyncToken: data.nextSyncToken,
    nextPageToken: data.nextPageToken,
  }
}

export async function createCalendarEvent(accessToken: string, input: CreateCalendarEventInput): Promise<GoogleCalendarEvent> {
  const body = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: input.startDateTime, timeZone: input.timeZone },
    end: { dateTime: input.endDateTime, timeZone: input.timeZone },
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create Google Calendar event: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as GoogleCalendarEvent
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  input: UpdateCalendarEventInput
): Promise<GoogleCalendarEvent> {
  const body: Record<string, unknown> = {}

  if (input.summary !== undefined) body.summary = input.summary
  if (input.description !== undefined) body.description = input.description
  if (input.startDateTime || input.timeZone) {
    body.start = { dateTime: input.startDateTime, timeZone: input.timeZone }
  }
  if (input.endDateTime || input.timeZone) {
    body.end = { dateTime: input.endDateTime, timeZone: input.timeZone }
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to update Google Calendar event: ${res.status} ${res.statusText} ${text}`)
  }

  return (await res.json()) as GoogleCalendarEvent
}

export async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (res.status === 404 || res.status === 410) return
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to delete Google Calendar event: ${res.status} ${res.statusText} ${text}`)
  }
}
