import { fetchCalendarEvents } from '../integrations/google'

export interface GoogleAccountTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  syncToken?: string
}

export interface SyncedEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  source: 'google'
  externalStatus?: string
  updatedAt?: string
  raw?: unknown
  localBlockId?: string
}

export async function syncGoogleCalendar(tokens: GoogleAccountTokens) {
  const { events, nextSyncToken } = await fetchCalendarEvents(tokens.accessToken, tokens.syncToken)

  const normalized: SyncedEvent[] = events
    .filter((event) => event.start?.dateTime && event.end?.dateTime)
    .map((event) => ({
      id: event.id,
      title: event.summary || 'Busy',
      description: event.description,
      start: event.start?.dateTime as string,
      end: event.end?.dateTime as string,
      source: 'google',
      externalStatus: event.status,
      updatedAt: event.updated,
      raw: event,
    }))

  return { events: normalized, nextSyncToken }
}
