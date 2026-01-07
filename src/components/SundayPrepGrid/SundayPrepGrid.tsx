'use client'

import React from 'react'

interface Task {
  id: string
  title: string
  category: string
  time?: string
}

interface DayColumn {
  day: string
  tasks: Task[]
}

interface SundayPrepGridProps {
  compact?: boolean
  showLabels?: boolean
  sampleData?: DayColumn[]
}

const DEFAULT_SAMPLE_DATA: DayColumn[] = [
  {
    day: 'Fri',
    tasks: [
      { id: '1', title: 'Morning Tempo', category: 'Run', time: '6:30 AM' },
      { id: '2', title: 'Team Meeting', category: 'Work', time: '10:00 AM' }
    ]
  },
  {
    day: 'Sat',
    tasks: [
      { id: '3', title: 'Long Ride', category: 'Bike', time: '7:00 AM' },
      { id: '4', title: 'Family time', category: 'Life', time: '2:00 PM' }
    ]
  },
  {
    day: 'Sun',
    tasks: [
      { id: '5', title: 'Easy Swim', category: 'Swim', time: '9:00 AM' },
      { id: '6', title: 'Plan week', category: 'Sunday Prep', time: '5:00 PM' }
    ]
  }
]

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Run: { bg: '#ffe8e8', border: '#EB5757', text: '#be1a1a' },
  Bike: { bg: '#fff4e0', border: '#F2C94C', text: '#684d08' },
  Swim: { bg: '#cce5ff', border: '#0077FF', text: '#004799' },
  Work: { bg: '#e8eeff', border: '#3849e0', text: '#2937b5' },
  Life: { bg: '#d4f4f0', border: '#00C2A8', text: '#2c5a41' },
  'Sunday Prep': { bg: '#f0e8ff', border: '#9333ea', text: '#6b21a8' }
}

export function SundayPrepGrid({
  compact = false,
  showLabels = true,
  sampleData = DEFAULT_SAMPLE_DATA
}: SundayPrepGridProps) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      {showLabels && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Your week at a glance</h3>
          <p className="text-sm text-slate-300 mt-1">Work, family, and training together</p>
        </div>
      )}

      {/* Grid */}
      <div className={`grid grid-cols-3 gap-3 ${compact ? 'gap-2' : ''}`}>
        {sampleData.map((dayColumn) => (
          <div
            key={dayColumn.day}
            className="flex flex-col"
          >
            {/* Day Header */}
            <div className="bg-white/10 rounded-t-lg py-3 flex items-center justify-center border border-b-0 border-white/10">
              <h4 className="font-semibold text-white text-sm">{dayColumn.day}</h4>
            </div>

            {/* Day Content */}
            <div className="bg-white/5 border border-t-0 border-white/10 rounded-b-lg p-3 flex flex-col gap-2 min-h-[180px]">
              {/* Tasks */}
              <div className="space-y-2">
                {dayColumn.tasks.map((task) => {
                  const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Life
                  return (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg border"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border
                      }}
                    >
                      <div className="text-xs font-semibold" style={{ color: colors.text }}>
                        {task.category}
                      </div>
                      <div className="text-sm font-medium text-slate-900 mt-1">{task.title}</div>
                      {task.time && (
                        <div className="text-xs text-slate-700 mt-1">{task.time}</div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Add button */}
              <button className="w-full py-2 px-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-dashed border-white/20 transition">
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
