export type TrainingType = 'swim' | 'bike' | 'run' | 'other'

export interface Workout {
  id: string
  title: string
  type: TrainingType
  start: string // ISO
  end?: string // ISO
  notes?: string
  source?: string
}

export interface Block {
  id: string
  title: string
  start: string
  end: string
  workouts: string[]
}

export interface AIInsight {
  id: string
  workoutId?: string
  suggestion: string
  score?: number
}

export interface Profile {
  id: string
  name: string
  email: string
  tz?: string
}