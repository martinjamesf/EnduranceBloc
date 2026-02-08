# Environment Variables

Copy `.env.local.example` to `.env.local`, then fill in what you need. Keep secrets out of git.

## Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Server-only (recommended)

```env
SUPABASE_SERVICE_ROLE_KEY=
```

## Analytics

```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
```

## Integrations (optional)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback

TRAININGPEAKS_CLIENT_ID=
TRAININGPEAKS_CLIENT_SECRET=
TRAININGPEAKS_REDIRECT_URI=http://localhost:3000/api/trainingpeaks/callback

OUTLOOK_CLIENT_ID=
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/outlook/callback
```

## AI (optional)

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

## Notes

- For Supabase setup and migrations, see `.github/docs/SUPABASE_SETUP.md`.
- Redirect URIs must match provider dashboards exactly.
- Restart `npm run dev` after editing env files.
