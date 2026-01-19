import type { Workout } from '../types'

/**
 * TrainingPeaks OAuth Configuration
 * Docs: https://github.com/TrainingPeaks/tp-public-api-auth
 * API Base: https://api.trainingpeaks.com/v2
 * Auth Base: https://oauth.trainingpeaks.com
 */

const TP_OAUTH_BASE = 'https://oauth.trainingpeaks.com'
const TP_API_BASE = 'https://api.trainingpeaks.com/v2'

export interface TPTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
}

export interface TPWorkout {
  id: string
  name: string
  description?: string
  workoutType?: string // swim, bike, run, etc.
  scheduledStartTime?: string // ISO 8601
  startTime?: string // ISO 8601 (actual start if completed)
  duration?: number // minutes
  distance?: number // km
  power?: {
    avgWatts?: number
    maxWatts?: number
    normalized?: number
  }
  heartRate?: {
    avgHr?: number
    maxHr?: number
  }
  tss?: number
  tag?: string
}

export function getAuthUrl(redirectUri?: string, state?: string) {
  const clientId = process.env.TRAININGPEAKS_CLIENT_ID || 'TP_CLIENT_ID'
  const actualRedirectUri = redirectUri || process.env.TRAININGPEAKS_REDIRECT_URI || 'http://localhost:3000/api/trainingpeaks/callback'
  const scopes = 'workouts:read calendar:read athlete:read'
  
  let url = `${TP_OAUTH_BASE}/OAuth/Authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    actualRedirectUri,
  )}&scope=${encodeURIComponent(scopes)}`
  
  if (state) {
    url += `&state=${encodeURIComponent(state)}`
  }
  
  return url
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TPTokenResponse> {
  const clientId = process.env.TRAININGPEAKS_CLIENT_ID
  const clientSecret = process.env.TRAININGPEAKS_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('TrainingPeaks credentials not configured')
  }

  const response = await fetch(`${TP_OAUTH_BASE}/OAuth/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Token exchange failed:', error)
    throw new Error(`Failed to exchange TrainingPeaks token: ${response.statusText}`)
  }

  return response.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<TPTokenResponse> {
  const clientId = process.env.TRAININGPEAKS_CLIENT_ID
  const clientSecret = process.env.TRAININGPEAKS_CLIENT_SECRET
  
  if (!clientId || !clientSecret) {
    throw new Error('TrainingPeaks credentials not configured')
  }

  const response = await fetch(`${TP_OAUTH_BASE}/OAuth/Token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Token refresh failed:', error)
    throw new Error(`Failed to refresh TrainingPeaks token: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get next week date range (Monday UTC 00:00 to Sunday UTC 23:59)
 * Assumes Sunday is planning day
 */
function getNextWeekDateRange() {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday
  
  // Calculate Monday of next week
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const mondayStart = new Date(now)
  mondayStart.setUTCDate(mondayStart.getUTCDate() + daysUntilMonday)
  mondayStart.setUTCHours(0, 0, 0, 0)
  
  // Calculate Sunday end (one week later)
  const sundayEnd = new Date(mondayStart)
  sundayEnd.setUTCDate(sundayEnd.getUTCDate() + 6)
  sundayEnd.setUTCHours(23, 59, 59, 999)
  
  return {
    start: mondayStart.toISOString(),
    end: sundayEnd.toISOString(),
  }
}

/**
 * Fetch workouts for the next week (Monday-Sunday)
 * @param accessToken TrainingPeaks access token
 * @param dateRange Optional custom date range
 */
export async function fetchWorkouts(
  accessToken: string,
  dateRange?: { start: string; end: string }
): Promise<Workout[]> {
  const range = dateRange || getNextWeekDateRange()
  
  try {
    // Fetch scheduled workouts
    const params = new URLSearchParams({
      sortBy: 'date',
      limit: '100',
      includeAllAccess: 'false',
      workoutDate_from: range.start,
      workoutDate_to: range.end,
    })

    const response = await fetch(`${TP_API_BASE}/me/workouts?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch workouts: ${response.status} ${response.statusText}`)
      throw new Error(`Failed to fetch TrainingPeaks workouts: ${response.statusText}`)
    }

    const data = await response.json()
    const tpWorkouts: TPWorkout[] = Array.isArray(data) ? data : data.items || []

    // Transform to our Workout type
    return tpWorkouts.map((tpWo) => ({
      id: `tp-${tpWo.id}`,
      title: tpWo.name,
      type: normalizeTrainingType(tpWo.workoutType),
      start: tpWo.scheduledStartTime || tpWo.startTime || new Date().toISOString(),
      end: tpWo.scheduledStartTime && tpWo.duration 
        ? new Date(new Date(tpWo.scheduledStartTime).getTime() + tpWo.duration * 60000).toISOString()
        : undefined,
      notes: tpWo.description,
      source: 'trainingpeaks',
      // Performance metrics (optional)
      metadata: {
        tss: tpWo.tss,
        distance: tpWo.distance,
        avgWatts: tpWo.power?.avgWatts,
        maxWatts: tpWo.power?.maxWatts,
        avgHr: tpWo.heartRate?.avgHr,
        maxHr: tpWo.heartRate?.maxHr,
      }
    }))
  } catch (error) {
    console.error('Error fetching TrainingPeaks workouts:', error)
    throw error
  }
}

function normalizeTrainingType(tpType?: string): 'swim' | 'bike' | 'run' | 'other' {
  if (!tpType) return 'other'
  const lower = tpType.toLowerCase()
  if (lower.includes('swim')) return 'swim'
  if (lower.includes('bike') || lower.includes('cycling')) return 'bike'
  if (lower.includes('run')) return 'run'
  return 'other'
}