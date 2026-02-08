export type TrainingType = 'swim' | 'bike' | 'run' | 'other'

export interface Workout {
  id: string
  title: string
  type: TrainingType
  start: string // ISO
  end?: string // ISO
  notes?: string
  source?: string
  metadata?: {
    tss?: number // Training Stress Score
    distance?: number // km
    avgWatts?: number
    maxWatts?: number
    avgHr?: number
    maxHr?: number
  }
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
  profileId: string
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

// Block Template System
export type BlockCategory = 
  | 'sleep'
  | 'meal'
  | 'work'
  | 'family'
  | 'commute'
  | 'training'
  | 'recovery'
  | 'custom'

export type RecurrencePattern = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom'

export interface RecurrenceRule {
  pattern: RecurrencePattern
  daysOfWeek?: number[] // 0=Sunday, 6=Saturday
  startDate?: string // ISO date
  endDate?: string // ISO date
  skipDates?: string[] // ISO dates to exclude
}

export interface BlockConstraints {
  earliestStart?: string // HH:mm format
  latestStart?: string // HH:mm format
  minDuration?: number // minutes
  maxDuration?: number // minutes
  bufferBefore?: number // minutes
  bufferAfter?: number // minutes
  mustNotOverlapWith?: BlockCategory[]
  preferredDays?: number[] // 0=Sunday, 6=Saturday
}

export interface BlockTemplate {
  id: string
  profileId: string
  name: string
  category: BlockCategory
  color: string
  defaultStart: string // HH:mm format
  defaultEnd: string // HH:mm format
  recurrence: RecurrenceRule
  constraints?: BlockConstraints
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface BlockConflict {
  templateId: string
  templateName: string
  conflictingEventId: string
  conflictingEventTitle: string
  date: string
  reason: string
}

// Canonical Workout Schema (LLM-driven normalization target)
export type WorkoutSource =
  | 'trainingpeaks'
  | 'strava'
  | 'garmin'
  | 'outlook'
  | 'google_calendar'
  | 'coach_text'
  | 'manual'
  | 'unknown'

export interface IntensitySpec {
  zone?: string // e.g., Z1-Z5
  rpe?: number | null // 1-10 scale
  if?: number | null // 0.0-1.5
}

export interface WorkoutStep {
  // Minimal step representation; can be expanded later
  kind: 'warmup' | 'interval' | 'cooldown' | 'rest' | 'free'
  duration_min?: number | null
  distance_km?: number | null
  target?: IntensitySpec | null
  notes?: string | null
}

export interface CanonicalWorkout {
  source: WorkoutSource
  type: TrainingType
  subtype?: 'endurance' | 'tempo' | 'threshold' | 'skills' | 'recovery' | 'race' | 'interval' | 'easy' | 'long' | 'other'
  duration_min?: number | null
  distance_km?: number | null
  intensity?: IntensitySpec
  structured: boolean
  steps: WorkoutStep[]
  notes?: string
  metadata: {
    raw_payload: Record<string, unknown>
    // Optional linkage to original row ids
    raw_workout_id?: string
    external_id?: string
  }
}