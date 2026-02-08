# EnduranceBloc

EnduranceBloc is a smart weekly planning app for endurance athletes. It syncs training data and calendar events, supports the Sunday Prep ritual, and uses AI to suggest optimal workout times based on performance patterns and life constraints.

## Tech stack
- Next.js (App Router, TypeScript)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS + CSS variables (design tokens)
- TrainingPeaks API (workout import)
- Microsoft Graph API (Outlook sync)
- AI layer (custom logic + future LLM integration)

## Core features
- Weekly grid with drag-and-drop
- Sunday Prep mode (5-step flow)
- TrainingPeaks and Outlook sync
- AI workout time suggestions
- Time-block editor (family, work, sleep, custom)
- Light and dark themes

## Project structure
- src/app - App Router routes
- src/components - UI components
- src/lib - integrations, hooks, services, types
- services - translator and training services
- styles - global styles
- supabase/migrations - database schema and changes

## Setup
1. Install dependencies: `npm install`
2. Create `.env.local` (see `.github/docs/SUPABASE_SETUP.md`)
3. Apply Supabase migrations: `npm run supabase:migrate`
4. Start dev server: `npm run dev`

## Scripts
- `npm run dev` - Start local dev server
- `npm run lint` - Lint
- `npm run format` - Format
- `npm run supabase:migrate` - Push migrations to Supabase
- `npm run worker:translate` - Run the translation worker

## License
MIT
