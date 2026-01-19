import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyPlanSuggestions, saveInsightsToDatabase } from '@/lib/ai/llmService'
import type { WeeklyPlanContext } from '@/lib/ai/llmService'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workouts, existingBlocks, weekStartDate } = body

    if (!workouts || !Array.isArray(workouts)) {
      return NextResponse.json(
        { error: 'Invalid request: workouts array required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Build context for AI
    const context: WeeklyPlanContext = {
      workouts,
      existingBlocks: existingBlocks || [],
      profile: {
        id: profile.id,
        name: profile.name || profile.email,
        email: profile.email,
        tz: profile.tz || 'UTC'
      },
      weekStartDate: weekStartDate || new Date().toISOString()
    }

    // Generate AI suggestions
    const suggestions = await generateWeeklyPlanSuggestions(context)

    // Convert workout suggestions to AIInsight format and save to database
    const insights = suggestions.workoutSuggestions.map(ws => ({
      id: '', // Will be assigned by database
      profileId: user.id,
      workoutId: ws.workoutId,
      suggestion: `${ws.reasoning}\n\nSuggested time: ${new Date(ws.suggestedStart).toLocaleString()} - ${new Date(ws.suggestedEnd).toLocaleString()}`,
      score: ws.confidence
    }))

    // Save to database
    if (insights.length > 0) {
      await saveInsightsToDatabase(insights, supabase)
    }

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('Error generating AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
