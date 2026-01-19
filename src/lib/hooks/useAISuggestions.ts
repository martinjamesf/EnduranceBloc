import { useState } from 'react'
import { supabase } from '../supabaseClient'
import type { Workout } from '../types'
import type { WorkoutBlock } from '../services/sundayPrep'
import type { WeeklyPlanSuggestion } from '../ai/llmService'

export interface UseAISuggestionsReturn {
  suggestions: WeeklyPlanSuggestion | null
  loading: boolean
  error: string | null
  generateSuggestions: (workouts: Workout[], blocks: WorkoutBlock[], weekStart: Date) => Promise<void>
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<WeeklyPlanSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSuggestions = async (
    workouts: Workout[],
    blocks: WorkoutBlock[],
    weekStart: Date
  ) => {
    setLoading(true)
    setError(null)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          workouts,
          existingBlocks: blocks,
          weekStartDate: weekStart.toISOString()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate suggestions')
      }

      const data = await response.json()
      setSuggestions(data.suggestions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error generating AI suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  return {
    suggestions,
    loading,
    error,
    generateSuggestions
  }
}
