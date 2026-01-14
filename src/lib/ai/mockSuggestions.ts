import { Workout, AIInsight } from '../types'

export function suggestTimesForWorkout(workout: Workout, profileId: string): AIInsight {
  // Simple mock: suggest the workout at 6 AM or 5 PM based on type
  let suggestion: string
  let time: string
  
  if (workout.type === 'swim') {
    suggestion = 'Pools open / cooler water'
    time = '06:00'
  } else if (workout.type === 'bike') {
    suggestion = 'Good road visibility'
    time = '17:30'
  } else {
    suggestion = 'Evening availability'
    time = '18:00'
  }

  return {
    id: '', // Will be assigned by database
    profileId,
    workoutId: workout.id,
    suggestion: `Suggested time: ${time} - ${suggestion}`,
    score: 0.85
  }
}