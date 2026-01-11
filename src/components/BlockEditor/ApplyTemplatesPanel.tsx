'use client'

import React, { useState } from 'react'
import type { BlockTemplate } from '@/lib/types'
import type { CalendarEvent } from '@/lib/services/calendarService'

interface ApplyTemplatesPanelProps {
  templates: BlockTemplate[]
  onApply: (
    selectedTemplates: BlockTemplate[],
    startDate: Date,
    endDate: Date
  ) => Promise<{ success: boolean; created: CalendarEvent[]; conflicts: any[] }>
  applying: boolean
}

export function ApplyTemplatesPanel({ templates, onApply, applying }: ApplyTemplatesPanelProps) {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<'this-week' | 'next-week' | 'weekend' | 'custom'>(
    'this-week'
  )
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [result, setResult] = useState<{
    success: boolean
    created: CalendarEvent[]
    conflicts: any[]
  } | null>(null)

  const activeTemplates = templates.filter(t => t.active)

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(templateId) ? prev.filter(id => id !== templateId) : [...prev, templateId]
    )
  }

  const selectAll = () => {
    setSelectedTemplateIds(activeTemplates.map(t => t.id))
  }

  const clearSelection = () => {
    setSelectedTemplateIds([])
  }

  const getDateRangeForOption = (option: typeof dateRange): { start: Date; end: Date } => {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (option) {
      case 'this-week':
        start.setDate(start.getDate() - start.getDay())
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 7)
        break
      case 'next-week':
        start.setDate(start.getDate() - start.getDay() + 7)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 7)
        break
      case 'weekend':
        const dayOfWeek = start.getDay()
        if (dayOfWeek === 0) {
          start.setDate(start.getDate() - 1)
        } else if (dayOfWeek !== 6) {
          start.setDate(start.getDate() + (6 - dayOfWeek))
        }
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 2)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate),
          }
        }
        break
    }

    return { start, end }
  }

  const handleApply = async () => {
    setResult(null)

    if (selectedTemplateIds.length === 0) {
      alert('Select at least one template to apply')
      return
    }

    if (dateRange === 'custom' && (!customStartDate || !customEndDate)) {
      alert('Select date range for custom option')
      return
    }

    const selectedTemplates = templates.filter(t => selectedTemplateIds.includes(t.id))
    const { start, end } = getDateRangeForOption(dateRange)

    const applyResult = await onApply(selectedTemplates, start, end)
    setResult(applyResult)
  }

  const { start: previewStart, end: previewEnd } = getDateRangeForOption(dateRange)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply Templates to Calendar</h3>
      </div>

      {/* Template Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Templates ({selectedTemplateIds.length} of {activeTemplates.length})
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-gray-600 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
          {activeTemplates.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No active templates. Enable templates in the list to apply them.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeTemplates.map(template => (
                <label
                  key={template.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTemplateIds.includes(template.id)}
                    onChange={() => toggleTemplate(template.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
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
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Range Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Date Range</label>
        <div className="space-y-2">
          {[
            { value: 'this-week', label: 'This Week' },
            { value: 'next-week', label: 'Next Week' },
            { value: 'weekend', label: 'This Weekend' },
            { value: 'custom', label: 'Custom Range' },
          ].map(option => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="dateRange"
                value={option.value}
                checked={dateRange === option.value}
                onChange={e => setDateRange(e.target.value as typeof dateRange)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="customStart" className="block text-xs text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="customStart"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="customEnd" className="block text-xs text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="customEnd"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {dateRange !== 'custom' || (customStartDate && customEndDate) ? (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> {previewStart.toLocaleDateString()} to{' '}
              {previewEnd.toLocaleDateString()}
            </p>
          </div>
        ) : null}
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={applying || selectedTemplateIds.length === 0}
        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {applying ? 'Applying...' : `Apply ${selectedTemplateIds.length} Template(s)`}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {result.created.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✓ Successfully created {result.created.length} block(s)
              </p>
              <ul className="text-xs text-green-700 space-y-1">
                {result.created.slice(0, 5).map(event => (
                  <li key={event.id}>
                    {event.title} on {new Date(event.start).toLocaleDateString()}
                  </li>
                ))}
                {result.created.length > 5 && (
                  <li className="italic">...and {result.created.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {result.conflicts.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠ {result.conflicts.length} conflict(s) found
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                {result.conflicts.slice(0, 5).map((conflict, idx) => (
                  <li key={idx}>
                    {conflict.templateName} on {new Date(conflict.date).toLocaleDateString()}:{' '}
                    {conflict.reason}
                  </li>
                ))}
                {result.conflicts.length > 5 && (
                  <li className="italic">...and {result.conflicts.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
