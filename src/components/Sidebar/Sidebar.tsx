'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  /** Optional top offset classes to place the sidebar below the main nav */
  offsetTopClass?: string
}

export default function Sidebar({ isOpen, onClose, offsetTopClass }: SidebarProps) {
  const pathname = usePathname()
  const topClass = offsetTopClass ?? 'top-0'
  const heightClass = offsetTopClass ? 'bottom-0' : 'h-full'
  
  // Get current date
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const monthName = today.toLocaleDateString('en-US', { month: 'long' })
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const dayHeaders = ['m', 't', 'w', 't', 'f', 's', 's']
  
  // Calculate Monday of current week and get all 7 dates
  const getWeekDates = () => {
    const d = new Date(today)
    const dayOfWeek = d.getDay() // 0 = Sunday, 1 = Monday, etc
    const day = dayOfWeek || 7 // Convert Sunday (0) to 7 for calculation
    const diff = d.getDate() - day
    d.setDate(diff)
    
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(d)
      date.setDate(d.getDate() + i)
      dates.push(date)
    }
    return dates
  }
  
  const weekDates = getWeekDates()
  
  // Check if a day should be highlighted
  const shouldHighlight = (day: number): boolean => {
    if (pathname === '/week') {
      return weekDates.some(d => d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear)
    } else if (pathname === '/weekend') {
      // Highlight Saturday and Sunday only
      return weekDates.some(d => {
        const dayOfWeek = d.getDay()
        return (dayOfWeek === 6 || dayOfWeek === 0) && d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
    } else if (pathname === '/day') {
      return day === currentDay
    }
    return false
  }
  
  // Non-negotiables and upcoming events
  const nonNegotiables = [
    { name: 'Daily Standup', time: '08:00', color: '#2c5a41' },
    { name: 'Budget Review', time: '09:00', color: '#be1a1a' },
    { name: 'Sasha Jay 121', time: '10:00', color: '#684d08' },
    { name: 'Web Team Progress Update', time: '11:00', color: '#3ba86e' },
    { name: 'Social team briefing', time: '12:00', color: '#2c5a41' },
  ]

  const tomorrow = [
    { name: 'Daily Standup', time: '13:00', color: '#2c5a41' },
    { name: 'Tech Standup', time: '14:00', color: '#341d76' },
    { name: 'Developer Progress', time: '15:00', color: '#2937b5' },
  ]

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 z-40 md:hidden ${offsetTopClass ?? ''}`.trim()}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 w-64 md:w-72 bg-white border-r border-[#dadce0] overflow-y-auto transition-transform duration-300 ease-in-out z-50 ${topClass} ${heightClass} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-[#dadce0]">
            <h2 className="text-sm font-semibold text-[#0D1D35]">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0 text-[#0D1D35]"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mini Calendar Section */}
          <div className="px-4 py-3">
            <h3 className="text-lg font-medium text-[#333] mb-3">{monthName}</h3>
            
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-medium text-[#333]/70">
              {dayHeaders.map((day, idx) => (
                <div key={idx} className="text-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar dates */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Padding for days before month starts */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }, (_, i) => (
                <div key={`empty-${i}`} className="py-1" />
              ))}
              
              {/* Actual dates */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  className={`py-1 text-center rounded-full font-medium transition-colors ${
                    shouldHighlight(day)
                      ? 'bg-[#0C41FF] text-white'
                      : 'hover:bg-gray-100 text-[#333]'
                  }`}
                  title={`${monthName} ${day}, ${currentYear}`}
                >
                  {day.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-[#dadce0] my-2" />

          {/* Navigation Section */}
          <div className="px-4 py-3 border-b border-[#dadce0]">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#666] mb-3">Navigation</h3>
            <nav className="space-y-1">
              <Link
                href="/calendar"
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#333] hover:bg-gray-100 transition-colors"
              >
                📅 Calendar
              </Link>
              <Link
                href="/sunday-prep"
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#333] hover:bg-gray-100 transition-colors"
              >
                📋 Sunday Prep
              </Link>
              <Link
                href="/block-editor"
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#333] hover:bg-gray-100 transition-colors"
              >
                🔨 Block Editor
              </Link>
              <Link
                href="/settings"
                className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#333] hover:bg-gray-100 transition-colors"
              >
                ⚙️ Settings
              </Link>
            </nav>
          </div>

          {/* Non-negotiables Section */}
          <div className="px-4 py-3 flex-1 overflow-y-auto">
            <h3 className="text-base font-medium text-[#333] mb-3">Non-negotiables</h3>
            <div className="space-y-2">
              {nonNegotiables.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <span className="font-medium text-[#333] truncate">{event.name}</span>
                  </div>
                  <span className="text-[#666] ml-2">{event.time}</span>
                </div>
              ))}
            </div>

            {/* Tomorrow Section */}
            <h3 className="text-base font-medium text-[#333] mt-4 mb-3">Tomorrow</h3>
            <div className="space-y-2">
              {tomorrow.map((event, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <span className="font-medium text-[#333] truncate">{event.name}</span>
                  </div>
                  <span className="text-[#666] ml-2">{event.time}</span>
                </div>
              ))}
            </div>

            {/* Vacations Section */}
            <h3 className="text-base font-medium text-[#333] mt-4 mb-3">Vacations</h3>
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2c5a41]" />
                <span className="font-medium text-[#333]">Bahamas</span>
              </div>
              <span className="text-[#666]">01-02 to 14-02</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
