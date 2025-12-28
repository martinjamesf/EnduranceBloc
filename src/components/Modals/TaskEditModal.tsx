'use client'

import { useState, useMemo } from 'react'

export interface TaskEditFormData {
  title: string
  category: 'Work' | 'Fitness' | 'Sleep' | 'Family' | 'Event'
  subtitle?: string
  notes?: string
  start?: string
  end?: string
}

interface TaskEditModalProps {
  isOpen: boolean
  taskId: string
  initialData: TaskEditFormData
  onClose: () => void
  onSave: (data: TaskEditFormData) => void
  onDelete: () => void
}

const CATEGORIES = ['Work', 'Fitness', 'Sleep', 'Family', 'Event'] as const

const categoryColors: Record<string, string> = {
  Work: '#f42495',
  Fitness: '#18c2cd',
  Sleep: '#1873cd',
  Family: '#f49524',
  Event: '#5d7583'
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return ''
  
  try {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    if (endMinutes <= startMinutes) return ''
    
    const duration = endMinutes - startMinutes
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  } catch {
    return ''
  }
}

function formatTime24To12(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export default function TaskEditModal({
  isOpen,
  taskId,
  initialData,
  onClose,
  onSave,
  onDelete
}: TaskEditModalProps) {
  const [formData, setFormData] = useState<TaskEditFormData>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [timeError, setTimeError] = useState<string>('')

  const duration = useMemo(() => {
    if (formData.start && formData.end) {
      return calculateDuration(formData.start, formData.end)
    }
    return ''
  }, [formData.start, formData.end])

  const isTimeValid = useMemo(() => {
    if (!formData.start || !formData.end) return true
    
    const [startHour, startMin] = formData.start.split(':').map(Number)
    const [endHour, endMin] = formData.end.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    return endMinutes > startMinutes
  }, [formData.start, formData.end])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!isTimeValid) {
      setTimeError('End time must be after start time')
      return
    }
    
    setTimeError('')
    setIsSaving(true)
    try {
      onSave(formData)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value
    setFormData(prev => {
      const updated = { ...prev, start: newStart }
      
      // Auto-set end time to 1 hour later if not set
      if (!prev.end && newStart) {
        const [hour, min] = newStart.split(':').map(Number)
        const endHour = (hour + 1) % 24
        const endTime = `${String(endHour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        updated.end = endTime
      }
      
      return updated
    })
  }

  const categoryColor = categoryColors[formData.category]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a2332] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-[#2a3f5f] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={`py-2 px-3 rounded font-medium text-sm transition-all ${
                    formData.category === cat
                      ? 'text-white border-2'
                      : 'text-gray-300 border-2 border-transparent hover:border-[#2a3f5f]'
                  }`}
                  style={{
                    borderColor: formData.category === cat ? categoryColor : 'transparent',
                    backgroundColor: formData.category === cat ? categoryColor + '20' : 'transparent'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-[#0d1623] border border-[#2a3f5f] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Task title"
            />
          </div>

          {/* Time Block Section */}
          <div className="bg-[#0d1623] rounded-lg p-4 space-y-3 border border-[#2a3f5f]">
            <h3 className="font-medium text-gray-300 text-sm">Schedule</h3>
            
            {/* Start Time */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Start Time
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.start || ''}
                  onChange={handleStartTimeChange}
                  className="flex-1 px-3 py-2 bg-[#1a2f3f] border border-[#2a3f5f] rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                />
                {formData.start && (
                  <div className="px-3 py-2 bg-[#1a2f3f] border border-[#2a3f5f] rounded text-gray-400 text-sm flex items-center">
                    {formatTime24To12(formData.start)}
                  </div>
                )}
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                End Time
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.end || ''}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, end: e.target.value }))
                    if (isTimeValid) setTimeError('')
                  }}
                  className={`flex-1 px-3 py-2 bg-[#1a2f3f] border rounded text-white focus:outline-none text-sm ${
                    isTimeValid ? 'border-[#2a3f5f] focus:border-blue-500' : 'border-red-500/50'
                  }`}
                />
                {formData.end && (
                  <div className="px-3 py-2 bg-[#1a2f3f] border border-[#2a3f5f] rounded text-gray-400 text-sm flex items-center">
                    {formatTime24To12(formData.end)}
                  </div>
                )}
              </div>
              {!isTimeValid && (
                <p className="text-red-400 text-xs mt-1">End time must be after start time</p>
              )}
            </div>

            {/* Duration Display */}
            {duration && (
              <div className="pt-2 border-t border-[#2a3f5f] flex items-center justify-between">
                <span className="text-xs text-gray-400">Duration</span>
                <span className="text-sm font-medium text-blue-400">{duration}</span>
              </div>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-3 py-2 bg-[#0d1623] border border-[#2a3f5f] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Optional subtitle (e.g., location)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-[#0d1623] border border-[#2a3f5f] rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-black border-t border-[#2a3f5f] px-6 py-4 flex gap-3 justify-between">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-300 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.title || !isTimeValid}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm rounded transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
