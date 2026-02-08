# Translation Pipeline

This pipeline converts raw vendor payloads into the canonical workout schema with a hybrid model + LLM fallback.

## Flow

```
POST /api/ingest
  -> raw_workouts
  -> translator_jobs
  -> worker
  -> translator service (/translate)
  -> workouts (or fallback + DLQ)
```

## Key Services

- Ingestion: `src/app/api/ingest/route.ts`
- Worker: `scripts/translationWorker.js`
- Translator: `services/translator_service/`
- LLM fallback: `src/app/api/translator/fallback/route.ts`

## Training

- Code: `services/training/`
- Artifacts: `services/training/artifacts/`

## Env Vars

```env
TRANSLATOR_SERVICE_URL=http://localhost:8000
FALLBACK_SERVICE_URL=http://localhost:3000/api/translator/fallback
CONFIDENCE_THRESHOLD=0.7
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## Schema References

- Canonical workout schema: `.github/docs/WORKOUT_SCHEMA.md`
- Database migration: `supabase/migrations/008_llm_translation_pipeline.sql`
