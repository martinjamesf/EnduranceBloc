import React from 'react'
import type { WeeklyPlanSuggestion } from '@/lib/ai/llmService'

interface AISuggestionsProps {
  suggestions: WeeklyPlanSuggestion | null
  loading: boolean
  error: string | null
  onApplySuggestion?: (workoutId: string, start: string, end: string) => void
}

export function AISuggestionsPanel({
  suggestions,
  loading,
  error,
  onApplySuggestion
}: AISuggestionsProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cadenceOrange"></div>
          <p className="text-gray-600 dark:text-gray-400">Analyzing your week and generating suggestions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          AI Suggestions Unavailable
        </h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!suggestions) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Week Overview */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-cadenceOrange/5 to-cadenceTeal/5 dark:from-cadenceOrange/10 dark:to-cadenceTeal/10 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-cadenceOrange/20 p-2">
            <svg className="w-5 h-5 text-cadenceOrange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Weekly Overview
            </h3>
            <p className="text-gray-700 dark:text-gray-300">{suggestions.weekOverview}</p>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {suggestions.keyInsights.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Key Insights
          </h3>
          <ul className="space-y-2">
            {suggestions.keyInsights.map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <svg className="w-5 h-5 text-cadenceTeal mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Workout Suggestions */}
      {suggestions.workoutSuggestions.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Workout Timing Suggestions
          </h3>
          <div className="space-y-4">
            {suggestions.workoutSuggestions.map((suggestion) => (
              <div
                key={suggestion.workoutId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cadenceOrange dark:hover:border-cadenceOrange transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(suggestion.suggestedStart).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-sm font-semibold text-cadenceOrange">
                        {new Date(suggestion.suggestedStart).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                        {' - '}
                        {new Date(suggestion.suggestedEnd).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {suggestion.reasoning}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-cadenceTeal rounded-full h-2 transition-all"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(suggestion.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                  {onApplySuggestion && (
                    <button
                      onClick={() => onApplySuggestion(
                        suggestion.workoutId,
                        suggestion.suggestedStart,
                        suggestion.suggestedEnd
                      )}
                      className="px-3 py-1.5 bg-cadenceOrange text-white text-sm font-medium rounded hover:bg-cadenceOrange/90 transition-colors"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {/* Alternative Times */}
                {suggestion.alternativeTimes && suggestion.alternativeTimes.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
                      View alternative times
                    </summary>
                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                      {suggestion.alternativeTimes.map((alt, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {new Date(alt.start).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                            {' - '}
                            {new Date(alt.end).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <p className="text-gray-600 dark:text-gray-400 mt-0.5">{alt.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Potential Conflicts */}
      {suggestions.potentialConflicts.length > 0 && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Potential Conflicts
          </h3>
          <div className="space-y-3">
            {suggestions.potentialConflicts.map((conflict, idx) => (
              <div key={idx} className="border-l-4 border-yellow-400 pl-4">
                <p className="font-medium text-yellow-900 dark:text-yellow-200">
                  {conflict.conflictType}
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  {conflict.description}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1 italic">
                  Resolution: {conflict.resolution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
