import { Workout } from '../types'

export function suggestTimesForWorkout(workout: Workout) {
  // Simple mock: suggest the workout at 6 AM or 5 PM based on type
  if (workout.type === 'swim') {
    return [{ time: '06:00', reason: 'Pools open / cooler water' }]
  }
  if (workout.type === 'bike') {
    return [{ time: '17:30', reason: 'Good road visibility' }]
  }
  return [{ time: '18:00', reason: 'Evening availability' }]
}