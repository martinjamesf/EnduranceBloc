'use client'

import React, { useState } from 'react'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: {
    title: string
    start: string
    end: string
    description?: string
    type: 'workout' | 'block'
    workoutType?: 'swim' | 'bike' | 'run' | 'other'
  }) => Promise<void>
  initialDate?: string
  initialHour?: number
  editEvent?: {
    id: string
    title: string
    start: string
    end: string
    description?: string
    type: 'workout' | 'block'
    workoutType?: 'swim' | 'bike' | 'run' | 'other'
  }
  onDelete?: (eventId: string, type: 'workout' | 'block') => Promise<void>
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialHour = 9,
  editEvent,
  onDelete,
}: EventModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state - reset when modal opens
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<'workout' | 'block'>('block')
  const [workoutType, setWorkoutType] = useState<'swim' | 'bike' | 'run' | 'other'>('other')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [description, setDescription] = useState('')

  // Initialize form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle(editEvent?.title || '')
      setEventType(editEvent?.type || 'block')
      setWorkoutType(editEvent?.workoutType || 'other')
      setDate(initialDate || editEvent?.start.split('T')[0] || new Date().toISOString().split('T')[0])
      setStartTime(editEvent?.start.split('T')[1]?.slice(0, 5) || `${initialHour.toString().padStart(2, '0')}:00`)
      setEndTime(editEvent?.end.split('T')[1]?.slice(0, 5) || `${(initialHour + 1).toString().padStart(2, '0')}:00`)
      setDescription(editEvent?.description || '')
      setError(null)
    }
  }, [isOpen, initialDate, initialHour, editEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create proper ISO timestamps in local timezone
      const startDate = new Date(`${date}T${startTime}:00`)
      const endDate = new Date(`${date}T${endTime}:00`)

      // Validate times
      if (endDate <= startDate) {
        throw new Error('End time must be after start time')
      }

      await onSave({
        title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        description,
        type: eventType,
        workoutType: eventType === 'workout' ? workoutType : undefined,
      })

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-4">
          {editEvent ? 'Edit Event' : 'Create New Event'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Event title"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEventType('block')}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  eventType === 'block'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                Life Block
              </button>
              <button
                type="button"
                onClick={() => setEventType('workout')}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  eventType === 'workout'
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                Workout
              </button>
            </div>
          </div>

          {/* Workout Type (if workout selected) */}
          {eventType === 'workout' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workout Type
              </label>
              <select
                value={workoutType}
                onChange={e => setWorkoutType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="swim">Swim</option>
                <option value="bike">Bike</option>
                <option value="run">Run</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Add notes..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {editEvent && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    setIsDeleting(true)
                    try {
                      await onDelete(editEvent.id, editEvent.type)
                      onClose()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to delete event')
                      setIsDeleting(false)
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={loading || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading || isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || isDeleting}
            >
              {loading ? 'Saving...' : editEvent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
