import { fetchWorkouts } from '../integrations/trainingpeaks'
import { fetchCalendarEvents } from '../integrations/outlook'
import { supabase } from '../supabaseClient'

export async function syncTrainingPeaksForProfile(profileId: string, accessToken: string) {
  const workouts = await fetchWorkouts(accessToken)
  // TODO: upsert into 'workouts' table using Supabase client
  // Example placeholder (not committing to DB yet):
  // await supabase.from('workouts').insert(...)
  return { count: workouts.length, workouts }
}

export async function syncOutlookForProfile(profileId: string, accessToken: string) {
  const events = await fetchCalendarEvents(accessToken)
  // TODO: upsert into 'blocks' or calendar entries
  return { count: events.length, events }
}