# Ingestion → Normalization → Storage Pipeline

This flow converts vendor payloads (TrainingPeaks, Garmin, Strava, calendar, coach text) into EnduranceBloc's canonical workout schema.

## Flow
```
POST /api/ingest
  → insert raw payload into raw_workouts
  → enqueue translator_jobs (status=pending)
  → worker translates (PyTorch / hybrid LLM)
  → postprocess + validate
  → upsert canonical into workouts
```

## API
- Route: `/api/ingest` (App Router)
- Auth: Supabase user; RLS enforced on `profile_id`
- Body: any JSON; optionally `{ source: string, payload: object }`
- Response: `{ raw_workout_id, job_id }`

## Tables
- `raw_workouts(id, profile_id, source, payload, received_at)`
- `translator_jobs(id, raw_workout_id, status, attempts, last_error, created_at, updated_at)`
- `workouts(id, profile_id, raw_workout_id, source, type, subtype, duration_min, distance_km, intensity, structured, steps, notes, metadata, created_at, updated_at)`
- `translator_dead_letter(id, raw_workout_id, job_id, error, payload, created_at)`

## Security
- RLS: users can only read/write rows where `profile_id = auth.uid()`.
- Tokens: server route passes the user's access token in Supabase client headers to respect RLS.

## Next Steps
- Implement background worker to consume `translator_jobs` and call the inference service.
- Add confidence thresholds and hybrid LLM fallback.
- Add admin visibility for failed jobs and DLQ.
