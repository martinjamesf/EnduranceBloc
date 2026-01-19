# AI Services

This directory contains the AI/LLM integration for EnduranceBloc's smart workout scheduling features.

## Files

### `llmService.ts` (Full LLM Integration)
Complete AI service supporting multiple LLM providers:
- **OpenAI GPT-4** (recommended for cost/performance)
- **Anthropic Claude** (alternative, deeper reasoning)
- **Mock mode** (fallback, no API key needed)

**Main Function:**
```typescript
generateWeeklyPlanSuggestions(context: WeeklyPlanContext): Promise<WeeklyPlanSuggestion>
```

**Features:**
- Analyzes entire week of workouts + life constraints
- Suggests optimal timing for each workout with reasoning
- Provides alternative times and conflict detection
- Returns confidence scores (0-1)
- Auto-saves insights to database

**Context Input:**
```typescript
interface WeeklyPlanContext {
  workouts: Workout[]          // From TrainingPeaks or manual
  existingBlocks: WorkoutBlock[] // Work, family, sleep, etc.
  profile: Profile             // User info + timezone
  weekStartDate: string        // ISO date
}
```

**Output:**
```typescript
interface WeeklyPlanSuggestion {
  workoutSuggestions: WorkoutTimingSuggestion[] // Per-workout suggestions
  weekOverview: string                          // Overall assessment
  keyInsights: string[]                         // Top 3-5 insights
  potentialConflicts: ConflictWarning[]         // Issues to resolve
}
```

### `mockSuggestions.ts` (Legacy)
Simple mock implementation for development/testing:
```typescript
suggestTimesForWorkout(workout: Workout, profileId: string): AIInsight
```

Uses basic heuristics:
- Swims → 6 AM (pool availability)
- Bikes → 5:30 PM (visibility, body temp)
- Runs → 6 AM (cooler temps)

**When to use:**
- Development without API keys
- Unit tests
- Fallback when LLM fails

## Usage

### In React Components

Use the `useAISuggestions` hook:

```tsx
import { useAISuggestions } from '@/lib/hooks/useAISuggestions'
import { AISuggestionsPanel } from '@/components'

function SundayPrep() {
  const { suggestions, loading, error, generateSuggestions } = useAISuggestions()

  const handleGetSuggestions = async () => {
    await generateSuggestions(workouts, blocks, weekStart)
  }

  return (
    <>
      <button onClick={handleGetSuggestions}>Get AI Suggestions</button>
      <AISuggestionsPanel 
        suggestions={suggestions}
        loading={loading}
        error={error}
      />
    </>
  )
}
```

### In API Routes

Call the service directly:

```typescript
import { generateWeeklyPlanSuggestions } from '@/lib/ai/llmService'

export async function POST(request: NextRequest) {
  const context = await buildContext(request)
  const suggestions = await generateWeeklyPlanSuggestions(context)
  return NextResponse.json({ suggestions })
}
```

## Configuration

Set in `.env.local`:

```env
# Option 1: OpenAI (recommended)
OPENAI_API_KEY=sk-your-key-here

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# If neither is set, mock mode is used automatically
```

## Provider Selection

Auto-selects in order:
1. OpenAI (if `OPENAI_API_KEY` set)
2. Anthropic (if `ANTHROPIC_API_KEY` set)
3. Mock (if neither set)

Override manually:
```typescript
const suggestions = await generateWeeklyPlanSuggestions(context, 'anthropic')
```

## Cost Estimates

### OpenAI GPT-4 Turbo
- $0.01-0.03 per weekly analysis
- ~500 workouts analyzable per 2000 tokens
- **Typical monthly cost:** $1-5/user

### Anthropic Claude Opus
- $0.015-0.075 per request
- Deeper reasoning, more expensive
- **Typical monthly cost:** $2-8/user

### Mock Mode
- **Free** - no API calls
- Good for development and testing
- Uses simple heuristics

## Customization

### Adjust AI Prompt

Edit `buildPrompt()` in `llmService.ts`:

```typescript
function buildPrompt(context: WeeklyPlanContext): string {
  return `
    Analyze this athlete's week considering:
    - Your custom factor 1
    - Your custom factor 2
    ...
  `
}
```

### Add Context Fields

Extend `WeeklyPlanContext`:

```typescript
interface WeeklyPlanContext {
  workouts: Workout[]
  existingBlocks: WorkoutBlock[]
  profile: Profile
  weekStartDate: string
  
  // New fields
  weatherForecast?: WeatherData[]
  recoveryMetrics?: RecoveryScore[]
  performanceHistory?: PerformanceLog[]
}
```

Update prompt to use new data.

## Testing

See [`.github/docs/TESTING_AI.md`](../../.github/docs/TESTING_AI.md) for:
- Quick test without API keys
- Testing with real LLMs
- Example scenarios
- Debugging tips

## Integration Guide

See [`.github/docs/AI_INTEGRATION.md`](../../.github/docs/AI_INTEGRATION.md) for:
- Setup instructions
- API endpoint usage
- Database schema
- Cost analysis
- Next steps

## Architecture

```
User clicks "Get AI Suggestions"
    ↓
useAISuggestions hook
    ↓
POST /api/ai/suggestions
    ↓
llmService.generateWeeklyPlanSuggestions()
    ↓
[OpenAI API / Anthropic API / Mock]
    ↓
Parse response → WeeklyPlanSuggestion
    ↓
Save to ai_insights table (Supabase)
    ↓
Return to component
    ↓
AISuggestionsPanel displays results
```

## Future Enhancements

- [ ] Streaming responses (show AI "thinking")
- [ ] Caching (avoid re-analyzing same week)
- [ ] User feedback (rate suggestions)
- [ ] Performance tracking (acceptance rates)
- [ ] Weather API integration
- [ ] Wearable data (Whoop, Oura, Garmin)
- [ ] Custom prompt templates per user
- [ ] Multi-week planning
- [ ] Race-specific periodization
