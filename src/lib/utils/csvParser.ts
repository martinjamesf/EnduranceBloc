import type { Workout } from '../types'

type HeaderMatch = string[]

const DATE_HEADERS: HeaderMatch = ['workout date', 'date', 'start date', 'start time', 'timestamp']
const NAME_HEADERS: HeaderMatch = ['workout name', 'name', 'title', 'session', 'activity name']
const TYPE_HEADERS: HeaderMatch = ['workout type', 'type', 'sport', 'activity type', 'activity']
const DURATION_HEADERS: HeaderMatch = ['planned duration', 'duration', 'time', 'moving time']
const DISTANCE_HEADERS: HeaderMatch = ['planned distance', 'distance', 'miles', 'km', 'kilometers']
const TSS_HEADERS: HeaderMatch = ['tss', 'score', 'stress']
const NOTES_HEADERS: HeaderMatch = ['workout description', 'description', 'notes']

/**
 * Parse a generic workout CSV (TrainingPeaks, Garmin, Strava export variants) into Workout objects.
 * We look for flexible header names and fall back gracefully when optional columns are missing.
 */
export function parseWorkoutCSV(csvText: string): Workout[] {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid')
  }

  // Support comma or semicolon separated exports; normalize to commas if a row has more semicolons
  const firstLine = lines[0]
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ','
  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/"/g, ''))

  const hasDateHeader = headers.some((h) => DATE_HEADERS.includes(h.toLowerCase()))
  const hasNameHeader = headers.some((h) => NAME_HEADERS.includes(h.toLowerCase()))

  if (!hasDateHeader || !hasNameHeader) {
    throw new Error('CSV is missing required columns for date and name/title. Include a date and workout name column.')
  }

  const workouts: Workout[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line, delimiter)
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/"/g, '') || ''
      })

      const workout = parseWorkoutRow(row)
      if (workout) {
        workouts.push(workout)
      }
    } catch (err) {
      console.warn(`Skipping row ${i + 1}:`, err)
    }
  }

  return workouts
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let currentValue = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  values.push(currentValue)

  return values
}

/**
 * Convert CSV row to Workout object
 */
function parseWorkoutRow(row: Record<string, string>): Workout | null {
  const workoutDate = findFirst(row, DATE_HEADERS)
  const workoutName = findFirst(row, NAME_HEADERS)
  const workoutType = findFirst(row, TYPE_HEADERS)

  if (!workoutDate || !workoutName) {
    return null
  }

  const date = new Date(workoutDate)
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${workoutDate}`)
  }

  date.setHours(6, 0, 0, 0)
  const start = date.toISOString()

  let end: string | undefined
  const durationStr = findFirst(row, DURATION_HEADERS)
  if (durationStr) {
    const durationMinutes = parseDuration(durationStr)
    if (durationMinutes > 0) {
      const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000)
      end = endDate.toISOString()
    }
  }

  const type = mapWorkoutType(workoutType)

  const metadata: Workout['metadata'] = {}

  const tss = parseFloat(findFirst(row, TSS_HEADERS) || '')
  if (!isNaN(tss)) metadata.tss = tss

  const distanceRaw = findFirst(row, DISTANCE_HEADERS)
  const distance = parseDistance(distanceRaw)
  if (!isNaN(distance)) metadata.distance = distance

  const avgPower = parseFloat(row['Avg Power'] || row['NP'] || row['Average Power'] || '')
  if (!isNaN(avgPower)) metadata.avgWatts = avgPower

  return {
    id: `csv-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: workoutName,
    type,
    start,
    end,
    notes: findFirst(row, NOTES_HEADERS) || undefined,
    source: 'csv_import',
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  }
}

/**
 * Parse duration string to minutes
 */
function parseDuration(duration: string): number {
  if (!duration) return 0

  if (duration.includes(':')) {
    const parts = duration.split(':').map(Number)
    if (parts.length === 3) {
      return parts[0] * 60 + parts[1] + parts[2] / 60
    }
    if (parts.length === 2) {
      return parts[0] + parts[1] / 60
    }
  }

  const minutes = parseFloat(duration)
  return isNaN(minutes) ? 0 : minutes
}

function parseDistance(distance: string | undefined): number {
  if (!distance) return NaN
  const normalized = distance.toLowerCase().trim()
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)/)
  if (!match) return NaN
  const value = parseFloat(match[1])
  if (normalized.includes('mi')) return value * 1.60934
  return value
}

/**
 * Map workout type to enum
 */
function mapWorkoutType(type: string): Workout['type'] {
  const normalized = (type || '').toLowerCase().trim()

  if (normalized.includes('swim')) return 'swim'
  if (normalized.includes('bike') || normalized.includes('cycle') || normalized.includes('ride')) return 'bike'
  if (normalized.includes('run') || normalized.includes('jog')) return 'run'
  if (normalized.includes('walk') || normalized.includes('hike')) return 'run'
  if (normalized.includes('strength') || normalized.includes('gym')) return 'other'

  return 'other'
}

function findFirst(row: Record<string, string>, candidates: HeaderMatch): string | undefined {
  const lowerKeys = Object.keys(row).reduce<Record<string, string>>((acc, key) => {
    acc[key.toLowerCase()] = key
    return acc
  }, {})

  for (const candidate of candidates) {
    const key = lowerKeys[candidate]
    if (key && row[key]) {
      return row[key]
    }
  }
  return undefined
}

/**
 * Generate example CSV template
 */
export function generateCSVTemplate(): string {
  return `Workout Date,Workout Name,Workout Type,Planned Duration,Planned Distance,TSS,Workout Description
2026-01-20,Easy Recovery Run,Run,00:45:00,8.0,45,Easy pace run for active recovery
2026-01-21,Threshold Bike,Bike,01:30:00,40.0,85,2x20min @ FTP with 5min recovery
2026-01-22,Swim Technique,Swim,01:00:00,3.0,55,Drill focused session - catch up drill`
}
