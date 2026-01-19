import type { Workout } from '@/lib/types'

interface WorkoutMetricsProps {
  workout: Workout
}

export function WorkoutMetrics({ workout }: WorkoutMetricsProps) {
  const { metadata } = workout

  if (!metadata || Object.values(metadata).every((v) => v === undefined)) {
    return null
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
      {metadata.tss !== undefined && (
        <div className="flex items-center gap-1 text-amber-400">
          <span title="Training Stress Score">⚡</span>
          <span>{metadata.tss} TSS</span>
        </div>
      )}
      {metadata.distance !== undefined && (
        <div className="flex items-center gap-1 text-blue-400">
          <span title="Distance">📏</span>
          <span>{metadata.distance.toFixed(1)} km</span>
        </div>
      )}
      {metadata.avgWatts !== undefined && (
        <div className="flex items-center gap-1 text-orange-400">
          <span title="Average Power">⚙️</span>
          <span>{metadata.avgWatts}W</span>
        </div>
      )}
      {metadata.maxWatts !== undefined && (
        <div className="flex items-center gap-1 text-red-400">
          <span title="Max Power">🔥</span>
          <span>{metadata.maxWatts}W</span>
        </div>
      )}
      {metadata.avgHr !== undefined && (
        <div className="flex items-center gap-1 text-rose-400">
          <span title="Average Heart Rate">❤️</span>
          <span>{metadata.avgHr} bpm</span>
        </div>
      )}
      {metadata.maxHr !== undefined && (
        <div className="flex items-center gap-1 text-rose-500">
          <span title="Max Heart Rate">💓</span>
          <span>{metadata.maxHr} bpm</span>
        </div>
      )}
    </div>
  )
}
