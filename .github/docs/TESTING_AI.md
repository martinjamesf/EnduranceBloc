# Testing the AI Integration

Quick guide to test the new AI-powered Sunday Prep features.

## Quick Test (No API Keys Required)

The system includes mock AI suggestions that work without any API keys!

### 1. Start the Dev Server

```bash
npm run dev
```

### 2. Navigate to Sunday Prep

Open http://localhost:3000/sunday-prep

### 3. Add Some Workouts

You need workouts to get suggestions. Either:

**Option A: Sync from TrainingPeaks**
- Go to Settings → Integrations
- Connect TrainingPeaks account
- Sync workouts

**Option B: Add Manual Workouts**
- Add workouts directly in the calendar
- Make sure they're in the current week

### 4. Click "Get AI Suggestions"

Even without API keys, you'll see:
- Suggested times for each workout
- Reasoning based on workout type
- Confidence scores
- Alternative time slots
- Weekly overview and insights

### 5. Apply Suggestions

Click "Apply" next to any suggestion to automatically update the workout timing.

## Testing with Real AI (OpenAI/Anthropic)

### Setup OpenAI (Recommended)

1. Get an API key from https://platform.openai.com/api-keys
2. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart the dev server
4. Test again - you'll get much smarter suggestions!

### Setup Anthropic Claude (Alternative)

1. Get an API key from https://console.anthropic.com/
2. Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Restart the dev server

## What the AI Considers

The LLM analyzes:
- **Workout type** (swim/bike/run) - considers facility availability, safety
- **Duration & intensity** - balances with recovery needs
- **Existing blocks** - avoids conflicts with work, family, sleep
- **Time of day** - considers performance patterns (body temp, glycogen)
- **Day of week** - balances training load across the week

## Example Scenarios to Test

### Scenario 1: Morning Swimmer
```
Workouts:
- Tuesday: 1hr Swim (Threshold)
- Thursday: 1hr Swim (Endurance)
- Saturday: 1.5hr Swim (Long)

Blocks:
- Work: M-F 9am-5pm
- Family: M-F 6pm-9pm
- Sleep: 10pm-6am daily

Expected AI Suggestion:
- All swims at 6am (before work, pool availability)
- Saturday swim slightly later (7am, more flexibility)
```

### Scenario 2: Evening Runner with Kids
```
Workouts:
- Monday: 45min Easy Run
- Wednesday: 1hr Tempo Run
- Sunday: 2hr Long Run

Blocks:
- Work: M-F 8am-4pm
- Kids pickup: M-F 4:30pm
- Family dinner: M-F 6pm-7pm
- Sleep: 10pm-5:30am

Expected AI Suggestion:
- M/W runs at 5:30am (before kids wake up)
- Sunday long run at 7am (weekend flexibility)
```

### Scenario 3: Triathlete - Complex Schedule
```
Workouts:
- Monday: 1hr Swim
- Tuesday: 2hr Bike (Intervals)
- Wednesday: 45min Run
- Thursday: 1hr Swim
- Friday: 1.5hr Bike (Endurance)
- Saturday: 1hr Run (Long)
- Sunday: 2hr Bike (Long)

Expected AI Insights:
- Spacing for recovery (48hr between hard sessions)
- Conflict warnings (too much volume?)
- Alternative scheduling to balance load
- Specific time suggestions per workout type
```

## Debugging

### Check API Response

Open browser DevTools → Network tab, then click "Get AI Suggestions". Look for the `/api/ai/suggestions` request.

**Success Response:**
```json
{
  "success": true,
  "suggestions": {
    "workoutSuggestions": [...],
    "weekOverview": "...",
    "keyInsights": [...],
    "potentialConflicts": [...]
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to generate suggestions",
  "details": "..."
}
```

### Common Issues

**"Unauthorized" error**
- Make sure you're logged in
- Check Supabase auth is working

**No suggestions appear**
- Check you have workouts in the current week
- Check browser console for errors

**Mock suggestions instead of AI**
- Verify API key is in `.env.local`
- Restart dev server after adding key
- Check key is valid (test on OpenAI/Anthropic website)

**Slow response**
- Normal for first AI call (3-10 seconds)
- Consider adding loading state improvements

## Next Steps

Once basic AI is working:

1. **Add more context** - weather, recovery metrics, performance history
2. **Implement caching** - cache suggestions per week to save API calls
3. **User feedback** - let users rate suggestions to improve over time
4. **Streaming responses** - show AI "thinking" in real-time
5. **Custom prompts** - let users adjust AI personality/priorities
