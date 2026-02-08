'use client'

import React, { useState } from 'react'

type BlockCategory = 'life' | 'work' | 'recovery'

interface BlockTemplate {
  category: BlockCategory
  title: string
  subtitle: string
  blockCategory: 'Family' | 'Work' | 'Sleep'
}

const BLOCK_TEMPLATES: Record<BlockCategory, BlockTemplate[]> = {
  life: [
    { category: 'life', title: 'Kids drop-off', subtitle: 'Family non-negotiable', blockCategory: 'Family' },
    { category: 'life', title: 'Kids pick-up', subtitle: 'Family non-negotiable', blockCategory: 'Family' },
    { category: 'life', title: 'Family dinner', subtitle: 'Family time', blockCategory: 'Family' },
    { category: 'life', title: 'Appointment', subtitle: 'Personal time', blockCategory: 'Family' },
  ],
  work: [
    { category: 'work', title: 'Team standup', subtitle: 'Work anchor', blockCategory: 'Work' },
    { category: 'work', title: 'Deep work block', subtitle: 'Focus time', blockCategory: 'Work' },
    { category: 'work', title: 'Meetings', subtitle: 'Work anchor', blockCategory: 'Work' },
    { category: 'work', title: 'Travel', subtitle: 'Work commitment', blockCategory: 'Work' },
  ],
  recovery: [
    { category: 'recovery', title: 'Sleep', subtitle: 'Recovery anchor', blockCategory: 'Sleep' },
    { category: 'recovery', title: 'Mobility window', subtitle: 'Recovery', blockCategory: 'Sleep' },
    { category: 'recovery', title: 'Nutrition prep', subtitle: 'Recovery habit', blockCategory: 'Sleep' },
    { category: 'recovery', title: 'Stretch/foam roll', subtitle: 'Recovery', blockCategory: 'Sleep' },
  ],
}

type Props = {
  onAddBlock: (dayIndex: number, blockCategory: 'Family' | 'Work' | 'Sleep', title: string) => void
  daysOfWeek: string[]
}

export function LayeredBlocksGuide({ onAddBlock, daysOfWeek }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const handleAddTemplate = (dayIndex: number, template: BlockTemplate) => {
    onAddBlock(dayIndex, template.blockCategory, template.title)
    setShowTemplates(false)
    setSelectedCategory(null)
    setSelectedDay(null)
  }

  const categoryInfo = {
    life: {
      label: 'Life non-negotiables',
      description: 'Kids schedules, family time, appointments',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-blue-500/20 border-blue-500/30',
    },
    work: {
      label: 'Work anchors',
      description: 'Key meetings, deadlines, travel',
      icon: '💼',
      color: 'bg-amber-500/20 border-amber-500/30',
    },
    recovery: {
      label: 'Recovery anchors',
      description: 'Sleep, mobility, nutrition prep',
      icon: '🧘',
      color: 'bg-green-500/20 border-green-500/30',
    },
  }

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(Object.keys(BLOCK_TEMPLATES) as BlockCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(selectedCategory === cat ? null : cat)
              setSelectedDay(null)
              setShowTemplates(false)
            }}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedCategory === cat
                ? `${categoryInfo[cat].color} border-current`
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{categoryInfo[cat].icon}</span>
              <div>
                <p className="font-semibold text-white">{categoryInfo[cat].label}</p>
                <p className="text-xs text-slate-400">{categoryInfo[cat].description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Day Selection & Templates */}
      {selectedCategory && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-sm font-medium text-white">
            Select a day or template for {categoryInfo[selectedCategory].label}
          </p>

          {/* Day Quick-Add Chips */}
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day, idx) => (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(selectedDay === idx ? null : idx)
                  setShowTemplates(false)
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedDay === idx
                    ? 'bg-secondary text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Show Templates for Selected Category */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition"
          >
            {showTemplates ? '▼' : '▶'} Quick templates for {categoryInfo[selectedCategory].label}
          </button>

          {showTemplates && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {BLOCK_TEMPLATES[selectedCategory].map((template) => (
                <button
                  key={`${template.category}-${template.title}`}
                  onClick={() => {
                    if (selectedDay !== null) {
                      handleAddTemplate(selectedDay, template)
                    }
                  }}
                  disabled={selectedDay === null}
                  className={`p-3 rounded-lg border transition text-left ${
                    selectedDay !== null
                      ? 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'border-white/10 bg-white/10 cursor-not-allowed opacity-50'
                  }`}
                >
                  <p className="font-medium text-sm text-white">{template.title}</p>
                  <p className="text-xs text-slate-400">{template.subtitle}</p>
                </button>
              ))}
            </div>
          )}

          {/* Manual Add Button */}
          {selectedDay !== null && (
            <button
              onClick={() => {
                const blockCategoryMap = {
                  life: 'Family' as const,
                  work: 'Work' as const,
                  recovery: 'Sleep' as const,
                }
                onAddBlock(selectedDay, blockCategoryMap[selectedCategory], 'New event')
                setSelectedDay(null)
                setSelectedCategory(null)
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary text-white font-semibold hover:opacity-90 transition text-sm"
            >
              + Add to {daysOfWeek[selectedDay]}
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      {!selectedCategory && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-3">
          <p className="text-xs text-slate-400">
            💡 <span className="font-medium">Tip:</span> Layer your week by starting with life non-negotiables, then work anchors, then recovery. This prevents training from conflicting with what matters most.
          </p>
        </div>
      )}
    </div>
  )
}
