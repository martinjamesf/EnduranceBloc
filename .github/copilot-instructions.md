# EnduranceBloc Copilot Instructions

## Project Overview
EnduranceBloc is a Next.js-based smart weekly planning app for endurance athletes. It syncs workout data from TrainingPeaks and calendar events from Outlook, allows athletes to structure their week via a drag-and-drop grid and Sunday Prep ritual, and uses AI to suggest optimal workout times based on performance patterns and life constraints.

## Architecture & Key Flows

### Tech Stack
- **Framework:** Next.js 16+ (App Router), React 19, TypeScript 5.9
- **Database:** Supabase (Auth, PostgreSQL, Realtime)
- **Styling:** Tailwind CSS 4 with CSS variables (see `tailwind.config.cjs`)
- **UI Components:** Custom in-house components (`src/components/`), aligned with Figma design system
- **Integrations:** TrainingPeaks API (OAuth), Microsoft Graph API (Outlook/Calendar)

### Data Model (Core Types in `src/lib/types.ts`)
- **Workout:** fitness activities (swim/bike/run/other) with ISO timestamp, linked to TrainingPeaks or imported directly
- **Block:** time blocks (work, family, sleep, custom) with start/end times on the weekly grid
- **AIInsight:** AI-generated suggestions tied to workouts or profiles
- **Profile:** athlete identity, timezone, email (Supabase Auth user)

### Data Flow
1. **OAuth Integration:** User connects TrainingPeaks/Outlook via callback routes (`src/app/api/{trainingpeaks,outlook}/callback/route.ts`)
2. **Sync Service:** `syncTrainingPeaksForProfile()` and `syncOutlookForProfile()` fetch remote data via integration modules
3. **Database:** Synced data is upserted into Supabase tables (workouts, blocks, calendars, users)
4. **UI Rendering:** React pages query Supabase and populate calendar grid with workouts + blocks
5. **AI Layer:** Mock suggestions in `src/lib/ai/mockSuggestions.ts` (ready for real LLM integration)

### Integration Modules (`src/lib/integrations/`)
- **trainingpeaks.ts:** OAuth flow, token exchange, `fetchWorkouts(accessToken)` (currently mocked)
- **outlook.ts:** Microsoft OAuth, Graph API prep, `fetchCalendarEvents(accessToken)` (currently mocked)
- Both follow the same pattern: `getAuthUrl()` → redirect → `exchangeCodeForToken()` → fetch data

## Component Patterns

### File Organization
- **Components:** grouped by feature in `src/components/{Feature}/{ComponentName}.tsx`
- **Exports:** use barrel export in `src/components/index.ts` for clean imports
- **Pages:** feature-based in `src/app/{page-name}/page.tsx`; use Next.js metadata export for page titles
- **Services:** business logic in `src/lib/services/` (e.g., syncService.ts)

### Component Style
- Functional components with TypeScript props typing
- Tailwind CSS for styling; use CSS variables from design tokens (primary: `#0D1D35`, accent orange: `#FF7A00`, teal: `#00C2A8`)
- Sport-specific colors: Swim `#0077FF`, Bike `#F2C94C`, Run `#EB5757`
- Support dark mode via `dark:` Tailwind prefix
- Example (Button.tsx): `<button className="px-4 py-2 rounded bg-cadenceOrange text-white">` — keep className props flexible

### Key Pages
- **`/`** (page.tsx): home/dashboard entry
- **`/login`** (login/page.tsx) and **`/signup`** (signup/page.tsx): auth entry points (signin also available at `/signin`)
- **`/forgot-password`** (forgot-password/page.tsx): reset flow
- **`/week`** (week/page.tsx): primary weekly calendar grid with workouts + life blocks
- **`/day`** (day/page.tsx): 24-hour timeline view
- **`/sunday-prep`** (sunday-prep/page.tsx): 5-step weekly planning ritual
- **`/block-editor`** (block-editor/page.tsx): drag-and-drop grid editor
- **`/workout/[id]`** (workout/[id]/page.tsx): workout detail/deep link
- **`/settings`** (settings/page.tsx): user preferences + integration management

## Developer Workflows

### Setup & Running
```bash
npm install
npm run dev            # Start local dev server (http://localhost:3000)
npm run build          # Prod build
npm run start          # Prod server
```

### Code Quality
```bash
npm run lint           # Check for TypeScript + ESLint errors
npm run lint:fix       # Auto-fix lint issues
npm run format         # Run Prettier (configured in .prettierrc)
```

### Supabase
```bash
supabase start         # Local Supabase instance (via Docker)
supabase db push       # Apply migrations from supabase/migrations/
npm run import:schema  # Load schema via psql (see .github/docs/SUPABASE_SETUP.md)
```

### Environment Setup
Create `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase dashboard)
- `TRAININGPEAKS_CLIENT_ID`, `TRAININGPEAKS_REDIRECT_URI`
- `OUTLOOK_CLIENT_ID`, `OUTLOOK_REDIRECT_URI`
- Optional: `SUPABASE_SERVICE_ROLE_KEY` (for admin DB access)

## Critical Conventions & Gotchas

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json); always type props and returns
- ISO 8601 timestamps everywhere (`start: string // ISO format`)
- Timezone support expected in Profile (tz field); handle in calculations

### API Routes & OAuth
- Route handlers use `src/app/api/{service}/{action}/route.ts` pattern
- Each integration has three routes: `connect/` (initiate OAuth), `callback/` (handle redirect), `sync/` (manual sync trigger)
- OAuth tokens stored in Supabase `auth` or user metadata (not yet fully implemented — see TODOs)

### Supabase Queries
- Use `supabase` client from `src/lib/supabaseClient.ts` (initialized with anon key)
- For admin operations, use service role key (never expose in frontend)
- Example pattern: `supabase.from('workouts').insert(workouts).select()`

### AI Integration
- Mock suggestions available in `src/lib/ai/mockSuggestions.ts`
- Ready for LLM integration; placeholder for future OpenAI/Anthropic calls
- Suggestions tied to workout IDs or generated for time slots

### Missing / In-Progress
- Token refresh logic for OAuth (access tokens expire; need refresh flow)
- Database upsert logic in `syncService.ts` (TODOs marked)
- Real LLM calls for AI suggestions (currently mock data)
- Mobile UI optimizations (marked as roadmap item)

## File Reference Map
- **Core Types:** `src/lib/types.ts`
- **Supabase Setup:** `src/lib/supabaseClient.ts`
- **OAuth + Integrations:** `src/lib/integrations/{trainingpeaks,outlook}.ts`
- **Sync Logic:** `src/lib/services/syncService.ts`
- **Design Tokens:** `tailwind.config.cjs` (colors, spacing)
- **Database Schema:** `supabase/migrations/000_init.sql` (or Supabase SQL editor)

## Documentation Guidelines
When creating or updating Markdown/instruction files:
- Place new workflow/setup docs in `.github/docs/` (e.g., `.github/docs/DEPLOYMENT.md`, `.github/docs/TESTING.md`)
- Keep `README.md` and `CONTRIBUTING.md` at root (GitHub's auto-discovery conventions)
- Update references in other docs to point to `.github/docs/` location
- Competitive/product analysis lives in `.github/docs/COMPETITOR_ANALYSIS_STRATEGY.md` (keep updated as positioning evolves)
- Update this file (`.github/copilot-instructions.md`) if adding new architectural concepts or patterns

## PR Checklist
- Run `npm run lint:fix` and `npm run format` before submitting
- Update `CONTRIBUTING.md` if adding new workflows
- Add types to `src/lib/types.ts` for new entities
- Reference the Figma design system when building UI
- Place documentation in `.github/docs/` (not at root)
