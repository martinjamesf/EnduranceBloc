# Testing AI Suggestions

## Quick Test (Mock Mode)

1) `npm run dev`
2) Open `/sunday-prep`
3) Ensure workouts exist in the current week
4) Click "Get AI Suggestions"

Mock mode is used when no API keys are set.

## Real Providers

```env
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Restart the dev server after changes.

## Debugging

- Check `/api/ai/suggestions` in DevTools Network.
- Common causes: not logged in, no workouts, missing API key.
