'use client'

import React, { useState } from 'react'

export interface BlockData {
  id: string
  title: string
  category: BlockCategory
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  isFixed?: boolean // Meals, breaks, sleep are fixed by default
  crossesMidnight?: boolean // For sleep (e.g., 10 PM - 6 AM)
  description?: string
}

export type BlockCategory = 'workout' | 'work' | 'life' | 'meal' | 'break' | 'sleep' | 'prep'

interface DayColumn {
  day: string
  date?: string
  blocks: BlockData[]
}

interface SundayPrepGridProps {
  compact?: boolean
  showLabels?: boolean
  sampleData?: DayColumn[]
  onAddClick?: () => void
  onBlockClick?: (block: BlockData) => void
  editable?: boolean
}

const DEFAULT_SAMPLE_DATA: DayColumn[] = [
  {
    day: 'Fri',
    date: 'Jan 10',
    blocks: [
      { id: '1', title: 'Morning Tempo', category: 'workout', startTime: '06:30', endTime: '07:30', isFixed: false },
      { id: '2', title: 'Team Meeting', category: 'work', startTime: '10:00', endTime: '11:00', isFixed: false }
    ]
  },
  {
    day: 'Sat',
    date: 'Jan 11',
    blocks: [
      { id: '3', title: 'Long Ride', category: 'workout', startTime: '07:00', endTime: '09:30', isFixed: false },
      { id: '4', title: 'Family time', category: 'life', startTime: '14:00', endTime: '17:00', isFixed: false }
    ]
  },
  {
    day: 'Sun',
    date: 'Jan 12',
    blocks: [
      { id: '5', title: 'Easy Swim', category: 'workout', startTime: '09:00', endTime: '10:00', isFixed: false },
      { id: '6', title: 'Plan week', category: 'prep', startTime: '17:00', endTime: '17:30', isFixed: false }
    ]
  }
]

// Enhanced color palette with better contrast and accessibility
const CATEGORY_STYLES: Record<BlockCategory, { bg: string; border: string; text: string; icon: string }> = {
  workout: { bg: '#ffe8e8', border: '#EB5757', text: '#be1a1a', icon: '⚡' },
  work: { bg: '#e8eeff', border: '#3849e0', text: '#2937b5', icon: '💼' },
  life: { bg: '#d4f4f0', border: '#00C2A8', text: '#2c5a41', icon: '👥' },
  meal: { bg: '#fef3c7', border: '#d97706', text: '#78350f', icon: '🍽️' },
  break: { bg: '#dbeafe', border: '#0284c7', text: '#075985', icon: '☕' },
  sleep: { bg: '#f3e8ff', border: '#7c3aed', text: '#581c87', icon: '😴' },
  prep: { bg: '#f0e8ff', border: '#9333ea', text: '#6b21a8', icon: '📋' }
}

// Fixed/common blocks that users typically don't customize
const COMMON_BLOCKS: Record<string, BlockData> = {
  breakfast: { id: 'breakfast', title: 'Breakfast', category: 'meal', startTime: '07:00', endTime: '07:30', isFixed: true },
  lunch: { id: 'lunch', title: 'Lunch', category: 'meal', startTime: '12:00', endTime: '13:00', isFixed: true },
  dinner: { id: 'dinner', title: 'Dinner', category: 'meal', startTime: '18:00', endTime: '19:00', isFixed: true },
  sleep: { id: 'sleep', title: 'Sleep', category: 'sleep', startTime: '22:00', endTime: '06:00', isFixed: true, crossesMidnight: true },
  morningBreak: { id: 'break-morning', title: 'Break', category: 'break', startTime: '10:30', endTime: '10:45', isFixed: true },
  afternoonBreak: { id: 'break-afternoon', title: 'Break', category: 'break', startTime: '15:00', endTime: '15:15', isFixed: true }
}

/**
 * Converts time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Formats minutes since midnight back to HH:MM
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Gets duration in minutes, handling cross-midnight blocks
 */
function getBlockDuration(block: BlockData): number {
  const startMinutes = timeToMinutes(block.startTime)
  let endMinutes = timeToMinutes(block.endTime)

  if (block.crossesMidnight) {
    endMinutes += 24 * 60 // Add 24 hours for cross-midnight blocks
  }

  return Math.max(endMinutes - startMinutes, 15) // Minimum 15 minutes
}

/**
 * Formats time display with AM/PM
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const hour12 = hours % 12 || 12
  const ampm = hours >= 12 ? 'PM' : 'AM'
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Block display component with accessibility support
 */
function BlockItem({ block, onBlockClick, isFixed }: { block: BlockData; onBlockClick?: (block: BlockData) => void; isFixed?: boolean }) {
  const style = CATEGORY_STYLES[block.category]
  const duration = getBlockDuration(block)
  const durationHours = (duration / 60).toFixed(1)

  const handleClick = () => {
    if (!isFixed && onBlockClick) {
      onBlockClick(block)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFixed && (e.key === 'Enter' || e.key === ' ') && onBlockClick) {
      e.preventDefault()
      onBlockClick(block)
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isFixed ? 'status' : 'button'}
      tabIndex={isFixed ? -1 : 0}
      aria-label={`${block.title}${isFixed ? ' (fixed)' : ''}, ${formatTime(block.startTime)} to ${block.crossesMidnight ? 'next day ' : ''}${formatTime(block.endTime)}, ${durationHours} hours`}
      className={`p-2 rounded-lg border transition ${
        isFixed
          ? 'cursor-default opacity-75 border-dashed'
          : 'cursor-pointer hover:border-white/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1'
      }`}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text,
        opacity: isFixed ? 0.7 : 1
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm" aria-hidden="true">
          {style.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide">{block.category}</div>
          <div className="text-sm font-medium mt-1 truncate">{block.title}</div>
          <div className="text-xs mt-1 opacity-75">
            {formatTime(block.startTime)} – {block.crossesMidnight ? 'next ' : ''}{formatTime(block.endTime)}
          </div>
          {isFixed && <div className="text-xs mt-1 font-medium opacity-60">Fixed</div>}
        </div>
      </div>
    </div>
  )
}

export function SundayPrepGrid({
  compact = false,
  showLabels = true,
  sampleData = DEFAULT_SAMPLE_DATA,
  onAddClick,
  onBlockClick,
  editable = true
}: SundayPrepGridProps) {
  const [hoveredDayId, setHoveredDayId] = useState<string | null>(null)

  return (
    <div 
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden ${compact ? 'p-4' : 'p-6'}`}
      role="region"
      aria-label="Weekly plan grid showing workouts, work, life commitments, meals, breaks, and sleep"
    >
      {/* Header */}
      {showLabels && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Your week at a glance</h3>
          <p className="text-sm text-slate-300 mt-1">Work, family, and training together</p>
          <p className="text-xs text-slate-400 mt-2">
            Gray/faded blocks (meals, sleep, breaks) are fixed. Click colored blocks to edit.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className={`grid grid-cols-3 gap-3 ${compact ? 'gap-2' : ''}`}>
        {sampleData.map((dayColumn) => (
          <div
            key={dayColumn.day}
            className="flex flex-col"
            onMouseEnter={() => setHoveredDayId(dayColumn.day)}
            onMouseLeave={() => setHoveredDayId(null)}
          >
            {/* Day Header */}
            <div 
              className="bg-white/10 rounded-t-lg py-3 flex flex-col items-center justify-center border border-b-0 border-white/10"
              role="columnheader"
            >
              <h4 className="font-semibold text-white text-sm">{dayColumn.day}</h4>
              {dayColumn.date && <span className="text-xs text-slate-400 mt-1">{dayColumn.date}</span>}
            </div>

            {/* Day Content */}
            <div className="bg-white/5 border border-t-0 border-white/10 rounded-b-lg p-3 flex flex-col gap-2 min-h-[200px]">
              {/* Blocks */}
              <div className="space-y-2 flex-1">
                {dayColumn.blocks.map((block) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    onBlockClick={editable ? onBlockClick : undefined}
                    isFixed={block.isFixed}
                  />
                ))}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Add button - visible when hovering or if editable */}
              {editable && (
                <button
                  onClick={onAddClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onAddClick?.()
                    }
                  }}
                  aria-label={`Add new block to ${dayColumn.day}`}
                  className="w-full py-2 px-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-dashed border-white/20 transition focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <span aria-hidden="true">+</span> Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend/Help text */}
      {showLabels && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <details className="text-xs text-slate-300">
            <summary className="cursor-pointer font-medium text-slate-200 hover:text-white">
              Block types
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {Object.entries(CATEGORY_STYLES).map(([category, style]) => (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-sm">{style.icon}</span>
                  <span className="capitalize text-xs">{category}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
