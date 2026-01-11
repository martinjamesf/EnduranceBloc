'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useBlockTemplates } from '@/lib/hooks/useBlockTemplates'
import { useApplyTemplates } from '@/lib/hooks/useApplyTemplates'
import { fetchCalendarEvents } from '@/lib/services/calendarService'
import type { BlockTemplate } from '@/lib/types'

interface QuickApplyDrawerProps {
  isOpen: boolean
  onClose: () => void
  onApplied?: () => void
}

export function QuickApplyDrawer({ isOpen, onClose, onApplied }: QuickApplyDrawerProps) {
  const [profileId, setProfileId] = useState<string | null>(null)
  const { templates, loading } = useBlockTemplates(profileId)
  const { applying, applyTemplates } = useApplyTemplates()
  const [result, setResult] = useState<{ success: boolean; created: any[]; conflicts: any[] } | null>(
    null
  )

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setProfileId(user?.id || null)
    }
    fetchUser()
  }, [])

  const activeTemplates = templates.filter(t => t.active)

  const handleQuickApply = async (range: 'this-week' | 'weekend') => {
    if (!profileId) return
    
    setResult(null)

    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    if (range === 'this-week') {
      start.setDate(start.getDate() - start.getDay())
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 7)
    } else {
      const dayOfWeek = start.getDay()
      if (dayOfWeek === 0) {
        start.setDate(start.getDate() - 1)
      } else if (dayOfWeek !== 6) {
        start.setDate(start.getDate() + (6 - dayOfWeek))
      }
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 2)
    }

    const existingEvents = await fetchCalendarEvents(
      start.toISOString(),
      end.toISOString(),
      profileId
    )

    const applyResult = await applyTemplates(activeTemplates, start, end, profileId, existingEvents)
    setResult(applyResult)

    if (applyResult.success && onApplied) {
      setTimeout(() => {
        onApplied()
      }, 1000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Quick Apply Blocks</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : activeTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No active templates</p>
              <a
                href="/block-editor"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Templates
              </a>
            </div>
          ) : (
            <>
              {/* Active Templates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Active Templates ({activeTemplates.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activeTemplates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: template.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
                        <p className="text-xs text-gray-500">
                          {template.defaultStart} - {template.defaultEnd}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Apply</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickApply('this-week')}
                    disabled={applying}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span>Apply to This Week</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickApply('weekend')}
                    disabled={applying}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span>Apply to This Weekend</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Results */}
              {result && (
                <div className="space-y-3">
                  {result.created.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 mb-2">
                        ✓ Created {result.created.length} block(s)
                      </p>
                    </div>
                  )}

                  {result.conflicts.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        ⚠ {result.conflicts.length} conflict(s)
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {result.conflicts.slice(0, 3).map((conflict: any, idx: number) => (
                          <li key={idx}>
                            {conflict.templateName}: {conflict.reason}
                          </li>
                        ))}
                        {result.conflicts.length > 3 && (
                          <li className="italic">...and {result.conflicts.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Link to Full Editor */}
              <div className="pt-4 border-t border-gray-200">
                <a
                  href="/block-editor"
                  className="block w-full px-4 py-2 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Open Block Editor
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
