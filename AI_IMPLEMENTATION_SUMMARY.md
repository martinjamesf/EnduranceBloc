# LLM Integration for Sunday Prep - Implementation Summary

## What We Built

A complete AI-powered workout scheduling system for EnduranceBloc that:
- Analyzes athlete's weekly workout plans
- Considers life constraints (work, family, sleep)
- Suggests optimal timing for each workout
- Provides reasoning and confidence scores
- Offers alternative times and conflict detection

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Interface                     │
│              (Sunday Prep Page)                      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              useAISuggestions Hook                   │
│         (React state management)                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          POST /api/ai/suggestions                    │
│       (Authentication & validation)                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         generateWeeklyPlanSuggestions()              │
│              (LLM Service)                           │
└──────────────┬────────────┬────────────┬────────────┘
               │            │            │
               ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ OpenAI   │  │Anthropic │  │   Mock   │
        │  GPT-4   │  │  Claude  │  │   Mode   │
        └──────────┘  └──────────┘  └──────────┘
               │            │            │
               └────────────┴────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Supabase    │
                  │  ai_insights  │
                  └───────────────┘
```

## Files Created

### Core AI Service
- **`src/lib/ai/llmService.ts`** - Main LLM service with OpenAI, Anthropic, and mock support
- **`src/lib/ai/README.md`** - Documentation for AI services

### API Layer
- **`src/app/api/ai/suggestions/route.ts`** - Next.js API endpoint for AI suggestions

### React Layer
- **`src/lib/hooks/useAISuggestions.ts`** - React hook for easy component integration
- **`src/components/AI/AISuggestionsPanel.tsx`** - UI component for displaying suggestions

### Documentation
- **`.github/docs/AI_INTEGRATION.md`** - Complete integration guide
- **`.github/docs/TESTING_AI.md`** - Testing guide with scenarios
- **`src/app/(app)/sunday-prep/AI_INTEGRATION_EXAMPLE.tsx`** - Example integration code

### Configuration
- **`.env.local.example`** - Updated with AI API keys
- **`.github/copilot-instructions.md`** - Updated with AI architecture

## Key Features

### 1. Multi-Provider Support
```typescript
// Automatic fallback chain:
OpenAI GPT-4 → Anthropic Claude → Mock Mode

// Or specify manually:
await generateWeeklyPlanSuggestions(context, 'anthropic')
```

### 2. Comprehensive Analysis
The AI considers:
- Workout type (swim/bike/run) and duration
- Time of day optimization (body temp, glycogen, performance patterns)
- Facility availability (pools, road visibility)
- Existing constraints (work, family, sleep)
- Recovery requirements between sessions
- Weekly training load balance

### 3. Rich Suggestions
Each suggestion includes:
- **Optimal time** - Best start/end time with reasoning
- **Confidence score** - 0-1 scale for suggestion quality
- **Alternative times** - Backup options with reasoning
- **Conflict detection** - Warnings about schedule issues
- **Weekly overview** - Assessment of overall training load
- **Key insights** - Top recommendations for the week

### 4. Database Integration
All suggestions are saved to `ai_insights` table with:
- Row-level security (RLS) enforcement
- User ownership via `profileId`
- Upsert logic to prevent duplicates
- Queryable for history/trends

## Usage Example

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
      <button onClick={handleGetSuggestions}>
        Get AI Suggestions
      </button>
      
      <AISuggestionsPanel
        suggestions={suggestions}
        loading={loading}
        error={error}
        onApplySuggestion={(id, start, end) => {
          // Update workout in database
        }}
      />
    </>
  )
}
```

## Configuration

### Option 1: OpenAI (Recommended)
```env
OPENAI_API_KEY=sk-your-key-here
```

**Cost:** ~$0.01-0.03 per request  
**Best for:** Cost-effective, reliable, fast responses

### Option 2: Anthropic Claude
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Cost:** ~$0.015-0.075 per request  
**Best for:** Deeper reasoning, more nuanced suggestions

### Option 3: Mock Mode (No Key)
Automatically falls back if no API keys are set.

**Cost:** Free  
**Best for:** Development, testing, demos

## Testing

### Quick Test (No API Key)
```bash
npm run dev
# Navigate to http://localhost:3000/sunday-prep
# Add some workouts
# Click "Get AI Suggestions"
# See mock suggestions
```

### With Real AI
```bash
# Add API key to .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local

# Restart server
npm run dev

# Test again - now with real AI!
```

See [TESTING_AI.md](.github/docs/TESTING_AI.md) for detailed test scenarios.

## Performance

### Response Times
- **Mock:** < 100ms (instant)
- **OpenAI GPT-4:** 2-5 seconds
- **Anthropic Claude:** 3-8 seconds

### Costs (Monthly per User)
- **Mock:** $0 (free)
- **OpenAI:** $1-5 (2-10 requests/week)
- **Anthropic:** $2-8 (2-10 requests/week)

### Optimization Tips
1. **Cache suggestions** - Don't regenerate for same week
2. **Batch requests** - Analyze multiple weeks at once
3. **Stream responses** - Show AI "thinking" progressively
4. **User feedback** - Learn what suggestions work best

## Next Steps

### Immediate (MVP)
- [x] Core LLM service with multi-provider support
- [x] API endpoint with authentication
- [x] React hook and UI component
- [x] Mock mode for development
- [ ] Integrate into Sunday Prep page
- [ ] Add to Block Editor page
- [ ] User acceptance testing

### Short-term (v1.1)
- [ ] Caching layer (avoid re-analyzing same week)
- [ ] User feedback (thumbs up/down)
- [ ] Suggestion history view
- [ ] Email weekly suggestions
- [ ] Performance tracking dashboard

### Medium-term (v1.2)
- [ ] Weather API integration
- [ ] Wearable data (Whoop, Oura, Garmin)
- [ ] Performance history analysis
- [ ] Custom prompt templates per user
- [ ] A/B testing different prompts

### Long-term (v2.0)
- [ ] Multi-week planning
- [ ] Race-specific periodization
- [ ] Training plan generation
- [ ] Injury prevention recommendations
- [ ] Fine-tuned model on EnduranceBloc data

## Troubleshooting

### "Unauthorized" error
- Ensure user is logged in via Supabase Auth
- Check session is valid

### Suggestions not appearing
- Verify workouts exist in current week
- Check browser console for errors
- Ensure API key is set (if not using mock)

### Slow responses
- Normal for first AI call (3-10 seconds)
- Consider adding streaming for better UX
- Check API rate limits

### Mock suggestions instead of AI
- Verify API key is in `.env.local`
- Restart dev server after adding key
- Test key on provider's website

## Resources

- **Setup Guide:** [.github/docs/AI_INTEGRATION.md](.github/docs/AI_INTEGRATION.md)
- **Testing Guide:** [.github/docs/TESTING_AI.md](.github/docs/TESTING_AI.md)
- **AI Services README:** [src/lib/ai/README.md](src/lib/ai/README.md)
- **Example Integration:** [src/app/(app)/sunday-prep/AI_INTEGRATION_EXAMPLE.tsx](src/app/(app)/sunday-prep/AI_INTEGRATION_EXAMPLE.tsx)

## Credits

Built with:
- OpenAI GPT-4 Turbo API
- Anthropic Claude 3 API
- Next.js 16 App Router
- Supabase for data persistence
- React hooks for state management

---

**Status:** ✅ Complete and ready for integration  
**Last Updated:** January 14, 2026  
**PyTorch Note:** While PyTorch is installed, this implementation uses API-based LLMs (OpenAI/Anthropic) which is more practical for production web apps. PyTorch can be used later for custom model training if needed.
