'use client'

import React, { useState } from 'react'

interface SleepSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  sleepStart: number // Hour (0-23)
  sleepEnd: number // Hour (0-23)
  onSave: (sleepStart: number, sleepEnd: number) => void
}

export function SleepSettingsModal({
  isOpen,
  onClose,
  sleepStart,
  sleepEnd,
  onSave,
}: SleepSettingsModalProps) {
  const [tempSleepStart, setTempSleepStart] = useState(sleepStart)
  const [tempSleepEnd, setTempSleepEnd] = useState(sleepEnd)

  const handleSave = () => {
    onSave(tempSleepStart, tempSleepEnd)
    onClose()
  }

  const handleReset = () => {
    setTempSleepStart(sleepStart)
    setTempSleepEnd(sleepEnd)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sleep Preferences</h2>
        
        <p className="text-sm text-gray-600 mb-6">
          Set your typical sleep schedule. Sleep time will appear at the bottom of your calendar.
        </p>

        <div className="space-y-5">
          {/* Sleep Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep starts at
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={tempSleepStart}
                onChange={(e) => setTempSleepStart(Number(e.target.value))}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-sm text-gray-600">
                {tempSleepStart.toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>

          {/* Sleep End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wake up at
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="23"
                value={tempSleepEnd}
                onChange={(e) => setTempSleepEnd(Number(e.target.value))}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-sm text-gray-600">
                {tempSleepEnd.toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>

          {/* Sleep duration summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              You'll have{' '}
              <span className="font-semibold">
                {tempSleepEnd >= tempSleepStart
                  ? tempSleepEnd - tempSleepStart
                  : 24 - (tempSleepStart - tempSleepEnd)}{' '}
                hours
              </span>{' '}
              of planning time each day.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
