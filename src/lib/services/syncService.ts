import { fetchWorkouts } from '../integrations/trainingpeaks'
import { fetchCalendarEvents } from '../integrations/outlook'
import { supabase } from '../supabaseClient'
import type { Workout } from '../types'

export interface SyncResult {
  count: number
  workouts?: Workout[]
  events?: any[]
  error?: string
  lastSyncedAt?: string
}

/**
 * Sync TrainingPeaks workouts for the next week
 * Fetches workouts and upserts them into the database
 */
export async function syncTrainingPeaksForProfile(
  profileId: string,
  accessToken: string
): Promise<SyncResult> {
  try {
    const workouts = await fetchWorkouts(accessToken)

    if (workouts.length === 0) {
      return { count: 0, workouts: [], lastSyncedAt: new Date().toISOString() }
    }

    // Transform workouts for database insertion
    const dbWorkouts = workouts.map((w) => ({
      id: w.id,
      profile_id: profileId,
      title: w.title,
      type: w.type,
      start: w.start,
      end: w.end,
      notes: w.notes,
      source: w.source || 'trainingpeaks',
      metadata: w.metadata || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    // Upsert into workouts table (update if exists, insert if new)
    const { data, error } = await supabase
      .from('workouts')
      .upsert(dbWorkouts, { 
        onConflict: 'id', // Use workout ID as unique identifier
        ignoreDuplicates: false, // Update on duplicate
      })
      .select()

    if (error) {
      console.error('Supabase upsert error:', error)
      throw error
    }

    return {
      count: workouts.length,
      workouts,
      lastSyncedAt: new Date().toISOString(),
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('TrainingPeaks sync failed:', errorMessage)
    return {
      count: 0,
      error: errorMessage,
    }
  }
}

export async function syncOutlookForProfile(profileId: string, accessToken: string) {
  const events = await fetchCalendarEvents(accessToken)
  // TODO: upsert into 'blocks' or calendar entries
  return { count: events.length, events }
}