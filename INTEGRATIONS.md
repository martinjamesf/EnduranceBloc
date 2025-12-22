# Integrations (TrainingPeaks & Outlook)

This document explains the placeholder endpoints and how to wire real integrations.

## Available endpoints (placeholders)

- **TrainingPeaks**
  - GET /api/trainingpeaks/connect → Redirects to TrainingPeaks OAuth authorize page
  - GET /api/trainingpeaks/callback → OAuth callback, exchanges code for token (placeholder)
  - POST /api/trainingpeaks/sync → Trigger a sync; expects JSON { accessToken }

- **Outlook (Microsoft Graph)**
  - GET /api/outlook/connect → Redirects to Outlook/Microsoft authorize page
  - GET /api/outlook/callback → OAuth callback for Outlook (placeholder)
  - POST /api/outlook/sync → Trigger a sync; expects JSON { accessToken }

## Next steps to make these production ready

- Implement OAuth token exchange flows using the respective token endpoints and persist refresh tokens in the database (Supabase) per user profile.
- Add server-side endpoints that validate the authenticated user and fetch tokens from the DB instead of accepting access tokens in the request body.
- Implement upserts into `workouts` and `blocks` tables using Supabase service role or server functions.
- Add background jobs (cron / queue) for full syncs and incremental syncs.
- Add tests and integration tests against sandbox/test accounts.

## Security notes
- Store secrets (client id, client secret) in GitHub Actions / environment variables, not in source control.
- Use short-lived tokens and refresh flows to minimize risk.
- Validate and scope the requested OAuth permissions to the minimum required.
