'use client'

import React, { useState, useEffect } from 'react'
import type { BlockTemplate, BlockCategory, RecurrencePattern } from '@/lib/types'

interface BlockTemplateFormProps {
  template: BlockTemplate | null
  onSave: (template: Omit<BlockTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCancel: () => void
}

const categoryOptions: Array<{ value: BlockCategory; label: string; color: string }> = [
  { value: 'sleep', label: 'Sleep', color: '#9B59B6' },
  { value: 'meal', label: 'Meal', color: '#E67E22' },
  { value: 'work', label: 'Work', color: '#3498DB' },
  { value: 'family', label: 'Family', color: '#E91E63' },
  { value: 'commute', label: 'Commute', color: '#95A5A6' },
  { value: 'training', label: 'Training', color: '#2ECC71' },
  { value: 'recovery', label: 'Recovery', color: '#1ABC9C' },
  { value: 'custom', label: 'Custom', color: '#7F8C8D' },
]

const recurrenceOptions: Array<{ value: RecurrencePattern; label: string }> = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays (Mon-Fri)' },
  { value: 'weekends', label: 'Weekends (Sat-Sun)' },
  { value: 'weekly', label: 'Specific days of week' },
]

const daysOfWeek = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

export function BlockTemplateForm({ template, onSave, onCancel }: BlockTemplateFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BlockCategory>('custom')
  const [color, setColor] = useState('#7F8C8D')
  const [defaultStart, setDefaultStart] = useState('09:00')
  const [defaultEnd, setDefaultEnd] = useState('10:00')
  const [description, setDescription] = useState('')
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [active, setActive] = useState(true)
  
  // Constraint states
  const [earliestStart, setEarliestStart] = useState('')
  const [latestStart, setLatestStart] = useState('')
  const [bufferBefore, setBufferBefore] = useState(0)
  const [bufferAfter, setBufferAfter] = useState(0)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (template) {
      setName(template.name)
      setCategory(template.category)
      setColor(template.color)
      setDefaultStart(template.defaultStart)
      setDefaultEnd(template.defaultEnd)
      setDescription(template.description || '')
      setRecurrencePattern(template.recurrence.pattern)
      setSelectedDays(template.recurrence.daysOfWeek || [])
      setActive(template.active)
      setEarliestStart(template.constraints?.earliestStart || '')
      setLatestStart(template.constraints?.latestStart || '')
      setBufferBefore(template.constraints?.bufferBefore || 0)
      setBufferAfter(template.constraints?.bufferAfter || 0)
    } else {
      resetForm()
    }
  }, [template])

  const resetForm = () => {
    setName('')
    setCategory('custom')
    setColor('#7F8C8D')
    setDefaultStart('09:00')
    setDefaultEnd('10:00')
    setDescription('')
    setRecurrencePattern('daily')
    setSelectedDays([])
    setActive(true)
    setEarliestStart('')
    setLatestStart('')
    setBufferBefore(0)
    setBufferAfter(0)
    setErrors({})
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!defaultStart) {
      newErrors.defaultStart = 'Start time is required'
    }

    if (!defaultEnd) {
      newErrors.defaultEnd = 'End time is required'
    }

    if (defaultStart >= defaultEnd) {
      newErrors.defaultEnd = 'End time must be after start time'
    }

    if (recurrencePattern === 'weekly' && selectedDays.length === 0) {
      newErrors.recurrence = 'Select at least one day'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)

    try {
      const templateData: Omit<BlockTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        profileId: template?.profileId || '',
        name: name.trim(),
        category,
        color,
        defaultStart,
        defaultEnd,
        description: description.trim(),
        recurrence: {
          pattern: recurrencePattern,
          daysOfWeek: recurrencePattern === 'weekly' ? selectedDays : undefined,
        },
        constraints: {
          earliestStart: earliestStart || undefined,
          latestStart: latestStart || undefined,
          bufferBefore: bufferBefore > 0 ? bufferBefore : undefined,
          bufferAfter: bufferAfter > 0 ? bufferAfter : undefined,
        },
        active,
      }

      await onSave(templateData)
      resetForm()
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save template' })
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (newCategory: BlockCategory) => {
    setCategory(newCategory)
    const categoryOption = categoryOptions.find(opt => opt.value === newCategory)
    if (categoryOption) {
      setColor(categoryOption.color)
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {template ? 'Edit Template' : 'New Template'}
        </h2>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Morning Coffee, Deep Work Session"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-600 mt-1">
            {errors.name}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={e => handleCategoryChange(e.target.value as BlockCategory)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {categoryOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="#7F8C8D"
          />
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="defaultStart" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="defaultStart"
            value={defaultStart}
            onChange={e => setDefaultStart(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.defaultStart ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.defaultStart}
          />
          {errors.defaultStart && (
            <p className="text-sm text-red-600 mt-1">{errors.defaultStart}</p>
          )}
        </div>
        <div>
          <label htmlFor="defaultEnd" className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="defaultEnd"
            value={defaultEnd}
            onChange={e => setDefaultEnd(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.defaultEnd ? 'border-red-500' : 'border-gray-300'
            }`}
            aria-invalid={!!errors.defaultEnd}
          />
          {errors.defaultEnd && (
            <p className="text-sm text-red-600 mt-1">{errors.defaultEnd}</p>
          )}
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 mb-1">
          Recurrence <span className="text-red-500">*</span>
        </label>
        <select
          id="recurrence"
          value={recurrencePattern}
          onChange={e => setRecurrencePattern(e.target.value as RecurrencePattern)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {recurrenceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {recurrencePattern === 'weekly' && (
          <div className="mt-2">
            <div className="flex gap-1">
              {daysOfWeek.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {errors.recurrence && (
              <p className="text-sm text-red-600 mt-1">{errors.recurrence}</p>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Optional notes about this template"
        />
      </div>

      {/* Constraints (collapsible) */}
      <details className="border border-gray-200 rounded-lg">
        <summary className="px-4 py-2 cursor-pointer font-medium text-sm text-gray-700 hover:bg-gray-50">
          Advanced Constraints
        </summary>
        <div className="p-4 space-y-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="earliestStart" className="block text-sm font-medium text-gray-700 mb-1">
                Earliest Start
              </label>
              <input
                type="time"
                id="earliestStart"
                value={earliestStart}
                onChange={e => setEarliestStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="latestStart" className="block text-sm font-medium text-gray-700 mb-1">
                Latest Start
              </label>
              <input
                type="time"
                id="latestStart"
                value={latestStart}
                onChange={e => setLatestStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bufferBefore" className="block text-sm font-medium text-gray-700 mb-1">
                Buffer Before (minutes)
              </label>
              <input
                type="number"
                id="bufferBefore"
                value={bufferBefore}
                onChange={e => setBufferBefore(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="bufferAfter" className="block text-sm font-medium text-gray-700 mb-1">
                Buffer After (minutes)
              </label>
              <input
                type="number"
                id="bufferAfter"
                value={bufferAfter}
                onChange={e => setBufferAfter(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Active Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-700">
          Active (apply this template automatically)
        </label>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
