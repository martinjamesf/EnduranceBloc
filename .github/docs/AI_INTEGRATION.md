# AI Integration for Sunday Prep

This guide shows how to integrate the AI-powered workout suggestions into the Sunday Prep page.

## Setup

### 1. Add Environment Variables

Add to your `.env.local`:

```env
# OpenAI (recommended)
OPENAI_API_KEY=sk-your-openai-key-here

# OR Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

**Note:** The system will automatically use OpenAI if available, then fall back to Anthropic, then to mock suggestions if neither is configured.

### 2. Install Dependencies

```bash
npm install @supabase/auth-helpers-nextjs
```

## Usage in Sunday Prep Page

Add the AI suggestions panel to your Sunday Prep page:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { usePageAnalytics } from '@/lib/analytics/usePageAnalytics'
import { PageHeader, AISuggestionsPanel } from '@/components'
import { useAISuggestions } from '@/lib/hooks/useAISuggestions'
import { supabase } from '@/lib/supabaseClient'
import {
  loadWeekPlan,
  getCurrentWeekStart,
  type DayBlock,
  type WorkoutBlock
} from '@/lib/services/sundayPrep'

export default function SundayPrep() {
  usePageAnalytics('sundayPrep')
  const [weekData, setWeekData] = useState<DayBlock[]>([])
  const [weekStart, setWeekStart] = useState<Date>(new Date())
  const [workouts, setWorkouts] = useState([])
  
  // AI Suggestions Hook
  const { suggestions, loading, error, generateSuggestions } = useAISuggestions()

  // Load week data and workouts
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ws = getCurrentWeekStart()
      setWeekStart(ws)

      // Load week plan
      const weekPlan = await loadWeekPlan(user.id, ws)
      setWeekData(weekPlan)

      // Load workouts for the week
      const weekEnd = new Date(ws)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('profile_id', user.id)
        .gte('start', ws.toISOString())
        .lt('start', weekEnd.toISOString())

      setWorkouts(workoutsData || [])
    }

    loadData()
  }, [])

  // Generate AI suggestions
  const handleGenerateAI = async () => {
    const allBlocks = weekData.flatMap(day => day.tasks)
    await generateSuggestions(workouts, allBlocks, weekStart)
  }

  // Apply a suggestion to a workout
  const handleApplySuggestion = async (workoutId: string, start: string, end: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .update({ start, end })
        .eq('id', workoutId)

      if (error) throw error

      // Refresh workouts
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        const { data: workoutsData } = await supabase
          .from('workouts')
          .select('*')
          .eq('profile_id', user.id)
          .gte('start', weekStart.toISOString())
          .lt('start', weekEnd.toISOString())

        setWorkouts(workoutsData || [])
      }
    } catch (err) {
      console.error('Failed to apply suggestion:', err)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Sunday Prep" 
        description="Plan your week with AI-powered suggestions"
      />

      {/* AI Suggestions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI Coach Suggestions
          </h2>
          <button
            onClick={handleGenerateAI}
            disabled={loading || workouts.length === 0}
            className="px-4 py-2 bg-cadenceOrange text-white font-medium rounded hover:bg-cadenceOrange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Get AI Suggestions'}
          </button>
        </div>
        
        <AISuggestionsPanel
          suggestions={suggestions}
          loading={loading}
          error={error}
          onApplySuggestion={handleApplySuggestion}
        />
      </div>

      {/* Rest of your Sunday Prep UI */}
      {/* ... */}
    </div>
  )
}
```

## API Endpoint

The AI suggestions are generated via the `/api/ai/suggestions` endpoint:

**Request:**
```json
{
  "workouts": [
    {
      "id": "workout-1",
      "title": "Morning Run",
      "type": "run",
      "start": "2026-01-20T06:00:00Z"
    }
  ],
  "existingBlocks": [
    {
      "id": "block-1",
      "title": "Work",
      "category": "Work",
      "day_of_week": 1,
      "start": "09:00",
      "end": "17:00"
    }
  ],
  "weekStartDate": "2026-01-19T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": {
    "workoutSuggestions": [
      {
        "workoutId": "workout-1",
        "suggestedStart": "2026-01-20T06:00:00Z",
        "suggestedEnd": "2026-01-20T07:00:00Z",
        "reasoning": "Early morning runs avoid heat stress...",
        "confidence": 0.85,
        "alternativeTimes": [...]
      }
    ],
    "weekOverview": "You have 5 workouts planned...",
    "keyInsights": ["Balance intensity with recovery", ...],
    "potentialConflicts": []
  }
}
```

## Testing Without API Keys

If you don't have API keys yet, the system will automatically use mock suggestions. To test:

1. Click "Get AI Suggestions" button
2. You'll see mock suggestions based on simple heuristics:
   - Swims → 6 AM (pool availability)
   - Bikes → 5:30 PM (visibility, body temp)
   - Runs → 6 AM (cooler temps, glycogen)

## Customization

### Adjust the AI Prompt

Edit the `buildPrompt()` function in `src/lib/ai/llmService.ts` to customize what the AI considers:

```typescript
function buildPrompt(context: WeeklyPlanContext): string {
  // Add your custom logic here
  // Consider: weather patterns, athlete's performance history, etc.
}
```

### Add More Context

Extend the `WeeklyPlanContext` interface to include:
- Sleep patterns
- Recovery metrics
- Performance history
- Weather forecasts
- Facility schedules

### Switch LLM Provider

Change the provider in the API route:

```typescript
const suggestions = await generateWeeklyPlanSuggestions(context, 'anthropic')
```

Or set it via environment variable (recommended).

## Database Schema

The AI insights are stored in the `ai_insights` table:

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  workout_id UUID REFERENCES workouts(id),
  suggestion TEXT NOT NULL,
  score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own insights"
  ON ai_insights FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
```

## Costs

### OpenAI (gpt-4-turbo-preview)
- ~$0.01-0.03 per request
- 2000 token limit = ~500 workouts analyzed
- Monthly cost for typical user: $1-5

### Anthropic (claude-3-opus)
- ~$0.015-0.075 per request
- More expensive but often better reasoning
- Monthly cost: $2-8

### Recommendation
Start with OpenAI gpt-4-turbo-preview for cost-effectiveness, then upgrade to Claude Opus for power users who want deeper insights.

## Next Steps

1. **Add streaming responses** for real-time feedback
2. **Implement caching** to avoid re-analyzing the same week
3. **Add user feedback** to improve suggestions over time
4. **Track suggestion acceptance rate** for model tuning
5. **Integrate weather API** for outdoor workout timing
6. **Add recovery metrics** from wearables (Whoop, Oura, Garmin)
