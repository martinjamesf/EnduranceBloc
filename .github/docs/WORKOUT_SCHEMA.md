# EnduranceBloc Canonical Workout Schema (MVP)

This schema is the normalization target produced by the translation pipeline (PyTorch + hybrid LLM fallback). It is compact, expressive, and compatible across TrainingPeaks, Garmin, Strava, coach text, and calendar entries.

## Canonical Shape

```json
{
  "source": "trainingpeaks",
  "type": "run",
  "subtype": "endurance",
  "duration_min": 60,
  "distance_km": 10.2,
  "intensity": { "zone": "Z2", "rpe": 3, "if": 0.68 },
  "structured": false,
  "steps": [],
  "notes": "Easy aerobic run",
  "metadata": { "raw_payload": {} }
}
```

## TypeScript Definitions
See src/lib/types.ts: `CanonicalWorkout`, `IntensitySpec`, `WorkoutStep`, `WorkoutSource`, and `TrainingType`.

## Mapping Rules (Summary)
- Durations → minutes; distances → kilometers.
- Intensity normalization → `zone` (Z1-Z5), `rpe` (1-10), `if` (0.0-1.5).
- Structured steps → optional; if present, capture `kind`, `duration_min`/`distance_km`, `target`, and `notes`.
- Preserve original vendor data in `metadata.raw_payload`.
- Always include `source`; default to `unknown` when not provided.

## Storage
- Raw vendor payloads → `raw_workouts.payload` (jsonb).
- Canonical records → `workouts` (with linkage to `raw_workout_id`).

## Evolution
- Power/cadence/stroke rate can be added under `intensity` or additional fields when needed.
- Steps can expand to support power/HR targets, repeats, and nested structures.
