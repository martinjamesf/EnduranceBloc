import type { Workout } from '../types'

interface CSVRow {
  'Workout Date': string
  'Workout Name': string
  'Workout Type': string
  'Planned Duration': string
  'Planned Distance': string
  'TSS': string
  'Workout Description': string
}

/**
 * Parse TrainingPeaks CSV export into Workout objects
 * Note: profile_id will be added during database insertion
 */
export function parseTrainingPeaksCSV(csvText: string): Workout[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid')
  }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const workouts: Workout[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      const values = parseCSVLine(line)
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
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
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
  const workoutDate = row['Workout Date'] || row['Date']
  const workoutName = row['Workout Name'] || row['Name'] || row['Title']
  const workoutType = row['Workout Type'] || row['Type'] || row['Sport']
  
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
  const durationStr = row['Planned Duration'] || row['Duration']
  if (durationStr) {
    const durationMinutes = parseDuration(durationStr)
    if (durationMinutes > 0) {
      const endDate = new Date(date.getTime() + durationMinutes * 60 * 1000)
      end = endDate.toISOString()
    }
  }

  const type = mapWorkoutType(workoutType)

  const metadata: Workout['metadata'] = {}
  
  const tss = parseFloat(row['TSS'] || row['Planned TSS'] || '')
  if (!isNaN(tss)) metadata.tss = tss

  const distance = parseFloat(row['Planned Distance'] || row['Distance'] || '')
  if (!isNaN(distance)) metadata.distance = distance

  const avgPower = parseFloat(row['Avg Power'] || row['NP'] || '')
  if (!isNaN(avgPower)) metadata.avgWatts = avgPower

  // Return workout without profile_id - that will be added during database insertion
  return {
    id: `csv-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: workoutName,
    type,
    start,
    end,
    notes: row['Workout Description'] || row['Description'],
    source: 'trainingpeaks',
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

/**
 * Map workout type to enum
 */
function mapWorkoutType(type: string): Workout['type'] {
  const normalized = type.toLowerCase().trim()
  
  if (normalized.includes('swim')) return 'swim'
  if (normalized.includes('bike') || normalized.includes('cycle')) return 'bike'
  if (normalized.includes('run')) return 'run'
  
  return 'other'
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
