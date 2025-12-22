import type { Workout } from '../types'

export function getAuthUrl() {
  const clientId = process.env.OUTLOOK_CLIENT_ID || 'OUTLOOK_CLIENT_ID'
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/api/outlook/callback'
  // Microsoft OAuth authorize URL (placeholder scopes)
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=offline_access%20openid%20profile%20Calendars.Read`
}

export async function exchangeCodeForToken(code: string) {
  // TODO: implement token exchange with Microsoft token endpoint
  return {
    accessToken: `mock-outlook-access-${code}`,
    refreshToken: `mock-outlook-refresh-${code}`,
    expiresIn: 3600,
  }
}

export async function fetchCalendarEvents(accessToken: string) {
  // Placeholder: in practice call Microsoft Graph '/me/calendar/events'
  return [
    {
      id: `outlook-${Date.now()}`,
      title: 'Mock Outlook Event',
      start: new Date().toISOString(),
      notes: 'Imported from Outlook (mock)'
    }
  ]
}