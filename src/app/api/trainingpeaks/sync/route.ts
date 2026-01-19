import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { syncTrainingPeaksForProfile } from '@/lib/services/syncService'

/**
 * POST /api/trainingpeaks/sync
 * Syncs TrainingPeaks workouts for the authenticated user
 * Requires valid Supabase auth token
 */
export async function POST(req: Request) {
  try {
    // Get authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's TrainingPeaks access token from Supabase
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('trainingpeaks_access_token, trainingpeaks_refresh_token, trainingpeaks_token_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.trainingpeaks_access_token) {
      return NextResponse.json(
        { error: 'No TrainingPeaks connection found. Please connect your TrainingPeaks account.' },
        { status: 400 }
      )
    }

    // Check if token is expired and refresh if needed
    let accessToken = profileData.trainingpeaks_access_token
    const expiresAt = profileData.trainingpeaks_token_expires_at
      ? new Date(profileData.trainingpeaks_token_expires_at)
      : null

    if (expiresAt && expiresAt < new Date() && profileData.trainingpeaks_refresh_token) {
      try {
        const { refreshAccessToken } = await import('@/lib/integrations/trainingpeaks')
        const newToken = await refreshAccessToken(profileData.trainingpeaks_refresh_token)
        
        // Update stored token
        await supabase
          .from('users')
          .update({
            trainingpeaks_access_token: newToken.access_token,
            trainingpeaks_refresh_token: newToken.refresh_token || profileData.trainingpeaks_refresh_token,
            trainingpeaks_token_expires_at: new Date(
              Date.now() + newToken.expires_in * 1000
            ).toISOString(),
          })
          .eq('id', user.id)
        
        accessToken = newToken.access_token
      } catch (refreshErr) {
        console.error('Failed to refresh TrainingPeaks token:', refreshErr)
        return NextResponse.json(
          { error: 'Failed to refresh TrainingPeaks token. Please reconnect your account.' },
          { status: 401 }
        )
      }
    }

    // Sync workouts
    const result = await syncTrainingPeaksForProfile(user.id, accessToken)

    if (result.error) {
      return NextResponse.json(
        { error: result.error, count: 0 },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      count: result.count,
      message: `Synced ${result.count} workouts from TrainingPeaks`,
      lastSyncedAt: result.lastSyncedAt,
    })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: err.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
