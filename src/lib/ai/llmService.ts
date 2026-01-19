import { Workout, AIInsight, Profile } from '../types'
import { WorkoutBlock } from '../services/sundayPrep'

// Environment configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

// Choose which LLM provider to use
type LLMProvider = 'openai' | 'anthropic' | 'mock'
const DEFAULT_PROVIDER: LLMProvider = OPENAI_API_KEY ? 'openai' : 
                                       ANTHROPIC_API_KEY ? 'anthropic' : 'mock'

export interface WeeklyPlanContext {
  workouts: Workout[]
  existingBlocks: WorkoutBlock[]
  profile: Profile
  weekStartDate: string // ISO format
}

export interface WorkoutTimingSuggestion {
  workoutId: string
  suggestedStart: string // ISO timestamp
  suggestedEnd: string // ISO timestamp
  reasoning: string
  confidence: number // 0-1
  alternativeTimes?: Array<{
    start: string
    end: string
    reasoning: string
  }>
}

export interface WeeklyPlanSuggestion {
  workoutSuggestions: WorkoutTimingSuggestion[]
  weekOverview: string
  keyInsights: string[]
  potentialConflicts: Array<{
    workoutId: string
    conflictType: string
    description: string
    resolution: string
  }>
}

/**
 * Generates AI-powered suggestions for optimal workout timing
 * based on the athlete's schedule, constraints, and performance patterns
 */
export async function generateWeeklyPlanSuggestions(
  context: WeeklyPlanContext,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<WeeklyPlanSuggestion> {
  if (provider === 'mock' || !OPENAI_API_KEY) {
    return generateMockSuggestions(context)
  }

  if (provider === 'openai') {
    return generateOpenAISuggestions(context)
  }

  if (provider === 'anthropic') {
    return generateAnthropicSuggestions(context)
  }

  throw new Error(`Unsupported provider: ${provider}`)
}

/**
 * OpenAI GPT-4 implementation
 */
async function generateOpenAISuggestions(
  context: WeeklyPlanContext
): Promise<WeeklyPlanSuggestion> {
  const prompt = buildPrompt(context)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert endurance sports coach and time management advisor. Your role is to help athletes optimize their weekly training schedule by analyzing their workouts, life constraints, and performance patterns. Provide specific, actionable timing suggestions with clear reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    return parseAIResponse(content, context)
  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback to mock suggestions
    return generateMockSuggestions(context)
  }
}

/**
 * Anthropic Claude implementation
 */
async function generateAnthropicSuggestions(
  context: WeeklyPlanContext
): Promise<WeeklyPlanSuggestion> {
  const prompt = buildPrompt(context)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        system: 'You are an expert endurance sports coach and time management advisor. Your role is to help athletes optimize their weekly training schedule by analyzing their workouts, life constraints, and performance patterns. Provide specific, actionable timing suggestions with clear reasoning.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      throw new Error('No content returned from Anthropic')
    }

    return parseAIResponse(content, context)
  } catch (error) {
    console.error('Anthropic API error:', error)
    // Fallback to mock suggestions
    return generateMockSuggestions(context)
  }
}

/**
 * Build the prompt for the LLM
 */
function buildPrompt(context: WeeklyPlanContext): string {
  const { workouts, existingBlocks, profile, weekStartDate } = context

  const workoutsList = workouts.map(w => 
    `- ${w.title} (${w.type}, ${w.start}${w.end ? ` - ${w.end}` : ''})`
  ).join('\n')

  const blocksList = existingBlocks.map(b => 
    `- ${b.title} (${b.category}, Day ${b.day_of_week}, ${b.start || 'flexible'} - ${b.end || 'flexible'})`
  ).join('\n')

  return `
Analyze this athlete's weekly training plan and suggest optimal times for each workout.

ATHLETE PROFILE:
- Name: ${profile.name}
- Email: ${profile.email}
- Timezone: ${profile.tz || 'UTC'}

WEEK STARTING: ${weekStartDate}

PLANNED WORKOUTS:
${workoutsList || 'No workouts scheduled'}

EXISTING TIME BLOCKS (Work, Family, Sleep, etc.):
${blocksList || 'No existing blocks'}

TASK:
For each workout, suggest:
1. The optimal start and end time (with timezone consideration)
2. Clear reasoning based on:
   - Workout type (swim/bike/run) - consider facility availability, weather, safety
   - Duration and intensity
   - Recovery from previous workouts
   - Life constraints (work, family, sleep)
   - Performance patterns (morning vs evening)
3. Alternative times if the primary suggestion has conflicts
4. Overall weekly insights and potential issues

Respond in JSON format:
{
  "workoutSuggestions": [
    {
      "workoutId": "workout-id",
      "suggestedStart": "ISO timestamp",
      "suggestedEnd": "ISO timestamp",
      "reasoning": "Why this time is optimal",
      "confidence": 0.85,
      "alternativeTimes": [
        {"start": "ISO", "end": "ISO", "reasoning": "Alternative explanation"}
      ]
    }
  ],
  "weekOverview": "Overall assessment of the week's training load and schedule",
  "keyInsights": ["Insight 1", "Insight 2"],
  "potentialConflicts": [
    {
      "workoutId": "id",
      "conflictType": "recovery/schedule/facility",
      "description": "What the conflict is",
      "resolution": "How to resolve it"
    }
  ]
}
`.trim()
}

/**
 * Parse the AI response into structured format
 */
function parseAIResponse(
  content: string,
  context: WeeklyPlanContext
): WeeklyPlanSuggestion {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content)
    return parsed as WeeklyPlanSuggestion
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error)
    // Fallback to mock
    return generateMockSuggestions(context)
  }
}

/**
 * Mock implementation for development/fallback
 */
function generateMockSuggestions(
  context: WeeklyPlanContext
): WeeklyPlanSuggestion {
  const { workouts, existingBlocks, profile } = context

  const workoutSuggestions: WorkoutTimingSuggestion[] = workouts.map(workout => {
    // Simple heuristics based on workout type
    let suggestedHour = 6
    let reasoning = ''
    let confidence = 0.75

    switch (workout.type) {
      case 'swim':
        suggestedHour = 6
        reasoning = 'Early morning swims align with pool availability and allow for recovery before work. Water temperature is typically stable.'
        confidence = 0.85
        break
      case 'bike':
        suggestedHour = 17
        reasoning = 'Late afternoon provides good visibility and road conditions. Body temperature peaks in late afternoon, optimizing performance.'
        confidence = 0.80
        break
      case 'run':
        suggestedHour = 6
        reasoning = 'Morning runs avoid heat stress and fit well before work commitments. Glycogen stores are optimal for aerobic work.'
        confidence = 0.82
        break
      default:
        suggestedHour = 12
        reasoning = 'Midday timing provides flexibility and good environmental conditions.'
        confidence = 0.70
    }

    // Check for conflicts with existing blocks
    const workoutDate = new Date(workout.start)
    const dayOfWeek = workoutDate.getDay() || 7
    const conflictingBlocks = existingBlocks.filter(b => b.day_of_week === dayOfWeek)

    if (conflictingBlocks.length > 0) {
      confidence -= 0.1
      reasoning += ' Note: There are existing blocks on this day that may require adjustment.'
    }

    const suggestedStart = new Date(workoutDate)
    suggestedStart.setHours(suggestedHour, 0, 0, 0)
    
    const suggestedEnd = new Date(suggestedStart)
    suggestedEnd.setHours(suggestedHour + 1, 0, 0, 0) // Default 1-hour duration

    return {
      workoutId: workout.id,
      suggestedStart: suggestedStart.toISOString(),
      suggestedEnd: suggestedEnd.toISOString(),
      reasoning,
      confidence,
      alternativeTimes: [
        {
          start: new Date(suggestedStart.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          end: new Date(suggestedEnd.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          reasoning: 'Evening alternative if morning isn\'t feasible'
        }
      ]
    }
  })

  return {
    workoutSuggestions,
    weekOverview: `You have ${workouts.length} workout(s) planned this week. ${
      workouts.length > 3 
        ? 'This is a solid training week - ensure adequate recovery between sessions.' 
        : 'Consider adding 1-2 more sessions if recovery allows.'
    }`,
    keyInsights: [
      'Balance high-intensity sessions with recovery days',
      'Morning workouts tend to have better adherence rates',
      'Consider spacing workouts at least 24 hours apart for recovery'
    ],
    potentialConflicts: []
  }
}

/**
 * Generate a single workout timing suggestion (for individual workout AI)
 */
export async function suggestTimesForWorkout(
  workout: Workout,
  profileId: string,
  provider: LLMProvider = DEFAULT_PROVIDER
): Promise<AIInsight> {
  // Simple context with just one workout
  const context: WeeklyPlanContext = {
    workouts: [workout],
    existingBlocks: [],
    profile: { id: profileId, name: '', email: '', tz: 'UTC' },
    weekStartDate: new Date().toISOString()
  }

  const suggestions = await generateWeeklyPlanSuggestions(context, provider)
  const workoutSuggestion = suggestions.workoutSuggestions[0]

  if (!workoutSuggestion) {
    // Fallback
    return {
      id: '',
      profileId,
      workoutId: workout.id,
      suggestion: 'Unable to generate suggestion at this time',
      score: 0.5
    }
  }

  return {
    id: '',
    profileId,
    workoutId: workout.id,
    suggestion: `Suggested time: ${new Date(workoutSuggestion.suggestedStart).toLocaleTimeString()} - ${workoutSuggestion.reasoning}`,
    score: workoutSuggestion.confidence
  }
}

/**
 * Save AI insights to database
 */
export async function saveInsightsToDatabase(
  insights: AIInsight[],
  supabaseClient: any
): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('ai_insights')
      .upsert(insights, { onConflict: 'workoutId,profileId' })

    if (error) {
      console.error('Failed to save AI insights:', error)
      throw error
    }
  } catch (err) {
    console.error('Error saving insights:', err)
    throw err
  }
}
