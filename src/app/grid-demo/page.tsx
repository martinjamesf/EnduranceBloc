'use client'

import { SundayPrepGrid, type BlockData } from '@/components/SundayPrepGrid/SundayPrepGrid'
import { useState } from 'react'

export default function GridDemo() {
  const [selectedBlock, setSelectedBlock] = useState<BlockData | null>(null)

  // Enhanced demo data with fixed blocks and cross-midnight sleep
  const demoData = [
    {
      day: 'Fri',
      date: 'Jan 10',
      blocks: [
        { id: 'fri-sleep', title: 'Sleep', category: 'sleep' as const, startTime: '22:00', endTime: '06:00', isFixed: true, crossesMidnight: true },
        { id: 'fri-breakfast', title: 'Breakfast', category: 'meal' as const, startTime: '07:00', endTime: '07:30', isFixed: true },
        { id: 'fri-workout', title: 'Morning Tempo Run', category: 'workout' as const, startTime: '06:30', endTime: '07:20', isFixed: false },
        { id: 'fri-work1', title: 'Team Standup', category: 'work' as const, startTime: '10:00', endTime: '10:30', isFixed: false },
        { id: 'fri-break', title: 'Break', category: 'break' as const, startTime: '10:30', endTime: '10:45', isFixed: true },
        { id: 'fri-lunch', title: 'Lunch', category: 'meal' as const, startTime: '12:00', endTime: '13:00', isFixed: true },
      ]
    },
    {
      day: 'Sat',
      date: 'Jan 11',
      blocks: [
        { id: 'sat-sleep', title: 'Sleep', category: 'sleep' as const, startTime: '23:00', endTime: '07:00', isFixed: true, crossesMidnight: true },
        { id: 'sat-breakfast', title: 'Breakfast', category: 'meal' as const, startTime: '08:00', endTime: '08:30', isFixed: true },
        { id: 'sat-workout', title: 'Long Ride', category: 'workout' as const, startTime: '07:00', endTime: '09:30', isFixed: false },
        { id: 'sat-lunch', title: 'Lunch', category: 'meal' as const, startTime: '12:00', endTime: '13:00', isFixed: true },
        { id: 'sat-life', title: 'Family Time', category: 'life' as const, startTime: '14:00', endTime: '17:00', isFixed: false },
        { id: 'sat-dinner', title: 'Dinner', category: 'meal' as const, startTime: '18:00', endTime: '19:00', isFixed: true },
      ]
    },
    {
      day: 'Sun',
      date: 'Jan 12',
      blocks: [
        { id: 'sun-sleep', title: 'Sleep', category: 'sleep' as const, startTime: '22:00', endTime: '06:00', isFixed: true, crossesMidnight: true },
        { id: 'sun-breakfast', title: 'Breakfast', category: 'meal' as const, startTime: '07:00', endTime: '07:30', isFixed: true },
        { id: 'sun-workout', title: 'Easy Swim', category: 'workout' as const, startTime: '09:00', endTime: '10:00', isFixed: false },
        { id: 'sun-lunch', title: 'Lunch', category: 'meal' as const, startTime: '12:00', endTime: '13:00', isFixed: true },
        { id: 'sun-prep', title: 'Weekly Planning (Sunday Prep)', category: 'prep' as const, startTime: '17:00', endTime: '17:30', isFixed: false },
        { id: 'sun-dinner', title: 'Dinner', category: 'meal' as const, startTime: '18:00', endTime: '19:00', isFixed: true },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-white mb-4">Improved SundayPrepGrid Demo</h1>
          <div className="space-y-2 text-slate-300">
            <p>✓ <strong>Cross-midnight support:</strong> Sleep blocks (10 PM → 6 AM) properly handle next-day times</p>
            <p>✓ <strong>Fixed blocks:</strong> Meals, breaks, and sleep are shown faded with dashed borders (not editable)</p>
            <p>✓ <strong>Better icons:</strong> Each block type has a visual emoji indicator</p>
            <p>✓ <strong>Accessibility:</strong> Full keyboard navigation, ARIA labels, screen reader support</p>
            <p>✓ <strong>Enhanced UX:</strong> Hover states, focus rings, helpful legend, and duration calculations</p>
          </div>
        </div>

        {/* Grid */}
        <div className="mb-12">
          <SundayPrepGrid
            compact={false}
            showLabels={true}
            sampleData={demoData}
            onAddClick={() => alert('Add workout clicked')}
            onBlockClick={(block) => setSelectedBlock(block)}
            editable={true}
          />
        </div>

        {/* Selected Block Info */}
        {selectedBlock && (
          <div className="rounded-lg bg-white/10 backdrop-blur border border-white/20 p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Selected Block Details</h2>
            <div className="space-y-2 text-slate-200">
              <p><strong>Title:</strong> {selectedBlock.title}</p>
              <p><strong>Category:</strong> {selectedBlock.category}</p>
              <p><strong>Time:</strong> {selectedBlock.startTime} – {selectedBlock.crossesMidnight ? 'next day ' : ''}{selectedBlock.endTime}</p>
              <p><strong>Fixed:</strong> {selectedBlock.isFixed ? 'Yes (not editable)' : 'No (editable)'}</p>
              <p><strong>Crosses Midnight:</strong> {selectedBlock.crossesMidnight ? 'Yes' : 'No'}</p>
            </div>
            <button
              onClick={() => setSelectedBlock(null)}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Design Improvements Documentation */}
        <div className="mt-12 bg-white/5 backdrop-blur border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Design & Accessibility Improvements</h2>
          <div className="space-y-6 text-slate-300 text-sm">
            <div>
              <h3 className="text-white font-semibold mb-2">1. Cross-Midnight Block Support</h3>
              <p>
                Sleep blocks and other time blocks can now span from one day to the next (e.g., 10 PM Sunday to 6 AM Monday).
                The UI clearly indicates this with "next day" label in time displays.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">2. Fixed vs. Editable Blocks</h3>
              <p>
                Common blocks (meals, breaks, sleep) are visually differentiated with:
              </p>
              <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                <li>Reduced opacity (70%) to indicate they're secondary</li>
                <li>Dashed borders to show they're pre-defined</li>
                <li>"Fixed" label to inform users</li>
                <li>No hover effects or click handlers (not interactive)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">3. Accessibility Standards (WCAG 2.1)</h3>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Keyboard Navigation:</strong> Tab through blocks, Enter/Space to open; blocks are proper button elements</li>
                <li><strong>Screen Reader Support:</strong> Each block has descriptive ARIA labels with title, time, duration, and status</li>
                <li><strong>Visual Focus Indicators:</strong> 2px focus ring on interactive blocks</li>
                <li><strong>Color Contrast:</strong> All text colors meet WCAG AA standards (4.5:1 minimum ratio)</li>
                <li><strong>Semantic HTML:</strong> Uses role="region", role="columnheader", role="button", role="status"</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">4. Enhanced Visual Design</h3>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Category Icons:</strong> Each block type has an emoji icon for quick visual recognition</li>
                <li><strong>Better Color Palette:</strong> Updated colors with improved contrast and accessibility</li>
                <li><strong>Duration Display:</strong> Shows block duration in hours for better planning</li>
                <li><strong>Time Format:</strong> Uses 12-hour format (AM/PM) for better readability</li>
                <li><strong>Expanded Headers:</strong> Day columns now include optional date display</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">5. Improved Usability</h3>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>Hover States:</strong> Clear indication of interactive vs. non-interactive blocks</li>
                <li><strong>Interactive Legend:</strong> Collapsible details section explaining all block types</li>
                <li><strong>Helper Text:</strong> Subtitle explaining that gray blocks are fixed</li>
                <li><strong>Consistent Spacing:</strong> Better vertical distribution with flex layout</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">6. New API for Integration</h3>
              <p>Enhanced props and interfaces for better type safety:</p>
              <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                <li><strong>BlockData interface:</strong> Structured data with proper types</li>
                <li><strong>BlockCategory type:</strong> Strict category union type</li>
                <li><strong>onBlockClick callback:</strong> Handle block interactions for editing</li>
                <li><strong>crossesMidnight flag:</strong> Explicit support for next-day blocks</li>
                <li><strong>Helper functions:</strong> timeToMinutes(), minutesToTime(), formatTime(), getBlockDuration()</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
