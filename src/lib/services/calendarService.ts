import { supabase } from '@/lib/supabaseClient'

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO timestamp
  end: string
  description?: string
  type: 'workout' | 'block' | 'google'
  source?: 'trainingpeaks' | 'manual' | 'google'
  color?: string
  workoutType?: 'swim' | 'bike' | 'run' | 'other'
  googleEventId?: string
  localBlockId?: string
}

/**
 * Fetch all calendar events for a given date range.
 * Combines workouts, blocks, and Google Calendar events.
 */
export async function fetchCalendarEvents(
  startDate: string,
  endDate: string,
  profileId?: string
): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = []

  try {
    // Fetch workouts
    let workoutsQuery = supabase
      .from('workouts')
      .select('*')
      .gte('start', startDate)
      .lte('start', endDate)
      .order('start', { ascending: true })

    if (profileId) {
      workoutsQuery = workoutsQuery.eq('profile_id', profileId)
    }

    const { data: workouts, error: workoutsError } = await workoutsQuery

    if (!workoutsError && workouts) {
      events.push(
        ...workouts.map((w: any) => ({
          id: w.id,
          title: w.title || 'Workout',
          start: w.start,
          end: w.end || w.start,
          description: w.notes,
          type: 'workout' as const,
          source: (w.source || 'manual') as 'manual' | 'google' | 'trainingpeaks',
          workoutType: w.type,
          color: getWorkoutColor(w.type),
        }))
      )
    }

    // Fetch life blocks
    let blocksQuery = supabase
      .from('blocks')
      .select('*')
      .gte('start', startDate)
      .lte('start', endDate)
      .order('start', { ascending: true })

    if (profileId) {
      blocksQuery = blocksQuery.eq('profile_id', profileId)
    }

    const { data: blocks, error: blocksError } = await blocksQuery

    if (!blocksError && blocks) {
      events.push(
        ...blocks.map((b: any) => ({
          id: b.id,
          title: b.title || 'Block',
          start: b.start,
          end: b.end || b.start,
          description: undefined,
          type: 'block' as const,
          source: 'manual' as const,
          color: '#bdffdb', // Default green
          localBlockId: b.id,
        }))
      )
    }

    // Fetch Google Calendar events
    let googleQuery = supabase
      .from('google_events')
      .select('*')
      .gte('start', startDate)
      .lte('start', endDate)
      .order('start', { ascending: true })

    if (profileId) {
      googleQuery = googleQuery.eq('profile_id', profileId)
    }

    const { data: googleEvents, error: googleError } = await googleQuery

    if (!googleError && googleEvents) {
      events.push(
        ...googleEvents.map((g: any) => ({
          id: g.id,
          title: g.title || 'Google Event',
          start: g.start,
          end: g.end || g.start,
          description: g.description,
          type: 'google' as const,
          source: 'google' as const,
          color: '#e8eeff', // Blue for Google events
          googleEventId: g.event_id,
          localBlockId: g.local_block_id,
        }))
      )
    }

    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return []
  }
}

/**
 * Create a new manual block/event
 */
export async function createCalendarEvent(
  event: Omit<CalendarEvent, 'id'>,
  profileId: string
): Promise<CalendarEvent | null> {
  try {
    if (!profileId) {
      throw new Error('Profile ID is required to create an event')
    }

    if (!event.title) {
      throw new Error('Event title is required')
    }

    if (!event.start || !event.end) {
      throw new Error('Event start and end times are required')
    }

    if (event.type === 'workout') {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          profile_id: profileId,
          title: event.title,
          start: event.start,
          end: event.end,
          notes: event.description,
          type: event.workoutType || 'other',
          source: 'manual',
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create workout: ${error.message}`)
      }
      if (!data) {
        throw new Error('No data returned from workout creation')
      }
      return { ...event, id: data.id }
    } else if (event.type === 'block') {
      const { data, error } = await supabase
        .from('blocks')
        .insert({
          profile_id: profileId,
          title: event.title,
          start: event.start,
          end: event.end,
          workouts: null,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create block: ${error.message}`)
      }
      if (!data) {
        throw new Error('No data returned from block creation')
      }
      return { ...event, id: data.id, localBlockId: data.id }
    }

    throw new Error(`Unknown event type: ${event.type}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error creating calendar event:', errorMessage)
    throw error
  }
}

/**
 * Update an existing event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEvent>,
  type: 'workout' | 'block' | 'google'
): Promise<boolean> {
  try {
    if (type === 'workout') {
      const { error } = await supabase
        .from('workouts')
        .update({
          title: updates.title,
          start: updates.start,
          end: updates.end,
          notes: updates.description,
          type: updates.workoutType,
        })
        .eq('id', eventId)

      return !error
    } else if (type === 'block') {
      const { error } = await supabase
        .from('blocks')
        .update({
          title: updates.title,
          start: updates.start,
          end: updates.end,
        })
        .eq('id', eventId)

      return !error
    } else if (type === 'google') {
      // For Google events, update via API
      const response = await fetch('/api/google/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: updates.googleEventId,
          title: updates.title,
          start: updates.start,
          end: updates.end,
          description: updates.description,
        }),
      })

      return response.ok
    }

    return false
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return false
  }
}

/**
 * Delete an event
 */
export async function deleteCalendarEvent(
  eventId: string,
  type: 'workout' | 'block' | 'google',
  googleEventId?: string
): Promise<boolean> {
  try {
    if (type === 'workout') {
      const { error } = await supabase.from('workouts').delete().eq('id', eventId)
      return !error
    } else if (type === 'block') {
      const { error } = await supabase.from('blocks').delete().eq('id', eventId)
      return !error
    } else if (type === 'google' && googleEventId) {
      const response = await fetch('/api/google/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: googleEventId }),
      })
      return response.ok
    }

    return false
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return false
  }
}

function getWorkoutColor(type?: string): string {
  switch (type) {
    case 'swim':
      return '#0077FF'
    case 'bike':
      return '#F2C94C'
    case 'run':
      return '#EB5757'
    default:
      return '#d4f4f0' // teal for other
  }
}
