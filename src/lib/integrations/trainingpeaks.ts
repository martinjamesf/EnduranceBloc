import type { Workout } from '../types'

export function getAuthUrl() {
  const clientId = process.env.TRAININGPEAKS_CLIENT_ID || 'TP_CLIENT_ID'
  const redirectUri = process.env.TRAININGPEAKS_REDIRECT_URI || 'http://localhost:3000/api/trainingpeaks/callback'
  // Placeholder URL - replace with actual TrainingPeaks OAuth endpoint and params
  return `https://app.trainingpeaks.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`
}

export async function exchangeCodeForToken(code: string) {
  // TODO: call TrainingPeaks token endpoint to exchange code for access/refresh tokens
  return {
    accessToken: `mock-tp-access-${code}`,
    refreshToken: `mock-tp-refresh-${code}`,
    expiresIn: 3600,
  }
}

export async function fetchWorkouts(accessToken: string): Promise<Workout[]> {
  // Placeholder: replace with TrainingPeaks API calls using the access token
  return [
    {
      id: `tp-${Date.now()}`,
      title: 'Mock TP Ride',
      type: 'bike',
      start: new Date().toISOString(),
      notes: 'Imported from TrainingPeaks (mock)'
    }
  ]
}